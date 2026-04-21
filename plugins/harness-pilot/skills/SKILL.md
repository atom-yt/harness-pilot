---
name: harness-pilot
description: Transform any project into a harness-compatible form with dry-run analysis and guided/auto generation modes
---

# Harness Pilot

**Announce at start:** "I'm using harness-pilot to analyze and build harness infrastructure for this project."

## Overview

Harness Pilot is a tool that transforms any codebase into a harness-compatible form. It provides two modes:

1. **harness-analyze** - Analyze project structure and generate health report without making changes
2. **harness-apply** - Generate harness infrastructure (interactive guided mode by default, `--auto` for auto mode)

## Mode Selection

Ask user which mode they want to use:

```
Available modes:
  1. harness-analyze  - Analyze project only (no changes)
  2. harness-apply    - Generate harness infrastructure (interactive by default, --auto for auto mode)
  3. harness-execute  - Execute development tasks within harness (plan, delegate, validate)
  4. harness-improve  - Audit harness health and self-improve

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

### harness-apply Mode

**Required sub-skill:** Use `harness-pilot:harness-apply`

Generates complete harness infrastructure including rules. Two sub-modes:

**Interactive mode (default)** — 6-step guided flow:

1. **Project Detection** - Detect language, framework, directory structure
2. **Component Selection** - Choose which harness components to create
3. **Layer Mapping** - Configure dependency layer rules
4. **Quality Rules** - Select code quality rules to enforce
5. **Validation Pipeline** - Configure build/lint/test/verify commands
6. **Confirm & Generate** - Preview and confirm changes

Each step shows detected defaults and allows customization before proceeding.

**Auto mode (`--auto`)** — One-click generation with detected defaults:

- Detects project language and framework
- Uses recommended layer mapping
- Uses default quality rule set
- Creates all files: AGENTS.md, docs/, scripts/, harness/, rules/
- Validates generated scripts

Best for standard-structure projects or when defaults are acceptable.

### harness-execute Mode

**Required sub-skill:** Use `harness-pilot:harness-execute`

Executes development tasks within the harness infrastructure. Manages the full lifecycle:

- **Environment detection** — Loads AGENTS.md, ARCHITECTURE.md, memory
- **Complexity assessment** — Simple (direct) / Medium (subagent) / Complex (subagent + worktree)
- **Task planning** — Dispatches planner agent for non-trivial tasks
- **Subagent delegation** — Coordinator never writes code for medium+ tasks
- **Validation pipeline** — build → lint-arch → test → verify
- **Checkpoints** — Saves progress for resumability
- **Memory recording** — Records experiences and failures

### harness-improve Mode

**Required sub-skill:** Use `harness-pilot:harness-improve`

Audits harness health and self-improves:

- Runs health check (reuses harness-analyze scoring)
- Analyzes failure patterns from harness/trace/
- Detects lint coverage gaps and stale documentation
- Generates improvement suggestions
- Optionally auto-applies fixes

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
| TypeScript | lint-deps, lint-quality, validate, verify-action | Full support |
| JavaScript | development rules | Rules only |
| Python | lint-deps, lint-quality, validate, verify-action | Full support |
| Go | lint-deps, lint-quality, validate, verify-action | Full support |

| Framework | Language | Status |
|---------|---------|--------|
| Next.js | TypeScript | Full support |
| React | TypeScript/JS | Template available |
| Express.js | JavaScript | Template available |
| Django | Python | Template available |
| FastAPI | Python | Template available |
| Gin | Go | Template available |

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
| "Language not detected" | Project may use uncommon structure; use harness-apply interactive mode for manual selection |
| "Layer detection failed" | Use harness-apply interactive mode to manually configure layer mappings |
| "Scripts not executable" | Run `chmod +x scripts/*.ts` on generated files |
| "Validation fails" | Check project has required build/test commands configured |

## References

- [Harness Creator Design](../../../docs/design-harness-creator.md)
- [Harness Report](../../../docs/harness-report.md)
- [AGENTS.md Standard](https://github.com/agentsmd/agents.md)
