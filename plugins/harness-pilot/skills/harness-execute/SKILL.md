---
name: harness-execute
description: Execute development tasks within harness infrastructure. Manages the full lifecycle - environment detection, task planning, subagent delegation, validation, checkpoints, and memory recording.
---

# Harness Execute

**Announce at start:** "I'm using harness-execute to perform this task within the harness infrastructure."

## Overview

The execution engine for harness-equipped projects. While harness-apply **creates** the harness, harness-execute **operates within** it. It manages the full task lifecycle: detect environment → assess complexity → plan → delegate → validate → checkpoint → record.

**Core principle:** The coordinator never writes implementation code for non-trivial tasks. It reads, plans, delegates, and verifies.

## When to Activate

- User wants to implement a feature, fix a bug, or refactor code in a harness-equipped project
- AGENTS.md exists in the project root
- User says "execute", "implement", "build feature", "dev", or describes a development task

## Prerequisites Check

Before any execution, verify the harness is in place:

```bash
# Check for harness infrastructure
if [ ! -f "AGENTS.md" ]; then
  echo "No harness detected. Running harness-apply first..."
  # Trigger harness-apply --auto, then continue
fi

# Load essential context
ARCH_FILE="docs/ARCHITECTURE.md"
DEV_FILE="docs/DEVELOPMENT.md"
PRODUCT_FILE="docs/PRODUCT_SENSE.md"

if [ ! -f "$ARCH_FILE" ]; then
  echo "Warning: docs/ARCHITECTURE.md not found. Layer rules unavailable."
fi
```

If AGENTS.md doesn't exist, automatically trigger `harness-apply --auto` first, then continue execution.

## Step 1: Load Context

Read essential harness files to understand the project:

```
1. AGENTS.md          → Project navigation map
2. docs/ARCHITECTURE.md → Layer rules, dependency constraints
3. docs/DEVELOPMENT.md  → Build/test/lint commands
4. docs/PRODUCT_SENSE.md → Business context (if exists)
5. harness/memory/      → Relevant past experiences
```

### Query Memory

Before starting, check if similar tasks have been done before:

```bash
# Search procedural memory for similar patterns
if [ -d "harness/memory/procedural" ]; then
  # Look for related task patterns
  grep -rl "$TASK_KEYWORDS" harness/memory/procedural/ 2>/dev/null | head -3
fi

# Check episodic memory for relevant lessons
if [ -d "harness/memory/episodic" ]; then
  grep -rl "$TASK_KEYWORDS" harness/memory/episodic/ 2>/dev/null | head -3
fi
```

If relevant memory is found, load it as additional context before proceeding.

## Step 2: Assess Task Complexity

Categorize the task to determine the execution strategy:

### Complexity Decision Tree

```
Is the task describable in one sentence without "and"?
├── Yes → Can it be done in a single file?
│         ├── Yes → SIMPLE: Execute directly
│         └── No  → Does it cross layer boundaries?
│                   ├── No  → SIMPLE: Execute directly
│                   └── Yes → MEDIUM: Delegate to subagent
└── No  → Does it require design decisions or tradeoffs?
          ├── No  → MEDIUM: Delegate to subagent
          └── Yes → COMPLEX: Plan + delegate + isolate
```

| Complexity | Strategy | Example |
|-----------|----------|---------|
| **Simple** | Execute directly, run validation after | Fix typo, add log line, rename variable |
| **Medium** | Delegate to subagent, review result | Multi-file consistency change, add API endpoint |
| **Complex** | Plan → approve → delegate in worktree → cross-review → merge | New module, architectural refactor, auth system |

## Step 3: Execute by Complexity

### Simple Tasks

Execute directly without subagent delegation:

```
1. Make the change
2. Run validation: build → lint-arch → test
3. If validation passes → done
4. If validation fails → fix and retry (max 3 rounds)
```

### Medium Tasks

Delegate to a coding subagent:

```
1. Dispatch planner agent to create execution plan
   → Plan written to docs/exec-plans/{task-name}.md
2. Present plan to user for approval
3. For each step in the plan:
   a. Pre-validate structural operations (dispatch harness-guardian)
   b. Delegate step to coding subagent with precise prompt
   c. Run step-level validation
   d. Save checkpoint to harness/tasks/
4. After all steps:
   a. Run full validation: build → lint-arch → test → verify
   b. Dispatch code-reviewer agent for cross-review
   c. If review passes → done
   d. If review finds issues → fix and re-review (max 2 rounds)
```

### Complex Tasks

Same as medium, plus isolation:

```
1. Create git worktree for isolation
   git worktree add .harness-worktree/{task-name} -b harness/{task-name}
2. Execute medium-task flow in the worktree
3. If successful:
   a. Run full validation in worktree
   b. Merge back to main branch
   c. Clean up worktree
4. If failed:
   a. Record failure to harness/trace/failures/
   b. Clean up worktree (no pollution to main branch)
   c. Report to user with diagnosis
```

## Step 4: Validation Pipeline

After execution, run the full validation sequence:

```
build → lint-arch → test → verify
  │        │         │       │
  │        │         │       └─ End-to-end functional verification
  │        │         └─ Unit/integration tests
  │        └─ Architecture and quality compliance
  └─ Code compiles/builds
```

### Validation Commands

Read commands from `docs/DEVELOPMENT.md` or use defaults:

```bash
# Validation sequence
validate() {
  local lang=$1

  echo "=== Step 1: Build ==="
  run_cmd "$BUILD_CMD" || { echo "Build failed"; return 1; }

  echo "=== Step 2: Architecture Lint ==="
  run_cmd "$LINT_ARCH_CMD" || { echo "Architecture lint failed"; return 1; }

  echo "=== Step 3: Tests ==="
  run_cmd "$TEST_CMD" || { echo "Tests failed"; return 1; }

  echo "=== Step 4: Verify ==="
  if [ -n "$VERIFY_CMD" ]; then
    run_cmd "$VERIFY_CMD" || { echo "Verification failed"; return 1; }
  fi

  echo "=== All validations passed ==="
}
```

### Auto-Fix Loop

If validation fails, attempt automatic repair:

```
Round 1: Analyze error → fix → re-validate
Round 2: Analyze error → fix → re-validate
Round 3: Analyze error → fix → re-validate
Round 4: STOP — hand off to human
```

**Critical:** If the same error persists for 3 rounds, stop. Do not continue — the context window is being consumed by retry noise. Save the current state as a checkpoint and report to the user.

## Step 5: Checkpoints

For medium and complex tasks, save progress after each successful step:

```bash
# Save checkpoint
save_checkpoint() {
  local task_name=$1
  local step_number=$2
  local status=$3

  cat > "harness/tasks/${task_name}.md" << EOF
# Task: ${task_name}
## Status: ${status}
## Current Step: ${step_number}
## Last Updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Completed Steps
${COMPLETED_STEPS}

## Architecture Decisions Made
${DECISIONS}

## Remaining Steps
${REMAINING_STEPS}
EOF
}
```

Checkpoints carry architecture decisions — this ensures a new agent resuming from a checkpoint won't make contradictory choices.

## Step 6: Record to Memory

After task completion (success or failure), update harness memory:

### On Success

```bash
# Record to procedural memory
cat > "harness/memory/procedural/${TASK_TYPE}.md" << EOF
# Pattern: ${TASK_TYPE}
## Steps (success rate: high)
${STEPS_TAKEN}
## Key Decisions
${DECISIONS}
## Validation Results
${VALIDATION_RESULTS}
EOF
```

### On Failure

```bash
# Record to failure trace
cat > "harness/trace/failures/$(date +%Y%m%d)-${TASK_NAME}.md" << EOF
# Failure: ${TASK_NAME}
## Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
## Error Type: ${ERROR_TYPE}
## Root Cause: ${ROOT_CAUSE}
## Steps Before Failure: ${STEPS_COMPLETED}
## Error Output:
${ERROR_OUTPUT}
EOF
```

### Episodic Memory (Lessons Learned)

```bash
# Record lesson if something unexpected happened
cat > "harness/memory/episodic/$(date +%Y%m%d)-${LESSON_SLUG}.md" << EOF
# Lesson: ${LESSON_TITLE}
## Context: ${WHAT_HAPPENED}
## Insight: ${WHAT_WE_LEARNED}
## Applies When: ${WHEN_RELEVANT}
EOF
```

## Subagent Delegation Rules

### Prompt Template for Coding Subagent

When delegating to a coding subagent, provide a precise, self-contained prompt:

```
Task: {step description from execution plan}
Files to modify: {specific file paths}
Files to read for context: {relevant source files}
Layer rules: {relevant layer constraints}
Quality rules: {applicable quality rules}
Verification command: {command to run after changes}
Constraints:
- Do not modify files outside the listed paths
- Run verification command before reporting completion
- If verification fails, fix and retry (max 2 attempts)
```

### Model Selection Guidelines

| Task Type | Recommended Model | Rationale |
|-----------|-------------------|-----------|
| Simple edits (rename, typo) | Lightweight/fast model | Speed over depth |
| Core implementation | Strong reasoning model | Quality matters most |
| Code search/retrieval | Fast model with large context | Speed for exploration |
| Code review | Different model from implementer | Fresh perspective |

## Coordinator Rules

**Iron Law:** For medium and complex tasks, the coordinator MUST NOT use Edit or Write tools on source code. If the coordinator finds itself about to edit a source file, STOP and dispatch a subagent instead.

Allowed coordinator actions:
- Read any file
- Write to `docs/exec-plans/`, `harness/tasks/`, `harness/memory/`, `harness/trace/`
- Dispatch subagents
- Run validation commands
- Present results to user

Forbidden coordinator actions:
- Edit source code (`.ts`, `.js`, `.py`, `.go`, `.rs`, etc.)
- Create new source files
- Modify test files directly

## Error Handling

| Scenario | Action |
|----------|--------|
| AGENTS.md missing | Auto-trigger harness-apply --auto, then continue |
| Subagent fails validation 3 times | Stop, save checkpoint, report to user |
| Cross-layer import detected pre-validation | Block the operation, suggest fix via harness-guardian |
| Git worktree creation fails | Fall back to in-place execution with extra caution |
| Memory query returns no results | Proceed without memory context (first-time task) |

## After Execution

Present completion summary:

```
✓ Task completed: {task description}

Execution Summary:
  - Complexity: {Simple/Medium/Complex}
  - Steps completed: {N}/{total}
  - Validation: build ✓ | lint-arch ✓ | test ✓ | verify ✓
  - Files modified: {count}
  - Files created: {count}

Memory Updated:
  - Procedural: {pattern recorded}
  - Episodic: {lesson recorded, if any}

Would you like to:
  [ ] Review the changes (git diff)
  [ ] Run additional validation
  [ ] Start next task
```
