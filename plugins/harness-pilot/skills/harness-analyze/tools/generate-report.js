#!/usr/bin/env node
/**
 * Visual Report Generator
 *
 * Generates a visual health report from analysis results.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Report Generation
// ============================================================================

function generateProgressBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getGrade(score) {
  if (score >= 90) return 'A - Excellent';
  if (score >= 70) return 'B - Good';
  if (score >= 50) return 'C - Fair';
  return 'D - Poor';
}

function generateReport(data) {
  const {
    projectName = 'Unknown',
    docs = {},
    architecture = {},
    imports = {},
    testCoverage = { score: 0 }
  } = data;

  // Calculate scores
  const docScore = docs.coverage || 0;
  const archScore = architecture.score || 0;
  const totalScore = Math.round((docScore * 0.35 + archScore * 0.35 + testCoverage.score * 0.3));
  const grade = getGrade(totalScore);

  const lines = [
    '',
    '=== Harness Health Report ===',
    '',
    `Project: ${projectName}`,
    `Score:   ${totalScore}/100 (${grade})`,
    '',
    'Category          Score   Status',
    '─────────────────────────────────',
  ];

  // Category scores
  lines.push(`Documentation      ${String(docScore).padStart(3)}/100  ${generateProgressBar(docScore)}  ${docScore >= 70 ? '✓' : '✗'}`);
  lines.push(`Architecture       ${String(archScore).padStart(3)}/100  ${generateProgressBar(archScore)}  ${archScore >= 70 ? '✓' : '✗'}`);
  lines.push(`Test Coverage      ${String(testCoverage.score || 0).padStart(3)}/100  ${generateProgressBar(testCoverage.score || 0)}  ${(testCoverage.score || 0) >= 70 ? '✓' : '✗'}`);

  lines.push('');
  lines.push('=== Details ===');
  lines.push('');

  // Documentation details
  if (docs.files) {
    lines.push('Documentation:');
    for (const file of docs.files) {
      const status = file.exists ? '✓' : '✗';
      lines.push(`  [${status}] .harness/docs/${file.name}`);
    }
    lines.push('');
  }

  // Architecture details
  if (architecture.exists) {
    lines.push('Architecture:');
    lines.push(`  ${architecture.layerDocs ? '✓' : '✗'} Layer Documentation`);
    lines.push(`  ${architecture.layerLint ? '✓' : '✗'} Layer Lint Script`);
    lines.push(`  ${architecture.layerMapping ? '✓' : '✗'} Layer Mapping`);
    lines.push(`  ${architecture.qualityLint ? '✓' : '✗'} Quality Lint`);
    lines.push('');
  }

  // Import analysis
  if (imports.language && imports.language !== 'unknown') {
    lines.push('Import Analysis:');
    lines.push(`  Language: ${imports.language}`);
    lines.push(`  Total imports: ${imports.totalImports}`);
    lines.push(`  Unique modules: ${imports.uniqueModules}`);
    lines.push(`  Files analyzed: ${imports.filesAnalyzed || 'N/A'}`);
    lines.push('');
  }

  // Recommendations
  lines.push('=== Recommendations ===');
  lines.push('');

  if (totalScore < 70) {
    lines.push('1. Run harness-apply to generate harness infrastructure');
    lines.push('2. Review and enable quality linting rules');
    lines.push('3. Add test coverage checks if missing');
  } else if (totalScore < 90) {
    lines.push('1. Run harness-apply to update harness with latest changes');
    lines.push('2. Consider enabling additional capabilities');
  } else {
    lines.push('✓ Harness is well-configured!');
  }

  lines.push('');
  lines.push('=== Toolchain ===');
  lines.push('');
  lines.push('[Recommended] harness-apply — generate harness + quality loop');
  lines.push('[Recommended] Superpowers — brainstorm + TDD + planning + code-reviewer');
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const input = args[0];

  if (!input) {
    console.error('Usage: generate-report.js <json-input>');
    process.exit(1);
  }

  try {
    // Accept JSON string directly or file path
    let data;
    if (input.endsWith('.json') || fs.existsSync(input)) {
      data = JSON.parse(fs.readFileSync(input, 'utf8'));
    } else {
      data = JSON.parse(input);
    }
    console.log(generateReport(data));
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateReport, generateProgressBar, getGrade };