#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadClaudeTranscripts } from './sources/claude.js';
import { loadCursorTranscripts, loadCursorComposerMetadata } from './sources/cursor.js';
import { SearchIndex } from './search-index.js';
import type { Source } from './types.js';

const SERVER_NAME = 'ai-chat-browser';
const SERVER_VERSION = '0.1.0';

const sourceEnum = z.enum(['claude', 'cursor']).optional().describe('Filter by source: "claude" or "cursor"');

async function main() {
  const startTime = Date.now();

  const index = await SearchIndex.create();
  const existingIds = index.getIndexedIds();

  const claudeTranscripts = loadClaudeTranscripts(existingIds);
  const cursorTranscripts = loadCursorTranscripts(existingIds);
  const allTranscripts = [...claudeTranscripts, ...cursorTranscripts];

  const indexed = index.indexConversations(allTranscripts);
  const stats = index.stats();
  const elapsed = Date.now() - startTime;

  // Enrich Cursor metadata in background
  if (cursorTranscripts.length > 0) {
    setImmediate(() => {
      try {
        const composerMeta = loadCursorComposerMetadata();
        index.enrichMetadata(composerMeta);
      } catch { /* non-critical */ }
    });
  }

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: {} },
      instructions: `AI Chat Browser — unified search across Claude Code and Cursor AI conversations.

Index: ${stats.totalConversations} conversations, ${stats.totalMessages} messages (Claude: ${stats.bySource.claude.conversations} convs / ${stats.bySource.claude.messages} msgs, Cursor: ${stats.bySource.cursor.conversations} convs / ${stats.bySource.cursor.messages} msgs). Indexed ${indexed} new in ${elapsed}ms.

Use search_messages to find specific messages by keyword. Use search_conversations to find by title. Use get_conversation to retrieve full transcripts. All tools support source filtering ("claude" or "cursor").

Proactively search past conversations when working on complex tasks — previous discussions contain decisions, patterns, and context.`,
    }
  );

  server.registerTool(
    'search_messages',
    {
      title: 'Search Messages',
      description:
        'Search through individual messages across all past AI conversations (Claude Code + Cursor). Returns matching messages with surrounding context.',
      inputSchema: z.object({
        query: z.string().describe('Search query — keywords, function names, error messages, concepts'),
        source: sourceEnum,
        workspace: z.string().optional().describe('Filter to a specific workspace/project name (partial match)'),
        limit: z.number().optional().default(10).describe('Maximum number of matching messages (default: 10)'),
        context_messages: z.number().optional().default(2).describe('Surrounding messages for context (default: 2)'),
      }),
    },
    async ({ query, source, workspace, limit, context_messages }) => {
      const results = index.searchMessages(query, {
        source: source as Source | undefined,
        workspace,
        limit,
        contextMessages: context_messages,
      });

      if (results.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No messages found for query: "${query}"${source ? ` (source: ${source})` : ''}${workspace ? ` in workspace "${workspace}"` : ''}`,
          }],
        };
      }

      const lines = results.map((r, i) => {
        const date = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'unknown';
        const contextBefore = r.context
          .filter((c) => c.index < r.messageIndex)
          .map((c) => `  > [${c.role}] ${c.snippet}`)
          .join('\n');
        const contextAfter = r.context
          .filter((c) => c.index > r.messageIndex)
          .map((c) => `  > [${c.role}] ${c.snippet}`)
          .join('\n');

        return [
          `### ${i + 1}. Match in "${r.conversationTitle}"`,
          `- **Source:** ${r.source} | **Workspace:** ${r.workspace} | **Date:** ${date} | **Message #${r.messageIndex}** (${r.role})`,
          '',
          contextBefore ? `${contextBefore}\n` : '',
          `  **>>> [${r.role}] ${r.matchSnippet}**`,
          '',
          contextAfter || '',
        ]
          .filter(Boolean)
          .join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Found ${results.length} matching message(s) for "${query}":\n\n${lines.join('\n\n---\n\n')}`,
        }],
      };
    }
  );

  server.registerTool(
    'search_conversations',
    {
      title: 'Search Conversations by Title',
      description: 'Search conversations by title/topic across Claude Code and Cursor.',
      inputSchema: z.object({
        query: z.string().describe('Search query — keywords or phrases to match against conversation titles'),
        source: sourceEnum,
        workspace: z.string().optional().describe('Filter to a specific workspace/project (partial match)'),
        limit: z.number().optional().default(10).describe('Maximum results (default: 10)'),
      }),
    },
    async ({ query, source, workspace, limit }) => {
      const results = index.search(query, { source: source as Source | undefined, workspace, limit });

      if (results.length === 0) {
        return {
          content: [{
            type: 'text' as const,
            text: `No conversations found for query: "${query}"${source ? ` (source: ${source})` : ''}`,
          }],
        };
      }

      const lines = results.map((r) => {
        const date = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'unknown';
        return [
          `### ${r.rank}. ${r.title}`,
          `- **ID:** ${r.id} | **Source:** ${r.source}`,
          `- **Workspace:** ${r.workspace} | **Date:** ${date} | **Messages:** ${r.messageCount}`,
          `- **Preview:** ${r.snippet}`,
        ].join('\n');
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Found ${results.length} conversation(s) for "${query}":\n\n${lines.join('\n\n')}`,
        }],
      };
    }
  );

  server.registerTool(
    'get_conversation',
    {
      title: 'Get Conversation',
      description: 'Retrieve a full conversation transcript by ID. Optionally search within it.',
      inputSchema: z.object({
        id: z.string().describe('Conversation UUID (from search results)'),
        search: z.string().optional().describe('Optional query to filter to matching messages within this conversation'),
        max_messages: z.number().optional().default(50).describe('Maximum messages to return (default: 50)'),
      }),
    },
    async ({ id, search, max_messages }) => {
      const conv = index.getConversation(id);

      if (!conv) {
        return { content: [{ type: 'text' as const, text: `Conversation not found: ${id}` }] };
      }

      const date = conv.createdAt ? new Date(conv.createdAt).toISOString() : 'unknown';
      const header = [
        `# ${conv.title}`,
        `**Source:** ${conv.source} | **Workspace:** ${conv.workspace} (${conv.workspacePath})`,
        `**Date:** ${date} | **Branch:** ${conv.branch ?? 'unknown'} | **Messages:** ${conv.messageCount}`,
        '---',
      ].join('\n');

      if (search?.trim()) {
        const matches = index.searchInConversation(id, search, { limit: max_messages, contextMessages: 2 });

        if (matches.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `${header}\n\nNo messages matching "${search}" found in this conversation.`,
            }],
          };
        }

        const matchLines = matches.map((m) => {
          const contextBefore = m.context
            .filter((c) => c.index < m.index)
            .map((c) => `  > [msg #${c.index} - ${c.role}] ${c.snippet}`)
            .join('\n');
          const contextAfter = m.context
            .filter((c) => c.index > m.index)
            .map((c) => `  > [msg #${c.index} - ${c.role}] ${c.snippet}`)
            .join('\n');

          return [
            contextBefore || '',
            `  **>>> [msg #${m.index} - ${m.role}] ${m.matchSnippet}**`,
            contextAfter || '',
          ]
            .filter(Boolean)
            .join('\n');
        });

        return {
          content: [{
            type: 'text' as const,
            text: `${header}\n\nFound ${matches.length} message(s) matching "${search}":\n\n${matchLines.join('\n\n---\n\n')}`,
          }],
        };
      }

      const messages = conv.messages.slice(0, max_messages);
      const truncated = conv.messages.length > max_messages;

      const messageLines = messages.map(
        (m) => `[msg #${m.index} - ${m.role}]\n${m.text}`
      );

      const body = messageLines.join('\n\n');
      const truncNote = truncated
        ? `\n> Showing ${max_messages} of ${conv.messages.length} messages. Increase max_messages to see more.\n`
        : '';

      return { content: [{ type: 'text' as const, text: `${header}${truncNote}\n\n${body}` }] };
    }
  );

  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description: 'List all projects with indexed conversations, grouped by source.',
      inputSchema: z.object({
        source: sourceEnum,
      }),
    },
    async ({ source }) => {
      const projects = index.listProjects(source as Source | undefined);
      const statsData = index.stats();

      const lines = projects.map(
        (p) => `- **${p.workspace}** [${p.source}] — ${p.conversationCount} conversation(s) (${p.workspacePath})`
      );

      return {
        content: [{
          type: 'text' as const,
          text: [
            `## Indexed Projects`,
            `Total: ${statsData.totalConversations} conversations, ${statsData.totalMessages} messages`,
            `Claude: ${statsData.bySource.claude.conversations} conversations | Cursor: ${statsData.bySource.cursor.conversations} conversations`,
            '',
            ...lines,
          ].join('\n'),
        }],
      };
    }
  );

  server.registerTool(
    'stats',
    {
      title: 'Index Statistics',
      description: 'Get total counts of indexed conversations and messages, broken down by source.',
      inputSchema: z.object({}),
    },
    async () => {
      const statsData = index.stats();

      return {
        content: [{
          type: 'text' as const,
          text: [
            `## AI Chat Browser Statistics`,
            `- **Total:** ${statsData.totalConversations} conversations, ${statsData.totalMessages} messages across ${statsData.workspaceCount} workspaces`,
            `- **Claude Code:** ${statsData.bySource.claude.conversations} conversations, ${statsData.bySource.claude.messages} messages`,
            `- **Cursor:** ${statsData.bySource.cursor.conversations} conversations, ${statsData.bySource.cursor.messages} messages`,
          ].join('\n'),
        }],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('ai-chat-browser error:', err);
  process.exit(1);
});
