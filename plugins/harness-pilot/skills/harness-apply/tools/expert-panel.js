#!/usr/bin/env node
/**
 * Expert Panel Coordinator
 *
 * Coordinates multi-agent collaboration for complex tasks using an expert panel approach.
 * Roles: Architect, Implementer, Reviewer, Domain Expert, DevOps Engineer.
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';
import { getTasksPath, RALPH_WIGGUM } from '../../../lib/constants.js';

const __dirname = getDirname(import.meta.url);

const modeConfig = loadConfig('development-modes.json') || {};
const expertMode = modeConfig.modes?.['expert-panel'] || {};

// ============================================================================
// Expert Role Definitions
// ============================================================================

const ROLES = expertMode.roles || [
  {
    id: 'architect',
    name: 'Architect',
    description: 'Design and architecture decisions',
    focus: ['structure', 'patterns', 'scalability']
  },
  {
    id: 'implementer',
    name: 'Implementer',
    description: 'Code implementation and testing',
    focus: ['code', 'tests', 'debugging']
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Code review and quality assurance',
    focus: ['quality', 'best-practices', 'security']
  }
];

// ============================================================================
// Panel Assembly
// ============================================================================

/**
 * Assemble expert panel based on task needs
 */
function assemblePanel(taskNeeds = {}) {
  const {
    taskType = 'feature',
    focus = [],
    preferredRoles = [],
    size = expertMode.panelSize?.default || 3
  } = taskNeeds;

  let panel = [];

  // Add explicitly requested roles first
  for (const roleId of preferredRoles) {
    const role = ROLES.find(r => r.id === roleId);
    if (role) panel.push(role);
  }

  // Add roles based on focus areas
  for (const role of ROLES) {
    if (panel.length >= size) break;
    if (panel.find(r => r.id === role.id)) continue;

    const hasFocusMatch = role.focus.some(f => focus.includes(f));
    if (hasFocusMatch || focus.length === 0) {
      panel.push(role);
    }
  }

  // Fill remaining slots with default roles
  const defaultRoleIds = ['architect', 'implementer', 'reviewer'];
  for (const roleId of defaultRoleIds) {
    if (panel.length >= size) break;
    if (!panel.find(r => r.id === roleId)) {
      const role = ROLES.find(r => r.id === roleId);
      if (role) panel.push(role);
    }
  }

  return panel;
}

// ============================================================================
// Panel Workflow
// ============================================================================

/**
 * Execute expert panel workflow
 */
async function executePanelWorkflow(task) {
  const { taskId, description, panel = [] } = task;

  const panelDir = path.join(getTasksPath(), taskId, 'expert-panel');
  if (!fs.existsSync(panelDir)) {
    fs.mkdirSync(panelDir, { recursive: true });
  }

  const workflow = [];

  // Step 1: Parallel analysis
  const analysisStep = {
    step: 'parallel-analysis',
    status: 'pending',
    assignments: panel.map(role => ({
      role: role.id,
      focus: role.focus,
      task: `Analyze task from ${role.name} perspective`
    }))
  };
  workflow.push(analysisStep);

  // Step 2: Synthesize solutions
  const synthesisStep = {
    step: 'synthesize-solutions',
    status: 'pending',
    description: 'Combine expert analyses into unified approach'
  };
  workflow.push(synthesisStep);

  // Step 3: Decision making
  const decisionStep = {
    step: 'decision',
    status: 'pending',
    method: 'consensus',
    fallback: 'majority-vote'
  };
  workflow.push(decisionStep);

  // Step 4: Execute
  const executionStep = {
    step: 'execute',
    status: 'pending'
  };
  workflow.push(executionStep);

  // Save workflow state
  const workflowFile = path.join(panelDir, 'workflow.json');
  fs.writeFileSync(workflowFile, JSON.stringify({
    taskId,
    panel,
    workflow,
    startedAt: new Date().toISOString()
  }, null, 2));

  return {
    taskId,
    panel,
    workflowSteps: workflow.length,
    status: 'initialized'
  };
}

/**
 * Generate expert panel prompts
 */
function generateExpertPrompts(task, panel) {
  const { description, context = {} } = task;

  const prompts = panel.map(role => ({
    roleId: role.id,
    roleName: role.name,
    prompt: `As a ${role.name} expert (${role.description}), analyze this task:

Task: ${description}

Focus areas: ${role.focus.join(', ')}

Provide:
1. Your perspective on the key challenges
2. Recommended approach based on your expertise
3. Potential risks and how to mitigate them
4. Dependencies and coordination needs

Context: ${JSON.stringify(context)}`
  }));

  return prompts;
}

// ============================================================================
// Decision Making
// ============================================================================

/**
 * Synthesize expert inputs into unified decision
 */
function synthesizeDecision(expertInputs) {
  if (!Array.isArray(expertInputs) || expertInputs.length === 0) {
    return { method: 'default', decision: null, confidence: 0 };
  }

  // Look for consensus
  const firstInput = expertInputs[0];
  const allAgree = expertInputs.every(input => input.decision === firstInput.decision);

  if (allAgree) {
    return {
      method: 'consensus',
      decision: firstInput.decision,
      confidence: 1.0,
      votes: expertInputs.map(i => i.decision)
    };
  }

  // Count votes
  const voteCounts = {};
  for (const input of expertInputs) {
    voteCounts[input.decision] = (voteCounts[input.decision] || 0) + 1;
  }

  const maxVotes = Math.max(...Object.values(voteCounts));
  const topVotes = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([decision, _]) => decision);

  if (topVotes.length === 1) {
    return {
      method: 'majority-vote',
      decision: topVotes[0],
      confidence: maxVotes / expertInputs.length,
      votes: expertInputs.map(i => i.decision)
    };
  }

  // Tie - need tiebreaker
  return {
    method: 'tie-breaker-needed',
    decision: null,
    confidence: 0,
    votes: expertInputs.map(i => i.decision),
    topVotes,
    note: 'Multiple options tied for majority'
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'assemble';

  if (action === 'assemble') {
    const input = args[1] ? JSON.parse(args[1]) : {};
    const panel = assemblePanel(input);
    console.log(JSON.stringify({
      action: 'panel-assembled',
      panel,
      size: panel.length
    }, null, 2));
  } else if (action === 'prompts') {
    const task = args[1] ? JSON.parse(args[1]) : { description: 'Sample task' };
    const panel = args[2] ? JSON.parse(args[2]) : assemblePanel();
    const prompts = generateExpertPrompts(task, panel);
    console.log(JSON.stringify({
      action: 'prompts-generated',
      count: prompts.length,
      prompts
    }, null, 2));
  } else if (action === 'roles') {
    console.log(JSON.stringify(ROLES, null, 2));
  } else if (action === 'execute') {
    const task = args[1] ? JSON.parse(args[1]) : {};
    const panel = task.panel || assemblePanel(task);
    const result = executePanelWorkflow({
      ...task,
      panel,
      taskId: task.taskId || `panel-${Date.now()}`
    });
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error('Usage: expert-panel.js [assemble|prompts|roles|execute] [input]');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for module use
export {
  assemblePanel,
  executePanelWorkflow,
  generateExpertPrompts,
  synthesizeDecision,
  ROLES
};