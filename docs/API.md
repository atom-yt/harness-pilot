# Harness Pilot API Documentation

## Overview

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes.

## Installation

Harness Pilot is a Claude Code plugin. To use it:

1. Add marketplace: `/plugin marketplace add https://github.com/atom-yt/harness-pilot.git`
2. Install plugin: `/plugin install harness-pilot@harness-pilot`
3. Use the plugin via the `/harness-pilot:harness-*` commands

## Skills

### harness-analyze

Analyzes project structure and generates a health report without making changes.

**Trigger:** `analyze`, `harness-analyze`, `project-analysis`

**Usage:**
```
I'm using harness-analyze to perform a dryrun analysis of this project.
```

**Output:**
- Documentation coverage score
- Architecture constraints score
- Quality rules score
- Import relationship analysis
- Actionable recommendations

### harness-apply

Generates complete harness infrastructure including rules. Supports interactive guided mode (default) and auto mode.

**Trigger:** `harness-apply`, `apply-harness`, `harness-auto`, `harness-guide`, `guide`, `harness-build`, `harness-generate-rules`, `generate-rules`, `harness-rules`

**Usage:**
```
# Interactive guided mode (default)
I'm using harness-apply to build harness infrastructure for this project.

# Auto mode
I'm using harness-apply --auto to auto-generate harness infrastructure.
```

**Interactive mode (default) -- 6-step guided flow:**
1. Project Detection - Confirm language, framework, directory structure
2. Component Selection - Choose which harness components to create
3. Layer Mapping - Configure dependency layer rules
4. Quality Rules - Select code quality rules to enforce
5. Validation Pipeline - Configure build/lint/test/verify commands
6. Confirm & Generate - Preview and confirm changes

**Auto mode (`--auto`):**
- Detects project language and framework automatically
- Uses recommended layer mapping
- Uses default quality rule set
- Creates all files: AGENTS.md, docs/, .harness/scripts/, .harness/rules/, .harness/memory/, .harness/tasks/, .harness/trace/
- Validates generated scripts are executable

### harness-improve

Audits harness health and self-improves by analyzing failure patterns, detecting lint coverage gaps, and applying targeted fixes.

**Trigger:** `improve`, `harness-improve`, `harness-health`, `harness-audit`

**Usage:**
```
I'm using harness-improve to audit and strengthen the harness infrastructure.
```

**What it does:**
- Runs health check (reuses harness-analyze scoring)
- Analyzes failure patterns from .harness/trace/
- Detects lint coverage gaps and stale documentation
- Generates improvement suggestions
- Optionally auto-applies fixes

## Template Engine

The plugin includes a lightweight template engine for rendering templates.

**Usage:**
```bash
node plugins/harness-pilot/scripts/template-engine.js \n  <template-file> \n  '<json-context>'
```

**Supported features:**
- Variable substitution: `{{VARIABLE}}`
- Conditional rendering: `{{#if VAR}}...{{/if}}`
- Loop rendering: `{{#each ITEMS}}...{{/each}}`

**Example:**
```bash
node plugins/harness-pilot/scripts/template-engine.js \n  plugins/harness-pilot/templates/base/AGENTS.md.template \n  '{"PROJECT_NAME":"my-app","LANGUAGE":"typescript"}'
```

## Generated File Structure

```
my-project/
├── AGENTS.md              # Navigation map (~100 lines)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
│   ├── DEVELOPMENT.md     # Build/test/lint commands
│   ├── design-docs/       # Component design documents
│   └── exec-plans/       # Execution plans
└── .harness/
    ├── scripts/
    │   ├── lint-deps.*        # Layer dependency checking
    │   ├── lint-quality.*     # Code quality rules
    │   ├── verify/            # End-to-end verification
    │   └── validate.*        # Unified validation pipeline
    ├── memory/            # Three types of memory
    ├── tasks/             # Task state and checkpoints
    ├── trace/             # Execution trace and failure records
    └── rules/
        ├── common/
        │   ├── safety.md      # AI safety constraints
        │   └── git-workflow.md # Git workflow rules
        └── {language}/
            └── development.md  # Language-specific guidelines
```

## Supported Languages

| Language | Status | Templates Available |
|----------|--------|---------------------|
| TypeScript | ✓ | lint-deps.ts, lint-quality.ts, validate.ts, development.md |
| JavaScript | ✓ | development.md |
| Python | ✓ | lint-deps.py, lint-quality.py, validate.py, development.md |
| Go | ✓ | lint-deps.go, lint-quality.go, validate.go, development.md |
| Rust | Planned | N/A |

## Supported Frameworks

| Framework | Language | Status |
|-----------|----------|--------|
| Next.js | TypeScript | Full support |
| React | TypeScript/JavaScript | Template available |
| Express.js | JavaScript | Template available |
| Django | Python | Template available |
| FastAPI | Python | Template available |
| Gin | Go | Template available |

## Configuration

### plugin.json

The `plugin.json` file defines the plugin configuration:

```json
{
  "name": "harness-pilot",
  "version": "0.1.0",
  "skills": [...],
  "supportedLanguages": [...],
  "supportedFrameworks": [...],
  "templates": {...}
}
```

### Layer Configuration

Layer mappings are configured per framework in the template files. Default mappings:

**Next.js:**
- Layer 0: types/
- Layer 1: utils/
- Layer 2: lib/
- Layer 3: components/, services/
- Layer 4: app/, api/

**FastAPI:**
- Layer 0: types/, models/
- Layer 1: utils/
- Layer 2: services/, managers/
- Layer 3: api/
- Layer 4: main.py

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| "Language not detected" | Project uses uncommon structure | Use guide mode for manual selection |
| "Template not found" | No template for language/framework | Base template will be used as fallback |
| "Node.js not found" | Template engine requires Node.js | Install Node.js or use manual generation |
| "Permission denied" | Cannot set executable permissions | Run `chmod +x .harness/scripts/*` manually |

## Troubleshooting

### Scripts not executable

```bash
chmod +x .harness/scripts/*.ts
chmod +x .harness/scripts/*.py
chmod +x .harness/scripts/*.go
```

### Template engine not found

Ensure Node.js is installed:
```bash
node --version
```

### Validation fails

Check that the project has required build/test commands configured in `DEVELOPMENT.md`.

## References

- [Harness Pilot Design](design-harness-creator.md)
- [Harness Report](harness-report.md)
- [AGENTS.md Standard](https://github.com/agentsmd/agents.md)