---
name: harness-pilot
description: Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes
---

# Harness Creator

**Announce at start:** "I'm using harness-pilot to analyze and build harness infrastructure for this project."

## Overview

Harness Creator is a tool that transforms any codebase into a harness-compatible form. It provides three modes:

1. **harness-analyze** (dryrun) - Analyze project structure and generate health report without making changes
2. **harness-guide** (guide mode) - Interactive guided build with step-by-step configuration
3. **harness-apply** (auto mode) - One-click generation with default settings

## Mode Selection

Ask user which mode they want to use:

```
Available modes:
  1. harness-analyze  - Analyze project only (no changes)
  2. harness-guide    - Interactive guided build
  3. harness-apply    - Auto-generate with defaults

Which mode? (or describe what you want to accomplish)
```

### harness-analyze Mode

**Required sub-skill:** Use `harness-pilot:harness-analyze`

Performs read-only analysis of the project and outputs a health report covering:

- Documentation coverage (AGENTS.md, ARCHITECTURE.md, etc.)
- Architecture constraints (layer rules, dependency checking)
- Quality rules (lint scripts, code standards)
- Import relationship analysis
- Actionable recommendations

No files are modified in this mode.

### harness-guide Mode

**Required sub-skill:** Use `harness-pilot:harness-guide`

Interactive 6-step guided flow:

1. **Project Detection** - Detect language, framework, directory structure
2. **Component Selection** - Choose which harness components to create
3. **Layer Mapping** - Configure dependency layer rules
4. **Quality Rules** - Select code quality rules to enforce
5. **Validation Pipeline** - Configure build/lint/test/verify commands
6. **Confirm & Generate** - Preview and confirm changes

Each step shows detected defaults and allows customization before proceeding.

### harness-apply Mode

**Required sub-skill:** Use `harness-pilot:harness-apply`

Generates complete harness infrastructure with automatic defaults:

- Detects project language and framework
- Uses recommended layer mapping
- Uses default quality rule set
- Creates all files: AGENTS.md, docs/, scripts/, harness/
- Validates generated scripts

Best for standard-structure projects or when defaults are acceptable.

## Generated Files

All modes generate the following structure (actual files vary by selection):

```
my-project/
├── AGENTS.md              # Navigation map (~100 lines)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
│   ├── DEVELOPMENT.md     # Build/test/lint commands
│   ├── design-docs/       # Component design documents
│   └── exec-plans/       # Execution plans (active / completed)
├── scripts/
│   ├── lint-deps.*        # Layer dependency checking
│   ├── lint-quality.*     # Code quality rules
│   ├── verify/             # End-to-end functional verification
│   └── validate.*        # Unified validation pipeline
└── harness/
    ├── memory/            # Three types of memory
    ├── tasks/             # Task state and checkpoints
    └── trace/             # Execution trace and failure records
```

## Supported Languages & Frameworks

| Language | Templates | Status |
|----------|-----------|--------|
| TypeScript | lint-deps, lint-quality, validate | ✓ |
| JavaScript | lint-deps, lint-quality | ✓ |
| Python | lint-deps, lint-quality, validate | ✓ |
| Go | lint-deps, validate | ✓ |
| Rust | lint-deps, validate | ✓ |

| Framework | Language | Status |
|---------|---------|--------|
| Next.js | TypeScript | ✓ |
| React | TypeScript/JS | ✓ |
| Express.js | JavaScript | ✓ |
| Django | Python | ✓ |
| FastAPI | Python | ✓ |
| Gin | Go | ✓ |

## After Generation

Once harness is generated, provide user with:

```bash
✓ Harness infrastructure created!

Generated files:
  ✓ AGENTS.md
  ✓ docs/ARCHITECTURE.md
  ✓ docs/DEVELOPMENT.md
  ✓ scripts/lint-deps.ts (executable)
  ✓ scripts/validate.ts (executable)
  ✓ harness/memory/, tasks/, trace/

Next steps:
  1. Review AGENTS.md to understand the structure
  2. Run `npm run lint` or `make lint` to check existing code
  3. Run `npm run validate` or `make validate` to test verification pipeline
  4. Read docs/ARCHITECTURE.md to understand layer rules

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Create a test file to verify harness works
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Language not detected" | Project may use uncommon structure; use guide mode for manual selection |
| "Layer detection failed" | Use guide mode to manually configure layer mappings |
| "Scripts not executable" | Run `chmod +x scripts/*.ts` on generated files |
| "Validation fails" | Check project has required build/test commands configured |

## References

- [Harness Creator Design](../design-harness-pilot.md)
- [Harness Report](../harness-report.md)
- [AGENTS.md Standard](https://github.com/agentsmd/agents.md)
