#!/usr/bin/env node
/**
 * Lightweight Template Engine
 *
 * Renders templates with variable substitution, conditionals, and loops.
 *
 * Usage:
 *   node plugins/harness-pilot/scripts/template-engine.js <template-file> <context-json>
 *
 * Example:
 *   node plugins/harness-pilot/scripts/template-engine.js \n *     templates/base/AGENTS.md.template \n *     '{"PROJECT_NAME":"my-app","LANGUAGE":"typescript"}'
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Template Engine
// ============================================================================

class TemplateEngine {
  constructor() {
    this.context = {};
  }

  /**
   * Set the rendering context
   */
  setContext(context) {
    this.context = context;
  }

  /**
   * Get a value from context by path (supports nested keys like "user.name")
   */
  getContextValue(path) {
    const keys = path.split('.');
    let value = this.context;

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }

    return value;
  }

  /**
   * Render a template string with the current context
   */
  render(template) {
    let result = template;

    // Process conditionals: {{#if VAR}}...{{/if}}
    result = this.renderConditionals(result);

    // Process loops: {{#each ITEMS}}...{{/each}}
    result = this.renderLoops(result);

    // Process variables: {{VAR}}
    result = this.renderVariables(result);

    return result;
  }

  /**
   * Render conditional blocks
   */
  renderConditionals(template) {
    // Match {{#if VAR}}...{{/if}} with optional whitespace
    const pattern = /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;

    return template.replace(pattern, (match, varName, content) => {
      const value = this.getContextValue(varName);

      // If variable is undefined (e.g., @first in outer context), keep condition as-is
      // This allows loops to handle their own conditionals
      if (value === undefined) {
        return match;
      }

      const isTruthy = value !== null && value !== false && value !== 0 && value !== '';

      return isTruthy ? content : '';
    });
  }

  /**
   * Render loop blocks
   */
  renderLoops(template) {
    const pattern = /\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs;

    return template.replace(pattern, (match, varName, content) => {
      const value = this.getContextValue(varName);

      if (!Array.isArray(value)) {
        return '';
      }

      return value.map((item, index) => {
        // Create a temporary context with {{@index}} and item properties
        const tempContext = {
          ...this.context,
          '@index': index,
          '@first': index === 0,
          '@last': index === value.length - 1,
        };

        // If item is an object, merge its properties into context
        if (typeof item === 'object' && item !== null) {
          Object.assign(tempContext, item);
        } else {
          // If item is a primitive, use it as {{this}}
          tempContext.this = item;
        }

        const tempEngine = new TemplateEngine();
        tempEngine.setContext(tempContext);

        // Recursively render the loop content
        let loopContent = content;

        // Process nested conditionals and variables in loop
        loopContent = tempEngine.renderConditionals(loopContent);
        loopContent = tempEngine.renderVariables(loopContent);

        return loopContent;
      }).join('\n');
    });
  }

  /**
   * Render variable substitutions
   */
  renderVariables(template) {
    // Match {{VAR}} patterns (but not {{#if}} or {{#each}} which are already processed)
    // Supports @-prefixed variables (@index, @first, @last) and regular variables
    const pattern = /\{\{(@?\w+(?:\.\w+)*)\}\}/g;

    return template.replace(pattern, (match, path) => {
      const value = this.getContextValue(path);

      if (value === undefined || value === null) {
        // Leave as-is for missing values
        return match;
      }

      // Convert to string
      return String(value);
    });
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node template-engine.js <template-file> [context-json]');
    console.error('');
    console.error('Example:');
    console.error('  node template-engine.js templates/base/AGENTS.md.template \n    \'{"PROJECT_NAME":"my-app","LANGUAGE":"typescript"}\'');
    process.exit(1);
  }

  const templatePath = args[0];
  const contextJson = args[1] || '{}';

  // Read template file
  let template;
  try {
    template = fs.readFileSync(templatePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading template file: ${err.message}`);
    process.exit(1);
  }

  // Parse context
  let context;
  try {
    context = JSON.parse(contextJson);
  } catch (err) {
    console.error(`Error parsing context JSON: ${err.message}`);
    process.exit(1);
  }

  // Render template
  const engine = new TemplateEngine();
  engine.setContext(context);
  const result = engine.render(template);

  // Output result
  console.log(result);
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for use as a module
export { TemplateEngine };