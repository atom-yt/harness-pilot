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

const HISTORY_FILE = '.harness/analyze-history.json';
const MAX_HISTORY = 30;

// ============================================================================
// History Management
// ============================================================================

function loadHistory() {
  try {
    const historyPath = path.join(process.cwd(), HISTORY_FILE);
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch {
    // Ignore errors
  }
  return [];
}

function saveHistory(entry) {
  try {
    const historyPath = path.join(process.cwd(), HISTORY_FILE);
    const history = loadHistory();
    history.push(entry);

    // Keep last MAX_HISTORY entries
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
  } catch {
    // Ignore errors
  }
}

function compareWithHistory(currentScore) {
  const history = loadHistory();
  if (history.length === 0) {
    return { trend: 'new', previous: null };
  }

  const lastEntry = history[history.length - 1];
  const diff = currentScore - lastEntry.totalScore;
  const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';

  return {
    trend,
    previous: lastEntry,
    diff,
    historyLength: history.length
  };
}

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
    testCoverage = { score: 0 },
    weights = { docs: 0.35, architecture: 0.35, test: 0.3 }
  } = data;

  // Calculate scores with custom weights
  const docScore = docs.coverage || 0;
  const archScore = architecture.score || 0;
  const testScore = testCoverage.score || 0;

  // Normalize weights (sum to 1.0)
  const totalWeight = weights.docs + weights.architecture + weights.test;
  const normWeights = {
    docs: weights.docs / totalWeight,
    architecture: weights.architecture / totalWeight,
    test: weights.test / totalWeight
  };

  const totalScore = Math.round(
    docScore * normWeights.docs +
    archScore * normWeights.architecture +
    testScore * normWeights.test
  );

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
  lines.push(`Test Coverage      ${String(testScore).padStart(3)}/100  ${generateProgressBar(testScore)}  ${testScore >= 70 ? '✓' : '✗'}`);

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

  // History comparison
  const comparison = compareWithHistory(totalScore);

  if (comparison.trend !== 'new') {
    lines.push('=== History Trend ===');
    lines.push(`Trend: ${comparison.trend}`);
    lines.push(`Previous Score: ${comparison.previous?.totalScore || 'N/A'}`);
    lines.push(`Difference: ${comparison.diff > 0 ? '+' : ''}${comparison.diff}`);
    lines.push('');
  }

  // Save current analysis to history
  saveHistory({
    timestamp: new Date().toISOString(),
    totalScore,
    docScore,
    archScore,
    testScore,
    docFiles: docs.files?.length || 0,
    projectName
  });

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

    // Load custom weights from config if not provided
    if (!data.weights) {
      const configPath = path.join(process.cwd(), '.harness/analyze-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        data.weights = config.weights;
      }
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