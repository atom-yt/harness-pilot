#!/usr/bin/env node

/**
 * CLI Status Display - Displays harness task status in ASCII format
 */

const { getTrackerData, sync } = require('../tracker/tracker.js');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  dim: '\x1b[2m'
};

// Status symbols
const statusSymbols = {
  completed: `${colors.green}✓${colors.reset}`,
  running: `${colors.blue}●${colors.reset}`,
  paused: `${colors.yellow}⏸${colors.reset}`,
  failed: `${colors.red}✗${colors.reset}`,
  pending: `${colors.dim}○${colors.reset}`,
  in_progress: `${colors.blue}●${colors.reset}`
};

/**
 * Draw a box with content
 */
function drawBox(title, content, width = 70) {
  const horizontalLine = '═'.repeat(width - 2);
  const lines = [
    `╔${horizontalLine}╗`,
    `║ ${title.padEnd(width - 3)}║`,
    `╠${horizontalLine}╣`,
    ...content.map(line => `║ ${line.padEnd(width - 3)}║`),
    `╚${horizontalLine}╝`
  ];
  return lines.join('\n');
}

/**
 * Format status with color
 */
function formatStatus(status) {
  const statusColors = {
    completed: colors.green,
    running: colors.blue,
    paused: colors.yellow,
    failed: colors.red,
    pending: colors.dim,
    in_progress: colors.blue
  };
  const color = statusColors[status] || colors.reset;
  return `${color}${status}${colors.reset}`;
}

/**
 * Format timestamp to readable string
 */
function formatTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Display summary view
 */
function displaySummary(data) {
  const { stats, tasks, lastUpdated } = data;

  const title = 'Harness Task Status';
  const content = [
    `  Total: ${stats.total}  |  Completed: ${colors.green}${stats.completed}${colors.reset}  |  ` +
    `In Progress: ${colors.blue}${stats.inProgress}${colors.reset}  |  Failed: ${colors.red}${stats.failed}${colors.reset}`,
    '',
    `${colors.dim}Last updated: ${formatTime(lastUpdated)}${colors.reset}`
  ];

  console.log('\n' + drawBox(title, content) + '\n');

  // Task list
  if (Object.keys(tasks).length === 0) {
    console.log(`${colors.dim}No tasks found. Run harness-apply to create one.${colors.reset}\n`);
    return;
  }

  const taskLines = [
    `${colors.bold}${'ID'.padEnd(30)} ${'Type'.padEnd(18)} ${'Status'.padEnd(12)}${colors.reset}`,
    '─'.repeat(70)
  ];

  const sortedTasks = Object.values(tasks).sort((a, b) =>
    new Date(b.startTime) - new Date(a.startTime)
  );

  for (const task of sortedTasks) {
    const id = task.id.length > 28 ? task.id.slice(0, 28) + '…' : task.id;
    const symbol = statusSymbols[task.status] || '○';
    taskLines.push(`${symbol} ${id.padEnd(28)} ${task.type.padEnd(18)} ${formatStatus(task.status)}`);
  }

  console.log(taskLines.join('\n') + '\n');
}

/**
 * Display detail view for a specific task
 */
function displayDetail(task) {
  const { id, type, status, startTime, endTime, context, progress, stages, metrics, failureReason } = task;

  const title = `Task: ${id}`;
  const content = [
    `${colors.bold}Status:${colors.reset} ${formatStatus(status)}`,
    `${colors.bold}Type:${colors.reset} ${type}`,
    `${colors.bold}Started:${colors.reset} ${formatTime(startTime)}`,
    endTime ? `${colors.bold}Ended:${colors.reset} ${formatTime(endTime)}` : null,
    progress?.currentStep ? `${colors.bold}Current Step:${colors.reset} ${progress.currentStep}` : null,
    progress?.iteration !== undefined ? `${colors.bold}Iteration:${colors.reset} ${progress.iteration}` : null,
    failureReason ? `${colors.red}${colors.bold}Failure:${colors.reset} ${failureReason}${colors.reset}` : null,
  ].filter(Boolean);

  console.log('\n' + drawBox(title, content) + '\n');

  // Context section
  if (context) {
    const contextLines = [
      `Language: ${context.language || 'unknown'}`,
      `Framework: ${context.framework || 'unknown'}`,
      `Project Root: ${context.projectRoot || process.cwd()}`
    ];
    console.log(drawBox('Context', contextLines) + '\n');
  }

  // Stages section
  if (stages) {
    const stageLines = [];
    const stageOrder = ['requirement', 'sdd', 'development', 'review', 'test', 'ci'];
    const stageNames = {
      requirement: 'Requirement',
      sdd: 'SDD',
      development: 'Development',
      review: 'Review',
      test: 'Test',
      ci: 'CI'
    };

    for (const stage of stageOrder) {
      const stageData = stages[stage];
      const name = stageNames[stage];
      let detail = '';

      if (stageData?.completed) {
        const symbol = statusSymbols.completed;
        if (stageData.time) detail = stageData.time;
        if (stageData.file) detail = stageData.file;
        if (stageData.filesChanged) detail = `${stageData.filesChanged} files`;
        if (stageData.result) detail = `${stageData.result}${stageData.comments ? ` (${stageData.comments} comments)` : ''}`;
        stageLines.push(`[${symbol}] ${name.padEnd(20)} ${colors.dim}${detail}${colors.reset}`);
      } else if (stageData?.pending) {
        stageLines.push(`[${statusSymbols.pending}] ${name.padEnd(20)} ${colors.dim}pending${colors.reset}`);
      } else {
        stageLines.push(`[${statusSymbols.pending}] ${name.padEnd(20)} ${colors.dim}-${colors.reset}`);
      }
    }

    console.log(drawBox('Stages', stageLines) + '\n');
  }

  // Metrics section
  if (metrics) {
    const metricLines = [
      `Iteration Count: ${metrics.iterationCount || 0}`,
      `Total Tool Calls: ${metrics.totalToolCalls || 0}`,
      `Errors: ${metrics.errors || 0}`
    ];
    console.log(drawBox('Metrics', metricLines) + '\n');
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse arguments
  const taskIdArg = args.find(arg => arg.startsWith('--task='))?.split('=')[1];
  const watchMode = args.includes('--watch') || args.includes('-w');
  const syncFirst = args.includes('--sync');

  if (syncFirst) {
    sync();
  }

  if (watchMode) {
    // Watch mode
    console.log('Watching for changes... Press Ctrl+C to exit\n');
    displaySummary(getTrackerData());
    setInterval(() => {
      console.clear();
      displaySummary(getTrackerData());
    }, 5000);
  } else if (taskIdArg) {
    // Detail view
    const data = getTrackerData();
    const task = data.tasks[taskIdArg];
    if (task) {
      displayDetail(task);
    } else {
      console.error(`${colors.red}Task not found: ${taskIdArg}${colors.reset}`);
      process.exit(1);
    }
  } else {
    // Summary view
    displaySummary(getTrackerData());

    console.log('Commands:');
    console.log('  --task=<id>  Show task details');
    console.log('  --watch      Watch mode (refresh every 5s)');
    console.log('  --sync       Sync before display');
    console.log('');
    console.log('Tip: Run harness-ui for a web dashboard');
  }
}

module.exports = {
  displaySummary,
  displayDetail,
  formatStatus,
  formatTime
};