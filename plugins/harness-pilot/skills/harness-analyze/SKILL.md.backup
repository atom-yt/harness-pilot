---
name: harness-analyze
description: Analyze project structure, audit harness health, and generate a visual health report with scoring without making changes
---

# Harness Analyze (Dryrun Mode)

**Announce at start:** "I'm using harness-analyze to perform a dryrun analysis of this project."

**Context:** Read-only operation. No files will be modified.

## Overview

Performs comprehensive analysis of the project structure and outputs a visual health report covering documentation, architecture constraints, quality rules, and import relationships.

This is a **dryrun** - no files are created or modified. Use this to:

- Assess a new project before applying harness
- Identify gaps in existing harness
- Audit harness health (documentation staleness, lint coverage gaps)
- Get an overall score and actionable recommendations
- Evaluate project readiness for AI Agent collaboration

## When to Activate

- User says "analyze", "harness-analyze", "project-analysis"
- User says "improve", "harness-improve", "harness-health", "harness-audit"
- Periodic health check (recommended: weekly or after major features)
- After a series of agent failures

## Analysis Steps

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

Check for existence of key documentation files under `.harness/docs/`:

```bash
check_file ".harness/docs/ARCHITECTURE.md"
check_file ".harness/docs/DEVELOPMENT.md"
check_file ".harness/docs/PRODUCT_SENSE.md"
```

**Scoring** (0-100 per category):
- ARCHITECTURE.md: 0 (missing) or 100 (exists)
- DEVELOPMENT.md: 0 or 100
- PRODUCT_SENSE.md: 0 or 100

### Step 3: Analyze Architecture Constraints

Check for layer enforcement:

```bash
# Check for layer configuration in ARCHITECTURE.md
grep -r "Layer" .harness/docs/ARCHITECTURE.md 2>/dev/null && LAYER_CONFIG=1 || LAYER_CONFIG=0

# Check for lint-deps scripts
find .harness/scripts -name "lint-deps.*" -type f 2>/dev/null | head -1 && LINT_DEPS=1 || LINT_DEPS=0

# Check for layer mapping in linter
grep "layers" .harness/scripts/lint-deps.* 2>/dev/null && LAYER_MAPPING=1 || LAYER_MAPPING=0
```

**Scoring** (0-100 per category):
- Layer documentation: LAYER_CONFIG * 100
- Layer lint script: LINT_DEPS * 100
- Layer mapping defined: LAYER_MAPPING * 100

### Step 4: Analyze Quality Rules

Check for quality enforcement:

```bash
# Check for lint-quality scripts
find .harness/scripts -name "lint-quality.*" -type f 2>/dev/null | head -1 && LINT_QUALITY=1 || LINT_QUALITY=0

# Check for quality rules configured
grep -E "(no_console|max_lines|strict_mode)" .harness/scripts/lint-quality.* 2>/dev/null && QUALITY_RULES=1 || QUALITY_RULES=0
```

**Scoring** (0-100 per category):
- Quality lint script: LINT_QUALITY * 100
- Quality rules defined: QUALITY_RULES * 100

### Step 5: Analyze Import Relationships

Scan source code for import patterns and detect potential violations:

```javascript
// TypeScript/JavaScript import pattern
import\s+.*\s+from\s+['"]([^'"]+)['"]
```

```python
# Python import pattern
from\s+(\S+)|import\s+(\S+)
```

```go
// Go import pattern
import\s+\(.*
```

**Analysis**:
- Count total import statements
- Group by source module
- Detect circular dependencies
- Identify potential layer violations (based on inferred structure)

### Step 6: Audit Analysis (if harness exists)

When the project already has a harness (`.harness/docs/ARCHITECTURE.md` exists), perform deeper audit checks:

#### Documentation Freshness

Compare file modification times to detect stale documentation:

```bash
# Check if ARCHITECTURE.md is older than source code changes
ARCH_MTIME=$(stat -f %m .harness/docs/ARCHITECTURE.md 2>/dev/null || stat -c %Y .harness/docs/ARCHITECTURE.md 2>/dev/null)
LATEST_SRC=$(find . -name "*.ts" -o -name "*.py" -o -name "*.go" | \
  xargs stat -f %m 2>/dev/null | sort -rn | head -1)

if [ "$LATEST_SRC" -gt "$ARCH_MTIME" ]; then
  echo "STALE: .harness/docs/ARCHITECTURE.md is older than latest source changes"
fi
```

#### Lint Coverage Gaps

Check whether all project directories are covered by lint rules:

```bash
SOURCE_DIRS=$(find . -maxdepth 2 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -name '.*' | sort)

for dir in $SOURCE_DIRS; do
  dir_name=$(basename "$dir")
  if ! grep -q "$dir_name" .harness/docs/ARCHITECTURE.md 2>/dev/null; then
    echo "UNCOVERED: $dir is not in layer mapping"
  fi
done
```

### Step 7: Generate Visual Health Report

Compile scores into a structured visual report:

```
╔══════════════════════════════════════════════════╗
║          Harness Health Report                   ║
║          Project: {name}                         ║
║          Score: {total}/100 ({grade})            ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Category          Score   Status                ║
║  ─────────────────────────────────────────────── ║
║  Documentation      {s1}   {bar1}  {label1}     ║
║  Architecture       {s2}   {bar2}  {label2}     ║
║  Quality Rules      {s3}   {bar3}  {label3}     ║
║  Test Coverage      {s4}   {bar4}  {label4}     ║
║  Validation         {s5}   {bar5}  {label5}     ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Details                                         ║
║  ─────────────────────────────────────────────── ║
║  [v/x] .harness/docs/ARCHITECTURE.md            ║
║  [v/x] .harness/docs/DEVELOPMENT.md             ║
║  [v/x] .harness/docs/PRODUCT_SENSE.md           ║
║  [v/x] .harness/scripts/lint-deps.{ext}         ║
║  [v/x] .harness/scripts/lint-quality.{ext}      ║
║  [v/x] .harness/scripts/validate.{ext}          ║
║                                                  ║
║  Audit (if harness exists):                      ║
║  Documentation freshness: {Fresh/Stale summary}  ║
║  Lint coverage: {count}/{total} dirs covered     ║
║                                                  ║
║  Import Analysis:                                ║
║  Total imports: {count}                          ║
║  Unique modules: {count}                         ║
║  Potential violations: {count}                   ║
║  Circular dependencies: {yes/no}                 ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Recommendations                                 ║
║  1. {actionable recommendation}                  ║
║  2. {actionable recommendation}                  ║
║  3. {actionable recommendation}                  ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Toolchain                                       ║
║  {see Toolchain Recommendation below}            ║
╚══════════════════════════════════════════════════╝
```

**Progress bar generation:**
- Score 0-100 maps to 10-char bar: `██████████` (100), `████████░░` (80), `░░░░░░░░░░` (0)
- Labels: 90-100 "Excellent", 70-89 "Good", 50-69 "Fair", 0-49 "Poor"

**Total Score** = weighted average:
- Documentation: 20%
- Architecture: 25%
- Quality Rules: 20%
- Test Coverage: 20%
- Validation: 15%

## Scoring Rubric

| Score Range | Grade | Interpretation |
|------------|-------|----------------|
| 90-100 | A | Excellent - Harness ready |
| 70-89 | B | Good - Minor gaps |
| 50-69 | C | Fair - Needs work |
| 0-49 | D | Poor - Requires significant effort |

## Toolchain Recommendation

Check conditions and output recommendations:

```bash
# Superpowers check
SP_INSTALLED=false
if [ -d "$HOME/.claude/plugins/superpowers" ] || \
   command -v claude >/dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q "superpowers"; then
  SP_INSTALLED=true
fi
```

**If Superpowers not installed:**
```
  [Recommended] Superpowers — brainstorm + TDD + planning + code-reviewer + git worktree
    Install: claude plugin marketplace add obra/superpowers-marketplace
             claude plugin install superpowers@superpowers-marketplace
    Why: Harness reuses Superpowers' planning, code-review, and TDD capabilities
```

**Always show:**
```
  [Recommended] harness-apply — generate harness + quality loop (Ralph Wiggum Loop)
    Why: Automated review-test-fix cycle for continuous quality enforcement
```

**Recommended workflow:**
```
  analyze → apply → develop → apply (loop) → ship
```

## Before Analysis

Check if project is at valid directory:

```bash
# Verify we're in a git repository
git rev-parse --git-dir > /dev/null 2>&1 || echo "Warning: not in a git repository"

# Verify we have source files
find . -maxdepth 2 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) | head -1
```

## Common Detection Issues

| Issue | Cause | Handling |
|-------|--------|----------|
| "No package.json found" | Non-standard project | Guide user to manual mode |
| "Multiple languages detected" | Polyglot project | Ask user for primary language |
| "Framework unclear" | Ambiguous structure | List detected frameworks, ask for selection |
| "No source files" | Wrong directory | Verify current working directory |

## After Analysis

Always offer follow-up actions:

```
Would you like to:
  1. Run harness-apply to generate/update harness infrastructure
  2. Review specific recommendations in detail

Choose an option or describe what you'd like to do next.
```

Do not automatically proceed to any mode. Wait for user confirmation.
