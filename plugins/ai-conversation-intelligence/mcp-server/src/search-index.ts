import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import type { Conversation, ConversationMeta, Source, SearchResult, MessageSearchResult } from './types.js';

const INDEX_DIR = join(homedir(), '.claude', 'chat-browser');
const INDEX_DB_PATH = join(INDEX_DIR, 'search-index.db');
// Bumped from 3 (sql.js/in-memory rewrite) -> 4 (node:sqlite, file-backed, FTS5,
// streaming per-conversation inserts). Old DBs are dropped and rebuilt on open.
const SCHEMA_VERSION = 4;

/**
 * File-backed SQLite index (node:sqlite, built-in — no sql.js/WASM, no whole-DB
 * export()/writeFileSync() on every save). Conversations are inserted one at a
 * time as the caller streams them in (see index.ts), so peak memory is bounded
 * by a single conversation's transcript, not the entire corpus.
 */
export class SearchIndex {
  private db: DatabaseSync;
  private insertConvStmt!: StatementSync;
  private insertConvFtsStmt!: StatementSync;
  private insertMsgStmt!: StatementSync;
  private insertMsgFtsStmt!: StatementSync;

  private constructor(db: DatabaseSync) {
    this.db = db;
  }

  static create(): SearchIndex {
    mkdirSync(INDEX_DIR, { recursive: true });

    if (existsSync(INDEX_DB_PATH)) {
      const probe = new DatabaseSync(INDEX_DB_PATH);
      const version = SearchIndex.readSchemaVersion(probe);
      probe.close();
      if (version < SCHEMA_VERSION) {
        for (const suffix of ['', '-wal', '-shm']) {
          const p = INDEX_DB_PATH + suffix;
          if (existsSync(p)) unlinkSync(p);
        }
      }
    }

    const db = new DatabaseSync(INDEX_DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');

    const instance = new SearchIndex(db);
    instance.init();
    return instance;
  }

  private static readSchemaVersion(db: DatabaseSync): number {
    try {
      const row = db.prepare('SELECT version FROM schema_version LIMIT 1').get() as
        | { version: number }
        | undefined;
      return row?.version ?? 1;
    } catch {
      return 1;
    }
  }

  private init() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`);
    const current = SearchIndex.readSchemaVersion(this.db);
    if (current < SCHEMA_VERSION) {
      this.db.exec(`DELETE FROM schema_version`);
      this.db.prepare(`INSERT INTO schema_version (version) VALUES (?)`).run(SCHEMA_VERSION);
    }

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        workspace TEXT NOT NULL,
        workspace_path TEXT NOT NULL,
        title TEXT NOT NULL,
        first_message TEXT NOT NULL,
        created_at INTEGER,
        mode TEXT,
        branch TEXT,
        message_count INTEGER NOT NULL,
        indexed_at INTEGER NOT NULL,
        source TEXT NOT NULL DEFAULT 'cursor',
        kind TEXT NOT NULL DEFAULT 'interactive',
        entrypoint TEXT
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        conv_id TEXT NOT NULL,
        msg_index INTEGER NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (conv_id) REFERENCES conversations(id)
      )
    `);

    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conv_id, msg_index)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_source ON conversations(source)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace)`);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        text,
        content='messages',
        content_rowid='rowid',
        tokenize='porter unicode61'
      )
    `);

    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts5(
        conv_id UNINDEXED,
        title,
        workspace,
        tokenize='porter unicode61'
      )
    `);

    this.insertConvStmt = this.db.prepare(`
      INSERT OR REPLACE INTO conversations
        (id, workspace, workspace_path, title, first_message, created_at, mode, branch, message_count, indexed_at, source, kind, entrypoint)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    this.insertConvFtsStmt = this.db.prepare(
      `INSERT INTO conversations_fts (conv_id, title, workspace) VALUES (?, ?, ?)`
    );
    this.insertMsgStmt = this.db.prepare(
      `INSERT INTO messages (conv_id, msg_index, role, text) VALUES (?, ?, ?, ?)`
    );
    this.insertMsgFtsStmt = this.db.prepare(
      `INSERT INTO messages_fts (rowid, text) VALUES (?, ?)`
    );
  }

  getIndexedIds(): Set<string> {
    const rows = this.db.prepare('SELECT id FROM conversations').all() as Array<{ id: string }>;
    return new Set(rows.map((r) => r.id));
  }

  /**
   * Insert a single new conversation. Caller is responsible for skipping
   * already-indexed ids via getIndexedIds() before parsing.
   *
   * IMPORTANT: this does NOT open its own transaction — see
   * indexConversationsStreaming() for why. Call sites that need a single
   * conversation inserted standalone (there are none in this codebase
   * currently) must wrap the call in BEGIN/COMMIT themselves.
   */
  private insertConversationRow(c: Conversation): void {
    this.insertConvStmt.run(
      c.id,
      c.workspace,
      c.workspacePath,
      c.title,
      c.firstMessage,
      c.createdAt ? Math.round(c.createdAt) : null,
      c.mode,
      c.branch,
      c.messageCount,
      Date.now(),
      c.source,
      c.kind,
      c.entrypoint
    );
    this.insertConvFtsStmt.run(c.id, c.title, c.workspace);

    for (let i = 0; i < c.messages.length; i++) {
      const msg = c.messages[i]!;
      if (!msg.text.trim()) continue;
      this.insertMsgStmt.run(c.id, i, msg.role, msg.text);
      const rowid = Number(this.db.prepare('SELECT last_insert_rowid() AS id').get()!.id);
      this.insertMsgFtsStmt.run(rowid, msg.text);
    }
  }

  /**
   * Batch entry point used by index.ts: consumes an iterable/generator of
   * conversations and inserts each one as it arrives, so a caller can stream
   * from disk without ever materializing the full corpus in memory.
   *
   * Commits are BATCHED (BATCH_SIZE conversations per transaction), not
   * one-transaction-per-conversation. This matters far more than it looks:
   * with a commit after every single conversation, SQLite interleaves pages
   * across conversations / conversations_fts / messages / messages_fts as
   * they all grow together, checkerboarding table B-trees across the file
   * instead of keeping each roughly contiguous. On a real ~35k-conversation
   * corpus this made a plain `SELECT COUNT(*) FROM conversations` (which only
   * needs to touch that table's own pages) take 8-20s because it had to fault
   * in nearly the entire 7GB file in near-random order. Batching commits
   * collapses that from ~35,700 transactions to ~180, and the resulting
   * layout keeps count/aggregate queries in the low tens of milliseconds.
   * Do not revert to per-conversation commits without re-verifying query
   * latency against a multi-GB corpus.
   */
  indexConversationsStreaming(conversations: Iterable<Conversation>): number {
    const BATCH_SIZE = 200;
    let count = 0;
    let inTxn = false;
    let sinceCommit = 0;

    try {
      for (const c of conversations) {
        if (!inTxn) {
          this.db.exec('BEGIN IMMEDIATE');
          inTxn = true;
        }
        this.insertConversationRow(c);
        count++;
        sinceCommit++;

        if (sinceCommit >= BATCH_SIZE) {
          this.db.exec('COMMIT');
          inTxn = false;
          sinceCommit = 0;
        }
      }
      if (inTxn) {
        this.db.exec('COMMIT');
      }
    } catch (err) {
      if (inTxn) this.db.exec('ROLLBACK');
      throw err;
    }

    return count;
  }

  private query<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(params as never[])) as T[];
  }

  private queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...(params as never[])) as T | undefined;
  }

  enrichMetadata(metaMap: Map<string, ConversationMeta>) {
    this.db.exec('BEGIN');
    try {
      const stmt = this.db.prepare(
        `UPDATE conversations SET created_at = ?, mode = ?, branch = ? WHERE id = ? AND (created_at IS NULL OR mode IS NULL)`
      );
      for (const [id, meta] of metaMap) {
        if (meta.createdAt || meta.mode || meta.branch) {
          stmt.run(meta.createdAt ?? null, meta.mode ?? null, meta.branch ?? null, id);
        }
      }
      this.db.exec('COMMIT');
    } catch {
      this.db.exec('ROLLBACK');
    }
  }

  close() {
    this.db.close();
  }

  searchMessages(
    queryStr: string,
    options?: { source?: Source; workspace?: string; limit?: number; contextMessages?: number }
  ): MessageSearchResult[] {
    const limit = options?.limit ?? 10;
    const contextSize = options?.contextMessages ?? 2;

    if (!queryStr.trim()) return [];

    const ftsQuery = buildFtsQuery(queryStr);

    const conditions: string[] = ['messages_fts MATCH ?'];
    const params: (string | number | null)[] = [ftsQuery];

    if (options?.workspace) {
      conditions.push('c.workspace LIKE ?');
      params.push(`%${options.workspace}%`);
    }
    if (options?.source) {
      conditions.push('c.source = ?');
      params.push(options.source);
    }

    params.push(limit);

    const sql = `
      SELECT m.rowid, m.conv_id, m.msg_index, m.role, m.text,
             c.workspace, c.workspace_path, c.title, c.created_at, c.mode, c.message_count, c.source
      FROM messages_fts fts
      JOIN messages m ON m.rowid = fts.rowid
      JOIN conversations c ON c.id = m.conv_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.created_at DESC, m.msg_index
      LIMIT ?
    `;

    type RawRow = {
      rowid: number;
      conv_id: string;
      msg_index: number;
      role: string;
      text: string;
      workspace: string;
      workspace_path: string;
      title: string;
      created_at: number | null;
      mode: string | null;
      message_count: number;
      source: Source;
    };

    const rows = this.query<RawRow>(sql, params);

    return rows.map((r) => {
      const context = this.getMessageContext(r.conv_id, r.msg_index, contextSize);
      return {
        conversationId: r.conv_id,
        workspace: r.workspace,
        workspacePath: r.workspace_path,
        conversationTitle: r.title,
        messageIndex: r.msg_index,
        role: r.role,
        matchSnippet: truncateToSnippet(r.text, 500),
        context,
        createdAt: r.created_at,
        mode: r.mode,
        messageCount: r.message_count,
        source: r.source,
      };
    });
  }

  private getMessageContext(
    convId: string,
    msgIndex: number,
    contextSize: number
  ): Array<{ index: number; role: string; snippet: string }> {
    const fromIdx = Math.max(0, msgIndex - contextSize);
    const toIdx = msgIndex + contextSize;

    const rows = this.query<{ msg_index: number; role: string; text: string }>(
      `SELECT msg_index, role, text FROM messages
       WHERE conv_id = ? AND msg_index >= ? AND msg_index <= ? AND msg_index != ?
       ORDER BY msg_index`,
      [convId, fromIdx, toIdx, msgIndex]
    );

    return rows.map((r) => ({
      index: r.msg_index,
      role: r.role,
      snippet: truncateToSnippet(r.text, 200),
    }));
  }

  search(queryStr: string, options?: { source?: Source; workspace?: string; limit?: number }): SearchResult[] {
    const limit = options?.limit ?? 20;
    const params: (string | number | null)[] = [];

    let sql: string;

    if (queryStr.trim()) {
      const ftsQuery = buildFtsQuery(queryStr);

      const conditions: string[] = ['conversations_fts MATCH ?'];
      params.push(ftsQuery);

      if (options?.workspace) {
        conditions.push('c.workspace LIKE ?');
        params.push(`%${options.workspace}%`);
      }
      if (options?.source) {
        conditions.push('c.source = ?');
        params.push(options.source);
      }

      params.push(limit);

      sql = `
        SELECT c.id, c.workspace, c.workspace_path, c.title, c.first_message, c.message_count, c.created_at, c.mode, c.source
        FROM conversations_fts fts
        JOIN conversations c ON c.id = fts.conv_id
        WHERE ${conditions.join(' AND ')}
        LIMIT ?
      `;
    } else {
      const conditions: string[] = [];
      if (options?.workspace) {
        conditions.push('workspace LIKE ?');
        params.push(`%${options.workspace}%`);
      }
      if (options?.source) {
        conditions.push('source = ?');
        params.push(options.source);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limit);

      sql = `SELECT id, workspace, workspace_path, title, first_message, message_count, created_at, mode, source
             FROM conversations ${whereClause} ORDER BY created_at DESC LIMIT ?`;
    }

    const rows = this.query<{
      id: string;
      workspace: string;
      workspace_path: string;
      title: string;
      first_message: string;
      message_count: number;
      created_at: number | null;
      mode: string | null;
      source: Source;
    }>(sql, params);

    return rows.map((r, i) => ({
      id: r.id,
      workspace: r.workspace,
      workspacePath: r.workspace_path,
      title: r.title,
      snippet: (r.first_message ?? '').slice(0, 300),
      rank: i + 1,
      createdAt: r.created_at,
      mode: r.mode,
      messageCount: r.message_count,
      source: r.source,
    }));
  }

  getConversation(id: string): {
    id: string;
    workspace: string;
    workspacePath: string;
    title: string;
    messages: Array<{ index: number; role: string; text: string }>;
    createdAt: number | null;
    mode: string | null;
    branch: string | null;
    messageCount: number;
    source: Source;
  } | null {
    const row = this.queryOne<{
      id: string;
      workspace: string;
      workspace_path: string;
      title: string;
      created_at: number | null;
      mode: string | null;
      branch: string | null;
      message_count: number;
      source: Source;
    }>(
      `SELECT id, workspace, workspace_path, title, created_at, mode, branch, message_count, source
       FROM conversations WHERE id = ?`,
      [id]
    );

    if (!row) return null;

    const messages = this.query<{ msg_index: number; role: string; text: string }>(
      `SELECT msg_index, role, text FROM messages WHERE conv_id = ? ORDER BY msg_index`,
      [id]
    );

    return {
      id: row.id,
      workspace: row.workspace,
      workspacePath: row.workspace_path,
      title: row.title,
      messages: messages.map((m) => ({ index: m.msg_index, role: m.role, text: m.text })),
      createdAt: row.created_at,
      mode: row.mode,
      branch: row.branch,
      messageCount: row.message_count,
      source: row.source,
    };
  }

  searchInConversation(
    convId: string,
    queryStr: string,
    options?: { limit?: number; contextMessages?: number }
  ): Array<{ index: number; role: string; matchSnippet: string; context: Array<{ index: number; role: string; snippet: string }> }> {
    const limit = options?.limit ?? 10;
    const contextSize = options?.contextMessages ?? 2;

    if (!queryStr.trim()) return [];

    const ftsQuery = buildFtsQuery(queryStr);

    const rows = this.query<{ rowid: number; msg_index: number; role: string; text: string }>(
      `SELECT m.rowid, m.msg_index, m.role, m.text
       FROM messages_fts fts
       JOIN messages m ON m.rowid = fts.rowid
       WHERE messages_fts MATCH ?
         AND m.conv_id = ?
       ORDER BY m.msg_index
       LIMIT ?`,
      [ftsQuery, convId, limit]
    );

    return rows.map((r) => {
      const context = this.getMessageContext(convId, r.msg_index, contextSize);
      return {
        index: r.msg_index,
        role: r.role,
        matchSnippet: truncateToSnippet(r.text, 500),
        context,
      };
    });
  }

  listProjects(source?: Source): Array<{ workspace: string; workspacePath: string; conversationCount: number; source: Source }> {
    const params: (string | number | null)[] = [];
    let whereClause = '';

    if (source) {
      whereClause = 'WHERE source = ?';
      params.push(source);
    }

    const rows = this.query<{ workspace: string; workspace_path: string; count: number; source: Source }>(
      `SELECT workspace, workspace_path, COUNT(*) as count, source
       FROM conversations ${whereClause}
       GROUP BY workspace, source
       ORDER BY count DESC`,
      params
    );

    return rows.map((r) => ({
      workspace: r.workspace,
      workspacePath: r.workspace_path,
      conversationCount: r.count,
      source: r.source,
    }));
  }

  stats(source?: Source): {
    totalConversations: number;
    totalMessages: number;
    workspaceCount: number;
    bySource: Record<Source, { conversations: number; messages: number }>;
  } {
    const params: (string | number | null)[] = [];
    let whereClause = '';

    if (source) {
      whereClause = 'WHERE source = ?';
      params.push(source);
    }

    const row = this.queryOne<{ total: number; msgs: number; ws: number }>(
      `SELECT COUNT(*) as total, SUM(message_count) as msgs, COUNT(DISTINCT workspace) as ws
       FROM conversations ${whereClause}`,
      params
    ) ?? { total: 0, msgs: 0, ws: 0 };

    const bySourceRows = this.query<{ source: Source; conversations: number; messages: number }>(
      `SELECT source, COUNT(*) as conversations, SUM(message_count) as messages
       FROM conversations GROUP BY source`
    );

    const bySource: Record<Source, { conversations: number; messages: number }> = {
      claude: { conversations: 0, messages: 0 },
      cursor: { conversations: 0, messages: 0 },
    };
    for (const r of bySourceRows) {
      bySource[r.source] = { conversations: r.conversations, messages: r.messages ?? 0 };
    }

    return {
      totalConversations: row.total,
      totalMessages: row.msgs ?? 0,
      workspaceCount: row.ws,
      bySource,
    };
  }
}

function buildFtsQuery(queryStr: string): string {
  // FTS5 needs bareword/quoted tokens; strip characters that would otherwise
  // be interpreted as FTS5 query syntax (', ", -, (, )) and re-join as an
  // implicit AND of terms.
  return queryStr
    .replace(/['")(-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function truncateToSnippet(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
