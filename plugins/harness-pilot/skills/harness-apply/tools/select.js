#!/usr/bin/env node
/**
 * Interactive Selection Tool
 *
 * Handles user selections for components, capabilities, and templates.
 * Outputs selection result as JSON.
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';

const __dirname = getDirname(import.meta.url);

const defaults = loadConfig('defaults.json') || {};

// ============================================================================
// Selection Definitions
// ============================================================================

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
  const mode = args[0] || 'components'; // components | capabilities | templates
  const action = args[1] || 'prompt'; // prompt | parse | interactive | defaults
  const input = args[2] || '';

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
export { COMPONENTS, CAPABILITIES, TEMPLATES, formatComponentsPrompt, formatCapabilitiesPrompt, parseSelection, interactiveSelect };