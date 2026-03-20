---
name: setup-promotion-tracking
description: Configure promotion evidence tracking with your target position
args: []
---

# Setup Promotion Evidence Tracking

Initialize automated promotion evidence capture with your career goals.

## Execution Steps

### Step 1: Ask User About Target Position

Use AskUserQuestion:

**Question:** "What position are you working towards?"

**Options:**
1. **Senior Engineer** - Mid-level to senior transition
2. **Staff Engineer** - Senior to staff/principal transition
3. **Principal Engineer** - Staff to principal transition
4. **Engineering Manager** - IC to management transition
5. **Other** - (User provides custom title)

Store answer as `TARGET_POSITION`.

### Step 2: Get/Generate Position Description

If user selected a standard position, offer generated description:

**Senior Engineer:**
```
Demonstrates technical expertise, mentors junior engineers, delivers
complex features independently, influences team technical decisions.

Key competencies: Technical depth, independent execution, mentorship,
cross-functional collaboration.
```

**Staff Engineer:**
```
Drives technical strategy across multiple teams, designs complex systems,
mentors senior engineers, identifies and solves ambiguous problems,
influences engineering culture.

Key competencies: System design, technical leadership, strategic thinking,
org-wide impact, mentorship at scale.
```

**Principal Engineer:**
```
Sets technical direction for entire org, solves the most complex technical
challenges, enables other engineers at scale, drives innovation and best
practices, influences company strategy through technical excellence.

Key competencies: Organizational impact, technical vision, strategic
leadership, innovation, executive partnership.
```

**Engineering Manager:**
```
Builds and leads high-performing teams, develops people, delivers business
outcomes through team execution, creates technical and cultural excellence.

Key competencies: People leadership, team building, delivery management,
strategic planning, talent development.
```

Ask user to confirm or provide custom description via AskUserQuestion:

**Question:** "Confirm position description"

**Options:**
1. **Use generated description** - (show generated text)
2. **Provide custom description** - Enter your own

Store final description as `POSITION_DESCRIPTION`.

### Step 3: Configure Evidence Categories

Based on position, suggest relevant categories:

**IC Track (Engineer/Staff/Principal):**
- Technical Leadership
- Problem Solving & Impact
- Influence & Communication
- People Development (mentorship)
- Strategic Delivery

**Manager Track:**
- People Leadership
- Team & Culture Building
- Delivery & Execution
- Strategic Planning
- Technical Guidance

Ask via AskUserQuestion:

**Question:** "Select evidence categories to track"

**Options:**
- *(checkboxes for relevant categories)*
- "Add custom category" (user provides)

Store as `EVIDENCE_CATEGORIES`.

### Step 4: Create Promotion Evidence File

```bash
EVIDENCE_FILE="$HOME/.cursor/promotion-evidence.md"

# Check if file exists
if [ -f "$EVIDENCE_FILE" ]; then
  echo "⚠️  File exists at $EVIDENCE_FILE"
  # Ask: Overwrite, Append, or Skip?
else
  # Create new file from template
  cat > "$EVIDENCE_FILE" <<EOF
# Promotion Evidence Log

**Target Position:** $TARGET_POSITION

**Position Description:**
$POSITION_DESCRIPTION

**Evidence Period:** Started $(date +%Y-%m-%d)

---

## Evidence Categories

$(for category in "${EVIDENCE_CATEGORIES[@]}"; do
  echo "### $category"
  echo "*(Description of what to capture for this category)*"
  echo ""
done)

---

## Evidence Entries

<!-- Auto-captured entries will be appended below -->

EOF

  echo "✓ Created promotion evidence file: $EVIDENCE_FILE"
fi
```

### Step 5: Configure Promotion Evidence Hook

Update `.claude/settings.json` PostToolUse hook to reference the file:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "agent",
        "prompt": "Analyze git commit/PR for promotion evidence towards: $TARGET_POSITION.

Tool data: $ARGUMENTS

Position description: $POSITION_DESCRIPTION

Evidence categories: $EVIDENCE_CATEGORIES

If this work demonstrates competencies for the target position:
1. Read ~/.cursor/promotion-evidence.md
2. Append under appropriate category:

   ## YYYY-MM-DD - [Category]
   **What:** [Brief description]
   **Why it matters:** [Business/technical impact]
   **Competency demonstrated:** [How this shows target position skills]

3. Return {\"systemMessage\": \"✅ Added to promotion evidence: [Category]\"}

If not promotion-worthy (trivial change), return: {}",
        "timeout": 30
      }]
    }]
  }
}
```

### Step 6: Summary

Show completion message:

```
✅ Promotion Tracking Setup Complete!

Target Position: $TARGET_POSITION
Evidence File: ~/.cursor/promotion-evidence.md
Categories: $EVIDENCE_CATEGORIES (comma-separated)

How it works:
1. Work normally and commit code
2. Significant work is auto-captured to evidence file
3. Review and edit entries as needed
4. Use for performance reviews, promotion discussions

Tips:
• Review evidence monthly
• Add context/metrics to entries
• Share with manager during 1:1s
• Update target position as you progress

Next steps:
• Make your first commit to test automation
• Review and enhance auto-captured entries
• Set reminder to review evidence monthly
```

## Template Customization

Users can customize the template by editing:
- Category names and descriptions
- Evidence format (what fields to capture)
- Auto-capture criteria (in hook prompt)

## Example Evidence Entry

Auto-generated entry format:

```markdown
## 2026-03-20 - Technical Leadership

**What:** Designed and implemented evaluation convergence detection system for Agent Builder

**Why it matters:** Prevents infinite loops in self-improving systems, enables safe autonomous operation. Impacts 50+ active skills and reduces wasted compute by 30%.

**Competency demonstrated:** Architectural thinking (designed system-level solution), technical depth (convergence algorithms), impact (org-wide adoption), innovation (novel approach to agent safety).
```

## Integration with Memory System

Promotion evidence complements the memory system:
- **Memory:** How to do things (avoid mistakes, validated patterns)
- **Promotion Evidence:** What you accomplished (impact, growth)

Both captured automatically, different purposes.
