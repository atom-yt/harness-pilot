---
name: harness-ui
description: Launch the Harness Pilot Web Dashboard for task tracking and analytics
---

# Harness UI - Web Dashboard

**Announce at start:** "I'm starting the Harness Pilot Web Dashboard at http://localhost:3000"

## Overview

Launches a Next.js-based web dashboard for visualizing harness tasks, tracking progress, and analyzing quality metrics.

## When to Activate

- User says "harness-ui", "dashboard", "web-ui"
- User wants to see a visual interface for tasks
- User needs detailed analytics and charts

## Usage

```
harness-ui [--port <port>] [--watch]
```

## Dashboard Pages

### 1. Overview (page.tsx)
- Task statistics (total, completed, in progress, failed)
- Recent tasks list
- Quick action buttons
- System health status

### 2. Tasks List (/tasks)
- Filterable task table
- Search by task ID or type
- Sort by status, time, type
- Bulk actions

### 3. Task Detail (/task/[id])
- Full task information
- Stage progress visualization
- Trace failure logs
- Timeline view

### 4. Analytics (/analytics)
- Task completion trends
- Quality metrics charts
- Common failure patterns
- Performance statistics

## Tool Protocol

1. Sync tracker: `node plugins/harness-pilot/ui/tracker/tracker.js --sync`
2. Start dev server: `cd plugins/harness-pilot/ui/web && npm run dev`
3. Open browser: `open http://localhost:3000`

## Features

### Real-time Updates
- Auto-refresh every 5 seconds
- Watch mode for continuous sync
- WebSocket connection (optional)

### Interactive Elements
- Click task to view details
- Filter by status/type
- Export data as JSON
- View trace logs inline

### Quality Analysis
- Visual charts for metrics
- Trend analysis over time
- Failure pattern detection
- Recommendations engine

## Setup

First time setup:
```bash
cd plugins/harness-pilot/ui/web
npm install
npm run dev
```

## Next Steps

After dashboard opens, suggest:
- "Would you like to set up auto-refresh?"
- "Check the Analytics tab for quality trends"
- "Use harness-status for CLI quick view"