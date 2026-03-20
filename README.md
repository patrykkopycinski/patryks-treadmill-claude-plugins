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

## 🤖 Agent Swarm (9 Focused Plugins)

### 📚 Knowledge Base System **[v1.0.0]**
**2 skills** | Automated knowledge capture and promotion evidence tracking

- ✅ Auto-captures session learnings when you exit
- ✅ Auto-tracks promotion evidence on every git commit
- ✅ Creates structured memory files (feedback, project, reference, user)
- ✅ Privacy-first design (all data stays local)

**Quick Start:** `/setup-knowledge-base` | `/setup-promotion-tracking`

**[Full Docs →](plugins/knowledge-base-system/README.md)**

---

### 🤖 CI Babysitter **[v1.0.0]**
**1 skill** | Automated PR maintenance and CI monitoring

- ✅ **GUARD Mode:** Pre-push validation (type check, eslint, tests)
- ✅ **BABYSIT Mode:** Continuous CI monitoring (5min polling)
- ✅ Auto-fixes: ESLint, type errors, test failures, flaky tests, merge conflicts
- ✅ Buildkite integration via MCP server

**Quick Start:** `/ci-babysitter guard` | `/ci-babysitter`

**[Full Docs →](plugins/ci-babysitter/README.md)**

---

### 🧪 Kibana Testing Tools **[v1.0.0]**
**6 skills** | Comprehensive testing and QA automation for Kibana

- ✅ **@kbn-evals-debugger** - Debug evals via OTEL traces (70% → 100% pass rate)
- ✅ **@cypress-to-scout-migrator** - Strategic test optimizer (not 1:1 conversion)
- ✅ **@flake-hunter** - Debug flaky tests (50-run protocol, 5 root causes)
- ✅ **@test-coverage-analyzer** - Find untested code paths (AST analysis)
- ✅ **@api-test-generator** - Generate Scout API tests from routes (2,334 lines!)
- ✅ **@test-data-builder** - Mock data generation with faker.js

**Expected Impact:** 🐛 Test flake rate: -75-85% | 📈 CI pass rate: +15-20%

---

### 🔒 Kibana Code Quality Suite **[v1.0.0]**
**5 skills** | Automated code quality, security, and accessibility reviews

- ✅ **@type-healer** - Fix TypeScript errors (10 categories, zero @ts-ignore)
- ✅ **@refactor-assistant** - Safety-first refactoring with tests
- ✅ **@security-reviewer** - Vulnerability scanner (7 types, validated test suite)
- ✅ **@accessibility-auditor** - WCAG 2.1 compliance checker
- ✅ **@skill-curator** - Skill ecosystem quality manager

**Expected Impact:** 🔒 Security issues: -80-90% | 🏗️ Code quality: measurably improved

---

### 🔧 Kibana Dev Workflow Tools **[v1.0.0]**
**4 skills** | Streamlined development workflow automation

- ✅ **@openspec-advisor** - Smart OpenSpec decision maker
- ✅ **@pr-optimizer** - PR size/quality analyzer
- ✅ **@git-workflow-helper** - Git operations guide (rebase, cherry-pick, conflicts)
- ✅ **@code-archaeology** - Git history analysis

**Expected Impact:** ⏱️ Time saved: 10-15 hr/week | 📊 PR quality: improved review times

---

### ⚡ Kibana Build Performance Tools **[v1.0.0]**
**3 skills** | Performance optimization and dependency management

- ✅ **@perf-optimizer** - Build/test/CI optimizer (perf_tools.sh, 1,989 lines!)
- ✅ **@bundle-analyzer** - Webpack optimization with TTI metrics
- ✅ **@dependency-updater** - Renovate PR reviewer and batch merger

**Expected Impact:** ⚡ Build time: -20-40% | 🧪 Test time: -50-80%

---

### 📖 Kibana Docs & Release Tools **[v1.0.0]**
**3 skills** | Documentation generation and release management

- ✅ **@doc-generator** - Technical docs from code (API, architecture, changelog)
- ✅ **@release-notes-generator** - Changelog automation
- ✅ **@migration-planner** - Large migration orchestrator

**Expected Impact:** 📝 Documentation: always current | 🚀 Release process: streamlined

---

### 🏗️ Kibana Infrastructure Ops Tools **[v1.0.0]**
**3 skills** | Infrastructure and operations automation

- ✅ **@cross-repo-sync** - Multi-repo version propagation (2,423 lines!)
- ✅ **@monitoring-setup** - APM/metrics/logging setup
- ✅ **@i18n-helper** - Internationalization automation

**Expected Impact:** 🔄 Cross-repo consistency: maintained | 📊 Observability: comprehensive

---

### 📈 Kibana Career Development **[v1.0.0]**
**1 skill** | Career progression and promotion evidence tracking

- ✅ **@promotion-evidence-tracker** - Auto-tracking with CI metrics

**Expected Impact:** 🎯 Promotion evidence: comprehensive, organized, ready

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

## 📊 Complete Agent Catalog

| Plugin | Category | Skills | Status | Docs |
|--------|----------|--------|--------|------|
| 📚 **Knowledge Base System** | Productivity | 2 | ✅ v1.0.0 | [Link](plugins/knowledge-base-system/README.md) |
| 🤖 **CI Babysitter** | CI/CD | 1 | ✅ v1.0.0 | [Link](plugins/ci-babysitter/README.md) |
| 🧪 **Kibana Testing Tools** | Testing | 6 | ✅ v1.0.0 | Testing & QA automation |
| 🔒 **Kibana Code Quality Suite** | Quality | 5 | ✅ v1.0.0 | Security, TypeScript, refactoring |
| 🔧 **Kibana Dev Workflow Tools** | Workflow | 4 | ✅ v1.0.0 | Git, PR, OpenSpec, archaeology |
| ⚡ **Kibana Build Performance** | Performance | 3 | ✅ v1.0.0 | Build, bundle, dependencies |
| 📖 **Kibana Docs & Release** | Documentation | 3 | ✅ v1.0.0 | Docs generation, changelogs |
| 🏗️ **Kibana Infrastructure Ops** | Infrastructure | 3 | ✅ v1.0.0 | Cross-repo, monitoring, i18n |
| 📈 **Kibana Career Development** | Career | 1 | ✅ v1.0.0 | Promotion evidence tracking |

**Total: 9 plugins | 28 skills**

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
