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
| rules/ | AI rules for safety, git, language-specific | Medium |

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
│  AI Rules (法律 - 强制约束):                           │
│  ☑ rules/common/safety.md (安全红线)            │
│  ☑ rules/common/git-workflow.md (提交规范)              │
│  ☑ rules/{{LANGUAGE}}/development.md (语言规范)      │
│                                                  │
│  [Select All] [Minimum Recommended]                │
└─────────────────────────────────────────────────────────┘
```

**Rules Explanation:**
- `rules/common/safety.md` - 🚫 安全红线（不能删除数据、不能暴露密钥等）
- `rules/common/git-workflow.md` - Git 工作流规范（commit 格式、分支命名等）
- `rules/{{LANGUAGE}}/development.md` - 语言特定的开发规范

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
│    ✓ rules/common/safety.md                        │
│    ✓ rules/common/git-workflow.md                   │
│    ✓ rules/typescript/development.md                │
│                                                  │
│  Files to create: 12                              │
│  Directories to create: 6                          │
│                                                  │
│  [Confirm & Generate] [Go Back]                │
└─────────────────────────────────────────────────────────┘
```

### Generation Flow

After user confirms:

1. Create directory structure
   ```
   docs/
   scripts/
   harness/
   rules/
     common/
     {language}/
   ```
2. Build template context with user selections
3. Generate AGENTS.md using template engine
4. Generate docs/ from templates using template engine
5. Generate scripts/ from templates using template engine
6. Generate rules/ from templates using template engine
7. Generate harness/ directory structure with README files
8. Set executable permissions on scripts
9. Output success message with next steps

**Template Engine Usage Example:**
```bash
# Build context
CONTEXT='{"PROJECT_NAME":"my-app","LANGUAGE":"typescript","FRAMEWORK":"nextjs"}'

# Render AGENTS.md
node plugins/harness-pilot/scripts/template-engine.js \n  plugins/harness-pilot/templates/base/AGENTS.md.template \n  "$CONTEXT" > AGENTS.md
```

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
  ✓ rules/
    ✓ common/safety.md
    ✓ common/git-workflow.md
    ✓ typescript/development.md

Next steps:
  1. Read AGENTS.md to understand the structure
  2. Read rules/ to understand mandatory constraints
  3. Run `npm run lint` to check existing code
  4. Run `npm run validate` to test verification pipeline
  5. Read docs/ARCHITECTURE.md to understand layer rules

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Review rules/ for mandatory constraints
  [ ] Create a test file to verify harness works
```

## Template Engine Integration

Use the template engine to render templates:

```bash
node plugins/harness-pilot/scripts/template-engine.js \n  <template-file> \n  '<json-context>'
```

Build a JSON context with all user selections:

```bash
CONTEXT="{
  "PROJECT_NAME": "$PROJECT_NAME",
  "LANGUAGE": "$LANGUAGE",
  "FRAMEWORK": "$FRAMEWORK",
  "CURRENT_YEAR": "$(date +%Y)",
  "LAYER_0": "$LAYER_0_DIRS",
  "LAYER_1": "$LAYER_1_DIRS",
  "LAYER_2": "$LAYER_2_DIRS",
  "LAYER_3": "$LAYER_3_DIRS",
  "LAYER_4": "$LAYER_4_DIRS"
}"
```

## Template Selection Priority

When generating files, use this priority:

```
frameworks/{framework}/ > languages/{language}/ > base/
```

## Generation Flow

After user confirms:

1. Create directory structure
   ```
   docs/
   scripts/
   harness/
   rules/
     common/
     {language}/
   ```
2. Build template context with user selections
3. Generate AGENTS.md using template engine
4. Generate docs/ from templates using template engine
5. Generate scripts/ from templates using template engine
6. Generate rules/ from templates using template engine
7. Generate harness/ directory structure with README files
8. Set executable permissions on scripts
9. Output success message with next steps
