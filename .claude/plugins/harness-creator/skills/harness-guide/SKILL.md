---
name: harness-guide
description: Interactive guided build mode with step-by-step configuration
---

# Harness Guide (Interactive Mode)

**Announce at start:** "I'm using harness-guide to interactively build harness infrastructure for this project."

## Overview

6-step interactive guided flow that walks the user through building complete harness infrastructure with customization at each step.

## Step 1: Project Detection

**Goal**: Detect and confirm project language, framework, and directory structure.

### Detection Logic

```bash
# Detect language
if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json; then
  LANGUAGE="TypeScript"
elif [ -f "package.json" ]; then
  LANGUAGE="JavaScript"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  LANGUAGE="Python"
elif [ -f "go.mod" ]; then
  LANGUAGE="Go"
elif [ -f "Cargo.toml" ]; then
  LANGUAGE="Rust"
else
  LANGUAGE="Unknown"
fi

# Detect framework
if [ "$LANGUAGE" = "TypeScript" ]; then
  if grep -q '"next"' package.json || [ -d "app/" ]; then
    FRAMEWORK="Next.js"
  elif grep -q '"react"' package.json; then
    FRAMEWORK="React"
  fi
elif [ "$LANGUAGE" = "Python" ]; then
  if [ -f "settings.py" ] || [ -f "manage.py" ]; then
    FRAMEWORK="Django"
  elif grep -q "fastapi" requirements.txt pyproject.toml; then
    FRAMEWORK="FastAPI"
  elif grep -q "flask" requirements.txt; then
    FRAMEWORK="Flask"
  fi
elif [ "$LANGUAGE" = "Go" ]; then
  if grep -q "gin" go.mod; then
    FRAMEWORK="Gin"
  fi
fi

# Detect directory structure
SRC_DIR=$(find . -maxdepth 1 -type d -name "src" -o -name "lib" -o -name "app" | head -1)
TYPES_DIR=$(find . -maxdepth 2 -type d -name "types" -o -name "types" | head -1)
UTILS_DIR=$(find . -maxdepth 2 -type d -name "utils" -o -name "util" | head -1)
```

### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Project Detection                                  │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Language: [TypeScript/JavaScript/Python/Go/Rust] │
│  Framework: [Next.js/React/Django/etc.]              │
│  Directory: [src/lib/app]                           │
│  Source dirs: [types/, utils/, components/, etc.]  │
│                                                  │
│  Is this correct?                                    │
│  [Yes] [No - Edit manually]                        │
└─────────────────────────────────────────────────────────┘
```

If user confirms, proceed to Step 2. If user says no, ask for correct values.

## Step 2: Component Selection

**Goal**: Select which harness components to create.

### Available Components

| Component | Description | Size |
|-----------|-------------|------|
| AGENTS.md | Navigation map (~100 lines) | Small |
| docs/ARCHITECTURE.md | Architecture, layers, rules | Medium |
| docs/DEVELOPMENT.md | Build/test/lint commands | Small |
| scripts/lint-deps | Layer dependency checker | Medium |
| scripts/lint-quality | Code quality rules | Medium |
| scripts/validate | Unified validation pipeline | Medium |
| scripts/verify/ | E2E verification scripts | Large |
| harness/memory/ | Three types of memory | Medium |
| harness/tasks/ | Task state and checkpoints | Small |
| harness/trace/ | Failure records | Small |

### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Select Harness Components                           │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Core Components:                                  │
│  ☑ AGENTS.md (navigation map)                   │
│  ☑ docs/ARCHITECTURE.md (architecture rules)      │
│  ☑ docs/DEVELOPMENT.md (dev commands)            │
│                                                  │
│  Validation Scripts:                                 │
│  ☑ scripts/lint-deps (layer checking)              │
│  ☑ scripts/lint-quality (code quality)              │
│  ☑ scripts/validate (unified pipeline)             │
│  ☐ scripts/verify/ (E2E tests)                  │
│                                                  │
│  Harness Storage:                                   │
│  ☑ harness/memory/ (experience storage)              │
│  ☑ harness/tasks/ (task state)                    │
│  ☑ harness/trace/ (failure records)                │
│                                                  │
│  [Select All] [Minimum Recommended]                │
└─────────────────────────────────────────────────────────┘
```

Save user selection for Step 6 generation.

## Step 3: Layer Mapping

**Goal**: Configure dependency layer rules.

### Default Layer Mapping by Framework

**Next.js (TypeScript)**:
```
Layer 0: types/             → No internal dependencies
Layer 1: utils/             → Tools, depends on Layer 0
Layer 2: lib/               → External library wrappers, depends on Layer 0-1
Layer 3: components/, services/ → Business logic, depends on Layer 0-2
Layer 4: app/, api/        → Interface layer, depends on Layer 0-3
```

**React**:
```
Layer 0: types/
Layer 1: utils/
Layer 2: hooks/, contexts/
Layer 3: components/, services/
Layer 4: pages/, app/
```

**Django (Python)**:
```
Layer 0: models.py, types/
Layer 1: utils/, helpers/
Layer 2: services/, managers/
Layer 3: views/, api/
Layer 4: urls.py, admin.py
```

### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Layer Mapping Configuration                       │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Detected directories:                             │
│    [types/], [utils/], [lib/], [components/]  │
│                                                  │
│  Recommended Layer Mapping:                          │
│  Layer 0: [types/] (no internal deps)            │
│  Layer 1: [utils/] (depends on Layer 0)          │
│  Layer 2: [lib/] (depends on Layer 0-1)           │
│  Layer 3: [components/, services/] (Layer 0-2)     │
│  Layer 4: [app/, api/] (Layer 0-3)              │
│                                                  │
│  Rule: Higher layers can import lower layers.           │
│        Lower layers CANNOT import higher layers.         │
│                                                  │
│  [Use This Mapping] [Customize]               │
└─────────────────────────────────────────────────────────┘
```

If user selects Customize, ask for manual layer configuration.

## Step 4: Quality Rules

**Goal**: Select code quality rules to enforce.

### Available Rules

| Rule | Description | Default |
|------|-------------|---------|
| no_console_log | Prohibit console.log / print(), require structured logging | ☑ |
| max_file_size | Single file not to exceed 500 lines | ☑ |
| no_hardcoded_strings | No hardcoded brand or config strings | ☐ |
| typescript_strict_mode | Force TypeScript strict mode | ☑ |

### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Quality Rules Selection                           │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Select rules to enforce:                          │
│  ☑ No console.log / print() (use logger)          │
│  ☑ Max 500 lines per file                         │
│  ☑ TypeScript strict mode                           │
│  ☐ No hardcoded strings                           │
│                                                  │
│  [All Recommended] [Customize]                   │
└─────────────────────────────────────────────────────────┘
```

## Step 5: Validation Pipeline

**Goal**: Configure build/lint/test/verify commands.

### Default Commands by Language

**TypeScript/JavaScript**:
```json
{
  "build": "npm run build",
  "test": "npm test",
  "lint": "npm run lint",
  "lint_arch": "ts-node scripts/lint-deps.ts",
  "validate": "ts-node scripts/validate.ts"
}
```

**Python**:
```json
{
  "build": "pip install -e .",
  "test": "pytest",
  "lint": "ruff check .",
  "lint_arch": "python scripts/lint-deps.py",
  "validate": "python scripts/validate.py"
}
```

**Go**:
```json
{
  "build": "go build ./...",
  "test": "go test ./...",
  "lint": "golangci-lint run",
  "lint_arch": "go run scripts/lint-deps.go",
  "validate": "go run scripts/validate.go"
}
```

### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Validation Pipeline Configuration                  │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Detected commands:                                │
│    Build: [npm run build]                       │
│    Test:  [npm test]                             │
│    Lint:   [npm run lint]                           │
│                                                  │
│  Harness validation:                              │
│    lint_arch: [ts-node scripts/lint-deps.ts]     │
│    validate:  [ts-node scripts/validate.ts]        │
│                                                  │
│  Validation order:                                │
│    build → lint_arch → test → validate            │
│                                                  │
│  [Use These Commands] [Customize]              │
└─────────────────────────────────────────────────────────┘
```

## Step 6: Confirm & Generate

**Goal**: Preview all selected components and confirm before generation.

### Preview Template

```
┌─────────────────────────────────────────────────────────┐
│  Harness Generation Preview                        │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Project: [Project Name]                           │
│  Language: [TypeScript]                           │
│  Framework: [Next.js]                              │
│                                                  │
│  Components to Create:                              │
│    ✓ AGENTS.md                                    │
│    ✓ docs/ARCHITECTURE.md                          │
│    ✓ docs/DEVELOPMENT.md                           │
│    ✓ scripts/lint-deps.ts                         │
│    ✓ scripts/lint-quality.ts                        │
│    ✓ scripts/validate.ts                           │
│    ✓ harness/memory/                                │
│    ✓ harness/tasks/                                 │
│    ✓ harness/trace/                                │
│                                                  │
│  Files to create: 9                               │
│  Directories to create: 3                          │
│                                                  │
│  [Confirm & Generate] [Go Back]                │
└─────────────────────────────────────────────────────────┘
```

### Generation Flow

After user confirms:

1. Create directory structure
2. Generate AGENTS.md from template
3. Generate docs/ from templates
4. Generate scripts/ from templates
5. Generate harness/ directory structure
6. Set executable permissions on scripts
7. Output success message with next steps

### Success Output

```bash
✓ Harness infrastructure created!

Generated files:
  ✓ AGENTS.md
  ✓ docs/
    ✓ ARCHITECTURE.md
    ✓ DEVELOPMENT.md
  ✓ scripts/
    ✓ lint-deps.ts (executable)
    ✓ lint-quality.ts (executable)
    ✓ validate.ts (executable)
  ✓ harness/
    ✓ memory/
    ✓ tasks/
    ✓ trace/

Next steps:
  1. Read AGENTS.md to understand the structure
  2. Run `npm run lint` to check existing code
  3. Run `npm run validate` to test verification pipeline
  4. Read docs/ARCHITECTURE.md to understand layer rules

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Create a test file to verify harness works
```

## Template Selection Priority

When generating files, use this priority:

```
custom/ > frameworks/{framework}/ > languages/{language}/ > base/
```

## Language-Specific Generation

For each selected file, choose appropriate template extension:

| Language | File Extensions |
|----------|----------------|
| TypeScript | .ts, .tsx |
| JavaScript | .js, .jsx |
| Python | .py |
| Go | .go |
| Rust | .rs |

## Back Button Support

If user selects "Go Back" at any step, return to previous step with previously selected values preserved.

## Error Handling

| Error | Action |
|-------|--------|
| Template not found for selected language/framework | Use base template and inform user |
| File already exists | Ask user to overwrite or skip |
| Permission denied | Inform user and suggest chmod |
| Validation command not found | Ask user to provide correct command |

## After Completion

Offer follow-up actions:

1. **harness-analyze** - Run health check on newly created harness
2. **harness-apply** - Re-generate with different settings
3. **Begin development** - Start using the harness for tasks
