#!/usr/bin/env node
/**
 * Change Tracker Tool
 *
 * Tracks code changes across harness-apply runs for precise incremental updates.
 * Detects modified/added/deleted files and identifies affected rules.
 */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { getManifestPath } from '../../../lib/constants.js';

class ChangeTracker {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.manifestPath = getManifestPath(projectDir);
  }

  /**
   * Calculate SHA256 hash of a file
   */
  getFileHash(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  /**
   * Load existing manifest
   */
  loadManifest() {
    try {
      return JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Detect code changes using git diff
   */
  async detectChanges(baseBranch = 'main') {
    const { execSync } = await import('child_process');

    // Get changed files from git
    const diffOutput = execSync(
      `git diff --name-status ${baseBranch}...HEAD`,
      { cwd: this.projectDir, encoding: 'utf8' }
    );

    const changes = {
      modified: [],
      added: [],
      deleted: []
    };

    // Parse git diff output
    // Format: M\t src/file.ts, A\t new/file.ts, D\t old/file.ts
    for (const line of diffOutput.trim().split('\n')) {
      if (!line) continue;

      const parts = line.split('\t');
      const status = parts[0]?.[0];
      const filePath = parts[parts.length - 1]; // Handle filenames with spaces

      if (status === 'M' || status === 'MM') {
        changes.modified.push(filePath);
      } else if (status === 'A') {
        changes.added.push(filePath);
      } else if (status === 'D' || status === 'DD') {
        changes.deleted.push(filePath);
      }
    }

    return changes;
  }

  /**
   * Analyze which rules are affected by the changes
   */
  analyzeAffectedRules(changes) {
    const affectedRules = new Set();

    // Language-specific file extensions
    const languageExtensions = {
      typescript: ['.ts', '.tsx'],
      javascript: ['.js', '.jsx'],
      python: ['.py'],
      go: ['.go'],
      java: ['.java']
    };

    const manifest = this.loadManifest();
    const lang = manifest?.language || 'typescript';
    const exts = languageExtensions[lang] || ['.ts'];

    for (const file of [...changes.modified, ...changes.added]) {
      // Check file type to infer rules to trigger
      if (exts.some(ext => file.endsWith(ext))) {
        // Source code changes → affect lint rules
        affectedRules.add('lint-deps');
        affectedRules.add('lint-imports');
        affectedRules.add('lint-quality');

        // Source changes (non-test) affect JiT test generation
        if (!file.includes('.test.') && !file.includes('.spec.')) {
          affectedRules.add('jit-test');
        }
      }

      // Detect architecture-related files
      if (file.includes('/types/') || file.includes('/models/')) {
        affectedRules.add('architecture');
      }
    }

    return Array.from(affectedRules);
  }

  /**
   * Update manifest's changeLog and checkpoints
   */
  async updateChangeLog(changes) {
    const manifest = this.loadManifest();

    if (!manifest) {
      console.error('❌ Manifest not found, cannot update change log');
      return { success: false, error: 'Manifest not found' };
    }

    const affectedRules = this.analyzeAffectedRules(changes);

    // Merge with existing changeLog
    const previousLog = manifest.changeLog || {
      filesModified: [],
      filesAdded: [],
      filesDeleted: [],
      rulesAffected: [],
      timestamp: null
    };

    // Deduplicate and merge
    const uniqueModified = [...new Set([...previousLog.filesModified, ...changes.modified])];
    const uniqueAdded = [...new Set([...previousLog.filesAdded, ...changes.added])];
    const uniqueDeleted = [...new Set([...previousLog.filesDeleted, ...changes.deleted])];
    const uniqueRules = [...new Set([...previousLog.rulesAffected, ...affectedRules])];

    // Update manifest
    manifest.changeLog = {
      filesModified: uniqueModified,
      filesAdded: uniqueAdded,
      filesDeleted: uniqueDeleted,
      rulesAffected: uniqueRules,
      timestamp: new Date().toISOString()
    };

    // Update checkpoints with git info and file hashes
    const { execSync } = await import('child_process');
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    manifest.checkpoints = {
      git: {
        lastCommit: currentCommit,
        branch: currentBranch
      },
      fileHash: await this.updateFileHashes(changes),
      lastCheck: new Date().toISOString()
    };

    // Write back to file
    fs.writeFileSync(
      this.manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    console.log(`✓ Change log updated: ${changes.modified.length + changes.added.length} changes, ${affectedRules.length} rules affected`);
    console.log(`  - Modified: ${changes.modified.length} files`);
    console.log(`  - Added: ${changes.added.length} files`);
    console.log(`  - Deleted: ${changes.deleted.length} files`);
    console.log(`  - Affected rules: ${affectedRules.join(', ')}`);

    return {
      success: true,
      changes,
      affectedRules,
      commit: currentCommit
    };
  }

  /**
   * Update file hash tracking
   */
  async updateFileHashes(changes) {
    const manifest = this.loadManifest();
    const existingHashes = manifest.checkpoints?.fileHash || {};
    const newHashes = { ...existingHashes };

    // Remove hashes for deleted files
    for (const file of changes.deleted) {
      delete newHashes[file];
    }

    // Update hashes for added/modified files
    for (const file of [...changes.added, ...changes.modified]) {
      const fullPath = path.join(this.projectDir, file);
      if (fs.existsSync(fullPath)) {
        newHashes[file] = this.getFileHash(fullPath);
      }
    }

    return newHashes;
  }

  /**
   * Check if a file has changed (by hash comparison)
   */
  hasFileChanged(filePath) {
    const manifest = this.loadManifest();
    const hashes = manifest.checkpoints?.fileHash || {};

    if (!(filePath in hashes)) {
      return true; // New file
    }

    const fullPath = path.join(this.projectDir, filePath);
    const currentHash = this.getFileHash(fullPath);

    return hashes[filePath] !== currentHash;
  }

  /**
   * Get files that need revalidation
   */
  getFilesToRevalidate() {
    const manifest = this.loadManifest();
    const changes = manifest?.changeLog || {};

    // Return recently changed files, limit to prevent excessive size
    return [
      ...(changes.filesModified || []).slice(-50),
      ...(changes.filesAdded || []).slice(-50)
    ];
  }

  /**
   * Cleanup change log (optional, prevents manifest bloat)
   */
  async cleanupChangeLog(maxAgeDays = 30) {
    const manifest = this.loadManifest();

    if (!manifest.changeLog?.timestamp) {
      return { cleaned: false, reason: 'No change log timestamp' };
    }

    const logDate = new Date(manifest.changeLog.timestamp);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    if (logDate < cutoffDate) {
      // Reset changeLog, keeping only recent commit info
      manifest.changeLog = {
        filesModified: [],
        filesAdded: [],
        filesDeleted: [],
        rulesAffected: [],
        timestamp: new Date().toISOString()
      };

      // Keep checkpoints for hash comparison
      if (manifest.checkpoints) {
        manifest.checkpoints.lastCheck = new Date().toISOString();
      }

      fs.writeFileSync(
        this.manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf8'
      );

      console.log(`✓ Change log cleaned (older than ${maxAgeDays} days)`);
      return { cleaned: true, cutoffDate };
    }

    return { cleaned: false, reason: 'Log is recent' };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Change Tracker Tool

Commands:
  detect               - Detect changes since last apply
  update               - Update manifest change log
  hasChanged <file>    - Check if file has changed
  filesToRevalidate   - Get files needing revalidation
  cleanup [days]        - Clean old change logs

Examples:
  node change-tracker.js detect
  node change-tracker.js update
  node change-tracker.js hasChanged src/api/user.ts
  node change-tracker.js cleanup 30
`);
    return;
  }

  try {
    const tracker = new ChangeTracker(process.cwd());

    // Map command to method name
    const commandMap = {
      'detect': 'detectChanges',
      'update': 'updateChangeLog',
      'hasChanged': 'hasFileChanged',
      'files-to-revalidate': 'getFilesToRevalidate',
      'cleanup': 'cleanupChangeLog'
    };

    const methodName = commandMap[command.toLowerCase()];
    if (!methodName || typeof tracker[methodName] !== 'function') {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }

    const methodArgs = args.slice(1);
    let result;

    if (methodName === 'detectChanges') {
      result = await tracker.detectChanges(...methodArgs);
    } else if (methodName === 'updateChangeLog') {
      const changes = await tracker.detectChanges();
      result = await tracker.updateChangeLog(changes);
    } else if (methodName === 'hasFileChanged') {
      result = tracker.hasFileChanged(methodArgs[0]);
    } else if (methodName === 'getFilesToRevalidate') {
      result = tracker.getFilesToRevalidate();
    } else if (methodName === 'cleanupChangeLog') {
      result = await tracker.cleanupChangeLog(parseInt(methodArgs[0]) || 30);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }, null, 2));
    process.exit(1);
  }
}

// Export for module use
export { ChangeTracker };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}