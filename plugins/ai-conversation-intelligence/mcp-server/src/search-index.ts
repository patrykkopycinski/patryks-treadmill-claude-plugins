import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import type { Conversation, ConversationMeta, Source, SearchResult, MessageSearchResult } from './types.js';

const INDEX_DIR = join(homedir(), '.claude', 'chat-browser');
const INDEX_DB_PATH = join(INDEX_DIR, 'search-index.db');
const SCHEMA_VERSION = 3; // Bumped from cursor-chat-browser v2

export class SearchIndex {
  private db: SqlJsDatabase;
  private dirty = false;

  private constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  static async create(): Promise<SearchIndex> {
    mkdirSync(INDEX_DIR, { recursive: true });

    const SQL = await initSqlJs();

    let db: SqlJsDatabase;
    let needsMigration = false;

    if (existsSync(INDEX_DB_PATH)) {
      const buffer = readFileSync(INDEX_DB_PATH);
      db = new SQL.Database(buffer);

      const version = SearchIndex.getSchemaVersion(db);
      if (version < SCHEMA_VERSION) {
        db.close();
        unlinkSync(INDEX_DB_PATH);
        db = new SQL.Database();
        needsMigration = true;
      }
    } else {
      db = new SQL.Database();
      needsMigration = true;
    }

    const instance = new SearchIndex(db);
    instance.init();
    if (needsMigration) {
      instance.dirty = true;
      instance.save();
    }
    return instance;
  }

  private static getSchemaVersion(db: SqlJsDatabase): number {
    try {
      const stmt = db.prepare('SELECT version FROM schema_version LIMIT 1');
      if (stmt.step()) {
        const row = stmt.getAsObject() as { version: number };
        stmt.free();
        return row.version;
      }
      stmt.free();
    } catch {
      // table doesn't exist
    }
    return 1;
  }

  private init() {
    this.db.run(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`);

    const currentVersion = SearchIndex.getSchemaVersion(this.db);
    if (currentVersion < SCHEMA_VERSION) {
      this.db.run(`DELETE FROM schema_version`);
      this.db.run(`INSERT INTO schema_version (version) VALUES (?)`, [SCHEMA_VERSION]);
    }

    this.db.run(`
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

    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        conv_id TEXT NOT NULL,
        msg_index INTEGER NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (conv_id) REFERENCES conversations(id)
      )
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conv_id, msg_index)`);

    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts4(
        text,
        tokenize=porter
      )
    `);

    this.db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS conversations_fts USING fts4(
        conv_id,
        title,
        workspace,
        tokenize=porter
      )
    `);
  }

  private save() {
    if (!this.dirty) return;
    const data = this.db.export();
    writeFileSync(INDEX_DB_PATH, Buffer.from(data));
    this.dirty = false;
  }

  private query<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params as (string | number | null)[]);

    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  getIndexedIds(): Set<string> {
    const rows = this.query<{ id: string }>('SELECT id FROM conversations');
    return new Set(rows.map((r) => r.id));
  }

  indexConversations(conversations: Conversation[]): number {
    const existing = this.getIndexedIds();
    const toInsert = conversations.filter((c) => !existing.has(c.id));

    if (toInsert.length === 0) return 0;

    this.db.run('BEGIN TRANSACTION');
    try {
      for (const c of toInsert) {
        this.db.run(
          `INSERT OR REPLACE INTO conversations
            (id, workspace, workspace_path, title, first_message, created_at, mode, branch, message_count, indexed_at, source, kind, entrypoint)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
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
            c.entrypoint,
          ]
        );
        this.db.run(
          `INSERT INTO conversations_fts (conv_id, title, workspace) VALUES (?, ?, ?)`,
          [c.id, c.title, c.workspace]
        );

        for (let i = 0; i < c.messages.length; i++) {
          const msg = c.messages[i]!;
          if (!msg.text.trim()) continue;

          this.db.run(
            `INSERT INTO messages (conv_id, msg_index, role, text) VALUES (?, ?, ?, ?)`,
            [c.id, i, msg.role, msg.text]
          );
          this.db.run(
            `INSERT INTO messages_fts (rowid, text) VALUES (last_insert_rowid(), ?)`,
            [msg.text]
          );
        }
      }
      this.db.run('COMMIT');
      this.dirty = true;
      this.save();
    } catch (err) {
      this.db.run('ROLLBACK');
      throw err;
    }

    return toInsert.length;
  }

  searchMessages(
    queryStr: string,
    options?: { source?: Source; workspace?: string; limit?: number; contextMessages?: number }
  ): MessageSearchResult[] {
    const limit = options?.limit ?? 10;
    const contextSize = options?.contextMessages ?? 2;

    if (!queryStr.trim()) return [];

    const ftsQuery = queryStr
      .replace(/['"]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');

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
      const ftsQuery = queryStr
        .replace(/['"]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .join(' ');

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
    const rows = this.query<{
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

    if (rows.length === 0) return null;
    const row = rows[0]!;

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

    const ftsQuery = queryStr
      .replace(/['"]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .join(' ');

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

  stats(source?: Source): { totalConversations: number; totalMessages: number; workspaceCount: number; bySource: Record<Source, { conversations: number; messages: number }> } {
    const params: (string | number | null)[] = [];
    let whereClause = '';

    if (source) {
      whereClause = 'WHERE source = ?';
      params.push(source);
    }

    const rows = this.query<{ total: number; msgs: number; ws: number }>(
      `SELECT COUNT(*) as total, SUM(message_count) as msgs, COUNT(DISTINCT workspace) as ws
       FROM conversations ${whereClause}`,
      params
    );

    const row = rows[0] ?? { total: 0, msgs: 0, ws: 0 };

    const bySourceRows = this.query<{ source: Source; convs: number; msgs: number }>(
      `SELECT source, COUNT(*) as convs, SUM(message_count) as msgs FROM conversations GROUP BY source`
    );

    const bySource: Record<Source, { conversations: number; messages: number }> = {
      claude: { conversations: 0, messages: 0 },
      cursor: { conversations: 0, messages: 0 },
    };

    for (const r of bySourceRows) {
      bySource[r.source] = { conversations: r.convs, messages: r.msgs ?? 0 };
    }

    return {
      totalConversations: row.total,
      totalMessages: row.msgs ?? 0,
      workspaceCount: row.ws,
      bySource,
    };
  }

  enrichMetadata(metaMap: Map<string, ConversationMeta>) {
    this.db.run('BEGIN TRANSACTION');
    try {
      for (const [id, meta] of metaMap) {
        if (meta.createdAt || meta.mode || meta.branch) {
          this.db.run(
            `UPDATE conversations SET created_at = ?, mode = ?, branch = ? WHERE id = ? AND (created_at IS NULL OR mode IS NULL)`,
            [meta.createdAt ?? null, meta.mode ?? null, meta.branch ?? null, id]
          );
        }
      }
      this.db.run('COMMIT');
      this.dirty = true;
      this.save();
    } catch {
      this.db.run('ROLLBACK');
    }
  }

  close() {
    this.save();
    this.db.close();
  }
}

function truncateToSnippet(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
