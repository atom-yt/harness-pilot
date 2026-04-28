#!/usr/bin/env node
/**
 * Complexity Analyzer
 *
 * Analyzes task complexity to determine the appropriate development mode.
 * Factors: file count, scope breadth, dependency impact, risk level, uncertainty.
 */

import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../../lib/config.js';
import { getDirname } from '../../../lib/path-utils.js';

const __dirname = getDirname(import.meta.url);

const modeConfig = loadConfig('development-modes.json') || {};
const complexityConfig = modeConfig.complexity || {};

// ============================================================================
// Complexity Analysis Functions
// ============================================================================

/**
 * Analyze file count complexity
 */
function analyzeFileCount(files = []) {
  const count = Array.isArray(files) ? files.length : 0;
  const thresholds = complexityConfig.factors?.find(f => f.id === 'file-count')?.thresholds || {};

  let score = 1;
  if (count > thresholds.high) score = 5;
  else if (count > thresholds.medium) score = 3;
  else if (count > thresholds.low) score = 2;

  return {
    factor: 'file-count',
    score,
    details: { count, thresholds }
  };
}

/**
 * Analyze scope breadth
 */
function analyzeScopeBreadth(scope = 'single-component') {
  const factor = complexityConfig.factors?.find(f => f.id === 'scope-breadth') || {};
  const values = factor.values || {};

  const score = values[scope] || 3;

  return {
    factor: 'scope-breadth',
    score,
    details: { scope, weight: factor.weight || 2 }
  };
}

/**
 * Analyze dependency impact
 */
function analyzeDependencyImpact(impact = 'isolated') {
  const factor = complexityConfig.factors?.find(f => f.id === 'dependency-impact') || {};
  const values = factor.values || {};

  const score = values[impact] || 1;

  return {
    factor: 'dependency-impact',
    score,
    details: { impact, weight: factor.weight || 2 }
  };
}

/**
 * Analyze risk level
 */
function analyzeRiskLevel(risk = 'non-critical') {
  const factor = complexityConfig.factors?.find(f => f.id === 'risk-level') || {};
  const values = factor.values || {};

  const score = values[risk] || 1;

  return {
    factor: 'risk-level',
    score,
    details: { risk, weight: factor.weight || 3 }
  };
}

/**
 * Analyze requirements uncertainty
 */
function analyzeUncertainty(uncertainty = 'clear-spec') {
  const factor = complexityConfig.factors?.find(f => f.id === 'uncertainty') || {};
  const values = factor.values || {};

  const score = values[uncertainty] || 1;

  return {
    factor: 'uncertainty',
    score,
    details: { uncertainty, weight: factor.weight || 1 }
  };
}

/**
 * Calculate weighted complexity score
 */
function calculateComplexity(analysis) {
  const factors = complexityConfig.factors || [];
  let totalScore = 0;
  let totalWeight = 0;

  for (const result of analysis) {
    const factorConfig = factors.find(f => f.id === result.factor);
    const weight = factorConfig?.weight || 1;
    totalScore += result.score * weight;
    totalWeight += weight;
  }

  // Normalize to 1-20 scale
  const rawScore = totalWeight > 0 ? totalScore / totalWeight : 1;
  return Math.round(rawScore * 4); // Scale to ~1-20 range
}

/**
 * Determine complexity level from score
 */
function getComplexityLevel(score) {
  const levels = complexityConfig.levels || {};

  for (const [level, config] of Object.entries(levels)) {
    const [min, max] = config.range;
    if (score >= min && score <= max) {
      return {
        level,
        recommendedMode: config.recommendedMode,
        expertPanelEligible: config.expertPanelEligible || false,
        expertPanelRequired: config.expertPanelRequired || false,
        description: config.description
      };
    }
  }

  // Default to complex if out of range
  return {
    level: 'complex',
    recommendedMode: 'spec',
    expertPanelEligible: true,
    expertPanelRequired: false,
    description: 'Complex task requiring specification-driven development'
  };
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze task complexity
 *
 * @param {Object} task - Task description and context
 * @returns {Object} Complexity analysis result
 */
function analyzeComplexity(task = {}) {
  const {
    files = [],
    scope = 'single-component',
    dependencyImpact = 'isolated',
    riskLevel = 'non-critical',
    uncertainty = 'clear-spec',
    description = ''
  } = task;

  // Run all factor analyses
  const analysis = [
    analyzeFileCount(files),
    analyzeScopeBreadth(scope),
    analyzeDependencyImpact(dependencyImpact),
    analyzeRiskLevel(riskLevel),
    analyzeUncertainty(uncertainty)
  ];

  // Calculate overall score
  const score = calculateComplexity(analysis);

  // Determine level and recommended mode
  const levelInfo = getComplexityLevel(score);

  // Check if large task (requires SPEC mode)
  const largeTaskThreshold = complexityConfig.largeTaskThreshold || 10;
  const isLargeTask = score >= largeTaskThreshold;

  // Check if expert panel needed
  const expertPanelThreshold = complexityConfig.expertPanelThreshold || 11;
  const needsExpertPanel = score >= expertPanelThreshold || levelInfo.expertPanelRequired;

  return {
    score,
    level: levelInfo.level,
    recommendedMode: levelInfo.recommendedMode,
    isLargeTask,
    needsExpertPanel,
    expertPanelEligible: levelInfo.expertPanelEligible,
    analysis,
    modeRequirements: {
      canSkipSpec: !isLargeTask,
      canUseDirect: score <= 6,
      shouldUseExpertPanel: needsExpertPanel
    }
  };
}

/**
 * Quick complexity estimation from task description
 */
function estimateFromDescription(description) {
  if (!description || typeof description !== 'string') {
    return { score: 5, level: 'simple', recommendedMode: 'plan' };
  }

  const text = description.toLowerCase();
  let score = 5; // Base score

  // Check for complexity indicators
  const indicators = {
    high: ['architectural', 'breaking change', 'migration', 'refactor', 'security', 'critical'],
    medium: ['feature', 'api', 'integration', 'multi', 'several', 'refactor'],
    low: ['fix', 'typo', 'update', 'minor', 'simple', 'quick']
  };

  // Count matches
  const highMatches = indicators.high.filter(w => text.includes(w)).length;
  const mediumMatches = indicators.medium.filter(w => text.includes(w)).length;
  const lowMatches = indicators.low.filter(w => text.includes(w)).length;

  // Adjust score
  score += highMatches * 3;
  score += mediumMatches * 1;
  score -= lowMatches * 1;

  // Clamp to 1-20
  score = Math.max(1, Math.min(20, score));

  return getComplexityLevel(score);
}

// ============================================================================
// CLI Interface
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'analyze';

  if (action === 'analyze' || action === 'estimate') {
    // Parse JSON input or use defaults
    let input = {};
    if (args[1]) {
      try {
        input = JSON.parse(args[1]);
      } catch (e) {
        // Treat as description string
        input = { description: args[1] };
      }
    }

    let result;
    if (action === 'estimate' || input.description) {
      const estimate = estimateFromDescription(input.description || '');
      result = {
        method: 'estimate',
        ...estimate
      };
    } else {
      result = analyzeComplexity(input);
    }

    console.log(JSON.stringify(result, null, 2));
  } else if (action === 'levels') {
    console.log(JSON.stringify(complexityConfig.levels || {}, null, 2));
  } else if (action === 'factors') {
    console.log(JSON.stringify(complexityConfig.factors || {}, null, 2));
  } else {
    console.error('Usage: complexity-analyzer.js [analyze|estimate|levels|factors] [input]');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for module use
export {
  analyzeComplexity,
  estimateFromDescription,
  analyzeFileCount,
  analyzeScopeBreadth,
  analyzeDependencyImpact,
  analyzeRiskLevel,
  analyzeUncertainty,
  calculateComplexity,
  getComplexityLevel
};