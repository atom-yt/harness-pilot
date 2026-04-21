# Harness Creator

> Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes

---

## What is Harness Creator?

Harness Creator is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides three modes:

- **harness-analyze** (dryrun) - Analyze project structure and generate health report without making changes
- **harness-guide** (guide mode) - Interactive guided build with step-by-step configuration
- **harness-apply** (auto mode) - One-click generation with default settings

## Quick Start

```bash
# Analyze project health (no changes made)
/harness-creator:harness-analyze

# Interactive guided build
/harness-creator:harness-guide

# Auto-generate with defaults
/harness-creator:harness-apply
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
└── harness/
    ├── memory/            # Three types of memory
    ├── tasks/             # Task state and checkpoints
    └── trace/             # Execution trace and failure records
```

## Supported Languages

| Language | Status |
|----------|--------|
| TypeScript | ✓ |
| JavaScript | ✓ |
| Python | Planned |
| Go | Planned |
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

## License

MIT