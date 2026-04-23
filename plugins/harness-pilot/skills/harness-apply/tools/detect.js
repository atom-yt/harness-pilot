#!/usr/bin/env node
/**
 * Project Detection Tool
 *
 * Detects project language, framework, structure, and harness status.
 * Outputs JSON for use by harness-apply.
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
    const configPath = path.join(__dirname, '../config', filename);
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    return null;
  }
}

const detectionRules = loadConfig('detection-rules.json') || {};

// ============================================================================
// Detection Functions
// ============================================================================

function detectLanguage() {
  for (const [lang, rules] of Object.entries(detectionRules.languages || {})) {
    if (rules.files) {
      for (const file of rules.files) {
        if (fs.existsSync(file)) {
          // Check exclude rules for JS (if tsconfig.json exists, prefer TS)
          if (lang === 'javascript' && rules.exclude) {
            if (rules.exclude.some(excl => fs.existsSync(excl))) {
              continue;
            }
          }
          return lang;
        }
      }
    }
  }
  return 'unknown';
}

function detectFramework(language) {
  if (language === 'unknown') return 'none';

  const langRules = detectionRules.languages?.[language];
  if (!langRules) return 'none';

  // Check framework by dependencies in package.json
  if (fs.existsSync('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const [fw, fwRules] of Object.entries(detectionRules.frameworks || {})) {
        if (fwRules.language !== language) continue;
        if (fwRules.dependencies) {
          if (fwRules.dependencies.some(dep => deps[dep])) {
            return fw;
          }
        }
      }
    } catch (e) {
      // Package.json parse error, continue
    }
  }

  // Check framework by files
  for (const [fw, fwRules] of Object.entries(detectionRules.frameworks || {})) {
    if (fwRules.language !== language) continue;
    if (fwRules.files) {
      for (const file of fwRules.files) {
        if (fs.existsSync(file)) {
          return fw;
        }
      }
    }
  }

  return 'none';
}

function detectDirectories() {
  const dirs = [];

  const sourceDirs = detectionRules.directories?.source || [];
  for (const dir of sourceDirs) {
    if (fs.existsSync(dir)) {
      dirs.push(dir);
    }
  }

  return dirs;
}

function detectHarnessStatus() {
  const manifestPath = '.harness/manifest.json';

  if (!fs.existsSync('.harness')) {
    return { exists: false, lastApply: null };
  }

  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return {
        exists: true,
        lastApply: manifest.lastApplied || null,
        version: manifest.version || null
      };
    } catch (e) {
      return { exists: true, lastApply: null, version: null };
    }
  }

  return { exists: true, lastApply: null };
}

// ============================================================================
// Main Detection
// ============================================================================

function detect() {
  const language = detectLanguage();
  const framework = detectFramework(language);
  const directories = detectDirectories();
  const harness = detectHarnessStatus();

  const result = {
    language,
    framework,
    structure: {
      sourceDirs: directories,
      hasTypesDir: fs.existsSync('types/'),
      hasUtilsDir: fs.existsSync('utils/'),
      hasComponentsDir: fs.existsSync('components/'),
      hasServicesDir: fs.existsSync('services/')
    },
    harness,
    timestamp: new Date().toISOString()
  };

  return result;
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const result = detect();
  console.log(JSON.stringify(result, null, 2));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for module use
export { detect };