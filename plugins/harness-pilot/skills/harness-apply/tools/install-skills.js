#!/usr/bin/env node
/**
 * Skills Installation Tool
 *
 * Checks and installs default ducc skills based on configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';
import { spawn } from 'child_process';

const __dirname = getDirname(import.meta.url);
// Load config from the harness-apply/config directory
const configDir = path.join(__dirname, '..', 'config');
const defaults = loadConfig('defaults.json', configDir) || {};
const duccConfig = defaults.ducc || {};

/**
 * Check if a skill is already installed
 */
async function isSkillInstalled(skillName) {
  return new Promise((resolve) => {
    const command = spawn('ducc', ['skill', 'list'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';

    command.stdout.on('data', (data) => {
      output += data.toString();
    });

    command.on('close', (code) => {
      // Check if skill name appears in the list
      const installed = output.toLowerCase().includes(skillName.toLowerCase());
      resolve(installed);
    });

    command.on('error', () => {
      // ducc command not found, assume skill not installed
      resolve(false);
    });
  });
}

/**
 * Check if ducc command is available
 */
async function isDuccAvailable() {
  return new Promise((resolve) => {
    const command = spawn('ducc', ['--version'], {
      stdio: 'pipe',
      shell: true
    });

    command.on('close', (code) => {
      resolve(code === 0);
    });

    command.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Install a skill
 */
async function installSkill(skill) {
  const { name, installCommand, required, postInstallAction, postInstallHint } = skill;

  const alreadyInstalled = await isSkillInstalled(name);

  if (alreadyInstalled) {
    return { success: true, name, status: 'already_installed', message: `${name} 已安装` };
  }

  return new Promise((resolve) => {
    const command = spawn('ducc', ['skill', 'install', name], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    command.stdout.on('data', (data) => {
      output += data.toString();
    });

    command.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    command.on('close', (code) => {
      if (code === 0) {
        let message = `${name} 安装成功`;
        if (postInstallAction) {
          message += `\n💡 后续操作: ${postInstallAction}`;
        }
        if (postInstallHint) {
          message += `\n💡 提示: ${postInstallHint}`;
        }
        resolve({ success: true, name, status: 'installed', message });
      } else {
        resolve({
          success: false,
          name,
          status: 'failed',
          message: `${name} 安装失败: ${errorOutput || '未知错误'}`
        });
      }
    });

    command.on('error', (err) => {
      resolve({
        success: false,
        name,
        status: 'failed',
        message: `${name} 安装失败: ducc 命令不可用 (${err.message})`
      });
    });
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'check';

  if (!duccConfig.autoInstallSkills) {
    console.log(JSON.stringify({ success: true, message: 'Ducc skills auto-install is disabled', skills: [] }));
    return;
  }

  const duccAvailable = await isDuccAvailable();

  if (!duccAvailable) {
    console.log(JSON.stringify({
      success: false,
      message: 'ducc 命令不可用，跳过 skills 安装',
      skills: []
    }));
    return;
  }

  const skills = duccConfig.skills || [];

  if (action === 'list') {
    console.log(JSON.stringify({ success: true, skills }));
    return;
  }

  if (action === 'check') {
    // Check installation status without installing
    const results = [];
    for (const skill of skills) {
      const installed = await isSkillInstalled(skill.name);
      results.push({
        name: skill.name,
        required: skill.required,
        installed,
        url: skill.url
      });
    }
    console.log(JSON.stringify({ success: true, skills: results }));
    return;
  }

  if (action === 'install') {
    // Install all skills
    const results = [];

    for (const skill of skills) {
      if (skill.required !== false) { // Install by default (required or optional)
        const result = await installSkill(skill);
        results.push(result);
      }
    }

    const failed = results.filter(r => !r.success);
    const successCount = results.filter(r => r.success).length;

    console.log(JSON.stringify({
      success: failed.length === 0,
      message: `Skills 安装完成: ${successCount}/${results.length} 成功`,
      skills: results
    }));
    return;
  }

  console.log(JSON.stringify({
    success: false,
    message: `Unknown action: ${action}`
  }));
}

// Run if executed directly
const currentFilePath = fileURLToPath(import.meta.url);
if (currentFilePath === path.resolve(process.argv[1])) {
  main().catch(err => {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  });
}

export { isSkillInstalled, installSkill, isDuccAvailable };
