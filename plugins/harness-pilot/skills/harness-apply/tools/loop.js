#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const HARNESS_ROOT = process.env.HARNESS_ROOT || path.join(process.cwd(), '.harness');
const TASKS_DIR = path.join(HARNESS_ROOT, 'tasks');
const HANDOFFS_DIR = path.join(HARNESS_ROOT, 'handoffs');

class RalphWiggumLoop {
  constructor(config = {}) {
    this.maxIterations = config.maxIterations || 3;
    this.autoFixEnabled = config.autoFixEnabled !== false;
    this.currentTaskId = null;
    this.iteration = 0;
  }

  generateTaskId() {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const time = new Date().toISOString().split('T')[1].replace(/[:.]/g, '').substring(0, 6);
    const random = crypto.randomBytes(4).toString('hex');
    return `task_${date}T${time}_${random}`;
  }

  generateSessionId() { return `sess_${Date.now()}`; }
  generateCheckpointId() { return `cp_${Date.now()}`; }

  calculateChecksum(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }

  async createTaskDir(taskId) {
    const taskDir = path.join(TASKS_DIR, taskId);
    await fs.mkdir(taskDir, { recursive: true });

    const task = {
      taskId,
      type: 'harness-apply',
      status: 'running',
      startTime: new Date().toISOString(),
      progress: { currentStep: 'init', iteration: 0 }
    };
    await fs.writeFile(path.join(taskDir, 'task.json'), JSON.stringify(task, null, 2));
    return taskDir;
  }

  async checkpoint(state, changes = []) {
    const taskId = this.currentTaskId || this.generateTaskId();
    const checkpointId = this.generateCheckpointId();

    const checkpoint = {
      checkpointId,
      timestamp: new Date().toISOString(),
      state: state || {},
      changes: changes.map(c => ({ path: c.path, action: c.action || 'unknown', lines: c.lines || 'unknown' }))
    };

    const taskDir = path.join(TASKS_DIR, taskId);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, 'checkpoint.json'), JSON.stringify(checkpoint, null, 2));

    return { checkpointId, path: path.join(taskDir, 'checkpoint.json') };
  }

  async handoff(taskId, reason, state = {}) {
    const sessionId = this.generateSessionId();
    const sessionDir = path.join(HANDOFFS_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const agentState = {
      sessionId,
      agentType: 'harness-apply',
      terminationReason: reason,
      stateSnapshot: { iteration: this.iteration, timestamp: new Date().toISOString() },
      artifacts: { taskArtifact: path.join(TASKS_DIR, taskId) }
    };

    await fs.writeFile(path.join(sessionDir, 'agent-state.json'), JSON.stringify(agentState, null, 2));

    const resumeInstruction = {
      resumeInstruction: {
        action: 'load-task',
        taskId,
        resumeFrom: `iteration-${this.iteration}`,
        contextSummary: { taskType: 'harness-apply', lastDecision: reason }
      },
      validation: { checksum: `sha256:${this.calculateChecksum(agentState)}`, verified: true }
    };

    await fs.writeFile(path.join(sessionDir, 'resume.json'), JSON.stringify(resumeInstruction, null, 2));

    const nextSteps = {
      nextAction: 'continue-loop',
      priority: 'immediate',
      steps: [{ id: `iteration-${this.iteration + 1}`, action: 'run-loop', params: { iteration: this.iteration + 1 } }]
    };

    const taskDir = path.join(TASKS_DIR, taskId);
    await fs.mkdir(taskDir, { recursive: true });
    await fs.writeFile(path.join(taskDir, 'next-steps.json'), JSON.stringify(nextSteps, null, 2));

    const latestLink = path.join(HANDOFFS_DIR, '.latest');
    try { await fs.unlink(latestLink); } catch {}
    await fs.symlink(sessionDir, latestLink);

    return { handoffId: sessionId, resumeCommand: `/harness-apply --resume ${taskId}`, message: `Handoff: ${reason}` };
  }

  async resolve(handoffId = null) {
    const sessionDir = handoffId ? path.join(HANDOFFS_DIR, handoffId) : path.join(HANDOFFS_DIR, '.latest');

    const resumeJson = await fs.readFile(path.join(sessionDir, 'resume.json'), 'utf8');
    const resume = JSON.parse(resumeJson);

    const stateJson = await fs.readFile(path.join(sessionDir, 'agent-state.json'), 'utf8');
    const state = JSON.parse(stateJson);

    const expectedChecksum = resume.validation.checksum.replace('sha256:', '');
    const actualChecksum = this.calculateChecksum(state);

    if (actualChecksum !== expectedChecksum) {
      throw new Error('Handoff verification failed: checksum mismatch');
    }

    const taskId = resume.resumeInstruction.taskId;
    const taskDir = path.join(TASKS_DIR, taskId);

    let task = {}, nextSteps = {};
    try {
      const taskJson = await fs.readFile(path.join(taskDir, 'task.json'), 'utf8');
      task = JSON.parse(taskJson);

      const nextStepsJson = await fs.readFile(path.join(taskDir, 'next-steps.json'), 'utf8');
      nextSteps = JSON.parse(nextStepsJson);
    } catch {}

    return {
      taskArtifact: task,
      resumeInstruction: resume.resumeInstruction,
      nextSteps,
      handoffId: handoffId || path.basename(sessionDir),
      verified: true
    };
  }

  async start(changes = [], config = {}) {
    this.currentTaskId = this.generateTaskId();
    this.iteration = 0;
    await this.createTaskDir(this.currentTaskId);

    const results = [];
    while (this.iteration < this.maxIterations) {
      this.iteration++;
      results.push({ iteration: this.iteration, verdict: 'APPROVED', timestamp: new Date().toISOString() });
      if (results[results.length - 1].verdict === 'APPROVED') break;
    }

    return { iterations: this.iteration, results, verdict: results[results.length - 1]?.verdict || 'UNKNOWN', taskId: this.currentTaskId };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const loop = new RalphWiggumLoop();

  if (!args[0]) {
    console.log(`
Ralph Wiggum Loop Tool

Commands:
  start              - Start loop
  checkpoint         - Create checkpoint  
  handoff <id> <reason>  - Trigger handoff
  resolve [id]       - Resolve handoff

Example:
  node loop.js handoff task_20260424_a1b2c3d4 "context-limit"
  node loop.js resolve`);
    return;
  }

  try {
    if (args[0] === 'start') {
      const result = await loop.start([]);
      console.log(JSON.stringify(result, null, 2));
    } else if (args[0] === 'checkpoint') {
      const result = await loop.checkpoint({ phase: 'test' }, []);
      console.log(JSON.stringify(result, null, 2));
    } else if (args[0] === 'handoff') {
      const taskId = args[1] || loop.generateTaskId();
      const reason = args[2] || 'manual';
      const result = await loop.handoff(taskId, reason);
      console.log(JSON.stringify(result, null, 2));
    } else if (args[0] === 'resolve') {
      const result = await loop.resolve(args[1]);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Unknown command: ${args[0]}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }, null, 2));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { RalphWiggumLoop };
