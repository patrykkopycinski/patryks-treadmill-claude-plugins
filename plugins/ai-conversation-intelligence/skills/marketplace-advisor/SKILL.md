---
name: marketplace-advisor
description: Evaluate whether a new or updated skill should be published to the patryks-treadmill marketplace and handle the publishing workflow. Triggers automatically after skill creation or when asked to publish/share a skill.
---

# Marketplace Advisor

Evaluate skills for marketplace readiness and handle publishing to the patryks-treadmill marketplace.

## When to Trigger

- After a new skill is created in any treadmill plugin
- After a skill is significantly updated
- When user asks to "publish", "share", or "add to marketplace"
- During `/review-nominations` when a skill nomination is accepted
- Periodically during `/mine-patterns` when new skills are discovered

## Process

### Step 1: Evaluate Marketplace Readiness

For a skill to be marketplace-worthy, check these criteria:

| Criterion | Required | Check |
|-----------|----------|-------|
| **Reusable** | Yes | Would other developers (not just Patryk) find this useful? |
| **Self-contained** | Yes | Does it work without project-specific paths, credentials, or local state? |
| **Well-described** | Yes | Does the SKILL.md have clear name, description, and process steps? |
| **Not Kibana-specific** | Preferred | Skills tied to Kibana internals are less marketplace-worthy than generic dev skills |
| **Has clear trigger** | Yes | Is the description specific enough that Claude knows when to invoke it? |
| **Tested** | Preferred | Has it been used successfully at least once? |

Score each criterion 0-2 (0=no, 1=partial, 2=yes). Total score out of 12.

- **10+**: Strong marketplace candidate
- **7-9**: Possible with improvements (suggest specific fixes)
- **<7**: Keep private — too specific or not ready

### Step 2: Check Current Marketplace State

Read `~/Projects/patryks-treadmill-claude-plugins/.claude-plugin/marketplace.json` to understand:
- Which plugins are already published
- Current skill counts per plugin
- Whether the skill's plugin is already in the marketplace

### Step 3: Determine Plugin Placement

If the skill should be published:

1. **Existing plugin**: If the skill belongs to a plugin already in marketplace.json, just verify the plugin.json includes the skill path
2. **New plugin needed**: If the skill doesn't fit any existing plugin, recommend creating a new plugin and adding it to marketplace.json

### Step 4: Pre-publish Checklist

Before publishing, verify:

- [ ] SKILL.md has proper YAML frontmatter (name, description)
- [ ] Description is under 200 chars and specific enough for triggering
- [ ] No hardcoded user-specific paths (use `~` or `$HOME` instead of `/Users/patrykkopycinski`)
- [ ] No secrets, credentials, or API keys in skill content
- [ ] Plugin's plugin.json lists the skill in its `skills` array
- [ ] Plugin is listed in marketplace.json
- [ ] README.md for the plugin mentions the skill

### Step 5: Publish

If all checks pass:

1. Ensure skill is in plugin.json's skills array
2. Update plugin's README.md to mention the new skill
3. Update marketplace.json if needed (new plugin or description change)
4. Update root README.md skill count if it changed
5. Commit all changes together

### Step 6: Report

Output:
- Marketplace readiness score with breakdown
- What was published (or why it was skipped)
- Any improvements suggested for future publishing

## Examples

### Strong Candidate
```
Skill: mine-patterns
Score: 11/12
- Reusable: 2 (any developer with AI sessions would benefit)
- Self-contained: 2 (uses MCP, no hardcoded paths)
- Well-described: 2 (clear process, triggers, output format)
- Not Kibana-specific: 2 (generic AI workflow)
- Clear trigger: 2 (explicit /mine-patterns command)
- Tested: 1 (just created, not yet battle-tested)
→ Publish to marketplace
```

### Not Ready
```
Skill: kibana-eslint-prepush
Score: 6/12
- Reusable: 1 (only useful for Kibana devs)
- Self-contained: 1 (depends on Kibana scripts/)
- Well-described: 2 (clear steps)
- Not Kibana-specific: 0 (deeply Kibana-specific)
- Clear trigger: 2 (before commit/push)
- Tested: 1 (used in workflow)
→ Keep private — too Kibana-specific for general marketplace
```

## Integration with manage-automations

When the `manage-automations` skill accepts a skill nomination:
1. After writing the skill to its target location
2. Automatically invoke this skill to evaluate marketplace readiness
3. If score >= 10, suggest publishing
4. If score 7-9, note improvements needed for future publishing
