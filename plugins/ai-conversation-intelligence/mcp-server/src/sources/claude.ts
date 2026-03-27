import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';
import type { Conversation, ConversationKind, Message } from '../types.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

const WRAPPER_TAG_PATTERN = /<(?:system-reminder|ide_opened_file|ide_selection|antml:thinking|antml:function_calls)[^>]*>[\s\S]*?<\/[^>]+>/g;
const SYSTEM_REMINDER_SELF_CLOSE = /<system-reminder[^/]*\/>/g;

function stripClaudeWrapperTags(text: string): string {
  return text
    .replace(WRAPPER_TAG_PATTERN, '')
    .replace(SYSTEM_REMINDER_SELF_CLOSE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveClaudeWorkspaceKey(key: string): { name: string; path: string } {
  // Claude uses path-encoded keys like "-Users-patrykkopycinski-Projects-kibana"
  // Convert to filesystem path
  const fullPath = '/' + key.replace(/^-/, '').replace(/-/g, '/');

  // Try greedy resolution like cursor-chat-browser
  const segments = key.replace(/^-/, '').split('-');
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

  const resolvedPath = '/' + resolvedParts.join('/');
  const projectsIdx = resolvedParts.indexOf('Projects');
  const name =
    projectsIdx >= 0 && projectsIdx + 1 < resolvedParts.length
      ? resolvedParts.slice(projectsIdx + 1).join('/')
      : resolvedParts.slice(-1)[0] ?? key;

  return { name, path: resolvedPath };
}

interface ClaudeEntry {
  type?: string;
  message?: {
    content?: Array<{ type: string; text?: string }> | string;
  };
  timestamp?: string;
  gitBranch?: string;
  sessionId?: string;
  cwd?: string;
  entrypoint?: string;
}

function parseClaudeSessionFile(filePath: string): {
  messages: Message[];
  metadata: {
    timestamp: string | null;
    gitBranch: string | null;
    sessionId: string | null;
    cwd: string | null;
    entrypoint: string | null;
  };
} {
  const messages: Message[] = [];
  const metadata = {
    timestamp: null as string | null,
    gitBranch: null as string | null,
    sessionId: null as string | null,
    cwd: null as string | null,
    entrypoint: null as string | null,
  };

  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        const entry: ClaudeEntry = JSON.parse(line);

        // Extract metadata from any entry that has it
        if (entry.gitBranch && !metadata.gitBranch) metadata.gitBranch = entry.gitBranch;
        if (entry.sessionId && !metadata.sessionId) metadata.sessionId = entry.sessionId;
        if (entry.cwd && !metadata.cwd) metadata.cwd = entry.cwd;
        if (entry.entrypoint && !metadata.entrypoint) metadata.entrypoint = entry.entrypoint;
        if (entry.timestamp && !metadata.timestamp) metadata.timestamp = entry.timestamp;

        // Only extract user/assistant messages
        if (entry.type !== 'user' && entry.type !== 'assistant') continue;

        let text = '';
        const content = entry.message?.content;
        if (typeof content === 'string') {
          text = content;
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              text += block.text + '\n';
            }
          }
        }

        const cleaned = stripClaudeWrapperTags(text);
        if (cleaned.length > 0) {
          messages.push({
            role: entry.type as Message['role'],
            text: cleaned,
          });
        }
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // skip unreadable files
  }

  return { messages, metadata };
}

function extractTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return '(no title)';

  const title = firstUser.text.replace(/\s+/g, ' ').trim();
  if (!title) return '(no title)';
  return title.length > 120 ? title.slice(0, 117) + '...' : title;
}

function isSubagentFile(filename: string): boolean {
  return /^agent-[a-f0-9]+\.jsonl$/.test(filename);
}

export function loadClaudeTranscripts(skipIds?: Set<string>): Conversation[] {
  const conversations: Conversation[] = [];

  if (!existsSync(CLAUDE_PROJECTS_DIR)) return conversations;

  for (const wsDir of readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true })) {
    if (!wsDir.isDirectory()) continue;

    const projectDir = join(CLAUDE_PROJECTS_DIR, wsDir.name);
    const { name: workspace, path: workspacePath } = resolveClaudeWorkspaceKey(wsDir.name);

    for (const file of readdirSync(projectDir, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith('.jsonl')) continue;

      // Skip non-session files (memory, etc.)
      const fileBaseName = basename(file.name, '.jsonl');
      if (skipIds?.has(fileBaseName)) continue;

      const filePath = join(projectDir, file.name);
      const kind: ConversationKind = isSubagentFile(file.name) ? 'subagent' : 'interactive';

      const { messages, metadata } = parseClaudeSessionFile(filePath);
      if (messages.length === 0) continue;

      const title = extractTitle(messages);

      let createdAt: number | null = null;
      if (metadata.timestamp) {
        createdAt = new Date(metadata.timestamp).getTime();
      }
      if (!createdAt) {
        try {
          createdAt = statSync(filePath).birthtimeMs;
        } catch { /* ignore */ }
      }

      conversations.push({
        id: fileBaseName,
        workspace,
        workspacePath,
        title,
        firstMessage: messages[0]?.text ?? '',
        messages,
        createdAt,
        mode: null,
        branch: metadata.gitBranch,
        messageCount: messages.length,
        source: 'claude',
        kind,
        entrypoint: metadata.entrypoint,
      });
    }
  }

  return conversations;
}
