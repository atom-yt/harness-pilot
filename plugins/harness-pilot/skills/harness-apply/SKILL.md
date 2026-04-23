---
name: harness-apply
description: Generate and maintain harness infrastructure with reentrant updates and Ralph Wiggum Loop (review-test-fix quality cycle)
---

# Harness Apply

**Announce at start:** "I'm using harness-apply to generate/update harness infrastructure and scaffold code for this project."

## Overview

The single "action" skill for Harness. Handles everything from initial setup to ongoing quality enforcement:

1. **Initial generation** — Detect project, create `.harness/` infrastructure
2. **Code generation** — Generate scaffolding from templates (API, model, service, handler)
3. **Reentrant update** — Detect code changes, incrementally update harness knowledge
4. **Ralph Wiggum Loop** — Automated review-test-fix quality cycle (default behavior when harness exists)

## Mode Selection

Mode is determined automatically:

```
if .harness/manifest.json does NOT exist:
  → Initial Mode (generate full .harness/)
  → Then run first Loop verification

if .harness/manifest.json EXISTS:
  → Check user intent:

  if user says "add-api" | "add-model" | "add-service" | "add-handler":
    → Code Generation Mode (scaffold from templates)

  else:
    → Reentry Mode (scan code changes, incremental update)
    → Then run Ralph Wiggum Loop

if user says --init:
  → Force Initial Mode (regenerate everything, skip Loop)

if user says --auto:
  → Non-interactive mode (use detected defaults, no prompts)
```

**Trigger keywords:** "harness-apply", "apply", "harness-build", "generate-rules", "harness-rules", "harness-loop", "quality loop", "add-api", "add-model", "add-service", "add-handler"

## Superpowers Detection

Before starting, check if Superpowers is installed:

```bash
SP_INSTALLED=false
if [ -d "$HOME/.claude/plugins/superpowers" ] || \
   command -v claude >/dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q "superpowers"; then
  SP_INSTALLED=true
fi
```

If not installed, display recommendation (does not block the flow):

```
┌─────────────────────────────────────────────────────────┐
│  [Recommended] Superpowers not installed                 │
│                                                          │
│  Harness reuses Superpowers capabilities:                │
│  - brainstorm (requirements exploration)                 │
│  - planning (task breakdown)                             │
│  - TDD (test-driven development)                         │
│  - code-reviewer (code review, used by Loop)             │
│  - git worktree (parallel development)                   │
│                                                          │
│  Install:                                                │
│  claude plugin marketplace add obra/superpowers-marketplace│
│  claude plugin install superpowers@superpowers-marketplace │
│                                                          │
│  Without Superpowers, Loop uses built-in code-reviewer.  │
└─────────────────────────────────────────────────────────┘
```

---

## Shared Detection Logic

### Language Detection

```bash
detect_language() {
  if [ -f "tsconfig.json" ] || grep -q '"typescript"' package.json 2>/dev/null; then
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
      if grep -q '"next"' package.json 2>/dev/null || [ -d "app/" ]; then
        echo "nextjs"
      elif grep -q '"react"' package.json 2>/dev/null; then
        echo "react"
      elif grep -q '"express"' package.json 2>/dev/null; then
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
      if grep -q "gin" go.mod 2>/dev/null; then
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
  for dir in types utils lib components services app api src hooks contexts pages handlers routes; do
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

## Initial Mode (First Run)

When `.harness/manifest.json` does not exist, run the full generation flow.

### Interactive Flow (default)

#### Step 1: Project Detection

Detect and confirm project language, framework, and directory structure.

```
┌─────────────────────────────────────────────────────────┐
│  Project Detection                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Language: [TypeScript/JavaScript/Python/Go/Rust]       │
│  Framework: [Next.js/React/Django/etc.]                 │
│  Directory: [src/lib/app]                               │
│  Source dirs: [types/, utils/, components/, etc.]        │
│                                                         │
│  Is this correct?                                       │
│  [Yes] [No - Edit manually]                             │
└─────────────────────────────────────────────────────────┘
```

#### Step 2: Component Selection

Select which harness components to create.

| Component | Description |
|-----------|-------------|
| .harness/docs/ARCHITECTURE.md | Architecture, layers, dependency rules |
| .harness/docs/DEVELOPMENT.md | Build/test/lint commands |
| .harness/docs/PRODUCT_SENSE.md | Business context |
| .harness/scripts/lint-deps | Layer dependency checker |
| .harness/scripts/lint-quality | Code quality rules |
| .harness/scripts/validate | Unified validation pipeline |
| .harness/memory/ | Agent experience storage |
| .harness/trace/ | Failure records |
| .harness/rules/ | AI rules for safety, git, language-specific |

```
┌─────────────────────────────────────────────────────────┐
│  Select Harness Components                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Documentation:                                         │
│  ☑ .harness/docs/ARCHITECTURE.md (architecture rules)   │
│  ☑ .harness/docs/DEVELOPMENT.md (dev commands)          │
│  ☑ .harness/docs/PRODUCT_SENSE.md (business context)    │
│                                                         │
│  Validation Scripts:                                    │
│  ☑ .harness/scripts/lint-deps (layer checking)          │
│  ☑ .harness/scripts/lint-quality (code quality)         │
│  ☑ .harness/scripts/validate (unified pipeline)         │
│                                                         │
│  Storage:                                               │
│  ☑ .harness/memory/ (experience storage)                │
│  ☑ .harness/trace/ (failure records)                    │
│                                                         │
│  AI Rules:                                              │
│  ☑ .harness/rules/common/safety.md                      │
│  ☑ .harness/rules/common/git-workflow.md                │
│  ☑ .harness/rules/{language}/development.md             │
│                                                         │
│  [Select All] [Minimum Recommended]                     │
└─────────────────────────────────────────────────────────┘
```

#### Step 2.5: Capability Selection (Optional)

Select which extended capabilities to enable. These add automated checks and code generation to Ralph Wiggum Loop.

| Capability | Description | Prerequisites |
|------------|-------------|---------------|
| JiT Test Generation | Auto-generate tests for changed code | test framework configured |
| Code Templates | Generate API/model/service/handler scaffolding | template engine available |
| Refactoring Tools | Detect code smells and complexity | lint-deps configured |
| E2E Testing | API & Browser end-to-end validation | Playwright installed |
| Monitoring Integration | Datadog/New Relic/Prometheus/Sentry | external account |
| Security Audit | SAST, dependency scan, config checks | semgrep or similar |
| Log Analysis | Anomaly detection in logs | logging configured |
| Authorization Verification | RBAC checks, sensitive operation audit | auth system configured |

```
┌─────────────────────────────────────────────────────────┐
│  Select Capabilities (Optional)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  High Priority:                                         │
│  ☐ JiT Test Generation (coverage threshold: 80%)         │
│  ☐ Code Templates (add-api, add-model, etc.)          │
│  ☐ Refactoring Tools (complexity, duplication)           │
│  ☐ E2E Testing (API & Browser end-to-end)             │
│                                                         │
│  Medium Priority:                                       │
│  ☐ Monitoring Integration (provider: [datadog])          │
│  ☐ Security Audit (sast_tool: [semgrep])               │
│                                                         │
│  Low Priority:                                          │
│  ☐ Log Analysis (pattern detection)                     │
│  ☐ Authorization Verification (RBAC checks)                │
│                                                         │
│  [Enable All Recommended] [Skip Capabilities]            │
└─────────────────────────────────────────────────────────┘
```

When capabilities are enabled, generate `.harness/capabilities.json`:

```bash
node plugins/harness-pilot/scripts/template-engine.js \n  templates/capabilities/capabilities.json.template \n  '{"TEST_FRAMEWORK":"jest","MONITORING_PROVIDER":"datadog","SAST_TOOL":"semgrep"}' \n  > .harness/capabilities.json
```

#### Step 3: Layer Mapping

Configure dependency layer rules.

```
┌─────────────────────────────────────────────────────────┐
│  Layer Mapping Configuration                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Detected directories:                                  │
│    [types/], [utils/], [lib/], [components/]            │
│                                                         │
│  Recommended Layer Mapping:                             │
│  Layer 0: [types/] (no internal deps)                   │
│  Layer 1: [utils/] (depends on Layer 0)                 │
│  Layer 2: [lib/] (depends on Layer 0-1)                 │
│  Layer 3: [components/, services/] (Layer 0-2)          │
│  Layer 4: [app/, api/] (Layer 0-3)                      │
│                                                         │
│  Rule: Higher layers can import lower layers.           │
│        Lower layers CANNOT import higher layers.        │
│                                                         │
│  [Use This Mapping] [Customize]                         │
└─────────────────────────────────────────────────────────┘
```

#### Step 4: Quality Rules

Select code quality rules to enforce.

```
┌─────────────────────────────────────────────────────────┐
│  Quality Rules Selection                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select rules to enforce:                               │
│  ☑ No console.log / print() (use logger)                │
│  ☑ Max 500 lines per file                               │
│  ☑ TypeScript strict mode                               │
│  ☐ No hardcoded strings                                 │
│                                                         │
│  [All Recommended] [Customize]                          │
└─────────────────────────────────────────────────────────┘
```

#### Step 4.5: Frontend Lint Options (TypeScript/JavaScript)

Configure frontend-specific lint checks.

```
┌─────────────────────────────────────────────────────────┐
│  Frontend Lint Configuration                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TypeScript Compilation:                                │
│  ☑ TypeScript compiler (tsc --noEmit)                  │
│  ☑ oxlint (ultra-fast linter)                          │
│  ☐ ESLint (legacy)                                      │
│                                                         │
│  Dependency Analysis:                                   │
│  ☑ Circular dependency detection                        │
│  ☑ Import restriction rules                             │
│  ☑ Boundary violation check                             │
│                                                         │
│  Semantic Rules:                                        │
│  ☑ Business logic validation                            │
│  ☐ Model constraint checking (e.g., start < end)       │
│                                                         │
│  Custom Semantic Rules:                                 │
│  File: .harness/rules/semantic-rules.json              │
│                                                         │
│  [Enable All] [Select Recommended] [Skip]               │
└─────────────────────────────────────────────────────────┘
```

**Circular Dependency Detection:**
- Builds dependency graph from imports
- Uses DFS to find cycles
- Reports all circular paths
- Prevents initialization order issues

**Import Restrictions:**
- No relative parent imports (../)
- Max depth of ../ imports (configurable)
- Require explicit extensions (optional)
- No barrel file imports (optional)

**Boundary Check:**
- Validates layer transitions
- Prevents API → Model direct access
- Enforces service layer for data access
- Detects architecture violations

**Semantic Rules:**
- Business logic validation
- Model constraints (start < end, price > 0)
- Status transition rules
- Custom rules via configuration

#### Step 5: Validation Pipeline

Configure build/lint/test/verify commands.

Default commands by language:

**TypeScript/JavaScript:**
```json
{
  "build": "npm run build",
  "test": "npm test",
  "lint": "npm run lint",
  "lint_arch": "ts-node .harness/scripts/lint-deps.ts",
  "lint_circular": "ts-node .harness/scripts/lint-circular-deps.ts",
  "lint_imports": "ts-node .harness/scripts/lint-imports.ts",
  "lint_boundary": "ts-node .harness/scripts/lint-boundary.ts",
  "lint_semantic": "ts-node .harness/scripts/lint-semantic.ts",
  "validate": "ts-node .harness/scripts/validate.ts"
}
```

**Python:**
```json
{
  "build": "pip install -e .",
  "test": "pytest",
  "lint": "ruff check .",
  "lint_arch": "python .harness/scripts/lint-deps.py",
  "validate": "python .harness/scripts/validate.py"
}
```

**Go:**
```json
{
  "build": "go build ./...",
  "test": "go test ./...",
  "lint": "golangci-lint run",
  "lint_arch": "go run .harness/scripts/lint-deps.go",
  "validate": "go run .harness/scripts/validate.go"
}
```

```
┌─────────────────────────────────────────────────────────┐
│  Validation Pipeline Configuration                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Detected commands:                                     │
│    Build: [npm run build]                               │
│    Test:  [npm test]                                    │
│    Lint:  [npm run lint]                                │
│                                                         │
│  Harness validation:                                    │
│    lint_arch: [ts-node .harness/scripts/lint-deps.ts]   │
│    validate:  [ts-node .harness/scripts/validate.ts]    │
│                                                         │
│  Validation order:                                      │
│    build → lint_arch → test → validate                  │
│                                                         │
│  [Use These Commands] [Customize]                       │
└─────────────────────────────────────────────────────────┘
```

#### Step 6: Confirm & Generate

Preview all selected components and confirm before generation.

```
┌─────────────────────────────────────────────────────────┐
│  Harness Generation Preview                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Project: [Project Name]                                │
│  Language: [TypeScript]                                  │
│  Framework: [Next.js]                                   │
│                                                         │
│  Files to create:                                       │
│    ✓ .harness/docs/ARCHITECTURE.md                      │
│    ✓ .harness/docs/DEVELOPMENT.md                       │
│    ✓ .harness/docs/PRODUCT_SENSE.md                     │
│    ✓ .harness/scripts/lint-deps.{ext}                   │
│    ✓ .harness/scripts/lint-quality.{ext}                │
│    ✓ .harness/scripts/validate.{ext}                    │
│    ✓ .harness/rules/common/safety.md                    │
│    ✓ .harness/rules/common/git-workflow.md              │
│    ✓ .harness/rules/{language}/development.md           │
│    ✓ .harness/memory/ (directory)                       │
│    ✓ .harness/trace/ (directory)                        │
│    ✓ .harness/hooks/post-commit                         │
│    ✓ .harness/manifest.json                             │
│    ✓ .harness/capabilities.json                          │
│                                                         │
│  Capabilities to enable:                                 │
│    ✓ JiT Test Generation                                 │
│    ✓ Code Templates                                      │
│    ✓ Refactoring Tools                                   │
│    • Monitoring Integration (optional)                      │
│    • Security Audit (optional)                            │
│                                                         │
│  [Confirm & Generate] [Go Back]                         │
└─────────────────────────────────────────────────────────┘
```

### Auto Mode (--auto)

One-click generation mode that:

1. Detects project language and framework automatically
2. Uses recommended layer mapping for detected structure
3. Uses default quality rule set
4. Creates all files with no user interaction
5. Validates generated scripts are executable

---

## Code Generation Mode

When user requests code generation (`add-api`, `add-model`, `add-service`, `add-handler`):

### Available Templates

| Template | Description | Supported Frameworks |
|----------|-------------|---------------------|
| `add-api` | API endpoints/routes | Next.js, FastAPI, Gin, Express, Flask |
| `add-model` | Data models with CRUD | TypeScript, Pydantic |
| `add-service` | Business logic services | TypeScript, Python |
| `add-handler` | Request handlers | Next.js, Django, Gin, Flask |

### Generation Flow

#### Step 1: Parse User Request

```bash
# Extract template type and resource name
/harness-apply add-api User → TYPE=add-api, NAME=User
/harness-apply add-model Product → TYPE=add-model, NAME=Product
/harness-apply add-service AuthService → TYPE=add-service, NAME=AuthService
/harness-apply add-handler create-user → TYPE=add-handler, NAME=create-user
```

#### Step 2: Load Configuration

Read `.harness/manifest.json` and `.harness/capabilities.json`:
- `language` (typescript, python, go)
- `framework` (nextjs, django, gin, etc.)
- `layer_mapping` (for file placement)
- `code_templates.enabled` (if capability enabled)

#### Step 3: Select Template

```
templates/capabilities/code-templates/templates/<TYPE>/<framework>-<lang>.template
```

Priority: framework-specific → language-specific → base template

#### Step 4: Interactive Field Input

```
┌─────────────────────────────────────────────────────────┐
│  Code Generation: <TYPE> <NAME>                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Detected: <LANGUAGE> + <FRAMEWORK>                     │
│  Template: <template-path>                               │
│                                                         │
│  Enter fields (comma-separated, format: name:type):    │
│  [input] name:string, email:string, age:number         │
│                                                         │
│  Add imports? [optional]                                 │
│  [input] import { User } from '../models/user'          │
│                                                         │
│  Output location: <determined-path>                     │
│  (Layer <N>: <directory/>)                              │
│                                                         │
│  [Generate] [Preview] [Cancel]                          │
└─────────────────────────────────────────────────────────┘
```

#### Step 5: Render Template

Generate context:
```json
{
  "TYPE": "add-api",
  "NAME": "User",
  "NAME_PREFIX": "",
  "ROUTE_PATH": "users",
  "DATA_TYPE": "User",
  "PACKAGE": "api",
  "EXPORTS": "import { User } from '../models/user'",
  "FIELDS": "  name: string;\n  email: string;\n  age: number;",
  "CURRENT_YEAR": "2026"
}
```

Render using template engine:
```bash
node plugins/harness-pilot/scripts/template-engine.js <template> '<context>' > <output>
```

#### Step 6: Place File (with verify-action)

```bash
# Determine correct layer location
node .harness/scripts/verify-action.<ext> --layer 4 --file <name>.<ext>
```

#### Step 7: Validate Generated Code

```bash
# Check layer compliance
$LINT_ARCH_COMMAND

# Check code quality
$LINT_QUALITY_COMMAND
```

If validation fails:
- Show violations
- Suggest alternative location (e.g., "Move to layer 3: services/")
- Offer to retry or place manually

#### Step 8: Generate Tests (if capability enabled)

```bash
# Use JiT test generation
.harness/scripts/generate-test.sh <generated-file>
```

### Example Usage

```bash
# Add API endpoint
/harness-apply add-api User
→ generates app/api/users/route.ts (Next.js)
→ generates app/api/users_test.ts (if JiT enabled)

# Add model
/harness-apply add-model Product
→ generates models/product.ts

# Add service
/harness-apply add-service AuthService
→ generates services/auth.service.ts

# Add handler
/harness-apply add-handler create-user
→ generates handlers/create-user.ts
```

---

## Generation Flow (shared by Interactive and Auto)

### Create Directory Structure

```bash
mkdir -p .harness/docs
mkdir -p .harness/scripts
mkdir -p .harness/memory/{episodic,procedural}
mkdir -p .harness/trace/failures
mkdir -p .harness/rules/common
mkdir -p .harness/rules/$LANGUAGE
mkdir -p .harness/hooks
```

### Template Engine Integration

```bash
node plugins/harness-pilot/scripts/template-engine.js \
  <template-file> \
  '<json-context>'
```

### Render Documents

```bash
# ARCHITECTURE.md — priority: framework > language > base
TEMPLATE=""
if [ "$FRAMEWORK" != "none" ] && [ -f "plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template"
elif [ -f "plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template"
else
  TEMPLATE="plugins/harness-pilot/templates/base/ARCHITECTURE.md.template"
fi
node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/docs/ARCHITECTURE.md

# DEVELOPMENT.md
node plugins/harness-pilot/scripts/template-engine.js \
  plugins/harness-pilot/templates/base/DEVELOPMENT.md.template "$CONTEXT" > .harness/docs/DEVELOPMENT.md

# PRODUCT_SENSE.md
node plugins/harness-pilot/scripts/template-engine.js \
  plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template "$CONTEXT" > .harness/docs/PRODUCT_SENSE.md
```

### Render Scripts (Language-specific)

```bash
case $LANGUAGE in
  "typescript") EXT="ts" ;;
  "javascript") EXT="js" ;;
  "python") EXT="py" ;;
  "go") EXT="go" ;;
  *) EXT="sh" ;;
esac

for script in lint-deps lint-quality validate; do
  TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/$script.$EXT.template"
  if [ -f "$TEMPLATE" ]; then
    node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/scripts/$script.$EXT
    chmod +x .harness/scripts/$script.$EXT
    echo "  ✓ .harness/scripts/$script.$EXT"
  fi
done
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

### Create Storage Placeholders

```bash
echo "# Harness Memory\n\nAgent experience storage:\n- episodic/ - Event-specific learnings\n- procedural/ - Standard workflows\n" > .harness/memory/README.md
echo "# Harness Trace\n\nExecution traces and failure records.\n" > .harness/trace/README.md
```

### Generate manifest.json

```bash
cat > .harness/manifest.json << EOF
{
  "version": "1.0",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "language": "$LANGUAGE",
  "framework": "$FRAMEWORK",
  "layer_mapping": $LAYER_MAPPING_JSON,
  "quality_rules": $QUALITY_RULES_JSON,
  "custom_rules": [],
  "capabilities": $CAPABILITIES_JSON,
  "files_generated": [
    ".harness/docs/ARCHITECTURE.md",
    ".harness/docs/DEVELOPMENT.md",
    ".harness/docs/PRODUCT_SENSE.md",
    ".harness/scripts/lint-deps.$EXT",
    ".harness/scripts/lint-quality.$EXT",
    ".harness/scripts/validate.$EXT",
    ".harness/rules/common/safety.md",
    ".harness/rules/common/git-workflow.md",
    ".harness/rules/$LANGUAGE/development.md",
    ".harness/capabilities.json",
    ".harness/e2e/api-tests.json (if e2e enabled)",
    ".harness/e2e/browser-tests.json (if e2e enabled)"
  ]
}
EOF
```

### Generate Hooks

```bash
# Git post-commit hook
cat > .harness/hooks/post-commit << 'HOOK'
#!/bin/bash
# Auto-check harness freshness after commit
echo "[harness] Checking harness freshness..."
touch .harness/.needs-update
HOOK
chmod +x .harness/hooks/post-commit
```

Offer to install git hook:
```
Would you like to install the git post-commit hook?
This will notify you when harness needs updating after commits.
  [Yes - install to .git/hooks/] [No - skip]
```

If yes:
```bash
cp .harness/hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
echo "  ✓ Git post-commit hook installed"
```

---

## Reentry Mode (Incremental Update)

When `.harness/manifest.json` exists, apply runs in reentry mode.

### Step 1: Read Manifest

```bash
MANIFEST=".harness/manifest.json"
PREV_LANGUAGE=$(jq -r '.language' "$MANIFEST")
PREV_FRAMEWORK=$(jq -r '.framework' "$MANIFEST")
PREV_GENERATED=$(jq -r '.generated_at' "$MANIFEST")
PREV_LAYERS=$(jq '.layer_mapping' "$MANIFEST")
CUSTOM_RULES=$(jq '.custom_rules' "$MANIFEST")
```

### Step 2: Scan Current Codebase

```bash
# Detect current state
CUR_LANGUAGE=$(detect_language)
CUR_FRAMEWORK=$(detect_framework "$CUR_LANGUAGE")
CUR_DIRS=$(detect_structure)

# Compare with manifest
if [ "$CUR_LANGUAGE" != "$PREV_LANGUAGE" ]; then
  echo "[harness] Language changed: $PREV_LANGUAGE → $CUR_LANGUAGE"
fi

# Find new source directories not in layer mapping
for dir in $CUR_DIRS; do
  if ! echo "$PREV_LAYERS" | grep -q "$(basename $dir)"; then
    echo "[harness] New directory detected: $dir (not in layer mapping)"
    NEW_DIRS+=("$dir")
  fi
done
```

### Step 3: Incremental Update

```
┌─────────────────────────────────────────────────────────┐
│  Harness Reentry Update                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Last generated: {date}                                 │
│  Changes detected:                                      │
│                                                         │
│  New directories:                                       │
│    + middleware/ → suggest Layer 2                       │
│    + webhooks/  → suggest Layer 4                       │
│                                                         │
│  Updated dependencies:                                  │
│    ~ services/auth.ts now imports from middleware/       │
│                                                         │
│  Documents to regenerate:                               │
│    ~ .harness/docs/ARCHITECTURE.md (new layers)         │
│    ~ .harness/docs/DEVELOPMENT.md (new commands)        │
│                                                         │
│  Protected (custom rules, not overwritten):             │
│    ✓ my-custom-rule                                     │
│                                                         │
│  [Apply Updates] [Review Changes First]                 │
└─────────────────────────────────────────────────────────┘
```

Apply updates:
- Update layer mapping in lint-deps script
- Regenerate `.harness/docs/` based on current code
- Preserve custom_rules from manifest
- Update manifest.json with new snapshot

### Step 4: Proceed to Loop

After reentry update completes, automatically proceed to Ralph Wiggum Loop.

---

## Ralph Wiggum Loop (Quality Cycle)

The core quality enforcement mechanism. Runs automatically after initial generation or reentry update.

### Loop Flow

```
                    ┌──────────────┐
                    │  Orchestrate  │ ← Detect changed files
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Review     │ ← Agent code review
                    │  (lint-deps   │   (dispatch code-reviewer)
                    │  + lint-quality│
                    │  + arch check)│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     Test      │ ← Run validate pipeline
                    │  (build/lint  │   (build → lint → test)
                    │  /test)       │
                    └──────┬───────┘
                           │
                     Pass? │
                    ┌──────▼───────┐
              No ── │   Decision    │ ── Yes → Done (output report)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     Fix       │ ← Auto-fix or suggest fix
                    │  (record to   │   (record to trace/failures/)
                    │   trace/)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Re-Review   │ ← Back to Review (max 3 rounds)
                    └──────────────┘
```

### Orchestrate Phase

Determine scope of review:

```bash
# If in a feature branch, diff against main
CHANGED_FILES=$(git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null)

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files detected. Loop skipped."
  exit 0
fi

echo "Files to review: $(echo "$CHANGED_FILES" | wc -l)"
```

### Review Phase

Agent mutual code review using base checks plus enabled capability checks:

**1. Architecture check — lint-deps:**
```bash
$LINT_ARCH_COMMAND
# Check: layer compliance, dependency direction, module placement
```

**2. Quality check — lint-quality:**
```bash
$LINT_QUALITY_COMMAND
# Check: code quality rules (console.log, file size, strict mode)
```

**3. Agent code review — dispatch code-reviewer:**

Dispatch the `code-reviewer` agent to review changed files. The agent reads:
- `.harness/docs/ARCHITECTURE.md` for layer rules
- `.harness/rules/` for coding standards
- `.harness/capabilities.json` for enabled capabilities
- Changed file diffs for review

**4. JiT Test Analysis** (if `jit_test` capability enabled):
```bash
# Check test coverage and generated test quality
$TEST_COVERAGE_COMMAND || echo "No coverage tool configured"

# Generate missing tests
bash .harness/scripts/generate-test.sh
```

**5. Refactoring Analysis** (if `refactor` capability enabled):
```bash
# Detect code duplication
bash .harness/scripts/detect-duplication.sh

# Detect high complexity
bash .harness/scripts/detect-complexity.sh
```

**6. Security Analysis** (if `security` capability enabled):
```bash
# Run SAST scan
bash .harness/scripts/security-scan.sh .
```

The code-reviewer outputs a structured review:
```markdown
### Code Review
- Architecture compliance: PASS / FAIL
- Quality standards: PASS / FAIL
- Test coverage: {percentage}% (if enabled)
- Code smells: {count} found (if enabled)
- Security issues: {count} found (if enabled)
- Issues found:
  1. [file:line] description
  2. [file:line] description
- Verdict: APPROVE / NEEDS_CHANGES
```

If Superpowers is installed, prefer its code-reviewer protocol (Requesting Code Review skill). Otherwise, use the built-in code-reviewer agent.

### Test Phase

Run the validation pipeline:

```bash
# Execute in order, stop on first failure
$BUILD_COMMAND && echo "Build: PASS" || { echo "Build: FAIL"; FAILED=true; }
$LINT_ARCH_COMMAND && echo "Lint-Arch: PASS" || { echo "Lint-Arch: FAIL"; FAILED=true; }
$LINT_QUALITY_COMMAND && echo "Lint-Quality: PASS" || { echo "Lint-Quality: FAIL"; FAILED=true; }

# Optional: Security scan (if enabled)
{{#if SECURITY_ENABLED}}
$SECURITY_SCAN_COMMAND && echo "Security: PASS" || { echo "Security: FAIL"; FAILED=true; }
{{/if}}

$TEST_COMMAND && echo "Test: PASS" || { echo "Test: FAIL"; FAILED=true; }

# Optional: JiT test generation (if enabled)
{{#if JIT_TEST_ENABLED}}
$JIT_TEST_GENERATE_COMMAND && echo "JiT-Test: PASS" || { echo "JiT-Test: FAIL"; FAILED=true; }
{{/if}}

$VALIDATE_COMMAND && echo "Validate: PASS" || { echo "Validate: FAIL"; FAILED=true; }
```

If project has no test framework, skip test step and only run lint checks.

### Decision Phase

```
if review.approved AND test.passed:
  → Output success report, done
elif iteration < MAX_ITERATIONS (3):
  → Record failures, attempt fix, re-review
else:
  → Output all unresolved issues, suggest manual intervention
```

### Fix Phase

For each failure:

1. **Record to trace:** Create failure record in `.harness/trace/failures/`
```markdown
# Failure: {description}
## Date: {ISO date}
## Type: layer_violation | quality_rule | test_failure | validation_error
## Severity: critical | warning
## Context
- Task: {what was being done}
- File: {file that triggered failure}
- Rule: {which rule violated}
## Error Output
{error message}
## Resolution
{how it was fixed, or "unresolved"}
```

2. **Attempt auto-fix** (if possible):
   - Layer violation → suggest moving import or file
   - Quality rule violation → apply code transformation
   - Test failure → cannot auto-fix, output suggestion

3. **If cannot auto-fix:** Output fix suggestions and break loop (needs human intervention).

### Evolution Insights (post-Loop)

After Loop completes, scan `.harness/trace/failures/` for patterns:

```bash
# Count failures by type
FAILURE_DIR=".harness/trace/failures"
if [ -d "$FAILURE_DIR" ]; then
  FAILURE_COUNT=$(find "$FAILURE_DIR" -type f -name "*.md" | wc -l)
  # Group by same rule violated
  # If same rule appears 3+ times, suggest rule update
fi
```

If patterns found:
```
Evolution Insights:
- "{rule}" violated {N} times across {files}
  → Suggest: update lint-deps rule / add to ARCHITECTURE.md
- "{pattern}" recurring in {task type}
  → Suggest: create procedural memory in .harness/memory/procedural/
```

### Loop Report

```
╔══════════════════════════════════════════════════╗
║          Harness Loop Report                     ║
║          Iterations: {n}/{max}                   ║
║          Result: {PASS/FAIL}                     ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Review Phase                                    ║
║  ─────────────────────────────────────────────── ║
║  Architecture: {PASS/FAIL} ({details})           ║
║  Quality:      {PASS/FAIL} ({details})           ║
║  Code Review:  {APPROVED/NEEDS_CHANGES}          ║
║                                                  ║
║  Test Phase                                      ║
║  ─────────────────────────────────────────────── ║
║  Build:    {PASS/FAIL}                           ║
║  Lint:     {PASS/FAIL}                           ║
║  Test:     {PASS/FAIL} ({passed}/{total})        ║
║  Validate: {PASS/FAIL}                           ║
║                                                  ║
║  Iteration History                               ║
║  ─────────────────────────────────────────────── ║
║  #1: {result} → {details}                        ║
║  #2: {result} → {details}                        ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Evolution Insights                              ║
║  {insights or "No recurring patterns detected"}  ║
╚══════════════════════════════════════════════════╝
```

---

## Success Output (Initial Generation)

```
✓ Harness infrastructure generated!

Configuration:
  - Language: $LANGUAGE
  - Framework: $FRAMEWORK

Files created:
  ✓ .harness/docs/ARCHITECTURE.md
  ✓ .harness/docs/DEVELOPMENT.md
  ✓ .harness/docs/PRODUCT_SENSE.md
  ✓ .harness/scripts/lint-deps.$EXT
  ✓ .harness/scripts/lint-quality.$EXT
  ✓ .harness/scripts/validate.$EXT
  ✓ .harness/rules/common/safety.md
  ✓ .harness/rules/common/git-workflow.md
  ✓ .harness/rules/$LANGUAGE/development.md
  ✓ .harness/memory/
  ✓ .harness/trace/
  ✓ .harness/hooks/post-commit
  ✓ .harness/manifest.json

Harness skills:
  ✅ harness-analyze — health analysis & scoring
  ✅ harness-apply — generate/update + code generation + Ralph Wiggum Loop

Extended capabilities (optional):
  🧪 JiT Test Generation — auto-generate tests for changed code
  🔧 Refactoring Tools — detect code smells and complexity
  🧪 E2E Testing — API & Browser end-to-end validation
  🔒 Security Audit — SAST, dependency scan, config checks
  📊 Monitoring Integration — Datadog/New Relic/Prometheus/Sentry
  📝 Log Analysis — anomaly detection in logs
  🔐 Authorization Verification — RBAC checks, sensitive operation audit

Code generation templates (via harness-apply):
  add-api — Generate API endpoints/routes
  add-model — Generate data models with CRUD
  add-service — Generate business logic services
  add-handler — Generate request handlers

Recommended workflow:
  analyze → apply → develop → apply (loop) → ship
  code-generation → apply (validate) → develop → apply (loop) → ship
```

---

## Success Output (Code Generation)

```
✓ Code generated from template!

Template: add-api
Resource: User
Generated: app/api/users/route.ts

Validation:
  ✓ Layer compliance: PASS
  ✓ Code quality: PASS

Files created:
  ✓ app/api/users/route.ts
  ✓ app/api/users_test.ts (JiT test generation enabled)

Next steps:
  • Implement TODO items in generated code
  • Add business logic to handlers
  • Write additional tests if needed
```

---

## E2E Testing Mode

When `.harness/capabilities.json` has `e2e: { enabled: true }`:

### Run All E2E Tests

```bash
/harness-apply e2e
```

This executes:
1. **API E2E Tests** — Server startup, request/response validation
2. **Browser E2E Tests** — Headless browser, page interaction, link verification

### Run API Tests Only

```bash
/harness-apply e2e:api
```

- Start dev server
- Run API test suite
- Validate responses
- Generate report

### Run Browser Tests Only

```bash
/harness-apply e2e:browser
```

- Start dev server
- Run Playwright tests
- Verify UI flows
- Generate screenshots on failure

### E2E Test Generation

#### Auto-Detect API Routes

```bash
bash .harness/scripts/generate-e2e-api-tests.sh app/api
```

Generates `.harness/e2e/api-tests.json` with:
- Detected API routes
- Default test configuration
- Expected status codes

#### Auto-Detect Pages

```bash
bash .harness/scripts/generate-e2e-browser-tests.sh app
```

Generates `.harness/e2e/browser-tests.json` with:
- Detected page files
- Default navigation tests
- Template assertions

#### Interactive Flow Builder

```bash
bash .harness/scripts/generate-e2e-browser-tests.sh --interactive
```

Guides you through:
1. Define user flow name
2. Set starting URL
3. Record actions (click, fill, wait)
4. Add assertions
5. Generate test configuration

### Test Execution Flow

#### API E2E

```
┌─────────────────────────────────────────────────────────┐
│  API E2E Test Suite                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [1/10] Health Check - GET /health                │
│  🚀 Starting server on port 3000...                    │
│  ✓ Server started                                        │
│  🧪 Test: Health Check                                   │
│     GET http://localhost:3000/health                     │
│     ✓ Status: 200                                         │
│     ✓ Response body matches                                │
│     ✅ Test passed                                       │
│                                                         │
│  [2/10] Create User - POST /api/users           │
│  ...                                                   │
│                                                         │
│  Summary: 10/10 passed (100%)                       │
└─────────────────────────────────────────────────────────┘
```

#### Browser E2E

```
┌─────────────────────────────────────────────────────────┐
│  Browser E2E Test Suite                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [1/5] User Login Flow                             │
│  📍 Navigated to: /login                                │
│  🎬 Executing 5 action(s)...                             │
│     click: [data-testid="email-input"]                    │
│     fill: [data-testid="email-input"] test@example.com        │
│     click: [data-testid="login-button"]                   │
│     wait: [data-testid="dashboard"] 5000ms                 │
│  ✅ Verifying 3 assertion(s)...                           │
│     ✓ URL matches: /dashboard                            │
│     ✓ Element visible: [data-testid="dashboard"]              │
│     ✅ Test passed                                        │
│                                                         │
│  Summary: 5/5 passed (100%)                         │
└─────────────────────────────────────────────────────────┘
```

### Integration with Ralph Wiggum Loop

When E2E testing is enabled, Test Phase includes:

```
# Standard validation
$BUILD_COMMAND
$LINT_ARCH_COMMAND
$LINT_QUALITY_COMMAND
$TEST_COMMAND

# E2E Tests (if enabled)
$E2E_API_COMMAND  # Run API end-to-end tests
$E2E_BROWSER_COMMAND  # Run browser end-to-end tests

# Final validation
$VALIDATE_COMMAND
```

### Failure Handling

On E2E test failure:
- **API:** Show request/response, expected vs actual
- **Browser:** Take screenshot, save video trace
- **Report:** Generate `.harness/e2e/report.md` with:
  - Failed tests
  - Screenshots (for browser tests)
  - Stack traces
  - Suggested fixes

---

If Superpowers not installed, append install recommendation.

---

## Error Handling

| Error | Action |
|-------|--------|
| Template not found for language/framework | Use base template and inform user |
| Node.js not found | Inform user that Node.js is required for template engine |
| File already exists (initial mode) | Ask user to overwrite or skip |
| manifest.json corrupted (reentry mode) | Fall back to initial mode, inform user |
| No changed files (loop mode) | Skip loop, inform user |
| Loop max iterations reached | Output all unresolved issues, suggest manual fix |
| Permission denied | Inform user and suggest chmod |
| No test framework detected | Skip test step in loop, only run lint checks |
| code-reviewer agent unavailable | Run lint-deps + lint-quality only in review phase |

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Project name from package.json or directory | my-app |
| `LANGUAGE` | Detected language | typescript |
| `FRAMEWORK` | Detected framework | nextjs |
| `CURRENT_YEAR` | Current year | 2026 |
