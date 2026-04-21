# Harness Pilot

> Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes

---

## What is Harness Pilot?

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides four modes:

- **harness-analyze** (dryrun) - Analyze project structure and generate health report without making changes
- **harness-guide** (guide mode) - Interactive guided build with step-by-step configuration
- **harness-apply** (auto mode) - One-click generation with default settings
- **harness-generate-rules** - Generate AI rules for safety, git workflow, and language-specific development

## Installation

### Install from marketplace (Recommended)

Add the Harness Pilot marketplace and install the plugin in Claude Code:

```bash
# Add marketplace
/plugin marketplace add github:atom-yt/harness-pilot

# Install plugin
/plugin install harness-pilot
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

# Interactive guided build
/harness-pilot:harness-guide

# Auto-generate with defaults
/harness-pilot:harness-apply

# Generate AI rules only
/harness-pilot:harness-generate-rules
```

## What is a Harness?

A Harness is a set of infrastructure that helps AI Agents work reliably in a codebase:

```
my-project/
├── AGENTS.md              # Navigation map (~100 lines)
├── docs/
│   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
│   └── DEVELOPMENT.md     # Build, test, lint commands
├── scripts/
│   ├── lint-deps.*        # Layer dependency checking
│   ├── lint-quality.*     # Code quality rules
│   └── validate.*         # Unified validation pipeline
├── harness/
│   ├── memory/            # Three types of memory
│   ├── tasks/             # Task state and checkpoints
│   └── trace/             # Execution trace and failure records
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
| TypeScript | ✓ |
| JavaScript | ✓ |
| Python | ✓ (rules only) |
| Go | ✓ (rules only) |
| Rust | Planned |

## Supported Frameworks

| Framework | Language | Status |
|-----------|----------|--------|
| Next.js | TypeScript | ✓ |
| React | TypeScript/JS | Planned |
| Express.js | JavaScript | Planned |
| Django | Python | Planned |
| FastAPI | Python | Planned |
| Gin | Go | Planned |

## Documentation

- [Harness Report](harness-report.md) - A reader-friendly introduction
- [Design Document](design-harness-creator.md) - Technical design details

## AI Rules

The `rules/` directory contains AI-enforceable constraints that guide agent behavior:

- **rules/common/safety.md** - Safety constraints (no destructive operations, secrets management)
- **rules/common/git-workflow.md** - Git workflow rules (commit format, branch naming)
- **rules/{language}/development.md** - Language-specific development guidelines

Rules are automatically detected and enforced when AI agents work on the codebase. Use `harness-generate-rules` to generate rules for your project.

## License

MIT