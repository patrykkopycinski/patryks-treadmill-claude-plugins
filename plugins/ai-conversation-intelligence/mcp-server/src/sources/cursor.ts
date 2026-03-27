import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import type { Conversation, ConversationMeta, Message } from '../types.js';

const CURSOR_PROJECTS_DIR = join(homedir(), '.cursor', 'projects');

function resolveWorkspaceKey(key: string): { name: string; path: string } {
  const segments = key.split('-');
  const resolvedParts: string[] = [];
  let i = 0;

  while (i < segments.length) {
    let matched = false;
    for (let j = segments.length; j > i; j--) {
      const candidate = segments.slice(i, j).join('-');
      const testPath = '/' + [...resolvedParts, candidate].join('/');
      if (existsSync(testPath)) {
        resolvedParts.push(candidate);
        i = j;
        matched = true;
        break;
      }
    }
    if (!matched) {
      resolvedParts.push(segments[i]!);
      i++;
    }
  }

  const fullPath = '/' + resolvedParts.join('/');
  const projectsIdx = resolvedParts.indexOf('Projects');
  const name =
    projectsIdx >= 0 && projectsIdx + 1 < resolvedParts.length
      ? resolvedParts.slice(projectsIdx + 1).join('/')
      : resolvedParts.slice(-1)[0] ?? key;

  return { name, path: fullPath };
}

function stripCursorWrapperTags(text: string): string {
  return text
    .replace(/<(?:system_reminder|user_info|git_status|open_and_recently_viewed_files|rules|agent_skills|agent_transcripts|attached_files|external_links|image_files|terminal_files_information)[^>]*>[\s\S]*?<\/[^>]+>/g, '')
    .replace(/<\/?user_query>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTranscriptFile(filePath: string): Message[] {
  const messages: Message[] = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        const role = entry.role as string;
        if (role !== 'user' && role !== 'assistant' && role !== 'tool') continue;

        let text = '';
        if (entry.message?.content) {
          for (const block of entry.message.content) {
            if (block.type === 'text' && block.text) {
              text += block.text + '\n';
            }
          }
        }
        if (text.trim()) {
          messages.push({ role: role as Message['role'], text: stripCursorWrapperTags(text.trim()) });
        }
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // skip unreadable files
  }
  return messages;
}

function extractTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return '(no title)';

  let text = firstUser.text;
  const userQueryMatch = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/);
  if (userQueryMatch) {
    text = userQueryMatch[1]!;
  }
  text = text.replace(/<(?:system_reminder|user_info|git_status|open_and_recently_viewed_files|rules|agent_skills|agent_transcripts)[^>]*>[\s\S]*?<\/[^>]+>/g, '');

  const title = text.replace(/\s+/g, ' ').trim();
  if (!title) return '(no title)';
  return title.length > 120 ? title.slice(0, 117) + '...' : title;
}

export function loadCursorTranscripts(skipIds?: Set<string>): Conversation[] {
  const conversations: Conversation[] = [];

  if (!existsSync(CURSOR_PROJECTS_DIR)) return conversations;

  for (const wsDir of readdirSync(CURSOR_PROJECTS_DIR, { withFileTypes: true })) {
    if (!wsDir.isDirectory()) continue;

    const transcriptsDir = join(CURSOR_PROJECTS_DIR, wsDir.name, 'agent-transcripts');
    if (!existsSync(transcriptsDir)) continue;

    const { name: workspace, path: workspacePath } = resolveWorkspaceKey(wsDir.name);

    for (const agentDir of readdirSync(transcriptsDir, { withFileTypes: true })) {
      if (!agentDir.isDirectory()) continue;

      const agentId = agentDir.name;
      if (skipIds?.has(agentId)) continue;

      const jsonlPath = join(transcriptsDir, agentId, `${agentId}.jsonl`);
      if (!existsSync(jsonlPath)) continue;

      const messages = parseTranscriptFile(jsonlPath);
      if (messages.length === 0) continue;

      const title = extractTitle(messages);

      let createdAt: number | null = null;
      try {
        createdAt = statSync(jsonlPath).mtimeMs;
      } catch { /* ignore */ }

      conversations.push({
        id: agentId,
        workspace,
        workspacePath,
        title,
        firstMessage: messages[0]?.text ?? '',
        messages,
        createdAt,
        mode: null,
        branch: null,
        messageCount: messages.length,
        source: 'cursor',
        kind: 'interactive',
        entrypoint: null,
      });
    }
  }

  return conversations;
}

function getStateDbPath(): string {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  }
  if (process.platform === 'win32') {
    return join(homedir(), 'AppData', 'Roaming', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  }
  return join(homedir(), '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
}

function findSqlite3(): string | null {
  const candidates = ['sqlite3', '/usr/bin/sqlite3', '/opt/homebrew/bin/sqlite3'];
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['--version'], { stdio: 'ignore', timeout: 5000 });
      return bin;
    } catch { /* not found */ }
  }
  return null;
}

export function loadCursorComposerMetadata(): Map<string, ConversationMeta> {
  const metaMap = new Map<string, ConversationMeta>();
  const dbPath = getStateDbPath();

  if (!existsSync(dbPath)) return metaMap;

  const sqlite3 = findSqlite3();
  if (!sqlite3) return metaMap;

  try {
    const sql = `SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%' AND length(value) > 100;`;
    const output = execFileSync(sqlite3, ['-json', dbPath, sql], {
      maxBuffer: 200 * 1024 * 1024,
      timeout: 60000,
      encoding: 'utf-8',
    });

    let rows: Array<{ key: string; value: string }>;
    try {
      rows = JSON.parse(output);
    } catch {
      return metaMap;
    }

    for (const row of rows) {
      try {
        const data = JSON.parse(row.value);
        const composerId = data.composerId as string;
        if (!composerId) continue;

        let userText = (data.text as string) ?? '';
        if (!userText && data.richText) {
          try {
            const rich = JSON.parse(data.richText);
            userText = extractTextFromLexical(rich);
          } catch { /* ignore */ }
        }

        metaMap.set(composerId, {
          composerId,
          createdAt: (data.createdAt as number) ?? null,
          mode: (data.unifiedMode as string) ?? (data.forceMode as string) ?? null,
          branch: (data.createdOnBranch as string) ?? null,
          status: (data.status as string) ?? null,
          isAgentic: Boolean(data.isAgentic),
          text: userText,
        });
      } catch {
        // skip unparseable entries
      }
    }
  } catch {
    // sqlite3 read failed
  }

  return metaMap;
}

function extractTextFromLexical(root: unknown): string {
  if (!root || typeof root !== 'object') return '';
  const node = root as Record<string, unknown>;

  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromLexical).join('');
  }

  if (node.root) {
    return extractTextFromLexical(node.root);
  }

  return '';
}
