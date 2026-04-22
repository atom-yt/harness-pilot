---
name: harness-evolve
description: Analyze failure patterns from .harness/trace/failures/, identify root causes, suggest harness rule improvements, and compile recurring successful patterns into deterministic scripts. Implements the Critic→Refiner self-evolution loop.
---

# Harness Evolve

**Announce at start:** "I'm using harness-evolve to analyze failure patterns and improve harness rules."

**Context:** Reads failure records and suggests improvements. Only modifies harness configuration files (not source code) and only after user confirmation.

## Overview

Implements the Critic→Refiner self-evolution loop described in the Harness Pilot design:

```
Agent execution → Validation catches problem → Record in trace/failures/
    → harness-evolve analyzes patterns → Suggests fixes → Updates harness rules
    → Next agent benefits from improved rules
```

Two core capabilities:
1. **Failure pattern analysis** — Find recurring failures, identify root causes, suggest rule improvements
2. **Trajectory compilation** — Detect successful task patterns executed 3+ times, compile into deterministic scripts

## When to Activate

- User says "harness-evolve", "evolve", "learn", "improve harness", "failure analysis"
- User says "what keeps failing", "analyze failures", "harness health"
- Periodically recommended: after major features, weekly, or after a series of agent failures
- When harness-analyze reports a declining health score

## Failure Record Format

harness-evolve expects failure records in `.harness/trace/failures/` as markdown files:

```markdown
# Failure: <short description>

## Date: <ISO date>
## Type: layer_violation | quality_rule | test_failure | validation_error | other
## Severity: critical | warning | info

## Context
- Task: <what was being done>
- File: <file that triggered the failure>
- Rule: <which rule was violated, if applicable>

## Error Output
```
<paste of error message or lint output>
```

## Resolution
- <how it was fixed, or "unresolved">

## Root Cause
- <if known, why this happened>
```

When this skill encounters failure records without this structure, it should still attempt best-effort analysis by scanning for common patterns (file paths, error messages, repeated keywords).

## Process

### Step 1: Collect Failure Data

```bash
# Count failure records
FAILURE_DIR=".harness/trace/failures"
if [ ! -d "$FAILURE_DIR" ] || [ -z "$(ls -A $FAILURE_DIR 2>/dev/null)" ]; then
  echo "No failure records found in $FAILURE_DIR"
  echo "Failures are recorded here during development when validation catches issues."
  echo "Run harness-evolve again after some development cycles."
  exit 0
fi

FAILURE_COUNT=$(find "$FAILURE_DIR" -type f -name "*.md" | wc -l)
echo "Found $FAILURE_COUNT failure records"
```

Read all failure records and extract:
- **Type** distribution (how many of each type)
- **File** frequency (which files appear most often)
- **Rule** frequency (which rules are violated most)
- **Date** range (recent vs historical)

### Step 2: Pattern Recognition

Group failures by similarity:

**Grouping criteria:**
1. Same file path → likely a structural issue with that file/module
2. Same rule violated → likely a gap in layer mapping or quality config
3. Same error message → likely unclear error output
4. Same task type → likely a missing procedural memory

**Pattern template:**
```
Pattern: <descriptive name>
Occurrences: <count>
Files involved: <list>
Rule involved: <if applicable>
Time span: <first occurrence> — <last occurrence>
Trend: increasing / stable / decreasing
```

### Step 3: Root Cause Analysis

For each pattern, determine the root cause:

| Pattern Type | Likely Root Cause | Suggested Fix |
|---|---|---|
| Repeated layer violation on same package | Package not in layer mapping | Add package to ARCHITECTURE.md and lint-deps config |
| Same quality rule violation across files | Rule not documented or unclear | Improve rule description in lint-quality config |
| Failures after specific file operations | Missing pre-validation for that operation type | Add verify-action check for the operation |
| Repeated "how to do X" failures | Missing procedural memory | Create procedural memory from successful executions |
| Unclear error messages causing retries | Error message not actionable | Improve error message to include fix suggestion |

### Step 4: Generate Evolution Report

```
=== Harness Evolution Report ===

Analysis period: <date range>
Total failure records: <count>
Unique patterns identified: <count>

--- Pattern 1: <name> (occurred <N> times) ---
  Root cause: <analysis>
  Affected: <files/rules>
  Suggested fix: <specific action>
  Confidence: high / medium / low
  Auto-fixable: yes / no

  [Apply Fix] [Skip] [Details]

--- Pattern 2: <name> (occurred <N> times) ---
  ...

--- Trajectory Compilation Candidates ---

  "Add API endpoint" — executed successfully 5 times with consistent steps:
    1. Create type file in types/
    2. Create service in services/
    3. Create handler in handlers/
    4. Register route in routes
    5. Create test
  → Can compile to: .harness/scripts/compiled/add-api-endpoint.sh
  [Compile] [Skip]

--- Summary ---
  Patterns found: <count>
  Auto-fixable: <count>
  Requires manual review: <count>
  Compilation candidates: <count>
```

### Step 5: Apply Fixes (User Confirmation Required)

For each approved fix:

**Layer mapping fixes:**
```bash
# Update ARCHITECTURE.md to include missing package
# Update lint-deps config to include missing package in layer mapping
```

**Quality rule fixes:**
```bash
# Update lint-quality config with clearer rule
# Add example to rule documentation
```

**Error message fixes:**
```bash
# Update lint script error messages to include fix suggestions
```

**Procedural memory creation:**
```bash
# Create .harness/memory/procedural/<task-type>.md from successful pattern
```

After applying fixes, verify:
```bash
# Run validate to ensure fixes don't break existing code
$VALIDATE_COMMAND
```

## Trajectory Compilation

When a task pattern is detected 3+ times with consistent steps:

### Detection Logic

```bash
# Scan procedural memory and exec-plans for repeated patterns
# Look for tasks with:
#   - Same type of objective (e.g., "add endpoint", "create component")
#   - Same sequence of file operations
#   - Same verification steps
#   - All completed successfully
```

### Compilation Output

Generate a shell script in `.harness/scripts/compiled/`:

```bash
#!/bin/bash
# Auto-compiled Harness script
# Pattern: <pattern name>
# Compiled from: <N> successful executions
# Compiled on: <ISO date>
#
# Usage: .harness/scripts/compiled/<script-name>.sh <arguments>

set -euo pipefail

ARGUMENT=${1:?Usage: $0 <argument>}

# Step 1: <description>
# <commands>

# Step 2: <description>
# <commands>

# Verify
# <validation commands>

echo "✓ <pattern name> completed for $ARGUMENT"
```

Mark the compiled script as executable:
```bash
chmod +x .harness/scripts/compiled/<script-name>.sh
```

## Integration Points

### With harness-analyze

harness-evolve reads the health report as a baseline. If health score has declined since last evolution run, flag this in the report.

### With harness-spec

When creating new specs, harness-evolve's procedural memories inform the Constraints and Verification Criteria sections.

### With .harness/memory/

harness-evolve writes to:
- `.harness/memory/procedural/` — new standard operating procedures extracted from patterns
- `.harness/memory/episodic/` — specific lessons learned from failure analysis

## After Evolution

```bash
Would you like to:
  1. Apply all high-confidence fixes
  2. Review specific patterns in detail
  3. Compile trajectory candidates
  4. Run harness-analyze to check updated health score

Choose an option or describe what you'd like to do next.
```

Do not automatically apply any fixes. Always wait for user confirmation.
