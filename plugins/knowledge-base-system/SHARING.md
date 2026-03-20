# How to Share Knowledge Base System

Multiple options for sharing this plugin with others, from local sharing to public marketplace.

## 🎯 Quick Sharing Methods

### 1. **Share as ZIP** (Simplest)

```bash
cd ~/.claude/plugins
tar -czf knowledge-base-system.tar.gz knowledge-base-system/
# Share knowledge-base-system.tar.gz

# Others install with:
cd ~/.claude/plugins
tar -xzf knowledge-base-system.tar.gz
```

### 2. **Share via Git** (Team Collaboration)

```bash
cd ~/.claude/plugins/knowledge-base-system
git init
git add .
git commit -m "Initial commit: Knowledge Base System plugin"
git remote add origin <your-repo-url>
git push -u origin main

# Others install with:
cd ~/.claude/plugins
git clone <your-repo-url>
```

### 3. **Publish to Marketplace** (Public Distribution)

Create marketplace listing:

```json
{
  "plugins": [
    {
      "id": "knowledge-base-system",
      "name": "Knowledge Base System",
      "description": "Automated knowledge capture with memory system",
      "author": "Your Name",
      "version": "1.0.0",
      "source": {
        "type": "github",
        "repo": "your-username/knowledge-base-system"
      }
    }
  ]
}
```

### 4. **Project-Specific Plugin** (Team Shared)

Copy to project repository:

```bash
# In your project
mkdir -p .claude/plugins
cp -r ~/.claude/plugins/knowledge-base-system .claude/plugins/

# Add to .claude/settings.json
{
  "enabledPlugins": {
    "knowledge-base-system@builtin": true
  }
}

# Team members get it automatically when they clone
```

## 📦 Distribution Formats

### Format 1: Standalone Plugin

**Structure:**
```
knowledge-base-system/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── setup-knowledge-base.md
├── skills/
│   ├── capture-learnings/
│   └── check-cross-repo-consistency/
├── README.md
└── SHARING.md
```

**Installation:**
```bash
cd ~/.claude/plugins
# Extract or clone
```

### Format 2: Hook Configuration Only

Share just the hook configuration in a `.claude/settings.json` template:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "agent",
            "prompt": "Auto-capture promotion evidence...",
            "timeout": 30
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Auto-capture session learnings...",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

Users merge into their settings.

### Format 3: Documentation + Manual Setup

Share README.md with manual setup instructions:
1. Create memory directory structure
2. Copy hook configurations
3. Customize for their project

## 🌐 Publishing Options

### Option A: GitHub Repository

1. **Create public repo:**
   ```bash
   cd ~/.claude/plugins/knowledge-base-system
   gh repo create knowledge-base-system --public --source=. --push
   ```

2. **Others install:**
   ```bash
   cd ~/.claude/plugins
   git clone https://github.com/your-username/knowledge-base-system
   ```

3. **Enable plugin:**
   ```bash
   # Add to ~/.claude/settings.json or .claude/settings.json
   {
     "enabledPlugins": {
       "knowledge-base-system@builtin": true
     }
   }
   ```

### Option B: NPM Package

1. **Add package.json:**
   ```json
   {
     "name": "@your-org/knowledge-base-system",
     "version": "1.0.0",
     "description": "Automated knowledge capture for Claude Code",
     "keywords": ["claude-code", "plugin", "knowledge-base"],
     "files": [".claude-plugin", "commands", "skills", "README.md"]
   }
   ```

2. **Publish:**
   ```bash
   npm publish --access public
   ```

3. **Others install:**
   ```bash
   cd ~/.claude/plugins
   npx @your-org/knowledge-base-system install
   ```

### Option C: Claude Code Marketplace

1. **Fork marketplace repo:**
   ```bash
   gh repo fork anthropics/claude-code-marketplace
   ```

2. **Add plugin entry to marketplace.json:**
   ```json
   {
     "id": "knowledge-base-system",
     "name": "Knowledge Base System",
     "description": "Automated knowledge capture",
     "author": "Your Name",
     "category": "productivity",
     "source": {
       "type": "github",
       "repo": "your-username/knowledge-base-system"
     }
   }
   ```

3. **Submit PR to marketplace**

4. **Others install:**
   ```bash
   /plugins install knowledge-base-system
   ```

## 👥 Team Deployment Strategies

### Strategy 1: Project Plugin (Recommended)

**Pros:** Auto-loads for all team members, version controlled
**Cons:** Larger repo size

```bash
# In your project repo
mkdir -p .claude/plugins
cp -r ~/.claude/plugins/knowledge-base-system .claude/plugins/

# Add to .gitignore (optional, for local overrides)
.claude/settings.local.json

# Commit and push
git add .claude/
git commit -m "Add knowledge base system plugin"
git push
```

Team members get it automatically when they clone or pull.

### Strategy 2: Shared Marketplace

**Pros:** Centralized updates, versioned releases
**Cons:** Setup overhead

1. Create internal marketplace
2. Add plugin to marketplace
3. Team members configure marketplace source
4. Install via `/plugins install`

### Strategy 3: Documentation

**Pros:** Flexible, customizable per project
**Cons:** Manual setup required

1. Share README.md with setup steps
2. Team members follow instructions
3. Each customizes for their workflow

## 🔧 Customization Guide for Recipients

After installing, users should:

### 1. Run Setup
```bash
/setup-knowledge-base
```

### 2. Customize User Memory
Edit `~/.claude/projects/<project>/memory/user_role.md`:
- Add your role and expertise
- Document how you prefer to work
- Note promotion goals (if applicable)

### 3. Configure Hooks (Optional)
Choose automation level:
- Full automation (recommended)
- Promotion evidence only
- Manual capture only

### 4. Customize for Project
Edit memory templates with project-specific:
- External resources (dashboards, wikis)
- Team conventions
- Domain-specific categories

## 📝 Templates for Recipients

### Template 1: Basic Setup Email

```
Subject: Knowledge Base System for Claude Code

Hi team,

I've created a knowledge base plugin that automatically captures
learnings and prevents us from repeating mistakes.

Setup (5 minutes):
1. Clone: git clone <repo-url> ~/.claude/plugins/knowledge-base-system
2. Enable: Add to your settings.json
3. Run: /setup-knowledge-base in any project

Features:
• Auto-captures promotion evidence on commits
• Auto-saves learnings at session end
• Cross-repo consistency checker

Questions? Check the README or reach out!
```

### Template 2: Team Wiki Page

```markdown
# Knowledge Base System Setup

## Quick Start
[Installation steps]

## How It Works
[Diagram showing automation]

## For Your First Project
1. Run /setup-knowledge-base
2. Customize user_role.md
3. Work normally - it captures automatically!

## FAQ
[Common questions]
```

## 🔒 Privacy Considerations

### What to Share
✅ Plugin code (skills, commands, hooks)
✅ Memory structure/templates
✅ Setup instructions
✅ Hook configurations

### What NOT to Share
❌ Your actual memory files (personal context)
❌ Promotion evidence file (private)
❌ User-level settings with personal info
❌ Project-specific secrets

### Sanitization Checklist

Before sharing, remove:
- [ ] Personal memory files
- [ ] API keys or credentials
- [ ] Company-specific references
- [ ] Personal promotion evidence

## 📊 Tracking Adoption

If you publish, track adoption with:

### GitHub Stars/Forks
```bash
gh repo view your-username/knowledge-base-system
```

### Marketplace Analytics
(If published to official marketplace)

### Internal Metrics
- Number of projects using plugin
- Memory files created per team
- Hook activation frequency

## 🆘 Support for Recipients

### Documentation Links
- Main README: Full feature documentation
- SHARING.md: This file
- Individual skill docs: In `skills/*/SKILL.md`

### Support Channels
- GitHub Issues: Bug reports, feature requests
- Internal Slack: #claude-code-knowledge-base
- Email: your-email@company.com

## 🔄 Version Management

### Semantic Versioning
- **1.0.x** - Bug fixes
- **1.x.0** - New features (backward compatible)
- **x.0.0** - Breaking changes

### Release Process
1. Update version in `plugin.json`
2. Tag release: `git tag v1.0.0`
3. Update changelog
4. Publish to distribution channels

### Upgrade Path
Users update by:
```bash
cd ~/.claude/plugins/knowledge-base-system
git pull origin main
```

Or re-install via marketplace.

## 🎓 Training Materials

### For Recipients
- [ ] Quick start guide (5 min)
- [ ] Video walkthrough (10 min)
- [ ] Example memory files
- [ ] FAQ document

### Sample Training Outline
1. **What is it?** (2 min) - Overview and benefits
2. **Installation** (3 min) - Step-by-step setup
3. **Usage** (5 min) - How automation works
4. **Customization** (5 min) - Tailor to your needs
5. **Q&A** (5 min)

## 🚀 Next Steps

1. Choose distribution method (Git/NPM/Marketplace)
2. Sanitize for sharing (remove personal data)
3. Package plugin
4. Share with team/community
5. Gather feedback
6. Iterate and improve

---

**Ready to share?** Pick a method above and follow the steps!
