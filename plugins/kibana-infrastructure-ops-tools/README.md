# Kibana Infrastructure & Ops Tools

**5 skills for infrastructure automation, monitoring, and environment management**

Cross-repo synchronization, consistency checking, monitoring setup, internationalization, and multi-spike Docker management.

---

## Skills

### @monitoring-setup
**APM/metrics/logging setup**

Set up monitoring, alerting, and observability for Kibana deployments with dashboard generation and alert configuration.

**Trigger:** "Set up monitoring" | "Configure alerting" | Deployment observability

---

### @cross-repo-sync
**Multi-repo version propagation**

Auto-propagates version and configuration changes across sibling repos (elastic-cursor-plugin, cursor-plugin-evals, agent-skills-sandbox). Detects Docker versions, npm dependencies, YAML conventions, creates sync PRs with CI validation.

**Trigger:** "Sync this change" | "Update package across repos" | "Propagate this version"

---

### @i18n-helper
**Internationalization automation**

Manages internationalization strings and translations for Kibana. Finds hardcoded strings, generates i18n calls.

**Trigger:** "Add i18n" | "Find hardcoded strings" | Translation management

---

### @spike-manager
**Multi-spike Docker/OrbStack environment manager**

Manages multiple Kibana spike environments using Docker and OrbStack. Run one spike locally (hot reload) and background spikes in Docker with OrbStack URLs. Switch between spikes, view logs, clean up when done.

**Trigger:** "Start spike" | "Switch spike" | "List spikes" | Working on multiple spikes

**Requires:** OrbStack installed, `spike` script on PATH

**Commands:**
```
spike list                     # Show running spikes with URLs
spike start <spike-dir>        # Start spike in Docker
spike stop <spike-dir>         # Stop spike (keeps data)
spike restart <spike-dir>      # Restart after code changes
spike open <spike-dir>         # Open in browser
spike logs <spike-dir> [svc]   # View logs
spike clean <spike-dir>        # Delete spike data (permanent)
```

---

### @check-cross-repo-consistency
**Cross-repo drift detector**

Checks elastic-cursor-plugin and cursor-plugin-evals for Docker version drift, npm dependency mismatches, and YAML convention divergence.

**Trigger:** "Check cross-repo consistency" | "Are repos in sync?" | After version bumps

---

## Installation

### Via Marketplace

```
/plugin marketplace add patrykkopycinski/patryks-treadmill-claude-plugins
/plugin install kibana-infrastructure-ops-tools@patryks-treadmill
```

### Manual

```bash
cd ~/.claude/plugins
git clone https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins treadmill
```

Restart Claude Code or run `/reload-plugins`.

---

**Part of [Patryk's Treadmill](https://github.com/patrykkopycinski/patryks-treadmill-claude-plugins)**
