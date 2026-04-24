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

const CACHE_FILE = path.join(process.cwd(), '.harness/.analyze-cache.json');

// ============================================================================
// Analysis Functions
// ============================================================================

function loadCache() {
  try {
    const content = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return { timestamp: 0 };
  }
}

function saveCache() {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now() }), 'utf8');
  } catch {
    // Ignore cache save errors
  }
}

function analyzeDocs(projectDir = process.cwd(), incremental = false) {
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
  const args = process.argv.slice(2);
  const incremental = args.includes('--incremental') || args.includes('-i');

  const result = analyzeDocs(undefined, incremental);

  if (incremental) {
    saveCache();
  }

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeDocs };