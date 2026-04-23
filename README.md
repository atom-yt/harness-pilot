# Harness Pilot

> Transform any project into a harness-compatible form with health analysis, guided generation, reentrant updates, and Ralph Wiggum Loop quality cycle

---

## What is Harness Pilot?

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides two skills:

- **harness-analyze** (look) - Analyze project structure, audit harness health, and generate a visual scoring report without making changes
- **harness-apply** (do) - Generate/update harness infrastructure with reentrant support and Ralph Wiggum Loop (automated review-test-fix quality cycle)

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

```bash
/plugin uninstall harness-pilot@harness-pilot
/plugin install harness-pilot@harness-pilot
```

### Manual update

```bash
cd harness-pilot && git pull
cp -r plugins/harness-pilot /path/to/your-project/plugins/
```

### Update generated harness files

Re-run `harness-apply` to incrementally update harness knowledge based on code changes:

```bash
/harness-pilot:harness-apply
```

> **Note**: Reentrant mode preserves custom rules. Use `--init` to force full regeneration.

## Quick Start

```bash
# Analyze project health (no changes made)
/harness-pilot:harness-analyze

# Generate harness infrastructure (interactive guided mode)
/harness-pilot:harness-apply

# Auto-generate with defaults (non-interactive)
/harness-pilot:harness-apply --auto

# Force regenerate (skip Loop)
/harness-pilot:harness-apply --init
```

After initial setup, running `harness-apply` again will:
1. Detect code changes since last run
2. Incrementally update harness knowledge
3. Run the Ralph Wiggum Loop (review → test → fix cycle, max 3 rounds)

## What is a Harness?

A Harness is a set of infrastructure that helps AI Agents work reliably in a codebase:

```
my-project/
└── .harness/
    ├── docs/
    │   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules
    │   ├── DEVELOPMENT.md     # Build, test, lint commands
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
    ├── memory/                # Agent experience storage
    ├── trace/                 # Failure records
    ├── hooks/                 # Git hooks (post-commit)
    └── manifest.json          # Harness state for reentrant updates
```

## Ralph Wiggum Loop

The core quality enforcement mechanism. Runs automatically when you invoke `harness-apply` on an existing harness:

```
Orchestrate → Review → Test → Fix → Re-Review (max 3 rounds)
```

- **Review**: Agent code review (dispatch code-reviewer) + lint-deps + lint-quality
- **Test**: Run validation pipeline (build → lint → test → validate)
- **Fix**: Auto-fix where possible, record failures to trace/
- **Evolve**: After loop, analyze recurring failure patterns and suggest rule updates

## Recommended Toolchain

Harness Pilot reuses capabilities from [Superpowers](https://github.com/janus-cards/superpowers) (brainstorm, planning, TDD, code-review, git worktree). Install for the best experience:

```bash
claude plugin marketplace add obra/superpowers-marketplace
claude plugin install superpowers@superpowers-marketplace
```

**Recommended workflow:**

```
analyze → apply → develop → apply (loop) → ship
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
- [Overview Design](docs/overview-design.md) - Design overview
- [Detailed Design](docs/detailed-design.md) - Detailed design
- [FAQ](docs/FAQ.md) - Frequently asked questions

## License

MIT
