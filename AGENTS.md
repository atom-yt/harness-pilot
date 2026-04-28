# harness-pilot — Agent Navigation Map

> **Meta-project notice**: This repository *is* the source of the `harness-pilot` Claude Code plugin. It dog-foods its own output under `.harness/`, but this `AGENTS.md` is **manually maintained** — do NOT regenerate it via `harness-apply` in this repo.
>
> Last reviewed: 2026-04-28

Read this file first. It is the map that tells any AI agent where to go next.

## First Principles

**From core requirements, not templates**

1. **Clarify intent** — Stop and discuss when goals are unclear. Don't assume.
2. **Shortest path** — Suggest better approaches when path isn't optimal.
3. **Root cause** — Fix at source, not patches. Every decision must answer "why".
4. **Cut noise** — Output only decision-critical information.

## Project Overview

- **Type**: Claude Code plugin (distributed as a directory tree)
- **Runtime**: Node.js, ES Modules — **no build step, no `package.json`**
- **Purpose**: Turn any codebase into a harness-compatible form (analyze → apply → Ralph Wiggum Loop)
- **Dogfooding**: The `.harness/` directory at repo root is this project's own harness output
- **SDD specs**: Feature specs live under `.comate/specs/{feature}/{doc,tasks,summary}.md`

## Repository Map

### Design & docs (`docs/`)

| File | Purpose |
|------|---------|
| `docs/overview-design.md` | High-level architecture, mode selection, handoff mechanism |
| `docs/detailed-design.md` | Component-level design & internal contracts |
| `docs/API.md` | Tool / CLI API reference |
| `docs/handoff-mechanism.md` | Cross-session resume protocol |
| `docs/FAQ.md` | Configuration customization & troubleshooting |
| `docs/OPTIMIZATION_PLAN.md` | Performance & quality roadmap |
| `docs/CONTRIBUTING.md` | Contribution guide |
| `docs/superpowers/` | Reference material for Superpowers integration |

### Plugin source (`plugins/harness-pilot/`)

| Path | Purpose |
|------|---------|
| `plugins/harness-pilot/skills/harness-analyze/` | Read-only health analyzer — `SKILL.md` + `tools/analyze-{docs,architecture,imports}.js` + `generate-report.js` |
| `plugins/harness-pilot/skills/harness-apply/`   | Generator + Ralph Wiggum Loop — `SKILL.md` + `tools/` (detect, select, generate, loop, **complexity-analyzer**, **expert-panel**) + `config/` |
| `plugins/harness-pilot/agents/planner.md`             | Task-decomposition agent |
| `plugins/harness-pilot/agents/code-reviewer.md`       | Review agent used by the Loop |
| `plugins/harness-pilot/agents/test-generator.md`      | JIT test synthesis agent |
| `plugins/harness-pilot/agents/e2e-executor.md`        | End-to-end runner |
| `plugins/harness-pilot/agents/refactoring-agent.md`   | Refactor assistant |
| `plugins/harness-pilot/lib/config.js`            | Shared config loader |
| `plugins/harness-pilot/lib/constants.js`         | Thresholds & constants |
| `plugins/harness-pilot/lib/detect-language.js`   | Language / framework detection |
| `plugins/harness-pilot/lib/fs-utils.js`          | JSON / file helpers |
| `plugins/harness-pilot/lib/path-utils.js`        | Path resolution helpers |
| `plugins/harness-pilot/templates/base/`          | Project-agnostic templates (AGENTS, ARCHITECTURE, DEVELOPMENT, PRODUCT_SENSE) |
| `plugins/harness-pilot/templates/languages/`     | `go/`, `java/`, `python/`, `typescript/` overrides |
| `plugins/harness-pilot/templates/frameworks/`    | `django/`, `express/`, `fastapi/`, `gin/`, `nextjs/`, `react/`, `spring-boot/` overrides |
| `plugins/harness-pilot/templates/rules/`         | Rule templates by language (`common/`, `go/`, `java/`, `javascript/`, `python/`, `typescript/`) |
| `plugins/harness-pilot/templates/capabilities/`  | Optional capability templates (e2e, jit-test, security, ...) |
| `plugins/harness-pilot/templates/agents/`        | Agent templates seeded into downstream repos |
| `plugins/harness-pilot/hooks/session-start`      | Session-start hook script |
| `plugins/harness-pilot/hooks/hooks.json`         | Hook configuration |
| `plugins/harness-pilot/scripts/template-engine.js` | Mustache-like renderer used by `harness-apply` |
| `plugins/harness-pilot/scripts/generate-test.sh` | Shell wrapper for JIT test generation |
| `plugins/harness-pilot/tests/template-engine.test.js` | Template engine unit tests |

### Other top-level entries

| Path | Purpose |
|------|---------|
| `README.md` | Install / quick-start / customization |
| `test-projects/harness-test-nextjs/` | Integration sample — Next.js |
| `test-projects/harness-test-python/` | Integration sample — Python |
| `utils/string-utils.ts` + `utils/__tests__/` | Top-level utilities (legacy) |
| `.harness/` | Self-applied harness output (see below) |
| `.comate/specs/` | SDD feature specs (`doc.md` / `tasks.md` / `summary.md`) |

### Self-applied harness (`.harness/`)

| Path | Purpose |
|------|---------|
| `.harness/manifest.json` | Harness state & capability snapshot |
| `.harness/capabilities.json` | Enabled capabilities |
| `.harness/docs/ARCHITECTURE.md` | Layered architecture & dependency rules |
| `.harness/docs/DEVELOPMENT.md` | Build / test / lint commands |
| `.harness/docs/PRODUCT_SENSE.md` | Business context |
| `.harness/rules/common/safety.md` | Safety guidelines |
| `.harness/rules/common/git-workflow.md` | Git conventions |
| `.harness/rules/typescript/development.md` | Language rules (TS-style, applies to the JS plugin source) |
| `.harness/tasks/` · `.harness/handoffs/` | Cross-session resume artifacts |
| `.harness/trace/` | Loop failure traces |

## Where to Start

| I want to… | Read in this order |
|------------|---------------------|
| Understand the whole system | `README.md` → `docs/overview-design.md` → `docs/detailed-design.md` |
| Change a Skill's behavior | `plugins/harness-pilot/skills/{skill}/SKILL.md` → that skill's `tools/*.js` |
| Add/modify a generated artifact for user projects | `plugins/harness-pilot/templates/` (pick `base/` → `languages/` → `frameworks/` in override order) |
| Extend language or framework detection | `plugins/harness-pilot/lib/detect-language.js` + `skills/harness-apply/config/detection-rules.json` |
| Change mode selection / enforcement rules | `skills/harness-apply/config/development-modes.json` (`enforcement` block) → `tools/select.js` (`selectDevelopmentMode`) |
| Change complexity scoring thresholds | `skills/harness-apply/tools/complexity-analyzer.js` + `development-modes.json` (`complexity.factors`) |
| Debug handoff / resume | `docs/handoff-mechanism.md` → `.harness/handoffs/` → `.harness/tasks/` |
| Run health check on this repo | Invoke `/harness-analyze` (read-only) |
| Ship a feature | Follow `.comate/specs/{feature}/tasks.md` under the SDD workflow |

## Available Harness Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Analyze | `/harness-analyze` | Read-only health analysis, scoring, recommendations |
| Apply | `/harness-apply` | Intelligent mode selection (SPEC default) → generate / incrementally update harness → Ralph Wiggum Loop |

## Bundled Sub-Agents

| Agent | File | When to dispatch |
|-------|------|------------------|
| planner | `plugins/harness-pilot/agents/planner.md` | Decompose a fuzzy ask into ordered tasks |
| code-reviewer | `plugins/harness-pilot/agents/code-reviewer.md` | Invoked by the Loop's review phase |
| test-generator | `plugins/harness-pilot/agents/test-generator.md` | Synthesize JIT tests for new code |
| e2e-executor | `plugins/harness-pilot/agents/e2e-executor.md` | Drive end-to-end scenarios |
| refactoring-agent | `plugins/harness-pilot/agents/refactoring-agent.md` | Structural refactors with guardrails |

## Development Workflow

```
/harness-analyze  →  Check project health (read-only)
develop           →  Edit plugin code under plugins/harness-pilot/
/harness-apply    →  Re-validate in a downstream sample (test-projects/*)
ship              →  Commit and push
```

Notes:
- In **this** repo, run `harness-analyze` freely, but avoid `harness-apply` unless intentionally refreshing the self-applied `.harness/` snapshot — `AGENTS.md` (this file) is intentionally excluded from that refresh.
- Prefer validating changes against `test-projects/harness-test-nextjs/` or `test-projects/harness-test-python/` before committing.

## AI Rules (verified paths)

- `.harness/rules/common/safety.md` — Safety guidelines
- `.harness/rules/common/git-workflow.md` — Git conventions
- `.harness/rules/typescript/development.md` — Language-specific rules

---

*Manually maintained meta-project map. If paths drift, update this file directly — do not rely on `harness-apply` to regenerate it here.*


<claude-mem-context>
# Memory Context

# [harness-pilot] recent context, 2026-04-27 2:50pm GMT+8

No previous sessions found.
</claude-mem-context>