# Harness Pilot API Documentation

## Overview

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form with health analysis, guided generation, reentrant updates, and Ralph Wiggum Loop quality cycle.

## Installation

1. Add marketplace: `/plugin marketplace add https://github.com/atom-yt/harness-pilot.git`
2. Install plugin: `/plugin install harness-pilot@harness-pilot`
3. Use via `/harness-pilot:harness-analyze` or `/harness-pilot:harness-apply`

## Skills

### harness-analyze

Analyzes project structure, audits harness health, and generates a visual scoring report without making changes.

**Trigger:** `analyze`, `harness-analyze`, `project-analysis`, `improve`, `harness-health`, `harness-audit`

**Output:**
- Visual health report with overall score (0-100, grade A-D)
- Per-category scoring with progress bars (Documentation, Architecture, Quality, Test Coverage, Validation)
- Documentation freshness audit (if harness exists)
- Lint coverage gap detection (if harness exists)
- Toolchain recommendations (Superpowers install prompt if not detected)
- Actionable recommendations

### harness-apply

Generates and maintains harness infrastructure. Supports three modes:

**Trigger:** `harness-apply`, `apply`, `harness-build`, `generate-rules`, `harness-rules`, `harness-loop`, `quality loop`

**Modes:**

| Mode | When | Behavior |
|------|------|----------|
| Initial | No `.harness/manifest.json` | Full generation → first Loop verification |
| Reentry (default) | `.harness/manifest.json` exists | Scan code changes → incremental update → Ralph Wiggum Loop |
| `--init` | User specifies | Force full regeneration, skip Loop |
| `--auto` | User specifies | Non-interactive, use detected defaults |

**Initial mode — 6-step guided flow:**
1. Project Detection - Confirm language, framework, directory structure
2. Component Selection - Choose harness components to create
3. Layer Mapping - Configure dependency layer rules
4. Quality Rules - Select code quality rules to enforce
5. Validation Pipeline - Configure build/lint/test commands
6. Confirm & Generate - Preview and generate all files

**Reentry mode:**
1. Read manifest.json for previous state
2. Scan codebase for changes (new directories, dependencies, configs)
3. Incremental update (layer mapping, rules, docs)
4. Preserve custom rules
5. Run Ralph Wiggum Loop

**Ralph Wiggum Loop (quality cycle):**
```
Orchestrate → Review → Test → Decision → Fix → Re-Review (max 3 rounds)
```

- Review: dispatch code-reviewer agent + lint-deps + lint-quality
- Test: build → lint → test → validate
- Fix: auto-fix or suggest fix, record to trace/failures/
- Evolve: post-loop analysis of recurring failure patterns

**Loop Report:** Visual report with iteration history, per-phase results, and evolution insights.

## Template Engine

```bash
node plugins/harness-pilot/scripts/template-engine.js \
  <template-file> \
  '<json-context>'
```

Supported features:
- Variable substitution: `{{VARIABLE}}`
- Conditional rendering: `{{#if VAR}}...{{/if}}`
- Loop rendering: `{{#each ITEMS}}...{{/each}}`

## Generated File Structure

```
my-project/
└── .harness/
    ├── docs/
    │   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
    │   ├── DEVELOPMENT.md     # Build/test/lint commands
    │   └── PRODUCT_SENSE.md   # Business context
    ├── scripts/
    │   ├── lint-deps.*        # Layer dependency checking
    │   ├── lint-quality.*     # Code quality rules
    │   └── validate.*         # Unified validation pipeline
    ├── rules/
    │   ├── common/
    │   │   ├── safety.md      # AI safety constraints
    │   │   └── git-workflow.md # Git workflow rules
    │   └── {language}/
    │       └── development.md # Language-specific guidelines
    ├── memory/                # Agent experience storage (episodic/procedural)
    ├── trace/                 # Failure records
    ├── hooks/                 # Git hooks (post-commit)
    └── manifest.json          # Harness state for reentrant updates
```

## Agents

### code-reviewer

Reviews changed code for correctness, architecture compliance, and quality. Combines code review with architecture validation (layer compliance, dependency direction, module boundaries).

Used by harness-apply during Ralph Wiggum Loop review phase. Reads `.harness/docs/ARCHITECTURE.md` for layer rules and `.harness/rules/` for coding standards.

## Supported Languages

| Language | Status | Templates Available |
|----------|--------|---------------------|
| TypeScript | Full | lint-deps.ts, lint-quality.ts, validate.ts, development.md |
| JavaScript | Rules | development.md |
| Python | Full | lint-deps.py, lint-quality.py, validate.py, development.md |
| Go | Full | lint-deps.go, lint-quality.go, validate.go, development.md |

## Supported Frameworks

| Framework | Language | Status |
|-----------|----------|--------|
| Next.js | TypeScript | Full support |
| React | TypeScript/JavaScript | Template available |
| Express.js | JavaScript | Template available |
| Django | Python | Template available |
| FastAPI | Python | Template available |
| Gin | Go | Template available |

## Error Handling

| Error | Solution |
|-------|----------|
| "Language not detected" | Use interactive mode for manual selection |
| "Template not found" | Base template used as fallback |
| "Node.js not found" | Install Node.js for template engine |
| "Permission denied" | Run `chmod +x .harness/scripts/*` |
| "manifest.json corrupted" | Run `harness-apply --init` to regenerate |

## References

- [Detailed Design](detailed-design.md)
- [Overview Design](overview-design.md)
