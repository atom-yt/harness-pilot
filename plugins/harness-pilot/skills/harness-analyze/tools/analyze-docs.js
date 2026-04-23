#!/usr/bin/env node
/**
 * Documentation Analysis Tool
 *
 * Analyzes documentation coverage under .harness/docs/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeDocs(projectDir = process.cwd()) {
  const harnessDir = path.join(projectDir, '.harness');
  const docsDir = path.join(harnessDir, 'docs');

  if (!fs.existsSync(harnessDir)) {
    return {
      exists: false,
      coverage: 0,
      files: []
    };
  }

  const requiredDocs = [
    { id: 'ARCHITECTURE', name: 'ARCHITECTURE.md', desc: 'Architecture, layers, dependency rules' },
    { id: 'DEVELOPMENT', name: 'DEVELOPMENT.md', desc: 'Build/test/lint commands' },
    { id: 'PRODUCT_SENSE', name: 'PRODUCT_SENSE.md', desc: 'Business context' }
  ];

  const results = [];
  let score = 0;

  for (const doc of requiredDocs) {
    const docPath = path.join(docsDir, doc.name);
    const exists = fs.existsSync(docPath);

    results.push({
      id: doc.id,
      name: doc.name,
      desc: doc.desc,
      exists,
      path: docPath.replace(projectDir + '/', '')
    });

    if (exists) score += 100;
  }

  return {
    exists: true,
    coverage: Math.round(score / requiredDocs.length),
    files: results
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const result = analyzeDocs();
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeDocs };