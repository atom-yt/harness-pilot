#!/usr/bin/env node
/**
 * Language Detection Utility
 *
 * Provides unified project language detection across all tools.
 */

import fs from 'fs';
import path from 'path';

/**
 * Detection rules for various languages and frameworks.
 * Can be extended or loaded from config.
 */
const LANGUAGE_RULES = {
  typescript: {
    files: ['tsconfig.json'],
    extensions: ['.ts', '.tsx'],
    frameworks: ['react', 'nextjs', 'vue', 'angular']
  },
  javascript: {
    files: ['package.json'],
    exclude: ['tsconfig.json'], // Prefer TypeScript if both exist
    extensions: ['.js', '.jsx'],
    frameworks: ['react', 'nextjs', 'vue', 'angular', 'express']
  },
  java: {
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    extensions: ['.java'],
    frameworks: ['spring', 'springboot', 'springmvc']
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'setup.py'],
    extensions: ['.py'],
    frameworks: ['django', 'flask', 'fastapi']
  },
  go: {
    files: ['go.mod'],
    extensions: ['.go'],
    frameworks: ['gin', 'echo', 'fiber']
  }
};

/**
 * Detects the project language by checking for language-specific files.
 *
 * @param {string} projectDir - Directory to analyze (defaults to cwd)
 * @returns {string} Detected language or 'unknown'
 */
export function detectLanguage(projectDir = process.cwd()) {
  const dir = projectDir || process.cwd();

  // Check TypeScript first (has priority over JS)
  const tsRules = LANGUAGE_RULES.typescript;
  for (const file of tsRules.files) {
    if (fs.existsSync(path.join(dir, file))) {
      return 'typescript';
    }
  }

  // Check JavaScript (exclude if TypeScript exists)
  const jsRules = LANGUAGE_RULES.javascript;
  for (const file of jsRules.files) {
    if (fs.existsSync(path.join(dir, file))) {
      // Check exclude rules
      if (jsRules.exclude) {
        const hasExcluded = jsRules.exclude.some(excl =>
          fs.existsSync(path.join(dir, excl))
        );
        if (!hasExcluded) {
          return 'javascript';
        }
      } else {
        return 'javascript';
      }
    }
  }

  // Check other languages
  for (const [lang, rules] of Object.entries(LANGUAGE_RULES)) {
    if (lang === 'typescript' || lang === 'javascript') continue; // Already checked

    for (const file of rules.files) {
      if (fs.existsSync(path.join(dir, file))) {
        return lang;
      }
    }
  }

  return 'unknown';
}

/**
 * Gets file extensions for a detected language.
 *
 * @param {string} language - Language name
 * @returns {string[]} Array of file extensions
 */
export function getExtensions(language) {
  return LANGUAGE_RULES[language]?.extensions || [];
}

/**
 * Gets available frameworks for a language.
 *
 * @param {string} language - Language name
 * @returns {string[]} Array of framework names
 */
export function getFrameworks(language) {
  return LANGUAGE_RULES[language]?.frameworks || [];
}

/**
 * Checks if a file extension matches a language.
 *
 * @param {string} filename - File to check
 * @param {string} language - Language name
 * @returns {boolean} True if extension matches
 */
export function isLanguageFile(filename, language) {
  const ext = path.extname(filename);
  const extensions = getExtensions(language);
  return extensions.includes(ext);
}

/**
 * Detects the framework for a language by checking dependencies.
 *
 * @param {string} language - Language name
 * @param {string} projectDir - Directory to analyze
 * @returns {string} Detected framework or 'none'
 */
export function detectFramework(language, projectDir = process.cwd()) {
  if (language === 'unknown') return 'none';

  const dir = projectDir || process.cwd();
  const frameworks = getFrameworks(language);

  // Check package.json for JS/TS
  if ((language === 'javascript' || language === 'typescript') && fs.existsSync(path.join(dir, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const fw of frameworks) {
        const depKey = fw === 'nextjs' ? 'next' : fw;
        if (deps[depKey]) {
          return fw;
        }
      }
    } catch {
      // Parse error, continue
    }
  }

  // Check Java build files
  if (language === 'java') {
    if (fs.existsSync(path.join(dir, 'pom.xml'))) {
      try {
        const pom = fs.readFileSync(path.join(dir, 'pom.xml'), 'utf8');
        if (pom.includes('spring-boot')) return 'springboot';
        if (pom.includes('spring-web')) return 'springmvc';
        if (pom.includes('spring')) return 'spring';
      } catch {}
    }
  }

  return 'none';
}

/**
 * Gets all supported languages.
 *
 * @returns {string[]} Array of language names
 */
export function getSupportedLanguages() {
  return Object.keys(LANGUAGE_RULES);
}