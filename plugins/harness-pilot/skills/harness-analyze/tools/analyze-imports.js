#!/usr/bin/env node
/**
 * Import Analysis Tool
 *
 * Analyzes import patterns in source code to detect potential violations.
 */

import fs from 'fs';
import path from 'path';
import { getDirname } from '../../../lib/path-utils.js';
import { detectLanguage, getExtensions } from '../../../lib/detect-language.js';

const __dirname = getDirname(import.meta.url);

// ============================================================================
// Pattern Definitions
// ============================================================================

const PATTERNS = {
  typescript: {
    import: /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    extension: ['.ts', '.tsx']
  },
  javascript: {
    import: /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
    extension: ['.js', '.jsx']
  },
  python: {
    import: /(?:from\s+(\S+)|import\s+(\S+))/g,
    extension: ['.py']
  },
  go: {
    import: /import\s+\(.*"([^"]+)"/g,
    extension: ['.go']
  }
};

// Maximum file size to read (10MB) to prevent OOM
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Default threshold for relative import violation detection
const DEFAULT_RELATIVE_THRESHOLD = 10;

/**
 * Analyzes import patterns in source code
 * @param {string} projectDir - Directory to analyze (defaults to cwd)
 * @param {Object} options - Analysis options
 * @param {number} options.relativeThreshold - Threshold for relative import violations
 * @returns {Object} Analysis results
 */
function analyzeImports(projectDir = process.cwd(), options = {}) {
  const { relativeThreshold = DEFAULT_RELATIVE_THRESHOLD } = options;
  const language = detectLanguage(projectDir);
  const pattern = PATTERNS[language];

  if (!pattern || language === 'unknown') {
    return {
      language: 'unknown',
      totalImports: 0,
      uniqueModules: 0,
      modules: {},
      potentialViolations: 0
    };
  }

  // Find source files
  const sourceFiles = [];
  const extensions = getExtensions(language);

  const walkDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc. and symlinks to prevent loops
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && !entry.isSymbolicLink()) {
          walkDir(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        sourceFiles.push(fullPath);
      }
    }
  };

  walkDir(projectDir);

  // Analyze imports
  const modules = {};
  let totalImports = 0;

  for (const file of sourceFiles) {
    try {
      const stats = fs.statSync(file);
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`Warning: Skipping ${file} (size exceeds ${MAX_FILE_SIZE} bytes)`);
        continue;
      }
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.matchAll(pattern.import);

      for (const match of matches || []) {
        const module = match[1] || match[2];
        totalImports++;

        // Extract module name (remove relative paths)
        const moduleName = module.startsWith('.') || module.startsWith('/')
          ? `<relative>`
          : module.split('/')[0];

        if (!modules[moduleName]) {
          modules[moduleName] = 0;
        }
        modules[moduleName]++;
      }
    } catch (e) {
      console.error(`Warning: Skipping ${file}: ${e.message}`);
    }
  }

  // Detect potential violations (relative imports across likely boundaries)
  let potentialViolations = 0;
  for (const [module, count] of Object.entries(modules)) {
    if (module === '<relative>' && count > relativeThreshold) {
      potentialViolations++;
    }
  }

  return {
    language,
    totalImports,
    uniqueModules: Object.keys(modules).length,
    modules,
    potentialViolations,
    filesAnalyzed: sourceFiles.length
  };
}

/**
 * CLI entry point - outputs JSON analysis results
 */
function main() {
  const result = analyzeImports();
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeImports };