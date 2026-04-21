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

## Generation Steps

### Step 1: Create Rules Directory Structure

```bash
mkdir -p rules/
mkdir -p rules/common
mkdir -p rules/$LANGUAGE
```

### Step 2: Copy Templates

```bash
# Common templates always generated
cp .claude/plugins/harness-creator/templates/rules/common/* rules/common/

# Language-specific templates
cp .claude/plugins/harness-creator/templates/rules/$LANGUAGE/* rules/$LANGUAGE/

# Language-specific git workflow if framework detected
if [ -n "$FRAMEWORK" ]; then
  # Copy additional framework-specific rules if available
  if [ -f ".claude/plugins/harness-creator/templates/rules/common/$FRAMEWORK-git-workflow.md.template" ]; then
    cp .claude/plugins/harness-creator/templates/rules/common/$FRAMEWORK-git-workflow.md.template rules/$LANGUAGE/
  fi
```

### Step 3: Copy Documentation References

```bash
# Copy README rules reference
cp ../everything-claude-code/rules/README.md rules/ 2>/dev/null

# Copy relevant rules from superpowers
cp ../superpowers/rules/*.md rules/ 2>/dev/null
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

- [Harness Creator Design](../design-harness-creator.md)
- [Everything Claude Code Rules](../everything-claude-code/rules/)
- [Superpowers Rules](../superpowers/rules/)