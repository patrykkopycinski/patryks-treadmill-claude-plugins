# API Test Generator - File Index

Complete reference for all skill files.

## Core Files

### 1. SKILL.md
**Purpose:** Main skill instructions for Claude Agent SDK

**Contains:**
- Skill activation phrases
- Step-by-step instructions
- Route parsing logic
- Test generation templates
- RBAC mapping logic
- Schema-driven test data generation
- Output format specifications

**Read this:** When activating the skill

---

### 2. README.md
**Purpose:** High-level overview and documentation

**Contains:**
- Skill overview
- Features and capabilities
- Usage examples
- Limitations
- Integration with Kibana
- Tips and best practices

**Read this:** To understand what the skill does

---

### 3. USAGE.md
**Purpose:** Step-by-step usage guide

**Contains:**
- Prerequisites
- Activation instructions
- Example sessions
- Common scenarios
- Customization tips
- Troubleshooting
- Best practices

**Read this:** When using the skill for the first time

---

### 4. QUICK_REFERENCE.md
**Purpose:** Fast lookup for common patterns

**Contains:**
- Activation phrases
- Schema mappings (quick table)
- Privilege-to-role mappings (quick table)
- Test structure checklist
- Common test patterns
- File naming conventions
- Run commands

**Read this:** For quick lookups during test generation

---

## Reference Files

### 5. helpers.md
**Purpose:** Detailed patterns and utilities

**Contains:**
- Schema type mappings (comprehensive)
- Privilege role mappings (comprehensive)
- Test data generation patterns
- Domain-specific naming examples
- Invalid data patterns
- Response assertion patterns
- Test organization guidelines
- Path/query parameter handling
- Constants file template
- Scout config template

**Read this:** For detailed implementation guidance

---

### 6. example_output.ts
**Purpose:** Complete example of generated tests

**Contains:**
- Full test suite for POST /api/alerting/rule
- All test categories (valid, RBAC, auth, validation, edge cases)
- Real-world test patterns
- Proper Scout API test structure
- Comments explaining each section

**Read this:** To see what the skill generates

---

### 7. TEMPLATE.ts
**Purpose:** Base template structure

**Contains:**
- Minimal test structure
- Placeholders for generated content
- Constants template
- Scout config template
- Comments showing what gets generated

**Read this:** To understand the base template structure

---

## Metadata Files

### 8. .skill_info.json
**Purpose:** Skill metadata

**Contains:**
- Skill name, version, author
- Description
- Activation phrases
- Capabilities
- Requirements
- Outputs
- File descriptions
- Test coverage areas
- Kibana integration details

**Read this:** For skill metadata and capabilities

---

### 9. INDEX.md (This File)
**Purpose:** File navigation guide

**Contains:**
- Description of each file
- Purpose and contents
- When to read each file

**Read this:** To understand the skill structure

---

## File Relationships

```
INDEX.md (you are here)
  ├─→ README.md (high-level overview)
  │    └─→ USAGE.md (detailed usage guide)
  │         └─→ QUICK_REFERENCE.md (quick lookups)
  │
  ├─→ SKILL.md (skill instructions)
  │    ├─→ helpers.md (detailed patterns)
  │    ├─→ example_output.ts (complete example)
  │    └─→ TEMPLATE.ts (base structure)
  │
  └─→ .skill_info.json (metadata)
```

## Quick Navigation

**I want to...**
- **Use the skill** → Start with `USAGE.md`
- **Understand capabilities** → Read `README.md`
- **Look up a pattern** → Check `QUICK_REFERENCE.md`
- **See an example** → View `example_output.ts`
- **Understand implementation** → Read `SKILL.md` and `helpers.md`
- **Get metadata** → Check `.skill_info.json`

## File Statistics

```
Total files: 9
Total lines: ~1,800
Documentation: ~1,400 lines
Code examples: ~400 lines
```

## Maintenance

When updating the skill:
1. Update `SKILL.md` for logic changes
2. Update `helpers.md` for new patterns
3. Update `example_output.ts` for new test types
4. Update `QUICK_REFERENCE.md` for quick lookups
5. Update `README.md` for capability changes
6. Update `.skill_info.json` version
7. Update this file if adding/removing files
