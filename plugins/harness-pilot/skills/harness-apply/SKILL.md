---
name: harness-apply
description: Generate harness infrastructure with interactive guided mode (default) or auto mode
---

# Harness Apply

**Announce at start:** "I'm using harness-apply to generate harness infrastructure for this project."

## Overview

Unified generation command that creates complete harness infrastructure for any project. Supports two modes:

1. **Interactive mode (default)** — 6-step guided flow with customization at each step
2. **Auto mode (`--auto`)** — One-click generation with detected defaults

Best for: All projects. Use interactive mode for full control, auto mode for quick setup.

## Mode Selection

Determine mode based on user input:

- **Interactive (default)**: User says "harness-apply", "apply", "guide", "harness-guide", "harness-build", "generate-rules", "harness-rules", or any variant without `--auto`
- **Auto**: User explicitly says "harness-apply --auto", "auto mode", "harness-auto", or similar

When unsure, use interactive mode.

## Template Engine Integration

Use the template engine to render templates:

```bash
node plugins/harness-pilot/scripts/template-engine.js \
  <template-file> \
  '<json-context>'
```

Example:
```bash
node plugins/harness-pilot/scripts/template-engine.js \
  plugins/harness-pilot/templates/base/AGENTS.md.template \
  '{"PROJECT_NAME":"my-app","LANGUAGE":"typescript"}'
```

## Shared Detection Logic

Both modes share the same detection functions.

### Language Detection

```bash
detect_language() {
  if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json; then
    echo "typescript"
  elif [ -f "package.json" ]; then
    echo "javascript"
  elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "python"
  elif [ -f "go.mod" ]; then
    echo "go"
  elif [ -f "Cargo.toml" ]; then
    echo "rust"
  else
    echo "unknown"
  fi
}
```

### Framework Detection

```bash
detect_framework() {
  local lang=$1
  case $lang in
    "typescript"|"javascript")
      if grep -q '"next"' package.json || [ -d "app/" ]; then
        echo "nextjs"
      elif grep -q '"react"' package.json; then
        echo "react"
      elif grep -q '"express"' package.json; then
        echo "express"
      else
        echo "none"
      fi
      ;;
    "python")
      if [ -f "settings.py" ] || [ -f "manage.py" ]; then
        echo "django"
      elif grep -q "fastapi" requirements.txt pyproject.toml 2>/dev/null; then
        echo "fastapi"
      elif grep -q "flask" requirements.txt 2>/dev/null; then
        echo "flask"
      else
        echo "none"
      fi
      ;;
    "go")
      if grep -q "gin" go.mod; then
        echo "gin"
      else
        echo "none"
      fi
      ;;
    *)
      echo "none"
      ;;
  esac
}
```

### Directory Structure Detection

```bash
detect_structure() {
  local dirs=""
  for dir in types utils lib components services app api src; do
    if [ -d "$dir" ]; then
      dirs="$dirs $dir/"
    fi
  done
  echo "$dirs"
}
```

## Template Resolution Order

When looking for templates, use this priority:

```
1. frameworks/{framework}/ - Framework-specific templates
2. languages/{language}/ - Language-specific templates
3. base/ - Base templates (fallback)
```

## Default Layer Mappings

| Framework | Layer Mapping |
|-----------|---------------|
| **Next.js** | 0:types/, 1:utils/, 2:lib/, 3:components/,services/, 4:app/,api/ |
| **React** | 0:types/, 1:utils/, 2:hooks/,contexts/, 3:components/,services/, 4:pages/,app/ |
| **Express.js** | 0:types/, 1:utils/, 2:services/, 3:routes/, 4:server.js |
| **Django** | 0:types/,models.py, 1:utils/,helpers/, 2:services/,managers/, 3:views/,api/, 4:urls.py,admin.py |
| **FastAPI** | 0:types/,models/, 1:utils/, 2:services/,managers/, 3:api/, 4:main.py |
| **Gin** | 0:types/, 1:utils/, 2:services/, 3:handlers/, 4:main.go |

## Default Quality Rules

```javascript
{
  "noConsoleLog": true,
  "maxFileSize": 500,
  "typescriptStrictMode": true,
  "noHardcodedStrings": false
}
```

---

## Interactive Mode (Default)

6-step guided flow that walks the user through building complete harness infrastructure with customization at each step.

### Step 1: Project Detection

**Goal**: Detect and confirm project language, framework, and directory structure.

#### Detection Logic

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

#### Output Template

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

### Step 2: Component Selection

**Goal**: Select which harness components to create.

#### Available Components

| Component | Description | Size |
|-----------|-------------|------|
| AGENTS.md | Navigation map (~100 lines) | Small |
| docs/ARCHITECTURE.md | Architecture, layers, rules | Medium |
| docs/DEVELOPMENT.md | Build/test/lint commands | Small |
| .harness/scripts/lint-deps | Layer dependency checker | Medium |
| .harness/scripts/lint-quality | Code quality rules | Medium |
| .harness/scripts/validate | Unified validation pipeline | Medium |
| .harness/scripts/verify/ | E2E verification scripts | Large |
| .harness/scripts/verify-action | Pre-validation for structural operations | Medium |
| .harness/memory/ | Three types of memory | Medium |
| .harness/tasks/ | Task state and checkpoints | Small |
| .harness/trace/ | Failure records | Small |
| .harness/rules/ | AI rules for safety, git, language-specific | Medium |

#### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Select Harness Components                           │
├─────────────────────────────────────────────────────────┤
│                                                  │
│  Core Components:                                  │
│  ☑ AGENTS.md (navigation map)                   │
│  ☑ docs/ARCHITECTURE.md (architecture rules)      │
│  ☑ docs/DEVELOPMENT.md (dev commands)            │
│  ☑ docs/PRODUCT_SENSE.md (business context)      │
│                                                  │
│  Validation Scripts:                                 │
│  ☑ .harness/scripts/lint-deps (layer checking)       │
│  ☑ .harness/scripts/lint-quality (code quality)      │
│  ☑ .harness/scripts/validate (unified pipeline)      │
│  ☑ .harness/scripts/verify-action (pre-validation)   │
│  ☐ .harness/scripts/verify/ (E2E tests)              │
│                                                  │
│  Harness Storage:                                   │
│  ☑ .harness/memory/ (experience storage)             │
│  ☑ .harness/tasks/ (task state)                      │
│  ☑ .harness/trace/ (failure records)                 │
│                                                  │
│  AI Rules:                                           │
│  ☑ .harness/rules/common/safety.md (safety constraints)   │
│  ☑ .harness/rules/common/git-workflow.md (commit standards) │
│  ☑ .harness/rules/{{LANGUAGE}}/development.md (language rules) │
│                                                  │
│  [Select All] [Minimum Recommended]                │
└─────────────────────────────────────────────────────────┘
```

**Rules Explanation:**
- `.harness/rules/common/safety.md` - Safety constraints (no destructive operations, no credential exposure)
- `.harness/rules/common/git-workflow.md` - Git workflow standards (commit format, branch naming)
- `.harness/rules/{{LANGUAGE}}/development.md` - Language-specific development rules

Save user selection for Step 6 generation.

### Step 3: Layer Mapping

**Goal**: Configure dependency layer rules.

#### Default Layer Mapping by Framework

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

#### Output Template

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

### Step 4: Quality Rules

**Goal**: Select code quality rules to enforce.

#### Available Rules

| Rule | Description | Default |
|------|-------------|---------|
| no_console_log | Prohibit console.log / print(), require structured logging | ☑ |
| max_file_size | Single file not to exceed 500 lines | ☑ |
| no_hardcoded_strings | No hardcoded brand or config strings | ☐ |
| typescript_strict_mode | Force TypeScript strict mode | ☑ |

#### Output Template

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

### Step 5: Validation Pipeline

**Goal**: Configure build/lint/test/verify commands.

#### Default Commands by Language

**TypeScript/JavaScript**:
```json
{
  "build": "npm run build",
  "test": "npm test",
  "lint": "npm run lint",
  "lint_arch": "ts-node .harness/scripts/lint-deps.ts",
  "validate": "ts-node .harness/scripts/validate.ts"
}
```

**Python**:
```json
{
  "build": "pip install -e .",
  "test": "pytest",
  "lint": "ruff check .",
  "lint_arch": "python .harness/scripts/lint-deps.py",
  "validate": "python .harness/scripts/validate.py"
}
```

**Go**:
```json
{
  "build": "go build ./...",
  "test": "go test ./...",
  "lint": "golangci-lint run",
  "lint_arch": "go run .harness/scripts/lint-deps.go",
  "validate": "go run .harness/scripts/validate.go"
}
```

#### Output Template

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
│    lint_arch: [ts-node .harness/scripts/lint-deps.ts]     │
│    validate:  [ts-node .harness/scripts/validate.ts]        │
│                                                  │
│  Validation order:                                │
│    build → lint_arch → test → validate            │
│                                                  │
│  [Use These Commands] [Customize]              │
└─────────────────────────────────────────────────────────┘
```

### Step 6: Confirm & Generate

**Goal**: Preview all selected components and confirm before generation.

#### Preview Template

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
│                                                  │
│  Core Documents:                                    │
│    ✓ AGENTS.md                                    │
│    ✓ docs/ARCHITECTURE.md                          │
│    ✓ docs/DEVELOPMENT.md                           │
│    ✓ docs/PRODUCT_SENSE.md                         │
│    ✓ docs/design-docs/ (directory)                 │
│    ✓ docs/exec-plans/ (directory)                  │
│                                                  │
│  Validation Scripts:                                 │
│    ✓ .harness/scripts/lint-deps.[ext]              │
│    ✓ .harness/scripts/lint-quality.[ext]           │
│    ✓ .harness/scripts/validate.[ext]               │
│    ✓ .harness/scripts/verify-action.[ext]          │
│    ✓ .harness/scripts/verify/ (directory)          │
│                                                  │
│  Harness Storage:                                   │
│    ✓ .harness/memory/ (directory)                  │
│    ✓ .harness/tasks/ (directory)                   │
│    ✓ .harness/trace/ (directory)                   │
│                                                  │
│  AI Rules:                                           │
│    ✓ .harness/rules/common/safety.md               │
│    ✓ .harness/rules/common/git-workflow.md         │
│    ✓ .harness/rules/[language]/development.md      │
│                                                  │
│  [Confirm & Generate] [Go Back]                │
└─────────────────────────────────────────────────────────┘
```

After user confirms, execute the shared generation flow (see below).

---

## Auto Mode (--auto)

**Announce at start:** "I'm using harness-apply in auto mode to generate harness infrastructure with default settings."

**Context:** Generates complete harness infrastructure automatically using detected language/framework defaults. No user interaction required.

One-click generation mode that:

1. Detects project language and framework automatically
2. Uses recommended layer mapping for detected structure
3. Uses default quality rule set
4. Creates all files: AGENTS.md, docs/, .harness/scripts/, .harness/rules/, .harness/memory/, .harness/tasks/, .harness/trace/
5. Validates generated scripts are executable

Best for: Standard-structure projects, quick setup, acceptable defaults.

### Auto Mode Steps

#### Step 1: Detect Project Info

```bash
LANGUAGE=$(detect_language)
FRAMEWORK=$(detect_framework "$LANGUAGE")
PROJECT_NAME=$(basename "$(pwd)")

echo "Detected:"
echo "  Language: $LANGUAGE"
echo "  Framework: $FRAMEWORK"
echo "  Project: $PROJECT_NAME"
```

#### Step 2: Build Context for Template Engine

```bash
CONTEXT="{
  \"PROJECT_NAME\": \"$PROJECT_NAME\",
  \"LANGUAGE\": \"$LANGUAGE\",
  \"FRAMEWORK\": \"$FRAMEWORK\",
  \"CURRENT_YEAR\": \"$(date +%Y)\"
}"
```

#### Step 3: Create Directory Structure

```bash
mkdir -p docs docs/design-docs docs/exec-plans
mkdir -p .harness/scripts/verify
mkdir -p .harness/memory/{episodic,procedural,failures}
mkdir -p .harness/tasks
mkdir -p .harness/trace/failures
mkdir -p .harness/rules/common
mkdir -p .harness/rules/$LANGUAGE
```

#### Step 4: Generate All Files

Uses the shared generation flow (see below) with all components selected and default configuration.

---

## Shared Generation Flow

Both modes use the same generation logic after configuration is finalized.

### Render AGENTS.md

```bash
TEMPLATE="plugins/harness-pilot/templates/base/AGENTS.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > AGENTS.md
  echo "  ✓ AGENTS.md"
fi
```

### Render docs/ARCHITECTURE.md

```bash
# Priority: framework > language > base
TEMPLATE=""
if [ "$FRAMEWORK" != "none" ] && [ -f "plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template"
elif [ -f "plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template"
else
  TEMPLATE="plugins/harness-pilot/templates/base/ARCHITECTURE.md.template"
fi

node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > docs/ARCHITECTURE.md
echo "  ✓ docs/ARCHITECTURE.md"
```

### Render docs/DEVELOPMENT.md

```bash
TEMPLATE="plugins/harness-pilot/templates/base/DEVELOPMENT.md.template"
node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > docs/DEVELOPMENT.md
echo "  ✓ docs/DEVELOPMENT.md"
```

### Render docs/PRODUCT_SENSE.md

```bash
TEMPLATE="plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > docs/PRODUCT_SENSE.md
  echo "  ✓ docs/PRODUCT_SENSE.md"
fi
```

### Render Scripts (Language-specific)

```bash
# Determine file extension
case $LANGUAGE in
  "typescript")
    EXT="ts"
    ;;
  "javascript")
    EXT="js"
    ;;
  "python")
    EXT="py"
    ;;
  "go")
    EXT="go"
    ;;
  *)
    EXT="sh"
    ;;
esac

# lint-deps
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/lint-deps.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/scripts/lint-deps.$EXT
  chmod +x .harness/scripts/lint-deps.$EXT
  echo "  ✓ .harness/scripts/lint-deps.$EXT"
fi

# lint-quality
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/lint-quality.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/scripts/lint-quality.$EXT
  chmod +x .harness/scripts/lint-quality.$EXT
  echo "  ✓ .harness/scripts/lint-quality.$EXT"
fi

# validate
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/validate.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/scripts/validate.$EXT
  chmod +x .harness/scripts/validate.$EXT
  echo "  ✓ .harness/scripts/validate.$EXT"
fi

# verify-action (pre-validation)
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/verify-action.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/scripts/verify-action.$EXT
  chmod +x .harness/scripts/verify-action.$EXT
  echo "  ✓ .harness/scripts/verify-action.$EXT"
fi
```

### Render Rules

```bash
# Common rules
for rule in safety git-workflow; do
  TEMPLATE="plugins/harness-pilot/templates/rules/common/$rule.md.template"
  if [ -f "$TEMPLATE" ]; then
    node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/rules/common/$rule.md
    echo "  ✓ .harness/rules/common/$rule.md"
  fi
done

# Language-specific rules
TEMPLATE="plugins/harness-pilot/templates/rules/$LANGUAGE/development.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/rules/$LANGUAGE/development.md
  echo "  ✓ .harness/rules/$LANGUAGE/development.md"
fi
```

### Create Harness Placeholders

```bash
echo "# Harness Memory\n\nThis directory stores agent memories:\n- episodic/ - Event memories\n- procedural/ - Process memories\n- failures/ - Failure analysis\n" > .harness/memory/README.md
echo "# Harness Tasks\n\nThis directory stores task state and checkpoints.\n" > .harness/tasks/README.md
echo "# Harness Trace\n\nThis directory stores execution traces and failure records.\n" > .harness/trace/README.md
```

## Success Output

```bash
✓ Harness infrastructure generated!

Configuration:
  - Language: $LANGUAGE
  - Framework: $FRAMEWORK
  - Template priority: framework > language > base

Files created:
  ✓ AGENTS.md
  ✓ docs/ARCHITECTURE.md
  ✓ docs/DEVELOPMENT.md
  ✓ .harness/scripts/lint-deps.$EXT (executable)
  ✓ .harness/scripts/lint-quality.$EXT (executable)
  ✓ .harness/scripts/validate.$EXT (executable)
  ✓ .harness/rules/common/safety.md
  ✓ .harness/rules/common/git-workflow.md
  ✓ .harness/rules/$LANGUAGE/development.md
  ✓ .harness/memory/
  ✓ .harness/tasks/
  ✓ .harness/trace/

Next steps:
  1. Review AGENTS.md to understand the structure
  2. Review .harness/rules/ to understand mandatory constraints
  3. Run `npm run lint` or `make lint` to check existing code
  4. Run `npm run validate` or `make validate` to test verification pipeline
  5. Read docs/ARCHITECTURE.md to understand layer rules

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Review .harness/rules/ for mandatory constraints
  [ ] Create a test file to verify harness works
```

## Error Handling

| Error | Action |
|-------|--------|
| Template not found for selected language/framework | Use base template and inform user |
| Node.js not found | Inform user that Node.js is required for template engine |
| File already exists | Ask user to overwrite or skip |
| Permission denied | Inform user and suggest chmod |

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Project name from package.json or directory | my-app |
| `LANGUAGE` | Detected language | typescript |
| `FRAMEWORK` | Detected framework | nextjs |
| `CURRENT_YEAR` | Current year | 2026 |

## After Generation

Offer follow-up options:

1. **harness-analyze** - Verify health of generated harness
2. **Begin development** - Start using harness for tasks
3. **Regenerate** - Run harness-apply again with different settings
