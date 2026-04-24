#!/usr/bin/env node
/**
 * Config Loading Utility
 *
 * Provides centralized configuration loading for all tools.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads a JSON configuration file from the config directory.
 *
 * @param {string} filename - The config filename (e.g., 'detection-rules.json')
 * @param {string} baseDir - Base directory to search from (defaults to lib/../../config)
 * @returns {Object|null} Parsed config object or null if not found
 */
export function loadConfig(filename, baseDir = null) {
  try {
    const configPath = baseDir
      ? path.join(baseDir, filename)
      : path.join(__dirname, '..', 'config', filename);
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

/**
 * Loads multiple config files at once.
 *
 * @param {string[]} filenames - Array of config filenames
 * @param {string} baseDir - Optional base directory
 * @returns {Object} Object with config data keyed by filename (without extension)
 */
export function loadConfigs(filenames, baseDir = null) {
  const result = {};
  for (const filename of filenames) {
    const key = filename.replace('.json', '');
    result[key] = loadConfig(filename, baseDir);
  }
  return result;
}

/**
 * Loads config with a default fallback.
 *
 * @param {string} filename - The config filename
 * @param {Object} defaultValue - Default value if config not found
 * @param {string} baseDir - Optional base directory
 * @returns {Object} Config or default value
 */
export function loadConfigWithDefault(filename, defaultValue, baseDir = null) {
  const config = loadConfig(filename, baseDir);
  return config !== null ? config : defaultValue;
}