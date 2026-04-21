# Harness Pilot

> Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes

---

## What is Harness Pilot?

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides three modes:

- **harness-analyze** (dryrun) - Analyze project structure and generate health report without making changes
- **harness-apply** (build) - Generate harness infrastructure with interactive guided mode (default) or auto mode (`--auto`)
- **harness-improve** (audit) - Audit harness health and self-improve by analyzing failure patterns and applying targeted fixes

## Installation

### Install from marketplace (Recommended)

Add the Harness Pilot marketplace and install the plugin in Claude Code:

```bash
# Add marketplace (HTTPS, no SSH key required)
/plugin marketplace add https://github.com/atom-yt/harness-pilot.git

# Install plugin
/plugin install harness-pilot@harness-pilot
```

### Manual installation

1. Clone this repository:
   ```bash
   git clone https://github.com/atom-yt/harness-pilot.git
   ```

2. Copy the plugin directory to your project:
   ```bash
   cp -r harness-pilot/plugins/harness-pilot /path/to/your-project/plugins/
   ```

## Quick Start

```bash
# Analyze project health (no changes made)
/harness-pilot:harness-analyze

# Generate harness infrastructure (interactive guided mode)
/harness-pilot:harness-apply

# Auto-generate with defaults
/harness-pilot:harness-apply --auto

# Audit and self-improve harness
/harness-pilot:harness-improve
```

## What is a Harness?

A Harness is a set of infrastructure that helps AI Agents work reliably in a codebase:

```
my-project/
├── AGENTS.md              # Navigation map (~100 lines)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
│   └── DEVELOPMENT.md     # Build, test, lint commands
└── .harness/
    ├── scripts/
    │   ├── lint-deps.*        # Layer dependency checking
    │   ├── lint-quality.*     # Code quality rules
    │   └── validate.*         # Unified validation pipeline
    ├── memory/            # Three types of memory
    ├── tasks/             # Task state and checkpoints
    ├── trace/             # Execution trace and failure records
    └── rules/
        ├── common/
        │   ├── safety.md      # AI safety constraints
        │   └── git-workflow.md # Git workflow rules
        └── {language}/
            └── development.md # Language-specific guidelines
```

## Supported Languages

| Language | Status |
|----------|--------|
| TypeScript | Full support (lint scripts + rules) |
| JavaScript | Rules only |
| Python | Full support (lint scripts + rules) |
| Go | Full support (lint scripts + rules) |

## Supported Frameworks

| Framework | Language | Status |
|-----------|----------|--------|
| Next.js | TypeScript | Full support |
| React | TypeScript/JS | Template available |
| Express.js | JavaScript | Template available |
| Django | Python | Template available |
| FastAPI | Python | Template available |
| Gin | Go | Template available |

## Documentation

- [Harness Report](docs/harness-report.md) - A reader-friendly introduction
- [Design Document](docs/design-harness-creator.md) - Technical design details

## AI Rules

The `.harness/rules/` directory contains AI-enforceable constraints that guide agent behavior:

- **.harness/rules/common/safety.md** - Safety constraints (no destructive operations, secrets management)
- **.harness/rules/common/git-workflow.md** - Git workflow rules (commit format, branch naming)
- **.harness/rules/{language}/development.md** - Language-specific development guidelines

Rules are automatically detected and enforced when AI agents work on the codebase. Use `harness-apply` to generate rules for your project.

## License

MIT