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
| harness-analyze | Assess a new project before applying harness |
| harness-guide | First time setup with customization |
| harness-apply | Standard projects, quick setup |
| harness-generate-rules | Add rules to existing project |

### What files are created?

```
AGENTS.md                    # Navigation map
docs/ARCHITECTURE.md         # Architecture, layers, rules
docs/DEVELOPMENT.md          # Build/test/lint commands
scripts/lint-deps.*          # Layer dependency checker
scripts/lint-quality.*       # Code quality checker
scripts/validate.*           # Validation pipeline
harness/memory/              # Agent memory storage
harness/tasks/               # Task tracking
harness/trace/               # Execution traces
rules/common/safety.md       # AI safety constraints
rules/common/git-workflow.md # Git workflow rules
rules/{language}/development.md # Language guidelines
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

### How does validate work?

The validate script runs a pipeline:
1. Build the project
2. Run architecture lint (lint-deps)
3. Run quality lint (lint-quality)
4. Run tests

## Error Troubleshooting

### "Language not detected"

**Cause:** Project uses non-standard structure.

**Solution:** Use `harness-guide` mode for manual language selection.

### "Template not found"

**Cause:** No template exists for language/framework.

**Solution:** Base template will be used. Consider contributing templates.

### "Scripts not executable"

**Cause:** Permission not set during generation.

**Solution:** Run manually:
```bash
chmod +x scripts/*.ts
chmod +x scripts/*.py
chmod +x scripts/*.go
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

### Can I use Harness Pilot on existing projects?

Yes! Use `harness-analyze` first to assess the project, then `harness-guide` to customize setup for existing code.

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
- Or use `harness-guide` to select additional components

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
- [Design Document](design-harness-creator.md)
- [Harness Report](harness-report.md)
- [Optimization Plan](OPTIMIZATION_PLAN.md)