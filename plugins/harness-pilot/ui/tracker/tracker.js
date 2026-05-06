#!/usr/bin/env node

/**
 * Task Tracker - Parses .harness/ directory and syncs to task-tracker.json
 *
 * This module reads the .harness/tasks/ directory structure and maintains
 * a centralized task database for CLI and Web UI consumption.
 */

const fs = require('fs');
const path = require('path');

const HARNESS_DIR = path.join(process.cwd(), '.harness');
const TASKS_DIR = path.join(HARNESS_DIR, 'tasks');
const TRACE_DIR = path.join(HARNESS_DIR, 'trace', 'failures');
const TRACKER_FILE = path.join(process.cwd(), 'plugins', 'harness-pilot', 'ui', 'tracker', 'task-tracker.json');

/**
 * Parse a task JSON file and return normalized task data
 */
function parseTaskFile(taskDir) {
  const taskJsonPath = path.join(taskDir, 'task.json');
  if (!fs.existsSync(taskJsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(taskJsonPath, 'utf8');
    const taskData = JSON.parse(content);

    // Normalize status mapping
    const statusMap = {
      'running': 'in_progress',
      'paused': 'paused',
      'completed': 'completed',
      'failed': 'failed'
    };

    // Extract stages from task directory files
    const stages = parseTaskStages(taskDir);

    // Extract requirement from requirement.md if exists
    const requirement = parseRequirementFile(taskDir);

    // Extract plan from plan.md if exists
    const plan = parsePlanFile(taskDir);

    // Extract development info from development.md if exists
    const development = parseDevelopmentFile(taskDir);

    // Extract quality/review info from review.md or quality.md if exists
    const quality = parseQualityFile(taskDir);

    return {
      id: taskData.taskId,
      type: taskData.type,
      status: statusMap[taskData.status] || taskData.status,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      mode: taskData.mode,
      context: taskData.context,
      progress: taskData.progress,
      metrics: taskData.metrics,
      failureReason: taskData.failureReason,
      stages: stages,
      // Full process data
      requirement: requirement,
      plan: plan,
      development: development,
      quality: quality,
      metadata: {
        createdBy: taskData.createdBy || 'user',
        createdAt: taskData.startTime
      }
    };
  } catch (error) {
    console.warn(`Failed to parse ${taskJsonPath}:`, error.message);
    return null;
  }
}

/**
 * Parse requirement.md file
 */
function parseRequirementFile(taskDir) {
  const reqPath = path.join(taskDir, 'requirement.md');
  if (!fs.existsSync(reqPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(reqPath, 'utf8');
    return {
      content: content,
      parsed: parseMarkdown(content)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse plan.md file
 */
function parsePlanFile(taskDir) {
  const planPath = path.join(taskDir, 'plan.md');
  if (!fs.existsSync(planPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(planPath, 'utf8');
    return {
      content: content,
      parsed: parseMarkdown(content)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse development.md file
 */
function parseDevelopmentFile(taskDir) {
  const devPath = path.join(taskDir, 'development.md');
  if (!fs.existsSync(devPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(devPath, 'utf8');
    return {
      content: content,
      parsed: parseMarkdown(content)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse quality.md or review.md file
 */
function parseQualityFile(taskDir) {
  const qualityPath = path.join(taskDir, 'quality.md');
  const reviewPath = path.join(taskDir, 'review.md');

  let filePath = null;
  if (fs.existsSync(qualityPath)) {
    filePath = qualityPath;
  } else if (fs.existsSync(reviewPath)) {
    filePath = reviewPath;
  }

  if (!filePath) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      content: content,
      parsed: parseMarkdown(content)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse markdown content into structured data
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const result = {
    title: '',
    sections: [],
    tasks: []
  };

  let currentSection = null;
  let inTaskList = false;

  for (const line of lines) {
    // Extract title
    if (line.startsWith('# ')) {
      result.title = line.substring(2).trim();
      continue;
    }

    // Extract sections
    if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim();
      result.sections.push(currentSection);
      continue;
    }

    // Extract tasks
    const taskMatch = line.match(/^\s*[-*]\s+(.+?)(?:\s+\[([x ])\])?$/);
    if (taskMatch) {
      const taskTitle = taskMatch[1].trim();
      const taskChecked = taskMatch[2] === 'x';
      result.tasks.push({
        section: currentSection,
        title: taskTitle,
        completed: taskChecked
      });
    }
  }

  return result;
}

/**
 * Parse task stages from directory structure and files
 */
function parseTaskStages(taskDir) {
  const stages = {};

  // Check for requirement.md
  stages.requirement = {
    completed: fs.existsSync(path.join(taskDir, 'requirement.md'))
  };

  // Check for plan.md
  stages.plan = {
    completed: fs.existsSync(path.join(taskDir, 'plan.md'))
  };

  // Check for development.md
  stages.development = {
    completed: fs.existsSync(path.join(taskDir, 'development.md'))
  };

  // Check for quality.md or review.md
  stages.quality = {
    completed: fs.existsSync(path.join(taskDir, 'quality.md')) || fs.existsSync(path.join(taskDir, 'review.md'))
  };

  // Check for test.md
  stages.test = {
    completed: fs.existsSync(path.join(taskDir, 'test.md'))
  };

  return stages;
}

/**
 * Scan .harness/tasks/ directory for all tasks
 */
function scanTasks() {
  const tasks = {};

  if (!fs.existsSync(TASKS_DIR)) {
    return tasks;
  }

  const entries = fs.readdirSync(TASKS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const taskDir = path.join(TASKS_DIR, entry.name);
      const task = parseTaskFile(taskDir);
      if (task) {
        tasks[task.id] = task;
      }
    }
  }

  return tasks;
}

/**
 * Calculate statistics from tasks
 */
function calculateStats(tasks) {
  const stats = {
    total: Object.keys(tasks).length,
    completed: 0,
    inProgress: 0,
    failed: 0
  };

  for (const task of Object.values(tasks)) {
    switch (task.status) {
      case 'completed':
        stats.completed++;
        break;
      case 'running':
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'failed':
        stats.failed++;
        break;
    }
  }

  return stats;
}

/**
 * Get trace failure logs for a task
 */
function getTraceFailures(taskId) {
  const failures = [];

  if (!fs.existsSync(TRACE_DIR)) {
    return failures;
  }

  const entries = fs.readdirSync(TRACE_DIR);

  for (const entry of entries) {
    if (entry.includes(taskId) || entry.match(/loop\.md$/)) {
      const filePath = path.join(TRACE_DIR, entry);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        failures.push({
          id: entry,
          timestamp: entry.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/)?.[0],
          content: content
        });
      } catch (error) {
        // Skip unreadable files
      }
    }
  }

  return failures;
}

/**
 * Sync tasks to tracker file
 */
function sync() {
  console.log('Syncing tasks from .harness/ directory...');

  const tasks = scanTasks();
  const stats = calculateStats(tasks);

  // Read existing tracker data
  let trackerData = { tasks: {}, stats: {}, lastUpdated: null };
  if (fs.existsSync(TRACKER_FILE)) {
    try {
      const content = fs.readFileSync(TRACKER_FILE, 'utf8');
      const parsed = JSON.parse(content);
      // Ensure trackerData has the required structure
      trackerData = {
        tasks: parsed.tasks || {},
        stats: parsed.stats || {},
        lastUpdated: parsed.lastUpdated || null
      };
    } catch (error) {
      console.warn('Failed to read existing tracker file, creating new one');
    }
  }

  // Merge new tasks, preserving existing process data if not present
  for (const [taskId, task] of Object.entries(tasks)) {
    const existingTask = trackerData.tasks[taskId];
    if (existingTask) {
      // Preserve process data if new task doesn't have it
      if (!task.requirement && existingTask.requirement) {
        task.requirement = existingTask.requirement;
      }
      if (!task.plan && existingTask.plan) {
        task.plan = existingTask.plan;
      }
      if (!task.development && existingTask.development) {
        task.development = existingTask.development;
      }
      if (!task.quality && existingTask.quality) {
        task.quality = existingTask.quality;
      }
    }
  }

  // Add trace failures
  for (const [taskId, task] of Object.entries(tasks)) {
    task.traceFailures = getTraceFailures(taskId);
  }

  // Write updated tracker data
  trackerData.tasks = tasks;
  trackerData.stats = stats;
  trackerData.lastUpdated = new Date().toISOString();

  // Ensure directory exists
  const trackerDir = path.dirname(TRACKER_FILE);
  if (!fs.existsSync(trackerDir)) {
    fs.mkdirSync(trackerDir, { recursive: true });
  }

  fs.writeFileSync(TRACKER_FILE, JSON.stringify(trackerData, null, 2));

  console.log(`✓ Synced ${stats.total} tasks`);
  console.log(`  - Completed: ${stats.completed}`);
  console.log(`  - In Progress: ${stats.inProgress}`);
  console.log(`  - Failed: ${stats.failed}`);

  return trackerData;
}

/**
 * Get current tracker data
 */
function getTrackerData() {
  if (!fs.existsSync(TRACKER_FILE)) {
    return sync();
  }

  try {
    const content = fs.readFileSync(TRACKER_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to read tracker file, re-syncing...');
    return sync();
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--watch') || args.includes('-w')) {
    // Watch mode - sync every 5 seconds
    console.log('Starting tracker in watch mode...');
    sync();
    setInterval(() => {
      sync();
    }, 5000);
  } else if (args.includes('--once') || args.includes('-o')) {
    // Single sync
    sync();
  } else if (args.includes('--get')) {
    // Get tracker data
    console.log(JSON.stringify(getTrackerData(), null, 2));
  } else {
    // Default: single sync
    sync();
  }
}

module.exports = {
  sync,
  getTrackerData,
  parseTaskFile,
  scanTasks,
  calculateStats,
  getTraceFailures,
  parseRequirementFile,
  parsePlanFile,
  parseDevelopmentFile,
  parseQualityFile,
  parseTaskStages,
  parseMarkdown
};