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
│       ├── agents/                    # AI agent definitions
│       │   └── code-reviewer.md       # Code review + architecture validation
│       ├── hooks/                     # Session hooks
│       │   ├── hooks.json
│       │   └── session-start
│       ├── lib/                       # Shared utility modules (Layer 2)
│       │   ├── config.js             # Configuration loading
│       │   ├── constants.js          # Centralized constants
│       │   ├── detect-language.js    # Language/framework detection
│       │   ├── fs-utils.js           # File system operations
│       │   ├── path-utils.js         # Cross-platform paths
│       │   └── README.md             # lib/ documentation
│       ├── scripts/
│       │   └── template-engine.js     # Template rendering engine
│       ├── skills/
│       │   ├── harness-analyze/       # Health analysis & scoring
│       │   │   └── tools/            # Analysis tools
│       │   └── harness-apply/         # Generation + reentrant update + Loop
│       │       └── tools/            # Apply tools (detect, select, generate, loop)
│       ├── templates/
│       │   ├── base/                  # Base templates
│       │   ├── languages/             # Language-specific templates
│       │   │   ├── typescript/
│       │   │   ├── python/
│       │   │   ├── java/
│       │   │   └── go/
│       │   ├── frameworks/            # Framework-specific templates
│       │   │   ├── nextjs/
│       │   │   ├── django/
│       │   │   └── spring/
│       │   └── rules/                 # Rule templates
│       └── tests/
│           └── template-engine.test.js
├── test-projects/                     # Test projects for validation
├── docs/                              # Documentation
│   ├── API.md
│   ├── CONTRIBUTING.md
│   ├── detailed-design.md
│   ├── FAQ.md
│   └── overview-design.md
├── README.md
└── .harness/                          # Harness infrastructure for plugin
    ├── docs/
    ├── scripts/
    └── manifest.json
```

## Adding a New Language

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

4. Update harness-apply SKILL.md to include detection for the new language

5. Test using a test project in `test-projects/`

## Adding a New Framework

1. Create framework template directory:
   ```
   templates/frameworks/{framework}/
   ```

2. Create architecture template:
   ```
   templates/frameworks/{framework}/ARCHITECTURE.md.template
   ```

3. Define layer mapping in the ARCHITECTURE template

4. Update harness-apply SKILL.md detection logic

5. Create a test project in `test-projects/`

## Template Guidelines

### Template Engine Syntax

- Variables: `{{VARIABLE_NAME}}`
- Conditionals: `{{#if VAR}}...{{/if}}`
- Loops: `{{#each ITEMS}}...{{/each}}`

### Best Practices

1. Use meaningful variable names
2. Provide fallback content with conditionals
3. Document layer mappings with tables
4. Include valid/invalid examples

### Testing Templates

```bash
node plugins/harness-pilot/scripts/template-engine.js \
  templates/base/ARCHITECTURE.md.template \
  '{"PROJECT_NAME":"test","LANGUAGE":"typescript"}'
```

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

## Testing

### Manual Testing

1. Create a test project
2. Run `harness-analyze` to check detection
3. Run `harness-apply` to generate harness
4. Verify generated files under `.harness/`
5. Run `harness-apply` again to test reentrant update
6. Verify Ralph Wiggum Loop executes correctly

### Unit Testing

Run the template engine tests:
```bash
node plugins/harness-pilot/tests/template-engine.test.js
```

### Test Projects

Use existing test projects as reference:
- `test-projects/harness-test-nextjs/`

## Contributing to lib/ Modules

The `lib/` directory contains shared utility modules that are imported by skills and scripts. When contributing to lib:

1. **Follow Layer 2 rules**: lib modules can import from each other and external packages, but NOT from skills or agents
2. **Keep modules focused**: Each module has a single responsibility
3. **Add JSDoc comments**: Document all exported functions
4. **Update README.md**: Document new functions in `lib/README.md`

**Module Responsibilities:**

| Module | Responsibility |
|--------|----------------|
| `config.js` | Load JSON configuration files |
| `constants.js` | Store shared constants (paths, thresholds, etc.) |
| `detect-language.js` | Detect project language and framework |
| `fs-utils.js` | File system operations with error handling |
| `path-utils.js` | Cross-platform path handling |

**Import Example:**
```js
// In a skill tool
import { loadConfig } from '../lib/config.js';
import { detectLanguage } from '../lib/detect-language.js';
import { readJSON, writeJSON } from '../lib/fs-utils.js';
import { getManifestPath } from '../lib/constants.js';
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
