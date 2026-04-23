#!/usr/bin/env node
/**
 * Architecture Analysis Tool
 *
 * Analyzes architecture constraints and lint script coverage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Config Loading
// ============================================================================

function loadConfig(filename) {
  try {
    const configPath = path.join(__dirname, '../../harness-apply/config', filename);
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

const qualityRules = loadConfig('quality-rules.json') || {};

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeArchitecture(projectDir = process.cwd()) {
  const harnessDir = path.join(projectDir, '.harness');
  const scriptsDir = path.join(harnessDir, 'scripts');

  if (!fs.existsSync(harnessDir)) {
    return {
      exists: false,
      layerDocs: false,
      layerLint: false,
      layerMapping: false,
      qualityLint: false,
      qualityRules: false,
      score: 0
    };
  }

  let score = 0;

  // Check layer documentation
  const archDoc = path.join(harnessDir, 'docs', 'ARCHITECTURE.md');
  const layerDocs = fs.existsSync(archDoc) && fs.readFileSync(archDoc, 'utf8').includes('Layer');
  if (layerDocs) score += 20;

  // Check for lint-deps scripts
  const lintDepsFiles = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter(f => f.startsWith('lint-deps'))
    : [];
  const layerLint = lintDepsFiles.length > 0;
  if (layerLint) score += 20;

  // Check for layer mapping in lint-deps
  let layerMapping = false;
  for (const file of lintDepsFiles) {
    const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    if (content.includes('layers') || content.includes('layerMapping')) {
      layerMapping = true;
      break;
    }
  }
  if (layerMapping) score += 20;

  // Check for lint-quality scripts
  const lintQualityFiles = fs.existsSync(scriptsDir)
    ? fs.readdirSync(scriptsDir).filter(f => f.startsWith('lint-quality'))
    : [];
  const qualityLint = lintQualityFiles.length > 0;
  if (qualityLint) score += 20;

  // Check for quality rules
  let qualityRulesDefined = false;
  for (const file of lintQualityFiles) {
    const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    if (content.includes('noConsole') || content.includes('maxFileSize')) {
      qualityRulesDefined = true;
      break;
    }
  }
  if (qualityRulesDefined) score += 20;

  return {
    exists: true,
    layerDocs,
    layerLint,
    layerMapping,
    qualityLint,
    qualityRulesDefined,
    score
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const result = analyzeArchitecture();
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeArchitecture };