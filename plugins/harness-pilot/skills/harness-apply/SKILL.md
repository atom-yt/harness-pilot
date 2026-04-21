---
name: harness-apply
description: Auto-generate complete harness infrastructure with default settings
---

# Harness Apply (Auto Mode)

**Announce at start:** "I'm using harness-apply to auto-generate harness infrastructure with default settings."

**Context:** Generates complete harness infrastructure automatically using detected language/framework defaults.

## Overview

One-click generation mode that:

1. Detects project language and framework automatically
2. Uses recommended layer mapping for detected structure
3. Uses default quality rule set
4. Creates all files: AGENTS.md, docs/, scripts/, harness/
5. Validates generated scripts are executable

Best for: Standard-structure projects, quick setup, acceptable defaults.

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

## Auto Detection

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

## Auto Configuration

### Default Layer Mappings

| Framework | Layer Mapping |
|-----------|---------------|
| **Next.js** | 0:types/, 1:utils/, 2:lib/, 3:components/,services/, 4:app/,api/ |
| **React** | 0:types/, 1:utils/, 2:hooks/,contexts/, 3:components/,services/, 4:pages/,app/ |
| **Express.js** | 0:types/, 1:utils/, 2:services/, 3:routes/, 4:server.js |
| **Django** | 0:types/,models.py, 1:utils/,helpers/, 2:services/,managers/, 3:views/,api/, 4:urls.py,admin.py |
| **FastAPI** | 0:types/,models/, 1:utils/, 2:services/,managers/, 3:api/, 4:main.py |
| **Gin** | 0:types/, 1:utils/, 2:services/, 3:handlers/, 4:main.go |

### Default Quality Rules

Always enabled by default:

```javascript
{
  "noConsoleLog": true,
  "maxFileSize": 500,
  "typescriptStrictMode": true,
  "noHardcodedStrings": false
}
```

## Generation Steps

### Step 1: Detect Project Info

```bash
LANGUAGE=$(detect_language)
FRAMEWORK=$(detect_framework "$LANGUAGE")
PROJECT_NAME=$(basename "$(pwd)")

echo "Detected:"
echo "  Language: $LANGUAGE"
echo "  Framework: $FRAMEWORK"
echo "  Project: $PROJECT_NAME"
```

### Step 2: Build Context for Template Engine

Create a JSON context for template rendering:

```bash
CONTEXT="{
  \"PROJECT_NAME\": \"$PROJECT_NAME\",
  \"LANGUAGE\": \"$LANGUAGE\",
  \"FRAMEWORK\": \"$FRAMEWORK\",
  \"CURRENT_YEAR\": \"$(date +%Y)\"
}"
```

### Step 3: Create Directory Structure

```bash
mkdir -p docs docs/design-docs docs/exec-plans
mkdir -p scripts/verify
mkdir -p harness/memory/{episodic,procedural,failures}
mkdir -p harness/tasks
mkdir -p harness/trace/failures
mkdir -p rules/common
mkdir -p rules/$LANGUAGE
```

### Step 4: Render and Generate Files

#### AGENTS.md

```bash
TEMPLATE="plugins/harness-pilot/templates/base/AGENTS.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > AGENTS.md
  echo "  ✓ AGENTS.md"
fi
```

#### docs/ARCHITECTURE.md

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

#### docs/DEVELOPMENT.md

```bash
TEMPLATE="plugins/harness-pilot/templates/base/DEVELOPMENT.md.template"
node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > docs/DEVELOPMENT.md
echo "  ✓ docs/DEVELOPMENT.md"
```

#### Scripts (Language-specific)

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
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > scripts/lint-deps.$EXT
  chmod +x scripts/lint-deps.$EXT
  echo "  ✓ scripts/lint-deps.$EXT"
fi

# lint-quality
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/lint-quality.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > scripts/lint-quality.$EXT
  chmod +x scripts/lint-quality.$EXT
  echo "  ✓ scripts/lint-quality.$EXT"
fi

# validate
TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/validate.$EXT.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > scripts/validate.$EXT
  chmod +x scripts/validate.$EXT
  echo "  ✓ scripts/validate.$EXT"
fi
```

#### Rules

```bash
# Common rules
for rule in safety git-workflow; do
  TEMPLATE="plugins/harness-pilot/templates/rules/common/$rule.md.template"
  if [ -f "$TEMPLATE" ]; then
    node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > rules/common/$rule.md
    echo "  ✓ rules/common/$rule.md"
  fi
done

# Language-specific rules
TEMPLATE="plugins/harness-pilot/templates/rules/$LANGUAGE/development.md.template"
if [ -f "$TEMPLATE" ]; then
  node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > rules/$LANGUAGE/development.md
  echo "  ✓ rules/$LANGUAGE/development.md"
fi
```

### Step 5: Create Empty Harness Directories

The harness/ directory structure is created in Step 3. Add placeholder README files:

```bash
echo "# Harness Memory\n\nThis directory stores agent memories:\n- episodic/ - Event memories\n- procedural/ - Process memories\n- failures/ - Failure analysis\n" > harness/memory/README.md
echo "# Harness Tasks\n\nThis directory stores task state and checkpoints.\n" > harness/tasks/README.md
echo "# Harness Trace\n\nThis directory stores execution traces and failure records.\n" > harness/trace/README.md
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
  ✓ scripts/lint-deps.$EXT (executable)
  ✓ scripts/lint-quality.$EXT (executable)
  ✓ scripts/validate.$EXT (executable)
  ✓ rules/common/safety.md
  ✓ rules/common/git-workflow.md
  ✓ rules/$LANGUAGE/development.md
  ✓ harness/memory/
  ✓ harness/tasks/
  ✓ harness/trace/

Next steps:
  1. Review AGENTS.md to understand the structure
  2. Run \`npm run lint\` or \`make lint\` to check existing code
  3. Run \`npm run validate\` or \`make validate\` to test verification pipeline
  4. Read docs/ARCHITECTURE.md to understand layer rules

Would you like to:
  [ ] Run lint now to see existing issues
  [ ] Open AGENTS.md for review
  [ ] Create a test file to verify harness works
```

## Error Handling

| Error | Action |
|-------|--------|
| Template not found for selected language/framework | Use base template and inform user |
| Node.js not found | Inform user that Node.js is required for template engine |
| File already exists | Ask user to overwrite or skip |
| Permission denied | Inform user and suggest chmod |

## Template Resolution Order

When looking for templates, use this priority:

```
1. frameworks/{framework}/ - Framework-specific templates
2. languages/{language}/ - Language-specific templates
3. base/ - Base templates (fallback)
```

## After Generation

Offer follow-up options:

1. **harness-analyze** - Verify health of generated harness
2. **Begin development** - Start using harness for tasks
3. **harness-guide** - Regenerate with different settings