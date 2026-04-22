---
name: harness-spec
description: Create structured feature specifications with verification criteria bound to harness validation pipeline. Manages spec lifecycle (draft → approved → archived) with delta markers for brownfield changes.
---

# Harness Spec

**Announce at start:** "I'm using harness-spec to create a structured feature specification."

**Context:** Creates specification files in `.harness/specs/`. No implementation code is written — only spec documents.

## Overview

Creates lightweight, structured feature specifications that bridge requirements to implementation. Each spec includes:

- Clear objective and constraints
- Affected files with delta markers (ADDED/MODIFIED/REMOVED)
- Verification criteria bound to harness validation (lint-deps, validate, etc.)
- Lifecycle state management (draft → approved → archived)

This is **not** a planning tool — it captures **what** needs to be done and **how to verify it**, not **how** to implement it. Use Superpowers' planning skill for implementation task breakdown after the spec is approved.

## When to Activate

- User says "harness-spec", "spec", "write spec", "feature spec"
- User says "write requirements", "define feature", "spec out"
- User describes a feature and you detect it needs formalization before planning
- After a Superpowers brainstorm session produces a design brief

## Spec Lifecycle

```
draft → approved → archived
  │         │          │
  │         │          └─ Feature shipped & verified, spec becomes historical record
  │         └─ User confirms spec, ready for planning & implementation
  └─ Initial creation, open for revision
```

## Process

### Step 1: Gather Feature Information

Ask the user (or extract from brainstorm output) for:

1. **Feature name** (kebab-case identifier)
2. **Objective** — one sentence describing what this feature does
3. **Constraints** — what rules must be followed (layer rules, performance, compatibility)
4. **Affected files** — what files will be added, modified, or removed

If `docs/ARCHITECTURE.md` exists, read it to pre-populate layer constraints.
If `docs/PRODUCT_SENSE.md` exists, read it for business context.

#### Output Template

```
┌─────────────────────────────────────────────────────────┐
│  Feature Spec: [feature-name]                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Let me gather some information:                        │
│                                                         │
│  1. What does this feature do? (one sentence)           │
│  2. Any specific constraints?                           │
│     - Detected layer rules: [from ARCHITECTURE.md]      │
│     - Performance requirements?                         │
│     - Compatibility requirements?                       │
│  3. What files will be affected?                        │
│     - New files to create?                              │
│     - Existing files to modify?                         │
│     - Files to remove?                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Generate Spec

Create the spec directory and files:

```bash
mkdir -p .harness/specs/<feature-name>
```

#### spec.md Template

```markdown
# Feature: <feature-name>

## Status: draft

## Objective

<One sentence describing what this feature does>

## Constraints

- Layer rules: <from ARCHITECTURE.md, e.g., "new service must be in Layer 2">
- <Additional constraints from user>

## Affected Files

- [ADDED] <path> — <brief description>
- [MODIFIED] <path> — <what changes>
- [REMOVED] <path> — <why removed>

## Verification Criteria

- [ ] `lint-deps` passes (no layer violations introduced)
- [ ] `lint-quality` passes (code quality rules met)
- [ ] New/modified code has test coverage
- [ ] `validate` pipeline passes end-to-end
- [ ] <Feature-specific verification criteria>

## Architecture Impact

- New modules/layers: <if any>
- Cross-layer dependencies: <if any>
- Layer rule changes needed: <if any>

## Approved By: pending
## Created: <ISO date>
## Last Updated: <ISO date>
```

#### status file

```bash
echo "draft" > .harness/specs/<feature-name>/status
```

#### delta.md (only for modifications to existing features)

When the spec modifies existing functionality, create a delta document:

```markdown
# Delta: <feature-name>

## Changes relative to current state

### Added
- <new file or capability>

### Modified
- <file>: <what changed and why>

### Removed
- <file or capability>: <why removed>

## Migration Notes
- <Any data migration or backwards compatibility notes>
```

### Step 3: Pre-validate with Harness Guardian

If `harness-guardian` agent is available, dispatch it to pre-validate the Affected Files:

```
For each [ADDED] file:
  → Guardian checks: Is the target directory in a valid layer?
  → Guardian checks: Does the file name follow conventions?

For each [MODIFIED] file:
  → Guardian checks: Will the modification introduce cross-layer violations?

Report any INVALID results in the spec as warnings.
```

### Step 4: Present Spec for Approval

```
┌─────────────────────────────────────────────────────────┐
│  Spec Ready for Review                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Feature: <feature-name>                                │
│  Status: draft                                          │
│  Files: <N> added, <N> modified, <N> removed            │
│  Verification: <N> criteria defined                     │
│                                                         │
│  Guardian pre-check:                                    │
│    ✓ All file locations valid                           │
│    ✗ <warning if any>                                   │
│                                                         │
│  Saved to: .harness/specs/<feature-name>/spec.md        │
│                                                         │
│  [Approve] [Revise] [Discard]                           │
└─────────────────────────────────────────────────────────┘
```

- **Approve**: Update status to `approved`, set `Approved By`
- **Revise**: Ask what to change, update spec.md
- **Discard**: Remove the spec directory

## Status Transitions

```bash
# Approve a spec
echo "approved" > .harness/specs/<feature-name>/status
# Update spec.md: change "## Status: draft" to "## Status: approved"
# Update spec.md: change "## Approved By: pending" to "## Approved By: <user or timestamp>"

# Archive a spec (after feature is shipped and verified)
echo "archived" > .harness/specs/<feature-name>/status
# Update spec.md: change "## Status: approved" to "## Status: archived"
```

## Integration with Other Tools

### With Superpowers (brainstorm → spec)

When a Superpowers brainstorm session produces a Design Brief:
1. Extract Objective from Problem Statement
2. Extract Constraints from Architecture Impact
3. Extract Verification Criteria from the brief
4. Auto-populate the spec template

### With Superpowers (spec → planning)

When planning begins, the planner should:
1. Read `.harness/specs/<feature>/spec.md` for constraints
2. Ensure every Affected File appears in the execution plan
3. Ensure every Verification Criterion has a corresponding plan step

### With Harness Guardian (pre-validation)

Guardian can validate Affected Files before any code is written:
- File creation locations checked against layer rules
- Cross-layer imports flagged early
- Naming convention compliance verified

### With gstack (review)

After implementation, gstack review skills (/review, /plan-eng-review) can reference the spec to check completeness.

## After Spec

Always offer follow-up actions:

```bash
Would you like to:
  1. Start planning (use Superpowers /write-plan with this spec as input)
  2. Revise the spec
  3. Create another spec

Choose an option or describe what you'd like to do next.
```

Do not automatically proceed to planning. Wait for user confirmation.

## Listing Specs

When user asks "show specs", "list specs", or "spec status":

```bash
# Scan all specs
for dir in .harness/specs/*/; do
  if [ -d "$dir" ]; then
    name=$(basename "$dir")
    status=$(cat "$dir/status" 2>/dev/null || echo "unknown")
    echo "  $name — $status"
  fi
done
```

Output:
```
=== Harness Specs ===
  user-auth — approved
  caching-layer — draft
  legacy-cleanup — archived

Active specs: 2 (1 approved, 1 draft)
```
