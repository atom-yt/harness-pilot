---
name: harness-review
description: Multi-perspective review combining architecture compliance (via harness-guardian), product completeness (via PRODUCT_SENSE.md), and quality assessment (via code-reviewer). Produces structured review reports with actionable verdicts.
---

# Harness Review

**Announce at start:** "I'm using harness-review to perform a multi-perspective review."

**Context:** Read-only analysis. Produces a review report but does not modify code.

## Overview

Performs structured review from three complementary perspectives:

1. **Architecture Review** — Layer compliance, dependency direction, module boundaries
2. **Product Review** — Feature completeness, edge cases, user impact
3. **Quality Review** — Test coverage, error handling, performance

Each perspective produces an independent verdict. The final verdict requires all selected perspectives to pass.

This complements (not replaces) other review tools:
- Superpowers' code review focuses on implementation details
- gstack's /review and /plan-eng-review focus on general engineering quality
- harness-review focuses on **harness-specific dimensions** backed by lint-deps data and architecture rules

## When to Activate

- User says "harness-review", "review", "design-review", "arch-review"
- User says "check this feature", "review my changes"
- After implementation is complete and mechanical validation (lint, test) passes
- Before merging a feature branch

## Review Perspectives

### Architecture Review

**Data sources:**
- `docs/ARCHITECTURE.md` — layer rules and dependency constraints
- `.harness/scripts/lint-deps.*` — run layer dependency check on changed files
- `.harness/specs/<feature>/spec.md` — check Architecture Impact section (if exists)
- Dispatch `harness-guardian` agent for structural validation (if available)

**Checks:**
1. **Layer compliance** — Do all new/modified imports respect layer rules?
   ```bash
   # Run lint-deps on changed files
   $LINT_ARCH_COMMAND
   ```
2. **Dependency direction** — Are there any upward dependencies (lower layer importing higher)?
3. **Module boundaries** — Are new files in the correct directories per layer mapping?
4. **Extensibility** — Does this change make future modifications harder?
5. **Cross-layer surface** — How many cross-layer boundaries does this feature touch?

**Output:**
```markdown
### Architecture Review
- Layer compliance: PASS / FAIL
  - [details of any violations]
- Dependency direction: PASS / FAIL
  - [details of any upward imports]
- Module placement: PASS / FAIL
  - [details of misplaced files]
- Extensibility concerns: [list or "none"]
- Cross-layer surface: [count] boundaries touched

Verdict: APPROVE / NEEDS_CHANGES
```

### Product Review

**Data sources:**
- `docs/PRODUCT_SENSE.md` — business context and user personas (if exists)
- `.harness/specs/<feature>/spec.md` — Objective and Verification Criteria (if exists)
- `.harness/rules/common/roles.md` — Product Perspective checklist (if exists)

**Checks:**
1. **Objective alignment** — Does the implementation match the spec's Objective?
2. **Feature completeness** — Are all Affected Files from the spec addressed?
3. **Edge cases** — What happens with empty input, missing data, concurrent access?
4. **User impact** — Does this change affect existing user workflows?
5. **Verification criteria** — Are all spec Verification Criteria met?

**Output:**
```markdown
### Product Review
- Objective alignment: PASS / FAIL / N/A (no spec)
  - [assessment]
- Feature completeness: [checklist with status]
- Edge cases identified:
  - [edge case 1]: handled / not handled
  - [edge case 2]: handled / not handled
- User impact: [assessment]
- Verification criteria: [N/M] met

Verdict: APPROVE / NEEDS_CHANGES
```

### Quality Review

**Data sources:**
- Dispatch `code-reviewer` agent for detailed code review (if available)
- `.harness/rules/common/roles.md` — Quality Perspective and Engineering Perspective checklists (if exists)
- `.harness/scripts/lint-quality.*` — run code quality check

**Checks:**
1. **Test coverage** — Do changed/new files have corresponding tests?
   ```bash
   # Check for test files matching changed files
   for file in $CHANGED_FILES; do
     test_file=$(echo "$file" | sed 's/\.ts$/.test.ts/' | sed 's/\.py$/_test.py/')
     if [ ! -f "$test_file" ]; then
       echo "MISSING TEST: $file"
     fi
   done
   ```
2. **Boundary testing** — Are boundary values tested (empty, null, max, negative)?
3. **Error handling** — Are error paths handled and tested?
4. **Performance** — Any O(n^2) loops, unnecessary allocations, missing caching?
5. **Code quality** — Run lint-quality check
   ```bash
   $LINT_QUALITY_COMMAND
   ```

**Output:**
```markdown
### Quality Review
- Test coverage: [assessment]
  - [list of files missing tests]
- Boundary testing: [assessment]
- Error handling: [assessment]
- Performance concerns: [list or "none"]
- Code quality lint: PASS / FAIL

Verdict: APPROVE / NEEDS_CHANGES
```

## Process

### Step 1: Determine Scope

Identify what to review:
```bash
# If in a feature branch, diff against main
CHANGED_FILES=$(git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1)

# Or user specifies files/feature
```

### Step 2: Select Perspectives

Ask user which perspectives to include (default: all three):

```
┌─────────────────────────────────────────────────────────┐
│  Harness Review                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Reviewing: [N] changed files                           │
│  Feature spec: [found / not found]                      │
│                                                         │
│  Select review perspectives:                            │
│  ☑ Architecture Review (layer compliance, deps)         │
│  ☑ Product Review (completeness, edge cases)            │
│  ☑ Quality Review (tests, error handling)               │
│                                                         │
│  [Review All] [Select]                                  │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Execute Reviews

Run each selected perspective sequentially. For each:
1. Load relevant data sources
2. Run checks
3. Produce perspective-specific output

### Step 4: Compile Final Report

```markdown
## Harness Review Report: <feature or branch>

Date: <ISO date>
Files reviewed: <count>
Spec: <found / not found>

### Architecture Review
[... perspective output ...]

### Product Review
[... perspective output ...]

### Quality Review
[... perspective output ...]

### Summary
- Architecture: APPROVE / NEEDS_CHANGES
- Product: APPROVE / NEEDS_CHANGES
- Quality: APPROVE / NEEDS_CHANGES

### Final Verdict: APPROVE / NEEDS_CHANGES

### Action Items (if NEEDS_CHANGES)
1. [specific action with file and line reference]
2. [specific action]
```

## After Review

```bash
Would you like to:
  1. Address action items
  2. Run review again after fixes
  3. Proceed to merge/ship (if APPROVE)
  4. Get a second opinion (use gstack /review or Superpowers code review)

Choose an option or describe what you'd like to do next.
```
