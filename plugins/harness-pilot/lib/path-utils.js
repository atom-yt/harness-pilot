#!/usr/bin/env node
/**
 * Path Utilities
 *
 * Provides cross-platform path handling utilities.
 */

import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Gets the module filename from import.meta.url.
 * Works in both ES Modules and provides a clean API.
 *
 * @param {string} importMetaUrl - import.meta.url value
 * @returns {string} Absolute file path
 */
export function getFilename(importMetaUrl) {
  return fileURLToPath(importMetaUrl);
}

/**
 * Gets the module directory from import.meta.url.
 *
 * @param {string} importMetaUrl - import.meta.url value
 * @returns {string} Absolute directory path
 */
export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}

/**
 * Gets the standard __filename and __dirname from import.meta.url.
 * Returns an object with both values.
 *
 * @param {string} importMetaUrl - import.meta.url value
 * @returns {Object} { __filename, __dirname }
 */
export function getPathInfo(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  return {
    __filename,
    __dirname: path.dirname(__filename)
  };
}

/**
 * Normalizes a path for cross-platform compatibility.
 * Handles Windows/Unix path differences.
 *
 * @param {string} filePath - Path to normalize
 * @returns {string} Normalized path
 */
export function normalizePath(filePath) {
  return path.normalize(filePath);
}

/**
 * Joins path segments using the platform-specific separator.
 *
 * @param {...string} segments - Path segments to join
 * @returns {string} Joined path
 */
export function joinPath(...segments) {
  return path.join(...segments);
}

/**
 * Resolves a path to an absolute path.
 *
 * @param {...string} segments - Path segments to resolve
 * @returns {string} Absolute path
 */
export function resolvePath(...segments) {
  return path.resolve(...segments);
}

/**
 * Gets the relative path from one file/directory to another.
 *
 * @param {string} from - Source path
 * @param {string} to - Destination path
 * @returns {string} Relative path
 */
export function getRelativePath(from, to) {
  return path.relative(from, to);
}