---
name: harness-analyze
description: Analyze project structure, audit harness health, and generate a visual health report with scoring without making changes
---

# Harness Analyze (Dryrun Mode)

**Announce at start:** "I'm using harness-analyze to perform a dryrun analysis of this project."

**Context:** Read-only operation. No files will be modified.

## Overview

Performs comprehensive analysis of project structure and outputs a visual health report covering documentation, architecture constraints, quality rules, and import relationships.

This is a **dryrun** - no files are created or modified. Use this to:

- Assess a new project before applying harness
- Identify gaps in existing harness
- Audit harness health (documentation staleness, lint coverage gaps)
- Get an overall score and actionable recommendations
- Evaluate project readiness for AI Agent collaboration

## When to Activate

- User says "analyze", "harness-analyze", "project-analysis"
- User says "improve", "harness-improve", "harness-health", "harness-audit"
- Periodic health check (recommended: weekly or after major features)
- After a series of agent failures

## Tool Protocol

All tools are in `plugins/harness-pilot/skills/harness-analyze/tools/`:
- `analyze-docs.js` — Documentation coverage analysis
- `analyze-architecture.js` — Architecture constraints and lint analysis
- `analyze-imports.js` — Import pattern analysis
- `generate-report.js` — Visual health report generation

## Analysis Workflow

```
1. CALL analyze-docs()
   Input: none
   Output: { exists, coverage, files }

2. CALL analyze-architecture()
   Input: none
   Output: { exists, layerDocs, layerLint, layerMapping, qualityLint, score }

3. CALL analyze-imports()
   Input: none
   Output: { language, totalImports, uniqueModules, modules, potentialViolations }

4. Compile scores and recommendations
   Total Score = (Docs * 0.35) + (Architecture * 0.35) + (Test * 0.3)

5. CALL generate-report({ projectName, docs, architecture, imports, testCoverage })
   Output: Visual ASCII report

6. Show follow-up recommendations

7. Check for active tasks/handoffs
   - Check .harness/tasks/.current
   - Check .harness/handoffs/.latest
   - Display pending tasks if present
```

## Task Status Display

Check for active tasks and handoffs:

```
if .harness/tasks/.current exists:
  Read task.json
  Display: { taskId, status, currentStep, lastCheckpoint }

if .harness/handoffs/.latest exists:
  Read resume.json
  Display: { handoffId, taskId, resumeFrom, timestamp }
  Suggest: Resume with /harness-apply --resume {taskId}
```

## Scoring Rubric

| Score Range | Grade | Interpretation |
|------------|-------|----------------|
| 90-100 | A | Excellent - Harness ready |
| 70-89 | B | Good - Minor gaps |
| 50-69 | C | Fair - Needs work |
| 0-49 | D | Poor - Requires significant effort |

**Total Score** = weighted average:
- Documentation: 35%
- Architecture: 35%
- Test Coverage: 30%

## Toolchain Recommendation

After analysis, always show:

```
[Recommended] harness-apply — generate harness + quality loop (Ralph Wiggum Loop)
  Why: Automated review-test-fix cycle for continuous quality enforcement
```

If Superpowers not detected:
```
[Recommended] Superpowers — brainstorm + TDD + planning + code-reviewer + git worktree
  Install: claude plugin marketplace add obra/superpowers-marketplace
            claude plugin install superpowers@superpowers-marketplace
```

## Output Format

Always output the visual ASCII report followed by:
- Score interpretation
- Actionable recommendations
- Next steps to improve harness health

## Common Detection Issues

| Issue | Cause | Handling |
|-------|--------|----------|
| "No package.json found" | Non-standard project | Guide user to manual mode |
| "Multiple languages detected" | Polyglot project | Ask user for primary language |
| "Framework unclear" | Ambiguous structure | List detected frameworks, ask for selection |
| "No source files" | Wrong directory | Verify current working directory |

## After Analysis

Always offer follow-up actions:

```
Would you like to:
1. Run harness-apply to generate/update harness infrastructure
2. Review specific recommendations in detail

Choose an option or describe what you'd like to do next.
```

Do not automatically proceed to any mode. Wait for user confirmation.