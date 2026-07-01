#!/usr/bin/env bash
# Regression guard for the product-shaping worktree-safety protocol.
# Verifies (a) the documented resolver bash still lives in
# shape-init/references/context-root-protocol.md, and (b) that resolver +
# exclude logic behaves correctly across main tree / linked worktree /
# non-git cwd, and is idempotent.

set -uo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROTO="$REPO/plugins/product-shaping/skills/shape-init/references/context-root-protocol.md"

pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✓ $1"; pass=$((pass+1)); else echo "  ✗ $1: expected [$3] got [$2]"; fail=$((fail+1)); fi; }
have()  { if grep -qF "$2" "$PROTO"; then echo "  ✓ $1"; pass=$((pass+1)); else echo "  ✗ $1: missing from protocol doc"; fail=$((fail+1)); fi; }

echo "=== 1. protocol doc contains canonical resolver + exclude bash ==="
have "resolver: git-common-dir"        'git rev-parse --git-common-dir'
have "resolver: worktree anchor"        'dirname "$GIT_COMMON_DIR"'
have "resolver: bare-repo branch"       'IS_BARE'
have "exclude: mkdir parent (robust)"   'mkdir -p "$(dirname "$EXCLUDE_FILE")"'
have "exclude: dedup line"              "grep -qxF 'context/'"

echo ""
echo "=== 2. behavioral test (scratch repo + worktree) ==="
SB=$(cd "$(mktemp -d)" && pwd -P)

resolve() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
    GIT_COMMON_DIR="$(cd "$GIT_COMMON_DIR" && pwd)"
    IS_BARE="$(git --git-dir="$GIT_COMMON_DIR" rev-parse --is-bare-repository 2>/dev/null)"
    if [ "$IS_BARE" = "true" ]; then CONTEXT_ROOT="$GIT_COMMON_DIR/shape-context"
    else CONTEXT_ROOT="$(dirname "$GIT_COMMON_DIR")"; fi
  else CONTEXT_ROOT="$(pwd)"; GIT_COMMON_DIR=""; fi
}
exclude_ctx() {
  if ! git check-ignore -q "$CONTEXT_ROOT/context/" 2>/dev/null; then
    local EF="$GIT_COMMON_DIR/info/exclude"
    mkdir -p "$(dirname "$EF")"; touch "$EF"
    grep -qxF 'context/' "$EF" || printf '\ncontext/\n' >> "$EF"
  fi
}
ignored() { git check-ignore -q "$1" 2>/dev/null && echo IGN || echo NO; }

MAIN="$SB/repo"; mkdir -p "$MAIN"; cd "$MAIN"; git init -q; git commit -q --allow-empty -m init
resolve; check "main resolves CONTEXT_ROOT to repo root" "$CONTEXT_ROOT" "$MAIN"
exclude_ctx; mkdir -p context/foundation; echo x > context/foundation/prd.md
check "context/ ignored in main" "$(ignored context/foundation/prd.md)" "IGN"

WT="$SB/repo.worktrees/feature-a"; git worktree add -q "$WT" -b feature-a; cd "$WT"
resolve; check "worktree shares MAIN CONTEXT_ROOT" "$CONTEXT_ROOT" "$MAIN"
mkdir -p context; echo y > context/note.md
check "context/ ignored from worktree (no re-init)" "$(ignored context/note.md)" "IGN"

NG="$SB/plain"; mkdir -p "$NG"; cd "$NG"
resolve; check "non-git dir falls back to cwd" "$CONTEXT_ROOT" "$NG"

cd "$MAIN"; resolve; exclude_ctx; exclude_ctx
check "exclude line idempotent (written once)" "$(grep -cxF 'context/' "$GIT_COMMON_DIR/info/exclude")" "1"

cd /; rm -rf "$SB"
echo ""
echo "RESULT: pass=$pass fail=$fail"
[ $fail -eq 0 ] && echo "context-root guard passed ✓" || { echo "context-root guard failed ✗"; exit 1; }
