#!/usr/bin/env node
/**
 * Generation Tool
 *
 * Generates harness infrastructure or code scaffolding from templates.
 * Handles template rendering, file writing, and manifest updates.
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';
import {
  getHarnessRoot,
  getDocsPath,
  getScriptsPath,
  getRulesPath,
  getManifestPath
} from '../../../lib/constants.js';

const __dirname = getDirname(import.meta.url);

const layerMappings = loadConfig('layer-mappings.json') || {};
const qualityRules = loadConfig('quality-rules.json') || {};
const defaults = loadConfig('defaults.json') || {};

// ============================================================================
// Template Engine
// ============================================================================

class TemplateEngine {
  constructor() {
    this.context = {};
  }

  setContext(context) {
    this.context = context;
  }

  getContextValue(path) {
    const keys = path.split('.');
    let value = this.context;
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }
    return value;
  }

  render(template) {
    let result = template;

    // Process conditionals
    result = this.renderConditionals(result);
    result = this.renderLoops(result);
    result = this.renderVariables(result);

    return result;
  }

  renderConditionals(template) {
    const pattern = /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;
    return template.replace(pattern, (match, varName, content) => {
      const value = this.getContextValue(varName);
      if (value === undefined) return match;
      const isTruthy = value !== null && value !== false && value !== 0 && value !== '';
      return isTruthy ? content : '';
    });
  }

  renderLoops(template) {
    const pattern = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}(.*?)\{\{\/each\}\}/gs;
    return template.replace(pattern, (match, varName, content) => {
      const value = this.getContextValue(varName);
      if (!Array.isArray(value)) return '';
      return value.map((item, index) => {
        const tempContext = {
          ...this.context,
          ...(typeof item === 'object' && item !== null ? item : {}),
          '@index': index,
          '@first': index === 0,
          '@last': index === value.length - 1,
        };
        if (typeof item !== 'object' || item === null) {
          tempContext.this = item;
        }
        const tempEngine = new TemplateEngine();
        tempEngine.setContext(tempContext);
        let loopContent = content;
        loopContent = tempEngine.renderConditionals(loopContent);
        loopContent = tempEngine.renderVariables(loopContent);
        return loopContent;
      }).join('\n');
    });
  }

  renderVariables(template) {
    const pattern = /\{\{(@?\w+(?:\.\w+)*)\}\}/g;
    return template.replace(pattern, (match, path) => {
      const value = this.getContextValue(path);
      if (value === undefined || value === null) return match;
      return String(value);
    });
  }
}

// ============================================================================
// Template Resolution
// ============================================================================

function resolveTemplate(type, language, framework) {
  const pluginRoot = path.join(__dirname, '../..', '..');

  if (type === 'AGENTS') {
    return path.join(pluginRoot, 'templates/base/AGENTS.md.template');
  }

  if (type === 'ARCHITECTURE') {
    const priorities = [
      path.join(pluginRoot, 'templates/frameworks', framework, 'ARCHITECTURE.md.template'),
      path.join(pluginRoot, 'templates/languages', language, 'ARCHITECTURE.md.template'),
      path.join(pluginRoot, 'templates/base/ARCHITECTURE.md.template')
    ];
    for (const p of priorities) {
      if (fs.existsSync(p)) return p;
    }
  }

  if (type === 'DEVELOPMENT') {
    return path.join(pluginRoot, 'templates/base/DEVELOPMENT.md.template');
  }

  if (type === 'PRODUCT_SENSE') {
    return path.join(pluginRoot, 'templates/base/PRODUCT_SENSE.md.template');
  }

  if (type === 'safety') {
    return path.join(pluginRoot, 'templates/rules/common/safety.md.template');
  }

  if (type === 'git-workflow') {
    return path.join(pluginRoot, 'templates/rules/common/git-workflow.md.template');
  }

  if (type === 'development') {
    return path.join(pluginRoot, 'templates/rules', language, 'development.md.template');
  }

  return null;
}

// ============================================================================
// Generation Functions
// ============================================================================

function generateHarness(options) {
  const { language, framework, components = ['ARCHITECTURE', 'DEVELOPMENT', 'PRODUCT_SENSE'], projectDir = process.cwd() } = options;

  const context = {
    PROJECT_NAME: path.basename(projectDir),
    LANGUAGE: language,
    FRAMEWORK: framework,
    GENERATED_DATE: new Date().toISOString().split('T')[0],
    CURRENT_YEAR: new Date().getFullYear().toString()
  };

  const engine = new TemplateEngine();
  engine.setContext(context);

  const results = [];

  const harnessRoot = getHarnessRoot(projectDir);
  const dirs = [
    path.join(harnessRoot, 'docs'),
    path.join(harnessRoot, 'scripts'),
    path.join(harnessRoot, 'memory/episodic'),
    path.join(harnessRoot, 'memory/procedural'),
    path.join(harnessRoot, 'trace/failures'),
    path.join(harnessRoot, 'rules/common'),
    path.join(harnessRoot, `rules/${language}`)
  ];

  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      results.push({ type: 'dir', path: dir, created: true });
    }
  }

  // Generate AGENTS.md (always generated at project root)
  const agentsTemplate = resolveTemplate('AGENTS', language, framework);
  if (agentsTemplate && fs.existsSync(agentsTemplate)) {
    const template = fs.readFileSync(agentsTemplate, 'utf8');
    const rendered = engine.render(template);
    const outputPath = path.join(projectDir, 'AGENTS.md');
    fs.writeFileSync(outputPath, rendered, 'utf8');
    results.push({ type: 'file', path: 'AGENTS.md', created: true });
  }

  // Generate documents
  const docs = components.filter(c => ['ARCHITECTURE', 'DEVELOPMENT', 'PRODUCT_SENSE'].includes(c));
  for (const doc of docs) {
    const templatePath = resolveTemplate(doc, language, framework);
    if (templatePath && fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      const rendered = engine.render(template);
      const outputPath = path.join(projectDir, `.harness/docs/${doc}.md`);
      fs.writeFileSync(outputPath, rendered, 'utf8');
      results.push({ type: 'file', path: `.harness/docs/${doc}.md`, created: true });
    }
  }

  // Generate rules
  const rules = components.filter(c => ['safety', 'git-workflow', 'dev-rules'].includes(c));
  for (const rule of rules) {
    const templatePath = resolveTemplate(rule, language, framework);
    if (templatePath && fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      const rendered = engine.render(template);
      const outputPath = rule === 'dev-rules'
        ? path.join(projectDir, `.harness/rules/${language}/development.md`)
        : path.join(projectDir, `.harness/rules/common/${rule}.md`);
      fs.writeFileSync(outputPath, rendered, 'utf8');
      results.push({ type: 'file', path: outputPath.replace(projectDir + '/', ''), created: true });
    }
  }

  // Generate manifest with extended schema
  const manifest = {
    version: '1.2.2',
    language,
    framework,
    components,
    lastApplied: new Date().toISOString(),

    // Change tracking for incremental updates
    changeLog: {
      filesModified: [],
      filesAdded: [],
      filesDeleted: [],
      rulesAffected: [],
      timestamp: new Date().toISOString()
    },

    // Checkpoints for change detection
    checkpoints: {
      git: { lastCommit: null, branch: null },
      fileHash: {},
      lastCheck: new Date().toISOString()
    },

    capabilities: {
      jitTest: true,  // Enable JiT test generation
      testFramework: framework === 'nextjs' ? 'jest' :
                      framework === 'django' || framework === 'fastapi' ? 'pytest' :
                      language === 'python' ? 'pytest' : 'jest',
      coverageThreshold: 80,
      ...defaults.capabilities
    }
  };
  const manifestPath = getManifestPath(projectDir);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  results.push({ type: 'file', path: '.harness/manifest.json', created: true });

  return { success: true, results };
}

/**
 * Incremental Update Function
 *
 * Updates AGENTS.md for existing harness projects with selective component updates.
 * Checks if manifest.json exists to determine update behavior.
 */
function generateIncremental(options) {
  const { language, framework, projectDir = process.cwd(), changeLog = null } = options;

  // Check if manifest.json exists
  const manifestPath = getManifestPath(projectDir);
  const hasManifest = fs.existsSync(manifestPath);

  // If project is managed by harness-pilot, update with selective regeneration
  if (hasManifest) {
    const context = {
      PROJECT_NAME: path.basename(projectDir),
      LANGUAGE: language || 'unknown',
      FRAMEWORK: framework || 'none',
      GENERATED_DATE: new Date().toISOString().split('T')[0],
      CURRENT_YEAR: new Date().getFullYear().toString()
    };

    const engine = new TemplateEngine();
    engine.setContext(context);

    const templatePath = resolveTemplate('AGENTS', language, framework);
    if (templatePath && fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      const rendered = engine.render(template);
      const outputPath = path.join(projectDir, 'AGENTS.md');

      // Update manifest lastApplied timestamp
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.lastApplied = new Date().toISOString();

        // Update changeLog if provided (from change-tracker)
        if (changeLog && changeLog.changes) {
          const affectedRules = changeLog.affectedRules || [];
          console.log(`📋 Affected rules: ${affectedRules.join(', ')}`);

          // Selectively update documents based on affected rules
          const docsToUpdate = [];
          if (affectedRules.includes('architecture')) {
            docsToUpdate.push('ARCHITECTURE');
          }
          if (affectedRules.includes('lint-deps') ||
              affectedRules.includes('lint-quality') ||
              affectedRules.includes('jit-test')) {
            docsToUpdate.push('DEVELOPMENT');
          }

          // Update affected documentation
          for (const doc of docsToUpdate) {
            const docTemplate = resolveTemplate(doc, language, framework);
            if (docTemplate && fs.existsSync(docTemplate)) {
              const docTemplateContent = fs.readFileSync(docTemplate, 'utf8');
              const docRendered = engine.render(docTemplateContent);
              const docOutputPath = path.join(projectDir, `.harness/docs/${doc}.md`);
              fs.writeFileSync(docOutputPath, docRendered, 'utf8');
              console.log(`✓ Updated ${doc} (affected by: ${affectedRules.join(', ')})`);
            }
          }
        }

        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      } catch (e) {
        console.warn(`⚠️  Manifest update warning: ${e.message}`);
      }

      fs.writeFileSync(outputPath, rendered, 'utf8');
      return { success: true, results: [{ type: 'file', path: 'AGENTS.md', action: 'updated', changeLog }] };
    } else {
      return { success: false, error: `AGENTS.md template not found for language=${language}, framework=${framework}` };
    }
  }

  // If project is not managed by harness-pilot, return confirmation request
  return {
    success: true,
    requiresConfirmation: true,
    message: 'AGENTS.md not managed by harness-pilot. Generate or append?',
    results: []
  };
}

function generateCode(options) {
  const { template, name, language, framework, projectDir = process.cwd() } = options;

  // Code generation from templates (scaffolding)
  // This would generate API/model/service/handler files
  // For now, return a stub

  return {
    success: true,
    results: [
      { type: 'info', message: `Code generation for ${template}:${name} not yet implemented` }
    ]
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'harness';  // harness | code | incremental
  const input = args[1] || '';

  if (!input) {
    console.error('Usage: generate.js <type> <json-input>');
    process.exit(1);
  }

  try {
    const options = JSON.parse(input);
    let result;

    if (type === 'harness') {
      result = generateHarness(options);
    } else if (type === 'code') {
      result = generateCode(options);
    } else if (type === 'incremental') {
      result = generateIncremental(options);
    } else {
      result = { success: false, error: `Unknown type: ${type}` };
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }, null, 2));
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for module use
export { generateHarness, generateCode, generateIncremental, TemplateEngine, resolveTemplate };