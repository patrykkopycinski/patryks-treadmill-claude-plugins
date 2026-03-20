# Patryk's Treadmill - Claude Code Plugins 🏃

> **A swarm of automated agents for Claude Code**
>
> Never stop running toward your goals.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude-Code%20Plugins-8A63D2)](https://github.com/anthropics/claude-code)
[![GitHub](https://img.shields.io/badge/github-patryks--treadmill--claude--plugins-181717?logo=github)](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)

Professional-grade automation for knowledge capture, career development, and team productivity. Built by an engineer on the path to Principal, for engineers who want to level up faster.

---

## 🚀 Quick Install

### Add Marketplace to Claude Code

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

All plugins will be available immediately. No additional configuration needed!

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
- Role: Principal Software Engineer II (candidate) @ Elastic
- Focus: Observability, Agent Builder, Kibana platform
- Goal: Technical excellence, organizational impact, helping others grow

**Connect:**
- GitHub: [@patrykkopycinski](https://github.com/patrykkopycinski)
- Treadmill: Running toward Principal while building agents that help others run faster

---

## 🙏 Credits

Built for engineers who want to level up faster.

**Special Thanks:**
- **Anthropic** - for Claude Code and the plugin system
- **Elastic Team** - for inspiration and collaboration
- **Open Source Community** - for shared knowledge and tools
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
