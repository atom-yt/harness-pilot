# Handoff Mechanism Tests

## Quick Test Sequence

### 1. Test Basic Loop Start

```bash
node plugins/harness-pilot/skills/harness-apply/tools/loop.js start
```

Expected output:
```json
{
  "iterations": 1,
  "results": [
    {
      "iteration": 1,
      "verdict": "APPROVED",
      "timestamp": "2026-04-24T..."
    }
  ],
  "verdict": "APPROVED",
  "taskId": "task_..."
}
```

### 2. Test Checkpoint Creation

```bash
node plugins/harness-pilot/skills/harness-apply/tools/loop.js checkpoint
```

Expected output:
```json
{
  "checkpointId": "cp_...",
  "path": "/.../.harness/tasks/task_.../checkpoint.json"
}
```

### 3. Test Handoff Trigger

```bash
node plugins/harness-pilot/skills/harness-apply/tools/loop.js handoff task_test_123 "context-limit"
```

Expected output:
```json
{
  "handoffId": "sess_...",
  "resumeCommand": "/harness-apply --resume task_test_123",
  "message": "Handoff: context-limit"
}
```

### 4. Test Handoff Resolve

```bash
node plugins/harness-pilot/skills/harness-apply/tools/loop.js resolve
```

Expected output:
```json
{
  "taskArtifact": {},
  "resumeInstruction": {
    "action": "load-task",
    "taskId": "task_test_123",
    "resumeFrom": "iteration-0",
    "contextSummary": {
      "taskType": "harness-apply",
      "lastDecision": "context-limit"
    }
  },
  "nextSteps": {},
  "handoffId": ".latest",
  "verified": true
}
```

## Full Integration Test

```bash
# Clean start
rm -rf .harness/tasks/* .harness/handoffs/*

# 1. Start a task
TASK_ID=$(node plugins/harness-pilot/skills/harness-apply/tools/loop.js start | jq -r '.taskId')
echo "Task ID: $TASK_ID"

# 2. Create checkpoint
node plugins/harness-pilot/skills/harness-apply/tools/loop.js checkpoint

# 3. Trigger handoff
HANDOFF_ID=$(node plugins/harness-pilot/skills/harness-apply/tools/loop.js handoff $TASK_ID "test" | jq -r '.handoffId')
echo "Handoff ID: $HANDOFF_ID"

# 4. Resolve handoff
node plugins/harness-pilot/skills/harness-apply/tools/loop.js resolve

# 5. Verify artifacts exist
echo "=== Artifacts ==="
ls -la .harness/tasks/$TASK_ID/
ls -la .harness/handoffs/$HANDOFF_ID/
```

## Validation Checklist

- [ ] Task ID format: `task_YYYYMMDDTHHMMSS_AABBCCDD`
- [ ] Session ID format: `sess_1234567890123`
- [ ] Checksum verification passes
- [ ] Symlink `.latest` points to correct session
- [ ] All JSON files are valid and parseable
- [ ] Error handling works for missing files
