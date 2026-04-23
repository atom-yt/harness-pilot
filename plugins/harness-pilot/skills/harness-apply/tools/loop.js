#!/usr/bin/env node
/**
 * Ralph Wiggum Loop Tool
 *
 * Automated review-test-fix quality cycle.
 * Integrates with code-reviewer agent and validation pipeline.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Config Loading
// ============================================================================

function loadConfig(filename) {
  try {
    const configPath = path.join(__dirname, '../config', filename);
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

const defaults = loadConfig('defaults.json') || {};
const MAX_ITERATIONS = defaults.loop?.maxIterations || 3;

// ============================================================================
// Validation Pipeline
// ============================================================================

function getCommands(manifest) {
  const lang = manifest.language || 'typescript';
  const ext = { typescript: 'ts', javascript: 'js', python: 'py', go: 'go', rust: 'rs' }[lang] || 'ts';

  return {
    build: manifest.buildCommand || 'npm run build',
    lintArch: `.harness/scripts/lint-deps.${ext}`,
    lintQuality: `.harness/scripts/lint-quality.${ext}`,
    test: manifest.testCommand || 'npm test',
    validate: `.harness/scripts/validate.${ext}`
  };
}

function runCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 60000 });
    return { passed: true, output: '' };
  } catch (err) {
    return {
      passed: false,
      output: err.stdout?.toString() || '' + err.stderr?.toString() || '',
      code: err.status
    };
  }
}

function runValidationPipeline(commands) {
  const results = [];

  // Build
  console.log('  → build...');
  const build = runCommand(commands.build);
  results.push({ step: 'build', ...build });
  if (!build.passed) {
    return { passed: false, results, failedAt: 'build' };
  }

  // Lint Architecture
  if (fs.existsSync(commands.lintArch)) {
    console.log('  → lint-arch...');
    const lintArch = runCommand(`node ${commands.lintArch}`);
    results.push({ step: 'lint-arch', ...lintArch });
    if (!lintArch.passed) {
      return { passed: false, results, failedAt: 'lint-arch' };
    }
  }

  // Lint Quality
  if (fs.existsSync(commands.lintQuality)) {
    console.log('  → lint-quality...');
    const lintQuality = runCommand(`node ${commands.lintQuality}`);
    results.push({ step: 'lint-quality', ...lintQuality });
    if (!lintQuality.passed) {
      return { passed: false, results, failedAt: 'lint-quality' };
    }
  }

  // Test
  console.log('  → test...');
  const test = runCommand(commands.test);
  results.push({ step: 'test', ...test });
  if (!test.passed) {
    return { passed: false, results, failedAt: 'test' };
  }

  // Validate
  if (fs.existsSync(commands.validate)) {
    console.log('  → validate...');
    const validate = runCommand(`node ${commands.validate}`);
    results.push({ step: 'validate', ...validate });
    if (!validate.passed) {
      return { passed: false, results, failedAt: 'validate' };
    }
  }

  return { passed: true, results };
}

// ============================================================================
// Failure Recording
// ============================================================================

function recordFailure(issue) {
  const traceDir = '.harness/trace/failures';
  if (!fs.existsSync(traceDir)) {
    fs.mkdirSync(traceDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-${issue.step}.md`;

  const content = `# Failure: ${issue.step}

## Date: ${new Date().toISOString()}
## Type: ${issue.type || 'validation_error'}
## Severity: ${issue.severity || 'warning'}

## Context
- Step: ${issue.step}
- File: ${issue.file || 'N/A'}
- Rule: ${issue.rule || 'N/A'}

## Error Output
\`\`\`
${issue.output || 'No output'}
\`\`\`

## Resolution
${issue.resolution || 'Unresolved'}
`;

  fs.writeFileSync(path.join(traceDir, filename), content, 'utf8');

  return filename;
}

// ============================================================================
// Loop Execution
// ============================================================================

function runLoop(options = {}) {
  const { changes = [], autoFix = true } = options;

  console.log(`\n=== Ralph Wiggum Loop ===\n`);

  // Load manifest
  let manifest = {};
  if (fs.existsSync('.harness/manifest.json')) {
    manifest = JSON.parse(fs.readFileSync('.harness/manifest.json', 'utf8'));
  }

  const commands = getCommands(manifest);
  const history = [];

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    console.log(`\n--- Iteration ${iteration}/${MAX_ITERATIONS} ---\n`);

    // Review phase (would call code-reviewer agent in real implementation)
    console.log('Review phase...');
    const review = { approved: null, issues: [] };

    // In real implementation, this would invoke code-reviewer agent
    // For now, we skip the review and go straight to validation

    // Test phase
    console.log('Test phase...');
    const validation = runValidationPipeline(commands);

    history.push({
      iteration,
      review,
      validation: validation.results,
      passed: validation.passed
    });

    if (validation.passed) {
      console.log('\n✓ All validations passed!\n');
      return {
        success: true,
        iterations: iteration,
        history,
        verdict: 'APPROVED'
      };
    }

    // Fix phase
    console.log('\n✗ Validation failed at:', validation.failedAt);

    // Record failure
    const failureFile = recordFailure({
      step: validation.failedAt,
      type: 'validation_error',
      output: validation.results.find(r => !r.passed)?.output || '',
      severity: 'warning'
    });
    console.log(`  → Recorded failure: ${failureFile}`);

    if (!autoFix) {
      console.log('\nAuto-fix disabled. Manual intervention required.\n');
      return {
        success: false,
        iterations: iteration,
        history,
        verdict: 'NEEDS_MANUAL_FIX'
      };
    }

    // In real implementation, attempt auto-fix here
    console.log('  → Auto-fix not implemented for this failure type');
  }

  console.log(`\n✗ Loop exhausted after ${MAX_ITERATIONS} iterations\n`);
  return {
    success: false,
    iterations: MAX_ITERATIONS,
    history,
    verdict: 'LOOP_EXHAUSTED'
  };
}

// ============================================================================
// Evolution Insights
// ============================================================================

function analyzeFailures() {
  const traceDir = '.harness/trace/failures';
  if (!fs.existsSync(traceDir)) {
    return { patterns: [], suggestions: [] };
  }

  const files = fs.readdirSync(traceDir).filter(f => f.endsWith('.md'));

  // Group failures by type/rule
  const failures = {};
  for (const file of files) {
    const content = fs.readFileSync(path.join(traceDir, file), 'utf8');
    const typeMatch = content.match(/## Type:\s*(.+)/);
    const type = typeMatch ? typeMatch[1].trim() : 'unknown';

    if (!failures[type]) failures[type] = [];
    failures[type].push(file);
  }

  const patterns = Object.entries(failures)
    .filter(([_, files]) => files.length >= 3)
    .map(([type, files]) => ({
      type,
      count: files.length,
      suggestion: `Rule "${type}" violated ${files.length} times. Consider updating rules.`
    }));

  return { patterns, totalFiles: files.length };
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'run';

  if (action === 'run') {
    const input = args[1] || '{}';
    try {
      const options = JSON.parse(input);
      const result = runLoop(options);
      console.log('\n=== Loop Result ===\n');
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  } else if (action === 'analyze') {
    const insights = analyzeFailures();
    console.log(JSON.stringify(insights, null, 2));
  } else {
    console.error('Usage: loop.js [run|analyze] [options-json]');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for module use
export { runLoop, runValidationPipeline, recordFailure, analyzeFailures };