#!/usr/bin/env node
/**
 * Interactive Selection Tool
 *
 * Handles user selections for components, capabilities, templates,
 * and development mode (SPEC / PLAN / DIRECT) with enforcement rules.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';

const __dirname = getDirname(import.meta.url);

const defaults = loadConfig('defaults.json') || {};
const modeConfig = loadConfig('development-modes.json') || {};
const enforcement = modeConfig.enforcement || {
  largeTaskThreshold: 7,
  largeTaskForcedMode: 'spec',
  largeTaskAllowSkipTo: ['plan'],
  expertPanelAutoThreshold: 11,
  expertPanelCanSkip: true,
  criticalForceThreshold: 16,
  criticalAllowSkip: false,
  openspecEnabled: true,
  openspecPluginId: 'openspec'
};

// ============================================================================
// Development Mode Definitions
// ============================================================================

const DEVELOPMENT_MODES = modeConfig.modes || {
  spec: {
    name: 'SPEC Mode',
    description: 'Specification-Driven Development - Write specs first, then implement',
    trigger: 'default',
    enforceOnLargeTasks: true
  },
  plan: {
    name: 'PLAN Mode',
    description: 'Traditional planning mode - Create implementation plan then execute',
    trigger: 'user-select'
  },
  direct: {
    name: 'DIRECT Mode',
    description: 'Direct execution - Skip planning for simple tasks',
    trigger: 'simple-tasks'
  }
};

// ============================================================================
// Development Mode — openspec Plugin Detection
// ============================================================================

/**
 * Detect whether the openspec plugin is available in the current Claude
 * Code environment.
 *
 * Strategy (in order, stops on first positive):
 *  1. Check $HOME/.claude/plugins/<pluginId>/
 *  2. `claude plugin list` output contains the pluginId
 *
 * @returns {{ installed: boolean, version?: string }}
 */
function detectOpenspecPlugin() {
  const pluginId = enforcement.openspecPluginId || 'openspec';

  // 1. File-system check
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const pluginDir = path.join(homeDir, '.claude', 'plugins', pluginId);
  if (fs.existsSync(pluginDir)) {
    let version;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8'));
      version = pkg.version;
    } catch (_) { /* no package.json, still installed */ }
    return { installed: true, version };
  }

  // 2. CLI check
  try {
    const output = execSync('claude plugin list 2>/dev/null', { timeout: 3000 }).toString();
    if (output.includes(pluginId)) {
      return { installed: true };
    }
  } catch (_) { /* claude CLI not available */ }

  return { installed: false };
}

// ============================================================================
// Development Mode — Mode Selection UI
// ============================================================================

/**
 * Determine and format the development mode selection prompt for the current
 * task. Enforces complexity-based constraints and returns the decision.
 *
 * @param {object} opts
 * @param {number}  opts.complexityScore   - pre-calculated score (1–20)
 * @param {string}  opts.complexityLevel   - trivial|simple|moderate|complex|critical
 * @param {string}  opts.taskDescription   - short description shown in UI
 * @param {boolean} [opts.autoMode=false]  - accept defaults without prompting
 * @param {boolean} [opts.noPanel=false]   - skip expert panel even if auto-triggered
 * @returns {{ prompt: string, defaultMode: string, allowedModes: string[],
 *             expertPanel: boolean, panelSkippable: boolean, enforced: boolean }}
 */
function selectDevelopmentMode({ complexityScore, complexityLevel, taskDescription, autoMode = false, noPanel = false }) {
  const score = complexityScore || 1;
  const level = complexityLevel || 'trivial';

  // Determine allowed modes and default based on enforcement config
  let defaultMode = 'spec';
  let allowedModes = ['spec', 'plan', 'direct'];
  let enforced = false;
  let expertPanel = false;
  let panelSkippable = true;
  let enforcementNote = '';

  if (score >= enforcement.criticalForceThreshold) {
    // Critical: spec only, expert panel required, no skip
    defaultMode = 'spec';
    allowedModes = ['spec'];
    enforced = true;
    expertPanel = true;
    panelSkippable = false;
    enforcementNote = `⛔  Complexity score ${score} (${level}) — SPEC + Expert Panel required. No override allowed.`;
  } else if (score >= enforcement.expertPanelAutoThreshold) {
    // Complex: spec forced, expert panel auto (skippable), can't drop to direct
    defaultMode = 'spec';
    allowedModes = ['spec'];
    enforced = true;
    expertPanel = !noPanel;
    panelSkippable = enforcement.expertPanelCanSkip !== false;
    enforcementNote = `⚠  Complexity score ${score} (${level}) — SPEC mode required. Expert Panel auto-assembled${panelSkippable ? ' (use --no-panel to skip)' : ''}.`;
  } else if (score >= enforcement.largeTaskThreshold) {
    // Moderate: spec is forced default, can downgrade to plan only
    defaultMode = 'spec';
    allowedModes = ['spec', ...(enforcement.largeTaskAllowSkipTo || ['plan'])];
    enforced = true;
    expertPanel = false;
    enforcementNote = `⚠  Complexity score ${score} (${level}) — SPEC mode required. You may downgrade to PLAN, but not DIRECT.`;
  } else {
    // Simple / Trivial: SPEC is always the default; user may choose plan or direct
    defaultMode = 'spec';
    allowedModes = ['spec', 'plan', 'direct'];
    enforcementNote = `ℹ  Complexity score ${score} (${level}) — SPEC mode recommended. You may switch to PLAN or DIRECT.`;
  }

  const modeLines = [
    { id: 'spec',   label: 'SPEC Mode (SDD)',    note: 'Write spec first → confirm → implement',      available: allowedModes.includes('spec') },
    { id: 'plan',   label: 'PLAN Mode',           note: 'Traditional step-by-step plan → implement',   available: allowedModes.includes('plan') },
    { id: 'direct', label: 'DIRECT Mode',         note: 'Skip planning, code immediately',             available: allowedModes.includes('direct') }
  ];

  const bar = '━'.repeat(54);
  const lines = [
    bar,
    ' Development Mode Selection',
    ` Task: ${taskDescription || '(not specified)'}`,
    ` Complexity: ${level} (score ${score}/20)`,
    bar,
    ''
  ];

  let idx = 1;
  for (const m of modeLines) {
    const tag = m.id === defaultMode ? ' [DEFAULT]' : '';
    const avail = m.available ? '' : '  [unavailable at this complexity]';
    lines.push(` ${m.available ? idx++ : '✗'} ${m.label}${tag}`);
    lines.push(`   ${m.note}${avail}`);
    lines.push('');
  }

  if (enforcementNote) {
    lines.push(bar);
    lines.push(` ${enforcementNote}`);
  }

  if (expertPanel) {
    lines.push('');
    lines.push(' Expert Panel will be assembled for this task.');
  }

  lines.push(bar);
  lines.push(` Enter choice or press Enter to accept default (${defaultMode}):`);

  return {
    prompt: lines.join('\n'),
    defaultMode,
    allowedModes,
    expertPanel,
    panelSkippable,
    enforced
  };
}

// ============================================================================
// Development Mode — Built-in openspec Fallback
// ============================================================================

/**
 * Generate a pre-filled spec outline displayed to the user before doc.md is
 * written. Used only when the openspec plugin is NOT installed.
 *
 * @param {object} ctx
 * @param {string} ctx.taskDescription
 * @param {string} [ctx.language]
 * @param {string} [ctx.framework]
 * @param {string[]} [ctx.estimatedFiles]
 * @returns {string} markdown outline text
 */
function openspecOutline({ taskDescription, language, framework, estimatedFiles = [] }) {
  const techStack = [language, framework].filter(Boolean).join(' / ') || 'unknown';
  const fileList = estimatedFiles.length
    ? estimatedFiles.map(f => `- \`${f}\``).join('\n')
    : '- (to be identified during analysis)';

  return [
    `# Spec Outline — ${taskDescription || 'New Task'}`,
    '',
    '## What problem does this solve?',
    '> [Describe the user need or technical gap this addresses]',
    '',
    '## Tech stack',
    `> ${techStack}`,
    '',
    '## Affected files (estimated)',
    fileList,
    '',
    '## Approach (choose one or propose your own)',
    '- [ ] Option A: [describe approach]',
    '- [ ] Option B: [describe alternative]',
    '',
    '## Out of scope',
    '> [List what this task explicitly does NOT cover]',
    '',
    '## Open questions / ambiguities',
    '> [List anything that needs clarification before implementation]',
    '',
    '---',
    '*Confirm this outline (yes / edit / cancel)?*'
  ].join('\n');
}



const COMPONENTS = {
  docs: {
    items: [
      { id: 'ARCHITECTURE', name: 'ARCHITECTURE.md', desc: 'Architecture, layers, dependency rules', default: true },
      { id: 'DEVELOPMENT', name: 'DEVELOPMENT.md', desc: 'Build/test/lint commands', default: true },
      { id: 'PRODUCT_SENSE', name: 'PRODUCT_SENSE.md', desc: 'Business context', default: false }
    ]
  },
  scripts: {
    items: [
      { id: 'lint-deps', name: 'lint-deps.*', desc: 'Layer dependency checker', default: true },
      { id: 'lint-quality', name: 'lint-quality.*', desc: 'Code quality rules', default: true },
      { id: 'validate', name: 'validate.*', desc: 'Unified validation pipeline', default: true },
      { id: 'verify-action', name: 'verify-action.*', desc: 'Pre-action validation', default: false }
    ]
  },
  storage: {
    items: [
      { id: 'memory', name: 'memory/', desc: 'Agent experience storage', default: true },
      { id: 'trace', name: 'trace/', desc: 'Failure records', default: true }
    ]
  },
  rules: {
    items: [
      { id: 'safety', name: 'common/safety.md', desc: 'AI safety constraints', default: true },
      { id: 'git-workflow', name: 'common/git-workflow.md', desc: 'Git workflow rules', default: true },
      { id: 'dev-rules', name: '{lang}/development.md', desc: 'Language-specific guidelines', default: true }
    ]
  }
};

const CAPABILITIES = {
  high: {
    items: [
      { id: 'jitTest', name: 'JiT Test Generation', desc: 'Auto-generate tests for changed code', default: false },
      { id: 'codeTemplates', name: 'Code Templates', desc: 'Generate API/model/service scaffolding', default: true },
      { id: 'refactoring', name: 'Refactoring Tools', desc: 'Detect code smells and complexity', default: false },
      { id: 'e2e', name: 'E2E Testing', desc: 'API & Browser end-to-end validation', default: false }
    ]
  },
  medium: {
    items: [
      { id: 'security', name: 'Security Audit', desc: 'SAST, dependency scan, config checks', default: false },
      { id: 'monitoring', name: 'Monitoring Integration', desc: 'Datadog/New Relic/Prometheus', default: false }
    ]
  }
};

const TEMPLATES = {
  'add-api': {
    desc: 'Generate API endpoint',
    required: ['types', 'handlers']
  },
  'add-model': {
    desc: 'Generate data model',
    required: ['types']
  },
  'add-service': {
    desc: 'Generate service layer',
    required: ['types', 'services']
  },
  'add-handler': {
    desc: 'Generate handler/controller',
    required: ['types', 'handlers']
  }
};

// ============================================================================
// Output Functions
// ============================================================================

function formatComponentsPrompt(context) {
  const lines = [
    '┌─────────────────────────────────────────────────────────┐',
    '│  Select Harness Components                              │',
    '├─────────────────────────────────────────────────────────┤',
    ''
  ];

  for (const [category, data] of Object.entries(COMPONENTS)) {
    const catName = category.charAt(0).toUpperCase() + category.slice(1);
    lines.push(`  ${catName}:`);
    for (const item of data.items) {
      const check = item.default ? '☑' : '☐';
      lines.push(`  ${check} .harness/${category === 'docs' ? 'docs/' : ''}${item.name} (${item.desc})`);
    }
    lines.push('');
  }

  lines.push('  [Select All] [Minimum Recommended] [Custom]');
  lines.push('└─────────────────────────────────────────────────────────┘');

  return lines.join('\n');
}

function formatCapabilitiesPrompt(context) {
  const lines = [
    '┌─────────────────────────────────────────────────────────┐',
    '│  Select Capabilities (Optional)                         │',
    '├─────────────────────────────────────────────────────────┤',
    ''
  ];

  const capDefaults = defaults.capabilities || {};

  for (const [priority, data] of Object.entries(CAPABILITIES)) {
    const priName = priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority:';
    lines.push(`  ${priName}`);
    for (const item of data.items) {
      const capDefault = capDefaults[item.id];
      const check = (capDefault !== undefined ? capDefault : item.default) ? '☑' : '☐';
      lines.push(`  ${check} ${item.name} (${item.desc})`);
    }
    lines.push('');
  }

  lines.push('  [Enable All Recommended] [Skip Capabilities]');
  lines.push('└─────────────────────────────────────────────────────────┘');

  return lines.join('\n');
}

function parseSelection(input, mode) {
  // Parse user selection input
  // Returns selected item IDs

  if (input.toLowerCase() === 'all' || input.toLowerCase() === 'select all') {
    return getAllDefault(mode);
  }

  if (input.toLowerCase() === 'minimum' || input.toLowerCase() === 'minimum recommended') {
    return getMinimumRecommended(mode);
  }

  // Parse explicit selections (comma-separated IDs)
  const selected = input.split(',').map(s => s.trim().toLowerCase());
  return selected;
}

function getAllDefault(mode) {
  const result = [];

  if (mode === 'components') {
    for (const data of Object.values(COMPONENTS)) {
      for (const item of data.items) {
        result.push(item.id);
      }
    }
  } else if (mode === 'capabilities') {
    for (const data of Object.values(CAPABILITIES)) {
      for (const item of data.items) {
        result.push(item.id);
      }
    }
  }

  return result;
}

function getMinimumRecommended(mode) {
  const result = [];

  if (mode === 'components') {
    for (const data of Object.values(COMPONENTS)) {
      for (const item of data.items) {
        if (item.default) {
          result.push(item.id);
        }
      }
    }
  } else if (mode === 'capabilities') {
    const capDefaults = defaults.capabilities || {};
    for (const data of Object.values(CAPABILITIES)) {
      for (const item of data.items) {
        const capDefault = capDefaults[item.id];
        if (capDefault !== undefined ? capDefault : item.default) {
          result.push(item.id);
        }
      }
    }
  }

  return result;
}

// ============================================================================
// Interactive Mode
// ============================================================================

function interactiveSelect(mode) {
  const items = mode === 'components' ? COMPONENTS : CAPABILITIES;
  const flatItems = [];
  for (const [category, data] of Object.entries(items)) {
    for (const item of data.items) {
      flatItems.push({ ...item, category, selected: item.default });
    }
  }

  return {
    mode,
    selected: flatItems.filter(i => i.selected).map(i => i.id)
  };
}

// ============================================================================
// Main CLI (with interactive support)
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'components'; // components | capabilities | templates | mode | spec
  const action = args[1] || 'prompt'; // prompt | parse | interactive | defaults | select | outline
  const input = args[2] || '';

  // --- Development mode selection ---
  if (mode === 'mode' && action === 'select') {
    const score = parseInt(args[2] || '1', 10);
    const level = args[3] || 'trivial';
    const desc = args[4] || '';
    const autoMode = args.includes('--auto');
    const noPanel = args.includes('--no-panel');
    const result = selectDevelopmentMode({ complexityScore: score, complexityLevel: level, taskDescription: desc, autoMode, noPanel });
    if (autoMode) {
      console.log(JSON.stringify({ mode: result.defaultMode, expertPanel: result.expertPanel, enforced: result.enforced }));
    } else {
      console.log(result.prompt);
      console.log(JSON.stringify({ defaultMode: result.defaultMode, allowedModes: result.allowedModes, expertPanel: result.expertPanel }));
    }
    process.exit(0);
  }

  // --- openspec outline (built-in fallback) ---
  if (mode === 'spec' && action === 'outline') {
    const ctx = input ? JSON.parse(input) : {};
    console.log(openspecOutline(ctx));
    process.exit(0);
  }

  // --- openspec plugin detection ---
  if (mode === 'spec' && action === 'detect') {
    console.log(JSON.stringify(detectOpenspecPlugin()));
    process.exit(0);
  }

  // Support interactive mode
  if (action === 'interactive' || action === '-i') {
    const result = interactiveSelect(mode);
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  if (action === 'prompt') {
    if (mode === 'components') {
      console.log(formatComponentsPrompt({}));
    } else if (mode === 'capabilities') {
      console.log(formatCapabilitiesPrompt({}));
    } else if (mode === 'templates') {
      console.log('Available templates:', Object.keys(TEMPLATES).join(', '));
    }
  } else if (action === 'parse') {
    const selected = parseSelection(input, mode);
    console.log(JSON.stringify({ mode, selected }));
  } else if (action === 'defaults') {
    console.log(JSON.stringify({
      components: getMinimumRecommended('components'),
      capabilities: getMinimumRecommended('capabilities')
    }));
  }
}

// ============================================================================
// Run if executed directly
// ============================================================================

const scriptPath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1];
if (scriptPath === invokedPath) {
  main();
}

// Export for module use
export {
  COMPONENTS, CAPABILITIES, TEMPLATES,
  formatComponentsPrompt, formatCapabilitiesPrompt, parseSelection, interactiveSelect,
  detectOpenspecPlugin, selectDevelopmentMode, openspecOutline
};