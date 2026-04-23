#!/usr/bin/env ts-node
/**
 * Import Restriction Checker
 * Enforces import restrictions: no relative parent imports, no barrel imports, etc.
 *
 * Usage: ts-node .harness/scripts/lint-imports.ts [--fix]
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface ImportRestrictionConfig {
  noRelativeParent: boolean;     // No ../ imports
  noBarrelFiles: boolean;         // No imports from index files
  noDeepImports: number;            // Max depth of ../ imports (default: 0)
  requireExplicitExtensions: boolean; // Require explicit file extensions
  maxImportDepth: number;          // Max directory depth (default: 4)
}

const RULES: ImportRestrictionConfig = {
  noRelativeParent: true,
  noBarrelFiles: false,
  noDeepImports: 0,
  requireExplicitExtensions: false,
  maxImportDepth: 4,
};

// Extensions to check
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '__tests__', 'test'];

// ============================================================================
// Import Analysis
// ============================================================================

interface ImportInfo {
  file: string;
  line: number;
  importPath: string;
  violation: string;
}

interface ImportRestriction {
  name: string;
  description: string;
  check: (importPath: string, fromFile: string, toFile: string) => boolean;
}

const importRestrictions: ImportRestriction[] = [
  {
    name: 'no-relative-parent',
    description: 'No ../ imports (relative parent imports break modularity)',
    check: (importPath, fromFile, toFile) => {
      return importPath.startsWith('../') || importPath.startsWith('..');
    },
  },
  {
    name: 'no-barrel-files',
    description: 'No imports from barrel/index files (prevents hidden dependencies)',
    check: (importPath, fromFile, toFile) => {
      if (!RULES.noBarrelFiles) return false;
      return toFile.endsWith('/index.ts') || toFile.endsWith('/index.tsx') ||
             toFile.endsWith('/index.js') || toFile.endsWith('/index.jsx');
    },
  },
  {
    name: 'no-deep-imports',
    description: `Limit depth of ../ imports (max: ${RULES.noDeepImports})`,
    check: (importPath) => {
      if (RULES.noDeepImports <= 0) return false;
      const depth = (importPath.match(/\.\.\//g) || []).length;
      return depth > RULES.noDeepImports;
    },
  },
  {
    name: 'explicit-extensions',
    description: 'Require explicit file extensions in imports (no .js for .ts)',
    check: (importPath, fromFile, toFile) => {
      if (!RULES.requireExplicitExtensions) return false;
      const fromExt = path.extname(fromFile);
      const importExt = importPath.includes('.') ? path.extname(importPath) : '';
      // If .ts file imports from .js, that's wrong
      return fromExt === '.ts' && (importExt === '.js' || !importExt);
    },
  },
];

// ============================================================================
// File Scanning
// ============================================================================

function getAllFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(entry.name)) {
        getAllFiles(fullPath, files);
      }
    } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];

  // ES6 imports
  const es6Pattern = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6Pattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // CommonJS requires
  const cjsPattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function checkImportDepth(file: string, importPath: string): number {
  const depth = (importPath.match(/\.\.\//g) || []).length;
  return depth;
}

function isBarrelFile(file: string): boolean {
  return file.endsWith('/index.ts') || file.endsWith('/index.tsx') ||
         file.endsWith('/index.js') || file.endsWith('/index.jsx');
}

// ============================================================================
// Violation Detection
// ============================================================================

function checkFile(filePath: string): ImportInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: ImportInfo[] = [];
  const relativeFile = path.relative(process.cwd(), filePath);

  const imports = extractImports(content);

  for (const importPath of imports) {
    // Only check internal imports (relative paths like ./ or ../)
    // Skip external dependencies and node_modules
    if (!importPath.startsWith('.') && !importPath.startsWith('..')) {
      continue;
    }

    const lineNum = lines.findIndex(line => line.includes(importPath)) + 1;

    for (const restriction of importRestrictions) {
      if (restriction.check(importPath, filePath, filePath)) {
        violations.push({
          file: relativeFile,
          line: lineNum,
          importPath,
          violation: restriction.name,
        });
        break;
      }
    }
  }

  return violations;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const projectRoot = process.cwd();
  const files = getAllFiles(projectRoot);
  const allViolations: ImportInfo[] = [];

  console.log(`\n🔍 Analyzing ${files.length} files for import restrictions...\n`);

  for (const file of files) {
    const violations = checkFile(file);
    allViolations.push(...violations);
  }

  if (allViolations.length === 0) {
    console.log('✓ No import violations found!\n');
    process.exit(0);
  }

  const errors = allViolations.filter(v =>
    RULES.noRelativeParent && v.violation === 'no-relative-parent' ||
    v.violation === 'explicit-extensions'
  );

  const warnings = allViolations.filter(v => !errors.includes(v));

  console.log(`✗ Found ${allViolations.length} import violation(s):\n`);

  for (const v of allViolations) {
    const icon = errors.includes(v) ? '❌' : '⚠️';
    console.log(`${icon} ${v.file}:${v.line}`);
    console.log(`   Import: ${v.importPath}`);
    console.log(`   Violation: ${v.violation}\n`);

    const restriction = importRestrictions.find(r => r.name === v.violation);
    if (restriction) {
      console.log(`   Rule: ${restriction.description}\n`);
      console.log(`   Why: ${restriction.name}\n`);
    }
  }

  const fixCommand = process.argv.includes('--fix') ? ' --fix' : '';

  console.log(`\n📝 Fix Command:\n`);
  console.log(`ts-node .harness/scripts/lint-imports.ts${fixCommand}\n`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main();