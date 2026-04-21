---
name: harness-analyze
description: Analyze project structure and generate harness health report without making changes
---

# Harness Analyze (Dryrun Mode)

**Announce at start:** "I'm using harness-analyze to perform a dryrun analysis of this project."

**Context:** Read-only operation. No files will be modified.

## Overview

Performs comprehensive analysis of the project structure and outputs a health report covering documentation, architecture constraints, quality rules, and import relationships.

This is a **dryrun** - no files are created or modified. Use this to:

- Assess a new project before applying harness
- Identify gaps in existing harness
- Get recommendations for improvements
- Evaluate project readiness for AI Agent collaboration

## Analysis Steps

### Step 0: Check Template Availability

Before analyzing, check what templates are available for this project:

```bash
# Detect language
LANGUAGE=$(detect_language)

# Check available templates
AVAILABLE_TEMPLATES=()

# Base templates
if [ -f "plugins/harness-pilot/templates/base/AGENTS.md.template" ]; then
  AVAILABLE_TEMPLATES+=("base:AGENTS.md")
fi

# Language-specific templates
for file in plugins/harness-pilot/templates/$LANGUAGE/*.template; do
  if [ -f "$file" ]; then
    AVAILABLE_TEMPLATES+=("$LANGUAGE:$(basename $file .template)")
  fi
done

# Framework-specific templates
if [ -n "$FRAMEWORK" ]; then
  for file in plugins/harness-pilot/templates/frameworks/$FRAMEWORK/*.template; do
    if [ -f "$file" ]; then
      AVAILABLE_TEMPLATES+=("$FRAMEWORK:$(basename $file .template)")
    fi
  done
fi
```

This information is used to generate recommendations in the report.

### Step 1: Detect Project Metadata

Scan for language and framework indicators:

| Language | Detection Files |
|----------|----------------|
| TypeScript | tsconfig.json, package.json with "typescript" |
| JavaScript | package.json without typescript |
| Python | requirements.txt, pyproject.toml, setup.py, *.py files |
| Go | go.mod, go.sum, *.go files |
| Rust | Cargo.toml, *.rs files |

| Framework | Detection Files |
|---------|----------------|
| Next.js | package.json with "next", app/ directory |
| React | package.json with "react", react dependencies |
| Express.js | package.json with "express", server.js/index.js |
| Django | settings.py, manage.py, apps/ directory |
| FastAPI | fastapi in requirements/pyproject.toml, main.py |
| Flask | Flask in requirements, app.py/wsgi.py |

### Step 2: Analyze Documentation Coverage

Check for existence of key documentation files:

```bash
# Check for AGENTS.md
if [ -f "AGENTS.md" ]; then
  AGENTS_EXISTS=1
else
  AGENTS_EXISTS=0
fi

# Check for docs directory structure
check_file "docs/ARCHITECTURE.md"
check_file "docs/DEVELOPMENT.md"
check_dir "docs/design-docs"
check_dir "docs/exec-plans"
```

**Scoring** (0-100 per category):
- AGENTS.md: 0 (missing) or 100 (exists)
- ARCHITECTURE.md: 0 or 100
- DEVELOPMENT.md: 0 or 100
- design-docs/: 0 (empty) to 100 (has docs)
- exec-plans/: 0 to 100

### Step 3: Analyze Architecture Constraints

Check for layer enforcement:

```bash
# Check for layer configuration
grep -r "Layer" AGENTS.md 2>/dev/null && LAYER_CONFIG=1 || LAYER_CONFIG=0

# Check for lint-deps scripts
find scripts -name "lint-deps.*" -type f 2>/dev/null | head -1 && LINT_DEPS=1 || LINT_DEPS=0

# Check for layer mapping in linter
grep "layers" scripts/lint-deps.* 2>/dev/null && LAYER_MAPPING=1 || LAYER_MAPPING=0
```

**Scoring** (0-100 per category):
- Layer documentation: LAYER_CONFIG * 100
- Layer lint script: LINT_DEPS * 100
- Layer mapping defined: LAYER_MAPPING * 100

### Step 4: Analyze Quality Rules

Check for quality enforcement:

```bash
# Check for lint-quality scripts
find scripts -name "lint-quality.*" -type f 2>/dev/null | head -1 && LINT_QUALITY=1 || LINT_QUALITY=0

# Check for quality rules configured
grep -E "(no_console|max_lines|strict_mode)" scripts/lint-quality.* 2>/dev/null && QUALITY_RULES=1 || QUALITY_RULES=0
```

**Scoring** (0-100 per category):
- Quality lint script: LINT_QUALITY * 100
- Quality rules defined: QUALITY_RULES * 100

### Step 5: Analyze Import Relationships

Scan source code for import patterns and detect potential violations:

```javascript
// Example TypeScript/JavaScript import pattern
import\s+.*\s+from\s+['"]([^'"]+)['"]
```

```python
# Example Python import pattern
from\s+(\S+)|import\s+(\S+)
```

```go
// Example Go import pattern
import\s+\(.*
```

**Analysis**:
- Count total import statements
- Group by source module
- Detect circular dependencies
- Identify potential layer violations (based on inferred structure)

### Step 6: Generate Health Report

Compile scores into a structured report:

```
=== Harness Health Report ===

Total Score: [0-100]

📋 Documentation Coverage: [score]/100
  [✓/✗] AGENTS.md
  [✓/✗] docs/ARCHITECTURE.md
  [✓/✗] docs/DEVELOPMENT.md
  [✓/✗] docs/design-docs/
  [✓/✗] docs/exec-plans/

🏗️ Architecture Constraints: [score]/100
  [✓/✗] Layer documentation
  [✓/✗] Layer lint script
  [✓/✗] Layer mapping configuration

📏 Quality Rules: [score]/100
  [✓/✗] Quality lint script
  [✓/✗] Quality rules defined

🧪 Test Coverage: [score]/100
  [✓/✗] Test framework detected
  [✓/✗] Test files present

🔧 Validation Pipeline: [score]/100
  [✓/✗] validate script
  [✓/✗] verify scripts

📊 Import Analysis:
  Total imports: [count]
  Unique modules: [count]
  Potential violations: [count]
  Circular dependencies: [yes/no]

🎯 Recommendations:
  1. [actionable recommendation]
  2. [actionable recommendation]
  3. [actionable recommendation]

Next Steps:
  - Run harness-guide for interactive build (uses template engine)
  - Run harness-apply for auto-generation (uses template engine)
  - Run harness-generate-rules to create AI rules only

**Available Templates:**
  - Base templates: AGENTS.md, ARCHITECTURE.md, DEVELOPMENT.md
  - $LANGUAGE templates: [list based on detection]
  - $FRAMEWORK templates: [list based on detection]
```

## Scoring Rubric

| Score Range | Grade | Interpretation |
|------------|-------|----------------|
| 90-100 | A | Excellent - Harness ready |
| 70-89 | B | Good - Minor gaps |
| 50-69 | C | Fair - Needs work |
| 0-49 | D | Poor - Requires significant effort |

## Output Format

Always output the health report using the template above. End with next steps:

```bash
Would you like to:
  1. Run harness-guide for interactive build
  2. Run harness-apply for auto-generation
  3. Review specific recommendations

Choose an option or describe what you'd like to do next.
```

## Before Analysis

Check if project is at valid directory:

```bash
# Verify we're in a git repository
git rev-parse --git-dir > /dev/null 2>&1
if [ $? -eq 0 ]; then
  IN_REPO=1
else
  IN_REPO=0
fi

# Verify we have source files
find . -maxdepth 2 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) | head -1
if [ $? -eq 0 ]; then
  HAS_SOURCE=1
else
  HAS_SOURCE=0
fi
```

If not in a git repo or no source files found, inform user.

## Common Detection Issues

| Issue | Cause | Handling |
|-------|--------|----------|
| "No package.json found" | Non-standard project | Guide user to manual mode |
| "Multiple languages detected" | Polyglot project | Ask user for primary language |
| "Framework unclear" | Ambiguous structure | List detected frameworks, ask for selection |
| "No source files" | Wrong directory | Verify current working directory |

## After Analysis

Always offer follow-up actions:

1. **harness-guide** - Build harness with interactive configuration
2. **harness-apply** - Auto-generate with defaults
3. **Specific recommendation** - Address a particular gap

Do not automatically proceed to any mode. Wait for user confirmation.
