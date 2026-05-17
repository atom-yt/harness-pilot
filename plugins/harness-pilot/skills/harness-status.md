---
name: harness-status
description: Quick CLI view of harness tasks and status
---

# Harness Status

**Announce at start:** "Here's the current harness task status."

## Overview

Displays a quick overview of all harness tasks and their current status using ASCII tables.

## When to Activate

- User says "harness-status", "task-status", "show-tasks"
- User wants to see what tasks are running
- User wants to check task progress

## Usage

```
harness-status [--watch] [--task <taskId>]
```

## Tool Protocol

Use the tracker module:
1. Run `node plugins/harness-pilot/ui/tracker/tracker.js --get`
2. Parse and display results

## Display Format

### Summary View (default)
```
╔════════════════════════════════════════════════════════════╗
║                    Harness Task Status                    ║
╠════════════════════════════════════════════════════════════╣
║  Total: 5  |  Completed: 2  |  In Progress: 2  |  Failed: 1 ║
╠════════════════════════════════════════════════════════════╣
║ ID                           Type           Status        ║
╠════════════════════════════════════════════════════════════╣
║ task_20260430T084951_45a9...  harness-apply  running       ║
║ task_20260430T143000_abc1...  harness-analyze completed     ║
╚════════════════════════════════════════════════════════════╝
```

### Detail View (--task)
```
╔════════════════════════════════════════════════════════════╗
║  Task: task_20260430T084951_45a9a701                       ║
╚════════════════════════════════════════════════════════════╝
Status: running
Type: harness-apply
Started: 2026-04-30T08:49:51Z
Current Step: init
Iteration: 0

╔════════════════════════════════════════════════════════════╗
║  Stages                                                    ║
╠════════════════════════════════════════════════════════════╣
║ [✓] Requirement            2026-04-30T14:30:00Z            ║
║ [✓] SDD                    .harness/docs/sdd-auth.md       ║
║ [✓] Development           12 files, 2.5h                  ║
║ [⚠] Review                 needs_fix (3 comments)          ║
║ [ ] Test                   pending                         ║
║ [ ] CI                     pending                         ║
╚════════════════════════════════════════════════════════════╝
```

### Watch Mode (--watch)
- Refresh status every 5 seconds
- Press Ctrl+C to exit

## Next Steps

After displaying status, suggest:
- Use `harness-ui` for detailed web dashboard
- Use `harness-apply --resume <taskId>` to resume paused tasks
- Use `harness-analyze` for project health check