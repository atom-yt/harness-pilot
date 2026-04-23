---
name: harness-apply
description: Generate and maintain harness infrastructure with reentrant updates and Ralph Wiggum Loop (review-test-fix quality cycle)
---

# Harness Apply

**Announce at start:** "I'm using harness-apply to generate/update harness infrastructure for this project."

## Overview

The single "action" skill for Harness. Handles everything from initial setup to ongoing quality enforcement:

1. **Initial generation** — Detect project, create `.harness/` infrastructure
2. **Reentrant update** — Detect code changes, incrementally update harness knowledge
3. **Ralph Wiggum Loop** — Automated review-test-fix quality cycle (default behavior when harness exists)

## Mode Selection

Mode is determined automatically:

```
if .harness/manifest.json does NOT exist:
  → Initial Mode (generate full .harness/)
  → Then run first Loop verification

if .harness/manifest.json EXISTS:
  → Reentry Mode (scan code changes, incremental update)
  → Then run Ralph Wiggum Loop

if user says --init:
  → Force Initial Mode (regenerate everything, skip Loop)

if user says --auto:
  → Non-interactive mode (use detected defaults, no prompts)
```

**Trigger keywords:** "harness-apply", "apply", "harness-build", "generate-rules", "harness-rules", "harness-loop", "quality loop"

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
  "files_generated": [
    ".harness/docs/ARCHITECTURE.md",
    ".harness/docs/DEVELOPMENT.md",
    ".harness/docs/PRODUCT_SENSE.md",
    ".harness/scripts/lint-deps.$EXT",
    ".harness/scripts/lint-quality.$EXT",
    ".harness/scripts/validate.$EXT",
    ".harness/rules/common/safety.md",
    ".harness/rules/common/git-workflow.md",
    ".harness/rules/$LANGUAGE/development.md"
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

Agent mutual code review using three checks:

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
- Changed file diffs for review

The code-reviewer outputs a structured review:
```markdown
### Code Review
- Architecture compliance: PASS / FAIL
- Quality standards: PASS / FAIL
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
$LINT_COMMAND && echo "Lint: PASS" || { echo "Lint: FAIL"; FAILED=true; }
$TEST_COMMAND && echo "Test: PASS" || { echo "Test: FAIL"; FAILED=true; }
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
  ✅ harness-apply — generate/update + Ralph Wiggum Loop

Recommended workflow:
  analyze → apply → develop → apply (loop) → ship
```

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
