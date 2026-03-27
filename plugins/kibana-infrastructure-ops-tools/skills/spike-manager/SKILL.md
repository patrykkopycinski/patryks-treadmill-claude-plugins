---
name: spike-manager
description: Manage multiple Kibana spike environments using Docker/OrbStack. Handles isolated spike environments, switches between spikes, and manages Docker containers. Use when working on multiple Kibana spikes simultaneously, switching between spikes, or using Docker for spike isolation. Triggers on "spike start", "spike list", "manage spikes", "switch spike", or "multiple spikes".
---

# Spike Manager Skill

**Purpose:** Manage multiple Kibana spike environments using Docker/OrbStack with the `spike-manager-orb.sh` script.

**When to use:** When user wants to work on multiple Kibana spikes simultaneously, switch between spikes, or use Docker for spike isolation.

---

## Setup

### Configuration

Set the following environment variables (or use the defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `SPIKES_DIR` | `$HOME/kibana-spikes` | Directory containing spike worktrees |
| `SPIKE_MANAGER_SCRIPT` | `spike` (on PATH) | Path to the spike-manager-orb.sh script |

### Install spike-manager-orb.sh

**Option 1: Add to PATH**
```bash
# Copy to a directory on your PATH
cp $SPIKES_DIR/spike-manager-orb.sh $HOME/.local/bin/spike
chmod +x $HOME/.local/bin/spike
```

**Option 2: Shell alias**
```bash
echo "alias spike='$SPIKES_DIR/spike-manager-orb.sh'" >> ~/.zshrc
source ~/.zshrc
```

**Verify:**
```bash
which spike
# Should output a path to the spike script
```

### Prerequisites

1. **OrbStack** installed and running (https://orbstack.dev)
2. **Docker** available via OrbStack (`docker ps` works)
3. Each spike directory must contain a `docker-compose.yml`

```
<spike-directory>/
  docker-compose.yml          # Required
  .env (optional)
  x-pack/... (spike code)
```

**Key docker-compose.yml requirements:**
- Unique container names: `kibana-<spike-name>`, `elasticsearch-<spike-name>`
- Docker volumes for ES data persistence
- Environment variables for feature flags

---

## Commands Reference

### `spike list`

Show all running spike containers with OrbStack URLs.

```bash
spike list
```

**Output:**
```
Active Kibana Spikes:
NAMES                          STATUS        PORTS
kibana-llm-investigation       Up 2 hours
kibana-auth-spike              Up 30 mins

Access URLs (OrbStack):
  http://kibana-llm-investigation.orb.local
  http://kibana-auth-spike.orb.local
```

### `spike start <spike-dir>`

Start a spike's Docker containers (ES + Kibana).

```bash
spike start llm-investigation-spike
```

**When to use:**
- Moving spike from local to Docker (freeing port 5601)
- Starting background spike for occasional checks
- Setting up a testing environment

### `spike stop <spike-dir>`

Stop spike containers (preserves data in Docker volumes).

```bash
spike stop llm-investigation-spike
```

### `spike restart <spike-dir>`

Restart Kibana container (e.g., after code changes in mounted volumes).

```bash
spike restart llm-investigation-spike
```

### `spike rebuild <spike-dir>`

Pull latest Docker images and restart (preserves data).

```bash
spike rebuild llm-investigation-spike
```

### `spike open <spike-dir>`

Open spike's Kibana in the default browser via OrbStack URL.

```bash
spike open llm-investigation-spike
# Opens: http://kibana-llm-investigation.orb.local
```

### `spike logs <spike-dir> [service]`

View container logs (real-time follow mode).

```bash
spike logs llm-investigation-spike              # Kibana logs (default)
spike logs llm-investigation-spike elasticsearch # ES logs
```

**Tip:** Pipe to grep for specific errors:
```bash
spike logs llm-investigation-spike | grep ERROR
```

### `spike clean <spike-dir>`

**Delete ALL spike data** (containers + Docker volumes). Cannot be undone.

```bash
spike clean llm-investigation-spike
```

**Use `spike stop` instead if you want to preserve data.**

---

## Core Workflows

### Workflow 1: Multiple Spikes (Hybrid Local + Docker)

**Best practice:** Run one active spike locally (hot reload), background spikes in Docker.

```bash
# Active spike (hot reload needed)
cd my-active-spike
yarn start  # localhost:5601

# Background spikes (occasional access)
spike start auth-refactor-spike
spike start performance-spike

# All accessible:
# - Active: http://localhost:5601 (hot reload)
# - Auth: http://kibana-auth-refactor.orb.local
# - Perf: http://kibana-performance.orb.local
```

### Workflow 2: Switching Active Spike

```bash
# 1. Move current active spike to Docker
spike start llm-investigation-spike

# 2. Stop local Kibana (Ctrl+C in yarn start terminal)

# 3. Verify Docker started
spike list

# 4. Start new spike locally
cd ../auth-refactor-spike
yarn start  # Now on localhost:5601 (hot reload)
```

### Workflow 3: New Spike Setup

```bash
# 1. Create docker-compose.yml in spike directory
cd new-spike
cp $SPIKES_DIR/docker-compose-template.yml docker-compose.yml

# 2. Customize container names
# Edit: kibana-SPIKE_NAME -> kibana-new-spike

# 3. Start spike
spike start new-spike

# 4. Open in browser
spike open new-spike
```

### Workflow 4: Debug Spike Not Starting

```bash
# 1. Check logs for errors
spike logs problematic-spike

# Common issues:
# - ES not starting: Check memory limits (needs 4GB+)
# - Kibana not starting: Check ES health (must be green/yellow)
# - Port conflict: Check if container name is unique

# 2. If stuck, restart
spike restart problematic-spike

# 3. If still broken, clean and start fresh
spike clean problematic-spike
spike start problematic-spike
```

### Workflow 5: Share Elasticsearch Between Spikes

Multiple Kibana spikes pointing at the same ES instance:

```yaml
# spike-1/docker-compose.yml
services:
  kibana-spike1:
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch-shared.orb.local:9200
```

```yaml
# spike-2/docker-compose.yml
services:
  kibana-spike2:
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch-shared.orb.local:9200
```

---

## Best Practices

### Naming Convention

Container names become OrbStack URLs, so use descriptive names:

```yaml
# Good:
container_name: kibana-llm-investigation
container_name: kibana-auth-refactor

# Bad:
container_name: kibana    # Too generic, conflicts
container_name: kibana-1  # Not descriptive
```

### Resource Management

- Use Docker for testing, local `yarn start` for development
- Clean up completed spikes to free disk space (Docker volumes can be GBs)
- Stop background spikes you're not actively checking to free RAM/CPU

### Batch Operations

```bash
# Start all spikes
for s in spike-a spike-b spike-c; do spike start $s; done

# Stop all Kibana containers
docker ps --filter "name=kibana-" -q | xargs docker stop

# Clean all spikes
for s in spike-a spike-b spike-c; do spike clean $s; done
```

---

## Integration with Other Tools

### With Claude Code / Cursor

```bash
# Start spike in Docker
spike start my-spike

# Edit code locally (mounted in container)
# Restart to reflect changes
spike restart my-spike

# Test via OrbStack URL
curl http://kibana-my-spike.orb.local/api/...
```

### With VSCode Remote Containers

```bash
spike start my-spike
# VSCode: Remote-Containers -> Attach to Running Container
# Select: kibana-my-spike
```

### With k6 Load Testing

```bash
spike start my-spike
k6 run load-test.js --env KIBANA_URL=http://kibana-my-spike.orb.local
spike logs my-spike | grep "response time"
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `spike` command not found | Add to PATH: `export PATH="$HOME/.local/bin:$PATH"` |
| Container name conflict | `spike stop <spike>` then retry, or `docker rm <container>` |
| OrbStack URL not resolving | Check OrbStack is running, container is up (`docker ps`) |
| Kibana not starting | Check ES health via logs: `spike logs <spike> elasticsearch` |
| Out of memory | Increase Docker memory (Settings -> Resources -> 8GB+) |

---

## Quick Reference

```
spike list                     # Show all running spikes with URLs
spike start <spike-dir>        # Start spike in Docker
spike stop <spike-dir>         # Stop spike (keeps data)
spike restart <spike-dir>      # Restart Kibana (after code changes)
spike rebuild <spike-dir>      # Update images, restart
spike open <spike-dir>         # Open in browser
spike logs <spike-dir> [svc]   # View logs
spike clean <spike-dir>        # Delete spike data (permanent)

# OrbStack URLs (automatic):
# http://kibana-<spike-name>.orb.local
# http://elasticsearch-<spike-name>.orb.local:9200

# Hybrid workflow (recommended):
# - Active spike: yarn start (localhost:5601, hot reload)
# - Background spikes: spike start <dir> (OrbStack URLs)
```

---

## When NOT to Use

- Active development with hot reload needed -> use `yarn start` locally
- Single spike only -> just use `yarn start`
- Frequent code iteration -> Docker restart is slower than webpack hot reload
