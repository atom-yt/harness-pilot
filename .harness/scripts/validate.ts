#!/usr/bin/env ts-node
/**
 * Unified Validation Pipeline
 * Runs all validation steps in order
 *
 * Usage: ts-node .harness/scripts/validate.ts [--step <name>]
 */

import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

interface CapabilityConfig {
  jit_test: { enabled: boolean; auto_generate: boolean };
  refactor: { enabled: boolean; threshold: number };
  security: { enabled: boolean };
  e2e: { enabled: boolean; api_e2e_enabled: boolean; browser_e2e_enabled: boolean };
  circular_deps: { enabled: boolean };
  import_restrictions: { enabled: boolean };
  boundary_check: { enabled: boolean };
  semantic_rules: { enabled: boolean };
}

interface PackageJson {
  scripts?: {
    test?: string;
    [key: string]: string | undefined;
  };
  [key: string]: unknown;
}

// Load capabilities configuration if exists
let capabilities: CapabilityConfig | null = null;
try {
  const capabilitiesPath = path.resolve('.harness/capabilities.json');
  if (fs.existsSync(capabilitiesPath)) {
    const content = fs.readFileSync(capabilitiesPath, 'utf8');
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.capabilities === 'object') {
      capabilities = parsed.capabilities as CapabilityConfig;
    }
  }
} catch {
  // Use defaults if config doesn't exist or is invalid
}

const VALIDATION_STEPS: ValidationStep[] = [
  {
    name: 'build',
    description: 'Compile TypeScript',
    command: 'npm run build',
    timeout: 120000,
    skipIfMissing: ['package.json'],
  },
  {
    name: 'lint-arch',
    description: 'Architecture lint',
    command: 'ts-node .harness/scripts/lint-deps.ts',
    timeout: 60000,
  },
  {
    name: 'lint-quality',
    description: 'Quality lint',
    command: 'ts-node .harness/scripts/lint-quality.ts',
    timeout: 60000,
  },
  ...(capabilities?.security?.enabled ? [{
    name: 'security-scan',
    description: 'Security scan',
    command: 'bash .harness/scripts/security-scan.sh .',
    timeout: 60000,
  }] : []),
  {
    name: 'test',
    description: 'Run tests',
    command: 'npm test',
    timeout: 300000,
    skipIfNoTest: true,
  },
  ...(capabilities?.jit_test?.enabled ? [{
    name: 'jit-test-generate',
    description: 'JiT test generation',
    command: 'bash .harness/scripts/generate-test.sh',
    timeout: 60000,
  }] : []),
  ...(capabilities?.e2e?.api_e2e_enabled ? [{
    name: 'e2e-api',
    description: 'API E2E tests',
    command: 'ts-node .harness/e2e/e2e-api.ts',
    timeout: 180000,
  }] : []),
  ...(capabilities?.e2e?.browser_e2e_enabled ? [{
    name: 'e2e-browser',
    description: 'Browser E2E tests',
    command: 'npx playwright test .harness/e2e/e2e-browser.spec.ts',
    timeout: 300000,
  }] : []),
  // TypeScript specific lint checks
  {
    name: 'lint-tsc',
    description: 'TypeScript compilation check',
    command: 'ts-node .harness/scripts/lint-tsc.ts',
    timeout: 120000,
  },
  ...(capabilities?.circular_deps?.enabled ? [{
    name: 'lint-circular-deps',
    description: 'Circular dependency check',
    command: 'ts-node .harness/scripts/lint-circular-deps.ts',
    timeout: 60000,
  }] : []),
  ...(capabilities?.import_restrictions?.enabled ? [{
    name: 'lint-imports',
    description: 'Import restriction check',
    command: 'ts-node .harness/scripts/lint-imports.ts',
    timeout: 60000,
  }] : []),
  ...(capabilities?.boundary_check?.enabled ? [{
    name: 'lint-boundary',
    description: 'Boundary violation check',
    command: 'ts-node .harness/scripts/lint-boundary.ts',
    timeout: 60000,
  }] : []),
  ...(capabilities?.semantic_rules?.enabled ? [{
    name: 'lint-semantic',
    description: 'Semantic rules check',
    command: 'ts-node .harness/scripts/lint-semantic.ts',
    timeout: 60000,
  }] : []),
];

// ============================================================================
// Helper Functions
// ============================================================================

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(path.resolve(filePath));
  } catch {
    return false;
  }
}

// ============================================================================
// Runner
// ============================================================================

interface ValidationStep {
  name: string;
  description: string;
  command: string;
  timeout: number;
  skipIfMissing?: string[];
  skipIfNoTest?: boolean;
}

interface StepResult {
  name: string;
  success: boolean;
  skipped?: boolean;
  duration: number;
  output?: string;
  error?: string;
}

function shouldSkipStep(step: ValidationStep): boolean {
  if (step.skipIfMissing) {
    for (const file of step.skipIfMissing) {
      if (!fileExists(file)) {
        console.log(`   ⊘ ${step.name} skipped (${file} not found)`);
        return true;
      }
    }
  }
  if (step.skipIfNoTest) {
    // Check if package.json has a valid test script
    if (fileExists('package.json')) {
      try {
        const pkg: PackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const hasTestScript = pkg.scripts?.test && typeof pkg.scripts.test === 'string' && pkg.scripts.test.length > 0;
        if (!hasTestScript) {
          console.log(`   ⊘ ${step.name} skipped (no valid test script in package.json)`);
          return true;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log(`   ⊘ ${step.name} skipped (invalid package.json: ${errorMessage})`);
        return true;
      }
    } else {
      console.log(`   ⊘ ${step.name} skipped (no package.json)`);
      return true;
    }
  }
  return false;
}

async function runStep(step: ValidationStep): Promise<StepResult> {
  const start = Date.now();

  if (shouldSkipStep(step)) {
    return {
      name: step.name,
      success: true,
      skipped: true,
      duration: 0,
    };
  }

  return new Promise((resolve) => {
    console.log(`\n🔧 Running ${step.name}...`);
    console.log(`   Command: ${step.command}`);

    const options: SpawnOptions = {
      shell: true,
      stdio: 'inherit',
      timeout: step.timeout,
    };

    const child = spawn(step.command, options);

    child.on('close', (code) => {
      const duration = Math.round((Date.now() - start) / 1000);

      if (code === 0) {
        console.log(`   ✓ ${step.name} passed (${duration}s)`);
        resolve({
          name: step.name,
          success: true,
          duration,
        });
      } else {
        console.log(`   ✗ ${step.name} failed (${duration}s)`);
        resolve({
          name: step.name,
          success: false,
          duration,
          error: `Process exited with code ${code}`,
        });
      }
    });

    child.on('error', (err) => {
      const duration = Math.round((Date.now() - start) / 1000);
      console.log(`   ✗ ${step.name} failed (${duration}s)`);
      resolve({
        name: step.name,
        success: false,
        duration,
        error: err.message,
      });
    });
  });
}

async function main(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('          Harness Validation Pipeline');
  console.log('═══════════════════════════════════════════════════════\n');

  const results: StepResult[] = [];
  const stepArg = process.argv.indexOf('--step');
  const stepFilter = stepArg > -1 ? process.argv[stepArg + 1] : null;

  for (const step of VALIDATION_STEPS) {
    if (stepFilter && step.name !== stepFilter) {
      continue;
    }

    const result = await runStep(step);
    results.push(result);

    if (!result.success) {
      console.log(`\n❌ Validation failed at step: ${step.name}`);
      console.log(`   ${result.error || 'Unknown error'}\n`);
      process.exit(1);
    }
  }

  // Summary
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('                Validation Summary');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const result of results) {
    if (result.skipped) {
      console.log(`  ⊘ ${result.name.padEnd(15)} skipped`);
    } else {
      const icon = result.success ? '✓' : '✗';
      console.log(`  ${icon} ${result.name.padEnd(15)} ${result.duration}s`);
    }
  }

  console.log(`\n  Total: ${totalDuration}s`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('✓ All validation steps passed!\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});