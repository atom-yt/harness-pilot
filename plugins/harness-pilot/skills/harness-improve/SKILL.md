---
name: harness-improve
description: Audit harness health and self-improve. Analyzes failure patterns, detects lint coverage gaps, checks documentation staleness, and applies targeted fixes to strengthen the harness.
---

# Harness Improve

**Announce at start:** "I'm using harness-improve to audit and strengthen the harness infrastructure."

## Overview

Harness Improve is the self-evolution engine. It analyzes how the harness is performing, identifies gaps, and applies targeted fixes. The goal is to turn every agent failure into a stronger harness — so the same mistake never happens twice.

**Core loop:** Agent executes → validation catches problem → Critic analyzes pattern → Refiner updates rules → next agent benefits.

## When to Activate

- User says "improve", "harness-improve", "harness-health", "harness-audit"
- Periodic health check (recommended: weekly or after major features)
- After a series of agent failures during harness-execute
- When lint/test issues keep recurring

## Prerequisites

The project must already have a harness (AGENTS.md exists). If not, suggest running harness-apply first.

## Step 1: Run Health Check

Reuse the harness-analyze scoring engine to get current health scores:

```
=== Current Harness Health ===

Documentation Coverage: [score]/100
Architecture Constraints: [score]/100
Quality Rules: [score]/100
Validation Pipeline: [score]/100

Overall Score: [score]/100 (Grade: [A/B/C/D])
```

Compare with previous score if available (stored in `harness/trace/health-history.md`).

```bash
# Save health history
echo "$(date +%Y-%m-%d) | Score: $SCORE | Grade: $GRADE" >> harness/trace/health-history.md
```

## Step 2: Analyze Failure Patterns (Critic)

Scan `harness/trace/failures/` for recorded failures and identify patterns:

```bash
# Count failures by type
if [ -d "harness/trace/failures" ]; then
  failure_files=$(find harness/trace/failures -name "*.md" -type f)
  failure_count=$(echo "$failure_files" | wc -l | tr -d ' ')
fi
```

### Pattern Detection

For each failure record, extract:
- **Error type**: layer violation, quality rule, test failure, build error
- **Affected file/module**: which directory or package
- **Frequency**: how many times this same pattern occurred
- **Root cause category**:
  - Missing directory in layer mapping
  - Ambiguous linter error message
  - Missing documentation for a convention
  - Quality rule too strict or too loose
  - Missing test coverage for a scenario

### Critic Output

```
=== Failure Pattern Analysis ===

Patterns found: [count]

Pattern 1: [type] — [count] occurrences
  Affected: [module/directory]
  Root cause: [description]
  Suggested fix: [actionable suggestion]

Pattern 2: ...

No patterns found (if harness/trace/failures/ is empty or has no recurring issues).
```

## Step 3: Detect Lint Coverage Gaps

Check whether all project directories are covered by lint rules:

```bash
# Find all source directories
SOURCE_DIRS=$(find . -maxdepth 2 -type d \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -name '.*' | sort)

# Check each against layer mapping in ARCHITECTURE.md
for dir in $SOURCE_DIRS; do
  dir_name=$(basename "$dir")
  # Check if dir_name is in the layer mapping
  if ! grep -q "$dir_name" docs/ARCHITECTURE.md 2>/dev/null; then
    echo "UNCOVERED: $dir is not in layer mapping"
  fi
done
```

### Output

```
=== Lint Coverage Analysis ===

Covered directories: [count]/[total]
Uncovered directories:
  - [dir1] — Not in layer mapping (suggested: Layer [N])
  - [dir2] — Not in layer mapping (suggested: Layer [N])

Lint rule gaps:
  - [rule] is configured but never triggered (may be too strict or irrelevant)
  - [directory] has [count] files but no quality rules applied
```

## Step 4: Check Documentation Staleness

Compare file modification times to detect stale documentation:

```bash
# Check if ARCHITECTURE.md is older than source code changes
ARCH_MTIME=$(stat -f %m docs/ARCHITECTURE.md 2>/dev/null || stat -c %Y docs/ARCHITECTURE.md 2>/dev/null)
LATEST_SRC=$(find . -name "*.ts" -o -name "*.py" -o -name "*.go" | \
  xargs stat -f %m 2>/dev/null | sort -rn | head -1)

if [ "$LATEST_SRC" -gt "$ARCH_MTIME" ]; then
  echo "STALE: docs/ARCHITECTURE.md is older than latest source changes"
fi

# Check AGENTS.md
# Check DEVELOPMENT.md
# Check PRODUCT_SENSE.md
```

### Output

```
=== Documentation Freshness ===

  docs/ARCHITECTURE.md  — [Fresh/Stale] (last updated: [date], source changed: [date])
  docs/DEVELOPMENT.md   — [Fresh/Stale]
  docs/PRODUCT_SENSE.md — [Fresh/Stale/Missing]
  AGENTS.md             — [Fresh/Stale]

Stale documents should be reviewed and updated to reflect current code structure.
```

## Step 5: Check Linter Error Message Quality

Review lint scripts to ensure error messages are educational:

### Quality Criteria

A good error message includes:
1. **What** rule was violated (specific, not generic)
2. **Why** it matters (the architectural reason)
3. **How** to fix it (concrete suggestion)

### Check

```bash
# Analyze lint-deps output format
# Look for error messages that are too short or missing fix suggestions
grep -n "message\|Message\|print\|fmt.Print\|console.log" scripts/lint-deps.* | \
  grep -v "Fix:" && echo "WARNING: Some error messages may lack fix suggestions"
```

### Output

```
=== Error Message Quality ===

lint-deps:
  - [count] error messages checked
  - [count] include fix suggestions (✓)
  - [count] missing fix suggestions (needs improvement)

lint-quality:
  - [count] error messages checked
  - [count] include fix suggestions (✓)
  - [count] missing fix suggestions (needs improvement)
```

## Step 6: Generate Improvement Plan

Compile all findings into an actionable improvement plan:

```
=== Harness Improvement Plan ===

Priority 1 (Critical — blocks agent effectiveness):
  [ ] Add [directory] to layer mapping in lint-deps (Pattern: [N] violations)
  [ ] Fix ambiguous error message in lint-deps line [N]

Priority 2 (Important — reduces agent quality):
  [ ] Update stale docs/ARCHITECTURE.md
  [ ] Add missing Layer mapping for [directory]

Priority 3 (Nice to have — improves experience):
  [ ] Add PRODUCT_SENSE.md (currently missing)
  [ ] Enhance error message for [rule] in lint-quality

Estimated health score after fixes: [projected score]

Would you like to:
  [1] Auto-apply all Priority 1 fixes
  [2] Auto-apply all fixes (Priority 1-3)
  [3] Review each fix individually
  [4] Export plan only (no changes)
```

## Step 7: Apply Fixes (Refiner)

When user approves, apply fixes automatically:

### Fix Types

| Fix Type | Action |
|----------|--------|
| Missing layer mapping | Add directory to LAYERS config in lint-deps script |
| Ambiguous error message | Rewrite to include What/Why/How |
| Stale documentation | Re-analyze project structure and update docs |
| Missing PRODUCT_SENSE.md | Generate template from harness-apply |
| Recurring review issue | Encode as new lint rule |

### Apply Flow

```
For each approved fix:
  1. Make the change
  2. Run validation to confirm no regressions
  3. Record the improvement in harness/trace/improvements.md
  4. Update health score
```

### Record Improvements

```bash
cat >> harness/trace/improvements.md << EOF

## $(date +%Y-%m-%d) Improvement Cycle

### Fixes Applied
- [fix 1 description]
- [fix 2 description]

### Health Score Change
- Before: [old score]
- After: [new score]
- Delta: +[improvement]

### Patterns Addressed
- [pattern description] — [fix applied]
EOF
```

## After Improvement

Present summary:

```
✓ Harness improvement complete!

Health Score: [old] → [new] (+[delta])

Fixes Applied:
  ✓ [fix 1]
  ✓ [fix 2]
  ✗ [fix 3] — skipped (user declined)

Next recommended improvement cycle: [date suggestion]

Would you like to:
  [ ] Run harness-analyze to see updated health report
  [ ] Continue with development (harness-execute)
  [ ] Schedule next improvement cycle
```

## Edge Cases

| Scenario | Handling |
|----------|---------|
| No failures recorded | Skip Critic step, focus on coverage gaps and staleness |
| All scores already 90+ | Report "Harness is healthy" with minor suggestions only |
| Conflicting fix suggestions | Present both options, let user decide |
| Fix breaks existing tests | Revert fix, report as "needs manual review" |
| First time running improve | Establish baseline, skip pattern analysis |
