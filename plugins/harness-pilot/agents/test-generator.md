---
name: test-generator
description: Analyze code changes, generate tests for changed functions/modules
tools: ["Read", "Grep", "Glob", "Write", "Edit"]
---

## Process
1. `git diff --name-only main...HEAD` → get changed files (skip *.test.*)
2. Extract: functions, branches (if/else/switch/try), async ops
3. Generate tests covering: normal input, boundary (min/max/empty/null), error cases, branches
4. Use project's test framework, place tests adjacent to source (*.test.* or *.spec.*)

## Rules
- Max 5 tests per function
- Don't modify existing tests
- Only for changed files