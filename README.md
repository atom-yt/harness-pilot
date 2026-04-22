# Harness Pilot

> Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes

---

## What is Harness Pilot?

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides five skills:

- **harness-analyze** (dryrun) - Analyze project structure, audit harness health, and generate health report without making changes
- **harness-apply** (build) - Generate harness infrastructure with interactive guided mode (default) or auto mode (`--auto`)
- **harness-spec** - Structured feature specification management with lifecycle (draft → approved → archived)
- **harness-review** - Multi-perspective code review (architecture / product / quality / engineering / operations)
- **harness-evolve** - Failure pattern analysis and self-evolution via Critic → Refiner loop

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

## Update

### Reinstall from marketplace

Uninstall the old version and reinstall to get the latest:

```bash
# Uninstall old version
/plugin uninstall harness-pilot@harness-pilot

# Reinstall latest version
/plugin install harness-pilot@harness-pilot
```

### Manual update

```bash
# Pull latest code
cd harness-pilot && git pull

# Re-copy to your project
cp -r plugins/harness-pilot /path/to/your-project/plugins/
```

### Update generated harness files

Re-run `harness-apply` to regenerate harness rules, scripts, and other files:

```bash
/harness-pilot:harness-apply
```

> **Note**: `harness-apply` will overwrite existing harness files. Back up any custom modifications before running.

## Quick Start

```bash
# Analyze project health (no changes made)
/harness-pilot:harness-analyze

# Generate harness infrastructure (interactive guided mode)
/harness-pilot:harness-apply

# Auto-generate with defaults
/harness-pilot:harness-apply --auto

# Create a feature specification
/harness-pilot:harness-spec

# Run multi-perspective code review
/harness-pilot:harness-review

# Analyze failure patterns and evolve harness rules
/harness-pilot:harness-evolve
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
    ├── specs/             # Feature specifications (draft/approved/archived)
    ├── memory/            # Three types of memory
    ├── tasks/             # Task state and checkpoints
    ├── trace/             # Execution trace and failure records
    └── rules/
        ├── common/
        │   ├── safety.md      # AI safety constraints
        │   ├── git-workflow.md # Git workflow rules
        │   └── roles.md       # Multi-perspective role checklists
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

- [API Documentation](docs/API.md) - Full API reference
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute
- [Overview Design](docs/overview-design.md) - Design overview (概要设计)
- [Detailed Design](docs/detailed-design.md) - Detailed design (详细设计)
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [Optimization Plan](docs/OPTIMIZATION_PLAN.md) - Optimization roadmap

## AI Rules

The `.harness/rules/` directory contains AI-enforceable constraints that guide agent behavior:

- **.harness/rules/common/safety.md** - Safety constraints (no destructive operations, secrets management)
- **.harness/rules/common/git-workflow.md** - Git workflow rules (commit format, branch naming)
- **.harness/rules/common/roles.md** - Multi-perspective role checklists (product, architecture, engineering, quality, operations)
- **.harness/rules/{language}/development.md** - Language-specific development guidelines

Rules are automatically detected and enforced when AI agents work on the codebase. Use `harness-apply` to generate rules for your project.

## Recommended Toolchain

When running `harness-analyze` or `harness-apply`, Harness Pilot recommends complementary development quality tools based on project characteristics:

| Tool | Purpose | Install |
|------|---------|---------|
| [Superpowers](https://github.com/janus-cards/superpowers) | Brainstorm, plan, git worktree, subagent execution, code review | `claude mcp add-skill obra/superpowers-skills` |
| [gstack](https://github.com/anthropics/courses) | Role governance, CEO/eng-manager/QA perspective review | `claude mcp add-skill anthropics/gstack` |

**Recommended workflow with all tools:**

```
brainstorm(SP) → spec(H) → plan(SP) → worktree(SP) → implement → review(H+G) → ship(G) → evolve(H)
```

SP = Superpowers, H = Harness Pilot, G = gstack

## License

MIT