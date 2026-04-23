#!/usr/bin/env ts-node
/**
 * TypeScript Compilation and Lint Checker
 * Runs TypeScript compiler and lint tools (oxlint, eslint)
 *
 * Usage: ts-node .harness/scripts/lint-tsc.ts [--fix]
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface LintConfig {
  useOxlint: boolean;
  useEslint: boolean;
  strictMode: boolean;
  noImplicitAny: boolean;
  strictNullChecks: boolean;
  reportUnusedVariables: boolean;
}

const config: LintConfig = {
  useOxlint: true,
  useEslint: false, // oxlint is faster
  strictMode: true,
  noImplicitAny: true,
  strictNullChecks: true,
  reportUnusedVariables: true,
};

// ============================================================================
// TypeScript Compiler Check
// ============================================================================

interface CheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

async function runTsc(): Promise<CheckResult> {
  return new Promise((resolve) => {
    console.log('🔨 Running TypeScript compiler...\n');

    const tsc = spawn('npx', ['tsc', '--noEmit', '--pretty'], {
      shell: true,
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    tsc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    tsc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    tsc.on('close', (code) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (code !== 0) {
        const lines = (stdout + stderr).split('\n');
        for (const line of lines) {
          if (line.includes('error TS')) {
            errors.push(line);
          } else if (line.includes('warning')) {
            warnings.push(line);
          }
        }
      }

      resolve({
        success: code === 0,
        errors,
        warnings,
      });
    });
  });
}

// ============================================================================
// Oxlint Check
// ============================================================================

async function runOxlint(): Promise<CheckResult> {
  if (!config.useOxlint) {
    return { success: true, errors: [], warnings: [] };
  }

  return new Promise((resolve) => {
    console.log('⚡ Running oxlint (ultra-fast linter)...\n');

    const oxlint = spawn('npx', ['oxlint', '.'], {
      shell: true,
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    oxlint.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    oxlint.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    oxlint.on('close', (code) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const output = stdout + stderr;
      if (output.trim()) {
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.includes('error') || line.includes('Error')) {
            errors.push(line);
          } else if (line.includes('warn') || line.includes('Warning')) {
            warnings.push(line);
          }
        }
      }

      resolve({
        success: code === 0,
        errors,
        warnings,
      });
    });
  });
}

// ============================================================================
// ESLint Check
// ============================================================================

async function runEslint(): Promise<CheckResult> {
  if (!config.useEslint) {
    return { success: true, errors: [], warnings: [] };
  }

  return new Promise((resolve) => {
    console.log('📏 Running ESLint...\n');

    const eslint = spawn('npx', ['eslint', '.', '--ext', '.ts,.tsx'], {
      shell: true,
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    eslint.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    eslint.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    eslint.on('close', (code) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (code !== 0) {
        const lines = (stdout + stderr).split('\n');
        for (const line of lines) {
          if (line.includes('error') || line.includes('Error')) {
            errors.push(line);
          } else if (line.includes('warn') || line.includes('Warning')) {
            warnings.push(line);
          }
        }
      }

      resolve({
        success: code === 0,
        errors,
        warnings,
      });
    });
  });
}

// ============================================================================
// Type Coverage Check
// ============================================================================

async function checkTypeCoverage(): Promise<void> {
  console.log('📊 Checking type coverage...\n');

  // Check if type-coverage package exists
  try {
    const typeCov = spawn('npx', ['type-coverage', '--detail'], {
      shell: true,
      cwd: process.cwd(),
    });

    typeCov.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    await new Promise<void>((resolve) => {
      typeCov.on('close', () => resolve());
    });
  } catch {
    console.log('   ℹ type-coverage not installed, skipping\n');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('          TypeScript Compilation & Lint');
  console.log('═══════════════════════════════════════════════════════\n');

  const results: { name: string; result: CheckResult }[] = [];

  // Run TypeScript compiler
  const tscResult = await runTsc();
  results.push({ name: 'TypeScript Compiler', result: tscResult });
  console.log(tscResult.success ? '   ✓ tsc passed\n' : '   ✗ tsc failed\n');

  // Run oxlint
  const oxlintResult = await runOxlint();
  results.push({ name: 'oxlint', result: oxlintResult });
  console.log(oxlintResult.success ? '   ✓ oxlint passed\n' : '   ✗ oxlint failed\n');

  // Run ESLint (if enabled)
  if (config.useEslint) {
    const eslintResult = await runEslint();
    results.push({ name: 'ESLint', result: eslintResult });
    console.log(eslintResult.success ? '   ✓ eslint passed\n' : '   ✗ eslint failed\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('                Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  let hasErrors = false;

  for (const { name, result } of results) {
    const icon = result.success ? '✓' : '✗';
    console.log(`  ${icon} ${name}`);
    console.log(`     Errors: ${result.errors.length}`);
    console.log(`     Warnings: ${result.warnings.length}`);

    if (result.errors.length > 0) {
      hasErrors = true;
      console.log('\n  Errors:');
      result.errors.slice(0, 10).forEach(e => console.log(`    - ${e}`));
      if (result.errors.length > 10) {
        console.log(`    ... and ${result.errors.length - 10} more`);
      }
    }

    console.log('');
  }

  if (hasErrors) {
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }

  console.log('✓ All TypeScript compilation and lint checks passed!\n');
  process.exit(0);
}

main();
