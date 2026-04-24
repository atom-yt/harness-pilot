#!/usr/bin/env node
/**
 * File System Utilities
 *
 * Provides unified file system operations with consistent error handling.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// ============================================================================
// JSON Operations
// ============================================================================

/**
 * Reads and parses a JSON file.
 *
 * @param {string} filePath - Path to the JSON file
 * @param {Object} defaultValue - Default value if file doesn't exist or is invalid
 * @returns {Object|Array} Parsed JSON or default value
 */
export async function readJSON(filePath, defaultValue = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (defaultValue !== null) return defaultValue;
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Reads and parses a JSON file synchronously.
 *
 * @param {string} filePath - Path to the JSON file
 * @param {Object} defaultValue - Default value if file doesn't exist or is invalid
 * @returns {Object|Array} Parsed JSON or default value
 */
export function readJSONSync(filePath, defaultValue = null) {
  try {
    const content = fsSync.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (defaultValue !== null) return defaultValue;
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Writes data as JSON file with formatting.
 *
 * @param {string} filePath - Path to write to
 * @param {Object|Array} data - Data to write
 * @param {number} indent - JSON indentation (default: 2)
 * @returns {Promise<void>}
 */
export async function writeJSON(filePath, data, indent = 2) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, JSON.stringify(data, null, indent), 'utf8');
}

/**
 * Writes data as JSON file synchronously with formatting.
 *
 * @param {string} filePath - Path to write to
 * @param {Object|Array} data - Data to write
 * @param {number} indent - JSON indentation (default: 2)
 * @returns {void}
 */
export function writeJSONSync(filePath, data, indent = 2) {
  const dir = path.dirname(filePath);
  ensureDirSync(dir);
  fsSync.writeFileSync(filePath, JSON.stringify(data, null, indent), 'utf8');
}

// ============================================================================
// Directory Operations
// ============================================================================

/**
 * Ensures a directory exists, creating it if necessary.
 *
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
export async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Ensures a directory exists, creating it if necessary (sync).
 *
 * @param {string} dirPath - Directory path
 * @returns {void}
 */
export function ensureDirSync(dirPath) {
  try {
    fsSync.accessSync(dirPath);
  } catch {
    fsSync.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Checks if a directory exists.
 *
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>}
 */
export async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a directory exists (sync).
 *
 * @param {string} dirPath - Directory path
 * @returns {boolean}
 */
export function dirExistsSync(dirPath) {
  try {
    const stats = fsSync.statSync(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// ============================================================================
// File Operations
// ============================================================================

/**
 * Reads a text file.
 *
 * @param {string} filePath - Path to the file
 * @param {string} defaultValue - Default value if file doesn't exist
 * @returns {Promise<string>} File content or default value
 */
export async function readFile(filePath, defaultValue = null) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if (defaultValue !== null) return defaultValue;
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Reads a text file synchronously.
 *
 * @param {string} filePath - Path to the file
 * @param {string} defaultValue - Default value if file doesn't exist
 * @returns {string} File content or default value
 */
export function readFileSync(filePath, defaultValue = null) {
  try {
    return fsSync.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (defaultValue !== null) return defaultValue;
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Writes a text file.
 *
 * @param {string} filePath - Path to write to
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
export async function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Writes a text file synchronously.
 *
 * @param {string} filePath - Path to write to
 * @param {string} content - Content to write
 * @returns {void}
 */
export function writeFileSync(filePath, content) {
  const dir = path.dirname(filePath);
  ensureDirSync(dir);
  fsSync.writeFileSync(filePath, content, 'utf8');
}

/**
 * Checks if a file exists.
 *
 * @param {string} filePath - File path
 * @returns {Promise<boolean>}
 */
export async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Checks if a file exists (sync).
 *
 * @param {string} filePath - File path
 * @returns {boolean}
 */
export function fileExistsSync(filePath) {
  try {
    const stats = fsSync.statSync(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Deletes a file if it exists.
 *
 * @param {string} filePath - Path to delete
 * @returns {Promise<boolean>} True if file was deleted
 */
export async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

// ============================================================================
// Path Operations
// ============================================================================

/**
 * Gets file stats with size check.
 *
 * @param {string} filePath - Path to check
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {Promise<{exists: boolean, size: number, tooLarge: boolean}>}
 */
export async function checkFileSize(filePath, maxSize) {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      tooLarge: stats.size > maxSize
    };
  } catch {
    return { exists: false, size: 0, tooLarge: false };
  }
}