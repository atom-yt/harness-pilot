# Frequently Asked Questions (FAQ)

## General Questions

### What is Harness Pilot?

Harness Pilot is a Claude Code plugin that transforms any codebase into a harness-compatible form. A "harness" is a set of infrastructure that helps AI Agents work reliably in a codebase.

### Why do I need a harness?

Without a harness, AI Agents often make repeated mistakes when working with codebases:
- They can't see architectural constraints
- They don't know directory conventions
- They violate dependency rules
- Code fails lint/tests, requiring repeated fixes

A harness provides:
- Clear documentation (AGENTS.md, ARCHITECTURE.md)
- Automated validation (lint scripts, validation pipeline)
- Layer enforcement (dependency checking)
- AI rules (safety, git workflow, development guidelines)

### How does this compare to existing solutions?

| Solution | Approach | Limitations |
|----------|----------|-------------|
| System Prompt | Rules in prompt | Too many rules, hard to maintain |
| RAG Retrieval | Retrieve from Wiki | Inaccurate, relies on "compliance" |
| CI/CD Lint | Check after commit | Too late, code already written |
| Harness | Validate before action | Catches issues early, reliable |

## Usage Questions

### How do I install Harness Pilot?

1. Add marketplace: `/plugin marketplace add https://github.com/atom-yt/harness-pilot.git`
2. Install plugin: `/plugin install harness-pilot@harness-pilot`
3. Use via `/harness-pilot:harness-*` commands

### Which mode should I use?

| Mode | When to Use |
|------|-------------|
| harness-analyze | Assess a new project, audit harness health, get recommendations |
| harness-apply | Interactive guided setup (default) or auto-generate with `--auto` |

### What files are created?

```
.harness/
├── docs/
│   ├── ARCHITECTURE.md         # Architecture, layers, rules
│   ├── DEVELOPMENT.md          # Build/test/lint commands
│   └── PRODUCT_SENSE.md         # Business context
├── scripts/
│   ├── lint-deps.*             # Layer dependency checker
│   ├── lint-quality.*          # Code quality checker
│   ├── lint-imports.*          # Import restriction and circular dependency detection
│   ├── lint-semantic.*        # Semantic business logic validation
│   ├── lint-tsc.*             # TypeScript compilation checking
│   └── validate.*              # Validation pipeline
├── rules/
│   ├── common/
│   │   ├── safety.md           # AI safety constraints
│   │   └── git-workflow.md     # Git workflow rules
│   └── {language}/
│       └── development.md      # Language guidelines
├── memory/                      # Agent memory storage
├── trace/                       # Execution traces
├── hooks/                       # Git hooks
└── manifest.json                # Harness state tracking
```

### Can I customize the generated files?

Yes! After generation, you can:
- Edit any file directly
- Modify layer mappings
- Add custom quality rules
- Update validation commands

For repeated customizations, consider creating a `harness.config.json`.

### What if my language/framework isn't supported?

You can:
1. Use base templates (available for all projects)
2. Use guide mode for manual configuration
3. Contribute templates for your language/framework

## Technical Questions

### How does the template engine work?

The template engine is a lightweight JavaScript tool that:
- Replaces variables: `{{VARIABLE}}`
- Renders conditionals: `{{#if VAR}}...{{/if}}`
- Processes loops: `{{#each ITEMS}}...{{/each}}`

Usage:
```bash
node plugins/harness-pilot/scripts/template-engine.js \n  <template-file> \n  '<json-context>'
```

### What are layer dependencies?

Layers enforce a one-way dependency rule:
- **Layer 0** (types): No internal dependencies
- **Layer 1** (utils): Depends on Layer 0
- **Layer 2** (lib/services): Depends on Layers 0-1
- **Layer 3** (components/business): Depends on Layers 0-2
- **Layer 4** (api/app/pages): Depends on Layers 0-3

Higher layers can import lower layers, but lower layers cannot import higher layers.

### How does lint-deps work?

The lint-deps script:
1. Scans all source files
2. Extracts import statements
3. Checks layer of source file and imported module
4. Reports violations if lower layer imports higher layer

### How does lint-quality work?

The lint-quality script enforces:
- No console.log / print() (use logger)
- Max file size (default: 500 lines)
- No debugger statements
- Optional: No hardcoded URLs, no `any` types

### How do the frontend lint scripts work (TypeScript/JavaScript)?

The harness includes enhanced frontend-specific linting:

| Script | Purpose |
|--------|---------|
| `lint-tsc.*` | TypeScript compiler check (tsc --noEmit) |
| `lint-imports.*` | Import restriction rules and circular dependency detection |
| `lint-semantic.*` | Business logic validation (start < end, price > 0) |

**Import Restrictions:**
- No relative parent imports (../) beyond configured depth
- Max depth of ../ imports (configurable)
- Require explicit extensions (optional)
- No barrel file imports (optional)

**Circular Dependency Detection:**
- Builds dependency graph from imports
- Uses DFS to find cycles
- Reports all circular paths
- Prevents initialization order issues

**Boundary Violation Check:**
- Validates layer transitions
- Prevents API → Model direct access
- Enforces service layer for data access
- Detects architecture violations

**Semantic Rules:**
- Business logic validation based on rules + model
- Example: Activity time validation (startTime ≤ endTime)
- Model-generated fix suggestions
- Custom rules via configuration

### How does validate work?

The validate script runs a pipeline:
1. Build the project
2. Run TypeScript compiler check (if TypeScript)
3. Run import restrictions and circular dependency check
4. Run architecture lint (lint-deps)
5. Run quality lint (lint-quality)
6. Run semantic validation (if enabled)
7. Run tests

## Error Troubleshooting

### "Language not detected"

**Cause:** Project uses non-standard structure.

**Solution:** Use `harness-apply` interactive mode for manual language selection.

### "Template not found"

**Cause:** No template exists for language/framework.

**Solution:** Base template will be used. Consider contributing templates.

### "Scripts not executable"

**Cause:** Permission not set during generation.

**Solution:** Run manually:
```bash
chmod +x .harness/scripts/*.ts
chmod +x .harness/scripts/*.py
chmod +x .harness/scripts/*.go
```

### "Validation fails"

**Cause:** Missing build/test commands or actual code issues.

**Solution:**
1. Update `docs/DEVELOPMENT.md` with correct commands
2. Run individual validation steps to identify issues
3. Fix code violations

### "Node.js not found"

**Cause:** Template engine requires Node.js.

**Solution:**
1. Install Node.js: https://nodejs.org/
2. Or manually copy templates without rendering

## Advanced Questions

### What is handoff and how does it work?

Handoff is a cross-session resume mechanism that allows long-running tasks to continue after context limits are reached.

**When does handoff trigger?**
- Context window approaching limit (tokens > 100k)
- Loop iterations exhausted with unresolved issues
- User explicitly requests handoff

**How to resume?**
```bash
# Say naturally
"continue the previous task"

# Or use explicit command
/harness-apply --resume

# Or specify task ID
/harness-apply --resume task_20260424_a1b2c3d4
```

**Artifacts created:**
- `.harness/tasks/{taskId}/` - Task state, checkpoint, next steps
- `.harness/handoffs/{sessionId}/` - Agent state, resume instruction

### How do I clean up handoff artifacts?

Artifacts are automatically cleaned based on age:
- **task artifacts**: 7 days (running), 30 days (completed)
- **handoff artifacts**: 3 days (or immediately after successful resume)

Manual cleanup:
```bash
# Remove all tasks
rm -rf .harness/tasks/*

# Remove all handoffs
rm -rf .harness/handoffs/*

# Remove specific task/handoff
rm -rf .harness/tasks/task_20260424_a1b2c3d4
rm -rf .harness/handoffs/sess_1713945022000
```

### Can I use Harness Pilot on existing projects?

Yes! Use `harness-analyze` first to assess the project, then `harness-apply` to customize setup for existing code.

### Does Harness Pilot work with monorepos?

Yes, but you'll need to run it on each package separately. Consider creating a harness at the root level with per-package documentation.

### Can I integrate Harness Pilot with CI/CD?

Yes! Add validation steps to your CI/CD pipeline:
```yaml
- name: Run harness validation
  run: npm run validate
```

### How do I update my harness?

To update harness rules or templates:
1. Manually edit files
2. Or regenerate with `harness-apply` (will overwrite existing files)

To add new components:
- Manually create files
- Or use `harness-apply` to select additional components

### Can I share harness between projects?

Yes! Copy the harness directory structure and templates between projects. Consider versioning your harness templates in a separate repository.

## Contributing

### How can I help contribute?

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Adding new language support
- Adding new framework support
- Improving templates
- Fixing bugs
- Writing documentation

### Where do I report bugs?

Open an issue on GitHub with:
- Project language/framework
- Expected behavior
- Actual behavior
- Steps to reproduce
- Error messages

## Support

For more information:
- [API Documentation](API.md)
- [Detailed Design](detailed-design.md)
- [Overview Design](overview-design.md)
- [Optimization Plan](OPTIMIZATION_PLAN.md)