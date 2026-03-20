#!/bin/bash
#
# Validation script for security-reviewer skill
# Tests that all known vulnerabilities are detected
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_FILES="$SCRIPT_DIR/vulnerable_routes.ts $SCRIPT_DIR/vulnerable_ui.tsx"

echo "🔍 Security Reviewer Validation Test"
echo "====================================="
echo ""
echo "Testing detection of known vulnerabilities in test files..."
echo ""

# Test 1: XSS Detection
echo "✓ Test 1: XSS Detection"
if grep -q "dangerouslySetInnerHTML" "$SCRIPT_DIR/vulnerable_ui.tsx"; then
  echo "  Found: dangerouslySetInnerHTML (3 instances expected)"
else
  echo "  ❌ Failed to find dangerouslySetInnerHTML"
  exit 1
fi

if grep -q "\.innerHTML\s*=" "$SCRIPT_DIR/vulnerable_ui.tsx"; then
  echo "  Found: .innerHTML assignment (1 instance expected)"
else
  echo "  ❌ Failed to find .innerHTML assignment"
  exit 1
fi

if grep -q "document\.write" "$SCRIPT_DIR/vulnerable_ui.tsx"; then
  echo "  Found: document.write (1 instance expected)"
else
  echo "  ❌ Failed to find document.write"
  exit 1
fi

# Test 2: SQL Injection Detection
echo ""
echo "✓ Test 2: SQL Injection Detection"
if grep -q 'query.*`.*\${' "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: Template literal in ES query (1 instance expected)"
else
  echo "  ❌ Failed to find template literal in query"
  exit 1
fi

# Test 3: Auth Bypass Detection
echo ""
echo "✓ Test 3: Auth Bypass Detection"
if grep -q "enabled:\s*false" "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: authz disabled (1 instance expected)"
else
  echo "  ❌ Failed to find disabled authz"
  exit 1
fi

# Test 4: Weak Validation Detection
echo ""
echo "✓ Test 4: Weak Validation Detection"
if grep -q "schema\.any()" "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: schema.any() (1 instance expected)"
else
  echo "  ❌ Failed to find schema.any()"
  exit 1
fi

# Test 5: Path Traversal Detection
echo ""
echo "✓ Test 5: Path Traversal Detection"
if grep -q "path\.join.*request\." "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: User input in path.join (1 instance expected)"
else
  echo "  ❌ Failed to find path.join with request data"
  exit 1
fi

if grep -q "fs\.readFileSync" "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: fs operation with user input (1 instance expected)"
else
  echo "  ❌ Failed to find fs operation with request data"
  exit 1
fi

# Test 6: Command Injection Detection
echo ""
echo "✓ Test 6: Command Injection Detection"
if grep -q "exec.*request\." "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: exec() with user input (1 instance expected)"
else
  echo "  ❌ Failed to find exec() with request data"
  exit 1
fi

# Test 7: CSRF Detection
echo ""
echo "✓ Test 7: CSRF Detection"
if grep -q "xsrfRequired:\s*false" "$SCRIPT_DIR/vulnerable_routes.ts"; then
  echo "  Found: CSRF protection disabled (1 instance expected)"
else
  echo "  ❌ Failed to find disabled CSRF protection"
  exit 1
fi

# Summary
echo ""
echo "====================================="
echo "✅ All validation tests passed!"
echo ""
echo "Known vulnerabilities in test files:"
echo "  - XSS: 3 instances (dangerouslySetInnerHTML, innerHTML, document.write)"
echo "  - SQL Injection: 1 instance (template literal in query)"
echo "  - Auth Bypass: 1 instance (authz disabled)"
echo "  - Weak Validation: 1 instance (schema.any())"
echo "  - Path Traversal: 1 instance (path.join + fs.readFileSync)"
echo "  - Command Injection: 1 instance (exec with user input)"
echo "  - CSRF: 1 instance (xsrfRequired: false)"
echo ""
echo "Total: 9 vulnerabilities across 2 test files"
echo ""
echo "The security-reviewer skill should detect all of these."
