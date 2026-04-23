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

## Usage Scenarios

### Scenario 1: Analyze Project Health

```bash
/harness-pilot:harness-analyze
```

Get a visual scoring report showing:
- Documentation coverage
- Architecture constraint status
- Quality rule completeness
- Actionable recommendations

### Scenario 2: Generate Harness Infrastructure

```bash
/harness-pilot:harness-apply
```

Interactive guided mode will:
1. Detect project type (TypeScript/Python/Go + Framework)
2. Ask which components to generate
3. Suggest layering rules for your codebase
4. Generate all required files to `.harness/`

### Scenario 3: Validate Code Before Commit

```bash
python3 .harness/scripts/lint-deps.py src/handler/user.ts
```

Pre-commit validation catches:
- Layer violations (high-level imports low-level)
- Circular dependencies
- Architectural rule violations

### Scenario 4: Incremental Updates

```bash
/harness-pilot:harness-apply
```

When your codebase evolves, re-run `harness-apply` to:
- Update layer mappings for new modules
- Refresh ARCHITECTURE.md with latest structure
- Preserve your custom rules (via manifest.json tracking)

### Scenario 5: Auto-Fix Loop

After implementing a feature, Ralph Wiggum Loop automatically:
1. Reviews changes for architecture violations
2. Runs full validation pipeline
3. Auto-fixes issues where possible
4. Records unfixable failures to trace/

## Validation Pipeline Order

```
build → lint-arch → test → verify
  │        │         │       │
  │        │         │       └─ End-to-end functional verification
  │        │         └─ Unit/integration tests
  │        └─ Architecture and quality compliance
  └─ Code compilation
```

## Design Philosophy

### "Teach" vs "Verify"

Most AI coding approaches teach agents through prompts and RAG. Harness lets agents verify their actions before execution:

| Approach | When Checks Happen | Reliability |
|----------|-------------------|-------------|
| System Prompt | After writing code | Low (agent may forget rules) |
| CI/CD Lint | After committing | High feedback cost |
| RAG Retrieval | Before acting | Medium (depends on retrieval accuracy) |
| **Harness** | **Before acting** | **High (automated validation)** |

Like driving: others provide a handbook; Harness installs collision avoidance brakes.

### Key Principles

1. **Repository is the single source of truth**
   - Wiki discussions, Slack agreements, architect's mental models don't exist for agents
   - If it's not in Git, agents can't see it

2. **`.harness/` is a map, not a manual**
   - Structure documents by concern, not a 500-line monolith
   - Load only what's needed for the current task

3. **Only manage architectural boundaries**
   - Harness doesn't dictate design patterns or implementation style
   - It enforces dependency direction: high-level can import low-level, never the reverse

4. **The human role shifts**
   - From "write correct code" to "design an environment where agents can reliably produce correct code"
   - Environment design ROI > prompt engineering ROI

### Repository as Agent OS

Think of your repository as an operating system for AI agents:

```
Without Harness:
  Agent has powerful reasoning but doesn't know:
  - That internal/types/ shouldn't import internal/config/
  - Where new files belong in the directory structure

With Harness:
  The "OS" provides:
  - Architecture constraints (the filesystem map)
  - Validation tools (the permission system)
  - Development workflow (the process scheduler)
```

## What is a Harness?

A Harness is a set of infrastructure that helps AI Agents work reliably in a codebase:

```
my-project/
└── .harness/
    ├── manifest.json          # Harness state for reentrant updates (tracks last apply, layer mappings, custom rules)
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
    ├── trace/                 # Failure records for pattern analysis
    ├── hooks/                 # Git hooks (post-commit validation)
    └── tasks/                 # Task state tracking
```

**Key Features:**

- **Reentrant Updates**: `manifest.json` tracks all state, allowing incremental updates without overwriting custom rules
- **Self-Evolving**: Ralph Wiggum Loop analyzes failure patterns and suggests rule improvements
- **Actionable Validation**: Pre-commit checks catch architectural violations before they become problems
- **Pattern Learning**: Successful execution patterns get compiled into deterministic scripts over time

**Frontend Lint (TypeScript/JavaScript):**

- **TypeScript Compilation**: tsc --noEmit + oxlint (ultra-fast linter)
- **Circular Dependency Detection**: Dependency graph analysis with DFS cycle detection
- **Import Restrictions**: No relative parent imports, depth limits, explicit extensions
- **Boundary Violation Check**: Layer transition validation (API→Model, Page→Model)
- **Semantic Rules**: Business logic validation (start < end, price > 0, status transitions)

**Semantic Layer:**
- Rule + Model联合判定业务语义
- Example: Activity time validation (startTime ≤ endTime)
- Model-generated fix suggestions (修复建议)

## Ralph Wiggum Loop

The core quality enforcement mechanism. Runs automatically when you invoke `harness-apply` on an existing harness:

```
Orchestrate → Review → Test → Fix → Re-Review (max 3 rounds)
```

- **Review**: code-reviewer performs architecture compliance check (fused from harness-guardian capability) + code quality review
- **Test**: Run validation pipeline (build → lint → test → validate)
- **Fix**: Auto-fix where possible, record failures to trace/
- **Evolve**: After loop, analyze recurring failure patterns and suggest rule updates

The code-reviewer agent fuses architecture validation (formerly harness-guardian) with code review capabilities, checking both structural compliance and implementation quality in a single review pass.

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
- [Overview Design](docs/overview-design.md) - Design overview (中文)
- [Detailed Design](docs/detailed-design.md) - Detailed design
- [FAQ](docs/FAQ.md) - Frequently asked questions

## Summary

**Core Idea**: Instead of teaching AI agents how to do things, let them verify their actions are correct before executing.

Rely on code, linters, and tests to ensure correctness—not on LLM "intuition" that can be forgotten or compressed away.

These mechanical checks don't fail, don't forget, and aren't lost to context compression.

**The Competitive Advantage is Trajectory, Not Prompts**

Your Harness compound-returns over time:
- Memory gets richer
- Lint rules become more comprehensive
- More execution patterns get compiled into deterministic scripts

Six months later, your repository becomes a highly-tuned agent operating environment tailored to your team's workflow. New agents (or new sessions) can immediately be productive.

These accumulated patterns and knowledge can't be copied by switching to a different model.

## License

MIT
