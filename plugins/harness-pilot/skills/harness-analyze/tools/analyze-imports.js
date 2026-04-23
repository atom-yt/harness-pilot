#!/usr/bin/env node
/**
 * Import Analysis Tool
 *
 * Analyzes import patterns in source code to detect potential violations.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ============================================================================
// Analysis Functions
// ============================================================================

function detectLanguage(projectDir = process.cwd()) {
  if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) return 'typescript';
  if (fs.existsSync(path.join(projectDir, 'package.json'))) return 'javascript';
  if (fs.existsSync(path.join(projectDir, 'go.mod'))) return 'go';
  if (fs.existsSync(path.join(projectDir, 'requirements.txt')) ||
      fs.existsSync(path.join(projectDir, 'pyproject.toml'))) return 'python';
  return 'unknown';
}

function analyzeImports(projectDir = process.cwd()) {
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
  const walkDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath);
        }
      } else if (pattern.extension.some(ext => entry.name.endsWith(ext))) {
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
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.matchAll(pattern.import);

      for (const match of matches || []) {
        const module = match[1];
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
      // Skip files that can't be read
    }
  }

  // Detect potential violations (relative imports across likely boundaries)
  let potentialViolations = 0;
  for (const [module, count] of Object.entries(modules)) {
    if (module === '<relative>' && count > 10) {
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

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const result = analyzeImports();
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeImports };