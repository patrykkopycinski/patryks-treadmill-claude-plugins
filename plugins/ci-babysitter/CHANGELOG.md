# Changelog

All notable changes to the ci-babysitter plugin will be documented in this file.

## [1.0.0] - 2026-03-20

### Added
- Initial release of ci-babysitter skill
- GUARD mode: Pre-push validation with scoped checks
- BABYSIT mode: Continuous CI monitoring and auto-fixing
- Auto-fix capabilities:
  - ESLint errors (via `eslint --fix`)
  - Type errors (analyzes and fixes type issues)
  - Test failures (fixes test or code logic)
  - Flaky tests (refactors to eliminate race conditions)
  - Merge conflicts (auto-resolves when safe)
- PR comment handling:
  - Auto-addresses bot/automated check comments
  - Asks for approval on human reviewer comments requiring major changes
- Safety features:
  - Dry-run mode on first iteration
  - Max 20 iteration limit
  - Major change detection
  - Infrastructure failure handling
- Integration with buildkite-ci-debugger skill for log analysis
- Support for Elastic Kibana CI/CD workflow

### Features
- 5-minute polling interval (configurable)
- Automatic `/ci` triggering on draft PRs
- Comprehensive status reporting
- Root cause categorization
- Multi-failure handling in single commit

### Requirements
- buildkite-ci-debugger skill
- Buildkite MCP server (user-buildkite-read-only-toolsets)
- GitHub CLI (`gh`)
- Git worktree access
