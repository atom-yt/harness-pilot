# Contributing to Harness Pilot

Thank you for your interest in contributing to Harness Pilot!

## How to Contribute

We welcome contributions in the following areas:

- Bug fixes
- New language/framework templates
- Feature improvements
- Documentation enhancements
- Test cases

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/harness-pilot.git
   cd harness-pilot
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Project Structure

```
harness-pilot/
├── plugins/
│   └── harness-pilot/
│       ├── plugin.json              # Plugin configuration
│       ├── scripts/
│       │   └── template-engine.js   # Template rendering engine
│       ├── skills/
│       │   ├── harness-analyze/     # Dryrun analysis mode
│       │   ├── harness-apply/       # Interactive & auto-generation mode
│       │   ├── harness-execute/     # Task execution mode
│       │   └── harness-improve/     # Self-improvement mode
│       └── templates/
│           ├── base/                # Base templates
│           ├── languages/           # Language-specific templates
│           ├── frameworks/          # Framework-specific templates
│           └── rules/               # Rule templates
├── test-projects/                      # Test projects for validation
├── docs/                                  # Documentation
│   ├── API.md                          # API documentation
│   ├── CONTRIBUTING.md                 # This file
│   ├── design-harness-creator.md       # Design document
│   ├── FAQ.md                          # FAQ
│   ├── harness-report.md              # Harness report
│   └── OPTIMIZATION_PLAN.md           # Optimization roadmap
├── README.md                              # Project README
```

## Adding a New Language

To add support for a new language:

1. Create language template directory:
   ```
   templates/languages/{language}/
   ```

2. Create lint scripts:
   - `lint-deps.{ext}.template` - Layer dependency checker
   - `lint-quality.{ext}.template` - Code quality checker
   - `validate.{ext}.template` - Validation pipeline

3. Create development rules:
   ```
   templates/rules/{language}/development.md.template
   ```

4. Update `plugin.json`:
   - Add language to `supportedLanguages` array
   - Add templates to `templates.languages` object

5. Test the templates using a test project in `test-projects/`

## Adding a New Framework

To add support for a new framework:

1. Create framework template directory:
   ```
   templates/frameworks/{framework}/
   ```

2. Create architecture template:
   ```
   templates/frameworks/{framework}/ARCHITECTURE.md.template
   ```

3. Define layer mapping in the ARCHITECTURE template

4. Update `plugin.json`:
   - Add framework to `supportedFrameworks` array
   - Add template to `templates.frameworks` object

5. Create a test project in `test-projects/`

## Template Guidelines

### Template Engine Syntax

- Variables: `{{VARIABLE_NAME}}`
- Conditionals: `{{#if VAR}}...{{/if}}`
- Loops: `{{#each ITEMS}}...{{/each}}`

### Best Practices

1. **Use meaningful variable names:**
   ```markdown
   {{PROJECT_NAME}}  # Good
   {{PN}}          # Bad - unclear
   ```

2. **Provide fallback content:**
   ```markdown
   {{#if FRAMEWORK}}
   Framework-specific content
   {{/if}}
   ```

3. **Document layer mappings:**
   ```markdown
   | Layer | Directory | Responsibilities |
   |-------|-----------|----------------|
   | Layer 0 | types/ | Type definitions |
   ```

4. **Include examples:**
   ```markdown
   ✓ Valid: import from lower layer
   ✗ Invalid: import from higher layer
   ```

### Testing Templates

Test templates using the template engine:

```bash
node plugins/harness-pilot/scripts/template-engine.js \n  templates/base/AGENTS.md.template \n  '{"PROJECT_NAME":"test","LANGUAGE":"typescript"}'
```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features
- Use meaningful variable names
- Add JSDoc comments for functions
- Follow existing code style

### Python

- Follow PEP 8 style guide
- Use type hints
- Add docstrings to functions
- Use descriptive variable names

### Go

- Follow Go conventions
- Use meaningful names
- Add godoc comments
- Run `go fmt` before committing

## Git Workflow

1. Commit messages:
   ```
   feat: add Python lint script template
   docs: update API documentation
   fix: resolve template engine bug
   ```

2. Branch naming:
   ```
   feature/add-rust-support
   bugfix/template-engine-fix
   docs/update-readme
   ```

3. Pull Request:
   - Describe changes
   - Reference related issues
   - Include test results
   - Ensure all checks pass

## Testing

### Manual Testing

1. Create a test project
2. Run `harness-analyze` to check detection
3. Run `harness-apply` to generate harness
4. Verify generated files
5. Run validation scripts

### Test Projects

Use existing test projects as reference:
- `test-projects/harness-test-nextjs/`
- `test-projects/harness-test-python/`

## Questions?

- Open an issue for bugs or feature requests
- Join discussions in existing issues
- Check the [API.md](API.md) for reference

## License

By contributing, you agree that your contributions will be licensed under the MIT License.