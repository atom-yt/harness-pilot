---
name: harness-generate-rules
description: Generate AI rules for the project
---

# Harness Generate Rules

**Announce at start:** "I'm using harness-generate-rules to generate AI rules for safety, git workflow, and language-specific development guidelines."

## Overview

Generates `rules/` directory with AI-enforceable constraints:
- Common safety rules (no destructive operations without confirmation)
- Git workflow rules (commit message format, protected branches)
- Language-specific development rules (TypeScript, Python, Go, etc.)

## Usage

```bash
# Generate all rules
harness-generate-rules

# Generate specific rule category
harness-generate-rules --category safety
harness-generate-rules --category git-workflow
harness-generate-rules --category typescript
```

## Rule Categories

| Category | Files Generated |
|----------|----------------|
| **Common Rules** | rules/common/safety.md, rules/common/git-workflow.md |
| **Git Workflow** | rules/common/git-workflow.md (if version control detected) |
| **Language Rules** | rules/{language}/development.md |

## Detection Logic

### Language Detection

```bash
# Detect primary language
if [ -f "tsconfig.json" ]; then
  LANGUAGE="typescript"
elif [ -f "package.json" ] && grep -q '"type": "module"' package.json; then
  LANGUAGE="javascript"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  LANGUAGE="python"
elif [ -f "go.mod" ]; then
  LANGUAGE="go"
elif [ -f "Cargo.toml" ]; then
  LANGUAGE="rust"
else
  LANGUAGE="unknown"
```

### Framework Detection

```bash
if [ "$LANGUAGE" = "typescript" ]; then
  if grep -q '"next"' package.json; then
    FRAMEWORK="nextjs"
  elif grep -q '"react"' package.json; then
    FRAMEWORK="react"
  fi
elif [ "$LANGUAGE" = "python" ]; then
  if [ -f "settings.py" ]; then
    FRAMEWORK="django"
  elif grep -q "fastapi" requirements.txt pyproject.toml; then
    FRAMEWORK="fastapi"
  fi
elif [ "$LANGUAGE" = "go" ]; then
  if grep -q "gin" go.mod; then
    FRAMEWORK="gin"
  fi
```

## Template Engine Integration

Use the template engine to render rule templates:

```bash
node plugins/harness-pilot/scripts/template-engine.js \n  <template-file> \n  '<json-context>'
```

Build context with project info:

```bash
CONTEXT="{
  "PROJECT_NAME": "$PROJECT_NAME",
  "LANGUAGE": "$LANGUAGE",
  "FRAMEWORK": "$FRAMEWORK",
  "CURRENT_YEAR": "$(date +%Y)"
}"
```

## Generation Steps

### Step 1: Detect Project Info

```bash
PROJECT_NAME=$(basename "$(pwd)")
LANGUAGE=$(detect_language)
FRAMEWORK=$(detect_framework)
```

### Step 2: Create Rules Directory Structure

```bash
mkdir -p rules/common
mkdir -p rules/$LANGUAGE
```

### Step 3: Render and Generate Common Rules

```bash
# Build context
CONTEXT='{"PROJECT_NAME":"'$PROJECT_NAME'","LANGUAGE":"'$LANGUAGE'","FRAMEWORK":"'$FRAMEWORK'","CURRENT_YEAR":"'$(date +%Y)'"}'

# Common rules
for rule in safety git-workflow; do
  TEMPLATE="plugins/harness-pilot/templates/rules/common/$rule.md.template"
  if [ -f "$TEMPLATE" ]; then
    node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > rules/common/$rule.md
    echo "  ✓ rules/common/$rule.md"
  fi
done
```

### Step 4: Render and Generate Language-Specific Rules

```bash
# Language-specific development rules
TEMPLATE="plugins/harness-pilot/templates/rules/$LANGUAGE/development.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > rules/$LANGUAGE/development.md
  echo "  ✓ rules/$LANGUAGE/development.md"
fi
```

### Step 4: Generate Output

Display summary:

```
✓ AI Rules Generated!

Categories:
  ✓ Common Rules (safety, git-workflow)
  ✓ Language-Specific Rules ($LANGUAGE)
  ✓ Framework Rules ($FRAMEWORK)

Files created:
  - rules/common/safety.md
  - rules/common/git-workflow.md
  - rules/$LANGUAGE/development.md

  $ git add rules/
  $ git commit -m "docs: add AI rules for development"

Next steps:
  - Commit these changes
  - Rules will be automatically enforced when AI agents work on this codebase
  - Review rules/rules/README.md for understanding the constraint system
```

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Project name from package.json or directory | my-app |
| `LANGUAGE` | Detected language | typescript |
| `FRAMEWORK` | Detected framework | nextjs |
| `CURRENT_YEAR` | Current year | 2026 |

## Error Handling

| Error | Action |
|-------|--------|
| Template not found for language | Skip language-specific rules, use common only |
| Framework template not found | Skip framework-specific rules |
| Git not detected | Warn: no git workflow rules generated |

## References

- [Harness Pilot Design](../design-harness-creator.md)
- [Everything Claude Code Rules](../everything-claude-code/rules/)
- [Superpowers Rules](../superpowers/rules/)