#!/usr/bin/env node
/**
 * Constants
 *
 * Centralized constants for all harness-pilot tools.
 */

import path from 'path';

// ============================================================================
// Harness Paths
// ============================================================================

/**
 * Harness root directory name
 */
export const HARNESS_DIR = '.harness';

/**
 * Gets the harness root directory path.
 *
 * @param {string} projectDir - Project directory (defaults to cwd)
 * @returns {string} Absolute path to .harness directory
 */
export function getHarnessRoot(projectDir = process.cwd()) {
  return path.join(projectDir || process.cwd(), HARNESS_DIR);
}

/**
 * Gets path to harness manifest file.
 *
 * @param {string} projectDir - Project directory
 * @returns {string} Path to manifest.json
 */
export function getManifestPath(projectDir = process.cwd()) {
  return path.join(getHarnessRoot(projectDir), 'manifest.json');
}

// ============================================================================
// Harness Subdirectories
// ============================================================================

/**
 * All standard harness subdirectories.
 */
export const HARNESS_SUBDIRS = {
  docs: 'docs',
  scripts: 'scripts',
  memory: 'memory',
  trace: 'trace',
  rules: 'rules',
  tasks: 'tasks',
  handoffs: 'handoffs'
};

/**
 * Gets a path to a harness subdirectory.
 *
 * @param {string} subdir - Subdirectory name
 * @param {string} projectDir - Project directory
 * @returns {string} Absolute path to subdirectory
 */
export function getHarnessPath(subdir, projectDir = process.cwd()) {
  return path.join(getHarnessRoot(projectDir), subdir);
}

/**
 * Gets path to docs directory.
 */
export function getDocsPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.docs, projectDir);
}

/**
 * Gets path to scripts directory.
 */
export function getScriptsPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.scripts, projectDir);
}

/**
 * Gets path to memory directory.
 */
export function getMemoryPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.memory, projectDir);
}

/**
 * Gets path to trace directory.
 */
export function getTracePath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.trace, projectDir);
}

/**
 * Gets path to rules directory.
 */
export function getRulesPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.rules, projectDir);
}

/**
 * Gets path to tasks directory.
 */
export function getTasksPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.tasks, projectDir);
}

/**
 * Gets path to handoffs directory.
 */
export function getHandoffsPath(projectDir = process.cwd()) {
  return getHarnessPath(HARNESS_SUBDIRS.handoffs, projectDir);
}

// ============================================================================
// Common Project Directories
// ============================================================================

/**
 * Standard project directory names that might exist.
 */
export const COMMON_DIRS = {
  types: 'types',
  utils: 'utils',
  components: 'components',
  services: 'services',
  src: 'src',
  lib: 'lib',
  test: 'test',
  tests: 'tests'
};

// ============================================================================
// File Extensions
// ============================================================================

/**
 * Common file extensions by language.
 */
export const FILE_EXTENSIONS = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs'],
  python: ['.py'],
  java: ['.java'],
  go: ['.go'],
  rust: ['.rs'],
  csharp: ['.cs']
};

// ============================================================================
// Config Files
// ============================================================================

/**
 * Config files by language/framework.
 */
export const CONFIG_FILES = {
  typescript: ['tsconfig.json', 'tsconfig.build.json'],
  javascript: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'],
  python: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile', 'poetry.lock'],
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle'],
  go: ['go.mod', 'go.sum'],
  rust: ['Cargo.toml', 'Cargo.lock'],
  csharp: ['.csproj', '.sln']
};

// ============================================================================
// Analysis Thresholds
// ============================================================================

/**
 * Default thresholds for various analysis metrics.
 */
export const THRESHOLDS = {
  // Coverage threshold percentage
  coverage: 80,
  // Relative import count before flagging as issue
  relativeImports: 10,
  // Maximum file size to analyze (bytes)
  maxFileSize: 10 * 1024 * 1024,
  // Maximum history entries
  historySize: 30
};

// ============================================================================
// Ralph Wiggum Loop Constants
// ============================================================================

/**
 * Default Ralph Wiggum Loop configuration.
 */
export const RALPH_WIGGUM = {
  defaultMaxIterations: 3,
  iterationPrefix: 'iteration-',
  checkpointPrefix: 'cp_',
  sessionPrefix: 'sess_',
  taskPrefix: 'task_',
  latestLink: '.latest',
  checkpointFile: 'checkpoint.json',
  taskFile: 'task.json',
  nextStepsFile: 'next-steps.json',
  agentStateFile: 'agent-state.json',
  resumeFile: 'resume.json'
};

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Environment variable names.
 */
export const ENV = {
  HARNESS_ROOT: 'HARNESS_ROOT',
  COVERAGE_THRESHOLD: 'COVERAGE_THRESHOLD',
  MAX_TESTS_PER_FUNCTION: 'MAX_TESTS_PER_FUNCTION',
  TEST_FRAMEWORK: 'TEST_FRAMEWORK',
  CLAUDE_PLUGIN_ROOT: 'CLAUDE_PLUGIN_ROOT'
};