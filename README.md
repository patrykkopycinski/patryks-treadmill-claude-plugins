# Patryk's Treadmill - Claude Code Plugins 🏃

> **A swarm of automated agents for Claude Code**
>
> Never stop running toward your goals.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude-Code%20Plugins-8A63D2)](https://github.com/anthropics/claude-code)
[![GitHub](https://img.shields.io/badge/github-patryks--treadmill--claude--plugins-181717?logo=github)](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)

Professional-grade automation for knowledge capture, career development, and team productivity. Built for engineers who want to level up faster.

---

## 🚀 Quick Install

### Option 1: Install Specific Agents (Recommended)

**Choose exactly which agents you want:**

```bash
curl -fsSL https://raw.githubusercontent.com/patrykkopycinski/patryks-treadmill-claude-plugins/main/install-select.sh | bash
```

Interactive installer lets you pick agents (e.g., "1 3 5") - only those get installed!

### Option 2: Install All Agents

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

All plugins available immediately. Disable unwanted ones in settings.

### Option 3: Manual Selection

```bash
# Clone marketplace
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill

# Symlink only agents you want
ln -s treadmill/plugins/knowledge-base-system knowledge-base-system
ln -s treadmill/plugins/agent-builder-tools agent-builder-tools
```

**[Full Installation Guide →](docs/SELECTIVE-INSTALL.md)**

---

## 🤖 Agent Swarm (Available Plugins)

### 📚 Knowledge Base System **[v1.0.0 - Released]**

**The Memory Agent - Never forget a learning**

Automated knowledge capture and promotion evidence tracking.

**Features:**
- ✅ Auto-captures session learnings when you exit Claude Code
- ✅ Auto-tracks promotion evidence on every git commit
- ✅ Creates structured memory files (feedback, project, reference, user)
- ✅ Supports Senior → Staff → Principal → Manager career paths
- ✅ Privacy-first design (all data stays local)
- ✅ One-liner installer
- ✅ Fully documented

**Quick Start:**
```bash
# In Claude Code
/setup-knowledge-base
/setup-promotion-tracking  # Optional but recommended
```

**[View Plugin Repo →](https://github.com/patrykkopycinski/claude-knowledge-base-system)** | **[Full Docs →](plugins/knowledge-base-system/README.md)**

---

### 🦸 Kibana Development Agents **[v1.0.0 - NEW!]**

**The Complete Workflow Automation Framework**

**20 specialized agents + 5 bonus** for Kibana development. Built from 2,001 real conversations.

**Top Agents:**
- ✅ **@kbn-evals-debugger** - Debug evals via OTEL traces (70% → 100% pass rate)
- ✅ **@cypress-to-scout-migrator** - Strategic test optimizer (66% faster execution)
- ✅ **@type-healer** - Fix TypeScript errors (10 categories, zero @ts-ignore)
- ✅ **@flake-hunter** - Debug flaky tests (50-run protocol, 5 root causes)
- ✅ **@test-coverage-analyzer** ⭐ NEW! - Find untested code paths (AST analysis)
- ✅ **@perf-optimizer** - Optimize build/test/CI (perf_tools.sh included)

**All 20 Agents:**
- Testing & Quality (8 agents) - Including test-coverage-analyzer!
- Development Workflow (6 agents)
- CI/CD & Operations (4 agents)
- Infrastructure & Tooling (2 agents)

**Plus 5 bonus agents:** bundle-analyzer, pr-optimizer, code-archaeology, release-notes-generator, test-data-builder

**Expected Impact:**
- ⏱️  Time saved: 15-40 hr/week
- 📈 CI pass rate: +15-20%
- 🐛 Test flake rate: -75-85%
- 🔒 Security issues: -80-90%

**Quick Start:**
```bash
/install-select    # Choose kibana-agent-superpowers
# Or manually: cd plugins/kibana-agent-superpowers && ./install.sh
```

**[Full Plugin Docs →](plugins/kibana-agent-superpowers/README.md)** | **[Quick Start →](plugins/kibana-agent-superpowers/docs/QUICK_START.md)** | **[Integration Workflows →](plugins/kibana-agent-superpowers/docs/INTEGRATION_WORKFLOWS.md)**

---

### 🤖 CI Babysitter **[v1.0.0 - Released]**

**The CI Agent - Automated PR maintenance and monitoring**

Keeps your PRs green by automatically monitoring CI, fixing failures, and handling PR comments.

**Features:**
- ✅ **GUARD Mode:** Pre-push validation (type check, eslint, tests)
- ✅ **BABYSIT Mode:** Continuous CI monitoring (5min polling)
- ✅ Auto-fixes: ESLint, type errors, test failures, flaky tests, merge conflicts
- ✅ Smart PR comment handling (auto for bots, ask for humans)
- ✅ Buildkite integration via MCP server
- ✅ Safety guards: dry-run, iteration limit (max 20)
- ✅ Stops automatically when CI goes green

**Quick Start:**
```bash
# In Claude Code
/ci-babysitter guard    # Validate before push
/ci-babysitter          # Monitor existing PR
# Or just say: "babysit my PR"
```

**[Full Docs →](plugins/ci-babysitter/README.md)**

---

### 🔧 Kibana Development Tools **[Coming Soon]**

**The Kibana Agent - Scout, FTR, and Elastic workflows**

Specialized automation for Kibana and Elastic Stack development.

**Planned Features:**
- Scout test scaffolding and best practices
- FTR → Scout migration tools
- Kibana validation workflows (type check, lint, test)
- Pre-commit checks for Elastic repositories
- Package dependency management

**Status:** 🚧 In Development

---

### 🔍 Elastic Stack Utils **[Planned]**

**The Elasticsearch Agent - Query, manage, observe**

Productivity tools for Elasticsearch, Kibana, and Elastic Cloud.

**Planned Features:**
- Quick Elasticsearch operations
- Kibana API helpers with authentication
- Cloud deployment automation
- Index management workflows
- Query builder and tester

**Status:** 🎯 Planned for Q2 2026

---

### 🤖 Agent Builder Tools **[Planned]**

**The Meta-Agent - Build and validate skills**

Tools for creating, testing, and validating Agent Builder skills.

**Planned Features:**
- Skill scaffolding with templates
- Automated skill validation
- Eval suite generation (@kbn/evals)
- Similarity detection (avoid duplicate skills)
- LLM benchmarking integration

**Status:** 🎯 Planned for Q2 2026

---

## 📦 Repository Structure

```
patryks-treadmill-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace manifest
├── plugins/
│   ├── knowledge-base-system/    # ✅ v1.0.0 Released
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   ├── skills/
│   │   ├── templates/
│   │   └── README.md
│   ├── kibana-dev-tools/         # 🚧 In Development
│   ├── elastic-utils/            # 🎯 Planned
│   └── agent-builder-tools/      # 🎯 Planned
├── shared/                       # Shared utilities (future)
│   ├── templates/
│   └── scripts/
├── docs/
│   ├── PHILOSOPHY.md            # The Treadmill philosophy
│   ├── CONTRIBUTING.md          # How to contribute agents
│   └── PLUGIN-DEVELOPMENT.md    # How to build a plugin
├── README.md
└── LICENSE (MIT)
```

---

## 🎯 Use Cases

### For Individual Contributors
- 🎯 **Career Growth:** Auto-track promotion evidence as you work
- 📚 **Learning:** Never forget gotchas, validated patterns, or lessons learned
- ⚡ **Productivity:** Automated workflows for repetitive development tasks
- 🔍 **Knowledge Base:** Build your personal encyclopedia of solutions

### For Teams
- 🤝 **Knowledge Sharing:** Preserve team learnings across onboarding cycles
- 📋 **Consistency:** Shared workflows, conventions, and best practices
- 🚀 **Onboarding:** New members inherit accumulated team knowledge
- 🔄 **Cross-Repo:** Maintain consistency across multiple repositories

### For Managers
- 📊 **Evidence Collection:** Help direct reports build promotion cases
- 🎨 **Process Improvement:** Automate and standardize team workflows
- 📈 **Impact Tracking:** Measure and document team achievements
- 👥 **Team Development:** Support career growth systematically

---

## 🔄 Installation & Updates

### Initial Install

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

### Update All Plugins

```bash
cd ~/.claude/plugins/treadmill
git pull origin main
```

### Install Specific Plugin

Each plugin can also be installed standalone:

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/claude-knowledge-base-system
```

---

## 🏗️ Plugin Development

Want to add a new agent to the swarm?

### Agent Design Principles

1. **Autonomous:** Runs without manual intervention after setup
2. **Specialized:** Does one thing exceptionally well
3. **Coordinated:** Works harmoniously with other agents
4. **Learning:** Captures and applies knowledge over time
5. **Privacy-First:** All data stays local by default

### Quick Start for Plugin Devs

```bash
# Clone marketplace
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins
cd patryks-treadmill-claude-plugins

# Create new plugin
mkdir -p plugins/my-new-agent/{.claude-plugin,commands,skills}

# Add to marketplace.json
# See: docs/PLUGIN-DEVELOPMENT.md
```

**[Full Plugin Development Guide →](docs/PLUGIN-DEVELOPMENT.md)**

---

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- 💡 New agent ideas
- 📖 Documentation improvements
- 🔧 Code contributions

**Get Started:**
1. [Report issues](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/issues)
2. [Suggest agents](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/discussions)
3. [Submit PRs](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/pulls)

**[Contributing Guide →](docs/CONTRIBUTING.md)**

---

## 🎓 Philosophy: Why "The Treadmill"?

Career growth is like running on a treadmill:

- **🏃 Constant Motion:** You're always learning, always improving, always moving forward
- **💪 Intentional Effort:** Progress requires deliberate, consistent action
- **📊 Measurable:** Track your pace through evidence, learnings, and impact
- **♻️ Sustainable:** Build systems that support long-term growth without burnout

This marketplace provides **automated agents** that run alongside you—capturing what matters, preventing repeated mistakes, and documenting your progress—so you can focus on moving forward.

**[Read Full Philosophy →](docs/PHILOSOPHY.md)**

---

## 📊 Agent Catalog

| Agent | Category | Status | Version | Docs |
|-------|----------|--------|---------|------|
| 📚 Knowledge Base System | Productivity | ✅ Released | v1.0.0 | [Link](https://github.com/patrykkopycinski/claude-knowledge-base-system) |
| 🤖 CI Babysitter | CI/CD | ✅ Released | v1.0.0 | [Link](plugins/ci-babysitter/README.md) |
| 🔧 Kibana Dev Tools | Development | 🚧 In Dev | - | Coming Soon |
| 🔍 Elastic Stack Utils | Development | 🎯 Planned | - | Coming Soon |
| 🤖 Agent Builder Tools | Meta | 🎯 Planned | - | Coming Soon |

### 🔮 Future Agents (Roadmap)

- **📊 Evidence Visualizer:** Career progress dashboards and impact metrics
- **🔗 Integration Agent:** Connect Slack, Linear, Jira, GitHub
- **🧪 Test Intelligence:** Flaky test detection and auto-remediation
- **🎯 Goal Tracker:** OKR and milestone tracking with AI insights
- **📝 Documentation Agent:** Auto-generate docs from code changes
- **🔍 Code Review Agent:** Automated PR review with learning feedback

**[Vote on roadmap →](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/discussions)**

---

## 📄 License

MIT License - Free to use, modify, and distribute.

Build your own treadmill. Share your agents. Help others run faster.

---

## 👨‍💻 Author

**Patryk Kopycinski**

Building automated agents for career growth and team productivity.

**Connect:**
- GitHub: [@patrykkopycinski](https://github.com/patrykkopycinski)
- Treadmill: Building agents that help engineers run faster

---

## 🙏 Credits

Built for engineers who want to level up faster.

**Special Thanks:**
- **Anthropic** - for Claude Code and the plugin system
- **Open Source Community** - for shared knowledge and inspiration
- **Early Adopters** - for feedback and contributions

---

## 🌟 Show Your Support

If these agents help you:
- ⭐ Star the repository
- 🐦 Share on social media
- 📝 Write about your experience
- 🤝 Contribute a new agent
- 💬 Start a discussion

---

**Join the treadmill. Never stop running.** 🏃💨

---

## 📚 Quick Links

- [Knowledge Base System Plugin](https://github.com/patrykkopycinski/claude-knowledge-base-system)
- [Installation Guide](./docs/INSTALLATION.md)
- [Philosophy](./docs/PHILOSOPHY.md)
- [Contributing](./docs/CONTRIBUTING.md)
- [Discussions](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/discussions)
- [Issues](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins/issues)
