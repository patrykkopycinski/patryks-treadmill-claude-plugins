#!/usr/bin/env bash
set -euo pipefail

# Sync treadmill-plugins skills into Hermes ~/.hermes/skills/ tree.
# Treadmill plugin domains map to Hermes categories.
#
# Usage:
#   ./scripts/sync-to-hermes.sh [--dry-run]
#
# Requires:
#   - Run from repo root (patryks-treadmill-claude-plugins)
#   - Hermes skills dir at ~/.hermes/skills/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HERMES_SKILLS="${HOME}/.hermes/skills"
PLUGINS_DIR="${REPO_ROOT}/plugins"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# Map treadmill plugin domain → Hermes category
category_for_domain() {
    case "$1" in
        kibana-build-performance-tools|kibana-code-quality-suite|kibana-testing-tools|kibana-dev-workflow-tools)
            echo "kibana" ;;
        ci-babysitter|kibana-infrastructure-ops-tools)
            echo "devops" ;;
        # Skip: treadmill-specific, career/promotion, or thin wrappers
        kibana-career-development|agent-team-toolkit|skill-ecosystem-tools)
            echo "SKIP" ;;
        # Everything else → general software-development
        *)
            echo "software-development" ;;
    esac
}

sync_skill() {
    local src_dir="$1"
    local skill_name
    skill_name="$(basename "$src_dir")"
    local domain_dir
    domain_dir="$(dirname "$(dirname "$src_dir")")"
    local domain
    domain="$(basename "$domain_dir")"
    local category
    category="$(category_for_domain "$domain")"

    [[ "$category" == "SKIP" ]] && return

    local dest_dir="${HERMES_SKILLS}/${category}/${skill_name}"
    local dest_file="${dest_dir}/SKILL.md"
    local src_file="${src_dir}/SKILL.md"

    [[ -f "$src_file" ]] || { echo "WARN: missing ${src_file}"; return; }

    if $DRY_RUN; then
        echo "[DRY] ${src_file} → ${dest_file}"
        return
    fi

    mkdir -p "$dest_dir"
    cp -f "$src_file" "$dest_file"
    echo "✅ ${domain}/${skill_name} → ${category}/${skill_name}"
}

main() {
    if [[ ! -d "$PLUGINS_DIR" ]]; then
        echo "ERROR: plugins/ dir not found at ${PLUGINS_DIR}"
        echo "Run this script from the patryks-treadmill-claude-plugins repo root."
        exit 1
    fi

    local dry_label=""
    $DRY_RUN && dry_label="[DRY RUN] "

    echo "${dry_label}Syncing treadmill-plugins to ${HERMES_SKILLS} ..."
    echo ""

    local count=0
    while IFS= read -r skill_dir; do
        sync_skill "$skill_dir"
        ((count++))
    done < <(find "$PLUGINS_DIR" -mindepth 2 -maxdepth 2 -type d -name 'skills' -exec find {} -mindepth 1 -maxdepth 1 -type d \;)

    echo ""
    echo "${dry_label}Synced ${count} skills."
}

main "$@"
