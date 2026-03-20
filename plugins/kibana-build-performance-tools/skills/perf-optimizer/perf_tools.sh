#!/usr/bin/env bash
# Performance analysis helper scripts for Kibana

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print section headers
section() {
  echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

error() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

warn() {
  echo -e "${YELLOW}WARNING: $1${NC}"
}

# Verify we're in Kibana repo
if [ ! -f "package.json" ] || ! grep -q '"name": "kibana"' package.json; then
  error "Must be run from Kibana repository root"
fi

# Function: Analyze webpack bundle
analyze_bundle() {
  local plugin=$1
  if [ -z "$plugin" ]; then
    error "Usage: $0 analyze_bundle <plugin-name>"
  fi

  section "Analyzing bundle for: $plugin"

  # Build with stats
  echo "Building plugin with webpack stats..."
  STATS_JSON=true node scripts/build_kibana_platform_plugins.js --focus "$plugin"

  # Find the stats file
  local stats_file=$(find target -name "webpack-stats.json" -type f | head -n1)
  if [ -z "$stats_file" ]; then
    error "webpack-stats.json not found. Build may have failed."
  fi

  echo "Stats file: $stats_file"

  # Analyze top assets
  section "Top 10 largest assets:"
  cat "$stats_file" | jq -r '.assets | sort_by(.size) | reverse | .[0:10] | .[] | "\(.size) bytes - \(.name)"'

  # Check for duplicates
  section "Checking for duplicate packages..."
  yarn dedupe --check || warn "Duplicate packages found. Run: yarn dedupe"

  # Launch bundle analyzer (optional)
  read -p "Launch webpack-bundle-analyzer? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx webpack-bundle-analyzer "$stats_file"
  fi
}

# Function: Profile Jest tests
profile_jest() {
  local config=$1
  if [ -z "$config" ]; then
    error "Usage: $0 profile_jest <path-to-jest-config>"
  fi

  section "Profiling Jest tests: $config"

  # Run with timing
  echo "Running tests with verbose output..."
  yarn test:jest --config "$config" --verbose 2>&1 | tee /tmp/jest-profile.log

  # Extract timing info
  section "Test timing summary:"
  grep -E "PASS|FAIL" /tmp/jest-profile.log | awk '{print $2, $NF}' | sort -t' ' -k2 -rn | head -20

  # Check for slow setup
  section "Checking for expensive setup operations..."
  grep -r "beforeEach" --include="*.test.ts" $(dirname "$config") | \
    xargs grep -l "es.indices.create\|kibanaServer.importExport" || \
    echo "No obvious expensive setup found"
}

# Function: Profile Scout tests
profile_scout() {
  local config=$1
  if [ -z "$config" ]; then
    error "Usage: $0 profile_scout <path-to-scout-config>"
  fi

  section "Profiling Scout tests: $config"

  # Run with HTML reporter
  echo "Running Scout tests with HTML reporter..."
  node scripts/scout run-tests \
    --arch stateful \
    --config "$config" \
    --reporter html

  # Find the HTML report
  local report=$(find . -name "scout-report-*.html" -type f -mmin -5 | head -n1)
  if [ -n "$report" ]; then
    echo "Report generated: $report"
    echo "Open it to view timeline and identify bottlenecks"
  else
    warn "HTML report not found"
  fi

  # Check worker config
  section "Scout configuration:"
  grep -A5 "workers:" "$config" || echo "Workers not explicitly configured (using default: 1)"
}

# Function: Analyze CI timing
analyze_ci() {
  local branch=${1:-main}

  section "Analyzing Buildkite CI timing for branch: $branch"

  # Check if gh CLI is available
  if ! command -v gh &> /dev/null; then
    error "gh CLI not found. Install: brew install gh"
  fi

  echo "Fetching recent workflow runs..."

  # Get recent runs (GitHub Actions, if using)
  # Note: Kibana uses Buildkite, so this is a placeholder
  warn "Buildkite API integration not implemented in this script"
  echo "Manual steps:"
  echo "1. Go to https://buildkite.com/elastic/kibana"
  echo "2. Filter by branch: $branch"
  echo "3. Sort by duration"
  echo "4. Identify slowest steps"
  echo ""
  echo "Or use Buildkite GraphQL API:"
  echo "https://buildkite.com/docs/apis/graphql-api"
}

# Function: Check bootstrap performance
analyze_bootstrap() {
  section "Analyzing bootstrap performance"

  # Check cache config
  echo "Current Yarn cache config:"
  yarn config get enableGlobalCache

  # Check node_modules size
  if [ -d "node_modules" ]; then
    section "node_modules size:"
    du -sh node_modules
  fi

  # Time a bootstrap run
  section "Timing bootstrap run (this may take several minutes)..."
  echo "Cleaning..."
  yarn kbn clean

  echo "Running bootstrap..."
  time yarn kbn bootstrap

  section "Recommendations:"
  echo "1. Enable Yarn cache: yarn config set enableGlobalCache true"
  echo "2. In CI: Cache node_modules with yarn.lock checksum"
  echo "3. Local: Use sparse git checkout for faster bootstrap"
}

# Function: Check duplicate dependencies
check_duplicates() {
  section "Checking for duplicate dependencies"

  echo "Running yarn dedupe --check..."
  if yarn dedupe --check; then
    echo -e "${GREEN}No duplicates found!${NC}"
  else
    warn "Duplicates found. Run 'yarn dedupe' to fix."

    # Show which packages are duplicated
    section "Duplicate packages:"
    yarn list --pattern "*" --depth=0 | grep -E "├─|└─" | \
      awk '{print $2}' | sort | uniq -d | head -20
  fi
}

# Function: Generate performance report
generate_report() {
  local scope=$1
  if [ -z "$scope" ]; then
    error "Usage: $0 generate_report <build|test|ci>"
  fi

  section "Generating performance report for: $scope"

  case $scope in
    build)
      echo "1. Identify target plugin"
      echo "2. Run: $0 analyze_bundle <plugin-name>"
      echo "3. Document bundle size and top contributors"
      echo "4. Suggest optimizations (tree-shaking, code splitting)"
      ;;
    test)
      echo "1. Identify target test config"
      echo "2. Run: $0 profile_jest <jest-config> OR $0 profile_scout <scout-config>"
      echo "3. Document suite duration and bottlenecks"
      echo "4. Suggest optimizations (beforeAll, parallelism, caching)"
      ;;
    ci)
      echo "1. Run: $0 analyze_ci <branch>"
      echo "2. Identify slowest steps"
      echo "3. Document agent hours and cost"
      echo "4. Suggest optimizations (caching, parallelism, incremental checks)"
      ;;
    *)
      error "Invalid scope. Use: build, test, or ci"
      ;;
  esac
}

# Main command dispatcher
main() {
  local command=$1
  shift || true

  case $command in
    analyze_bundle)
      analyze_bundle "$@"
      ;;
    profile_jest)
      profile_jest "$@"
      ;;
    profile_scout)
      profile_scout "$@"
      ;;
    analyze_ci)
      analyze_ci "$@"
      ;;
    analyze_bootstrap)
      analyze_bootstrap
      ;;
    check_duplicates)
      check_duplicates
      ;;
    generate_report)
      generate_report "$@"
      ;;
    *)
      echo "Kibana Performance Analysis Tools"
      echo ""
      echo "Usage: $0 <command> [args]"
      echo ""
      echo "Commands:"
      echo "  analyze_bundle <plugin>       - Analyze webpack bundle size"
      echo "  profile_jest <config>         - Profile Jest test suite"
      echo "  profile_scout <config>        - Profile Scout test suite"
      echo "  analyze_ci [branch]           - Analyze CI timing"
      echo "  analyze_bootstrap             - Analyze bootstrap performance"
      echo "  check_duplicates              - Find duplicate dependencies"
      echo "  generate_report <scope>       - Generate performance report (build|test|ci)"
      echo ""
      echo "Examples:"
      echo "  $0 analyze_bundle securitySolution"
      echo "  $0 profile_jest x-pack/platform/packages/shared/kbn-evals-extensions/jest.config.js"
      echo "  $0 profile_scout x-pack/test/security_solution_scout/detection_engine.scout.config.ts"
      echo "  $0 analyze_ci main"
      echo "  $0 check_duplicates"
      ;;
  esac
}

# Run main if not sourced
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
  main "$@"
fi
