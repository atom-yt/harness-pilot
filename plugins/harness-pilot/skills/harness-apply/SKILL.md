---
name: harness-apply
description: Generate and maintain harness infrastructure with reentrant updates and Ralph Wiggum Loop (review-test-fix quality cycle)
---

# Harness Apply

**Announce at start:** "I'm using harness-apply to generate/update harness infrastructure and scaffold code for this project."

## Overview

The single "action" skill for Harness. Handles everything from initial setup to ongoing quality enforcement:

1. **Initial generation** — Detect project, select development mode, create `.harness/` infrastructure
2. **Code generation** — Generate scaffolding from templates (API, model, service, handler)
3. **Reentrant update** — Detect code changes, incrementally update harness knowledge
4. **Ralph Wiggum Loop** — Automated review-test-fix quality cycle

## First Principles

**From core requirements, not templates**

1. **Clarify intent** — Stop and discuss when goals are unclear. Don't assume.
2. **Shortest path** — Suggest better approaches when path isn't optimal.
3. **Root cause** — Fix at source, not patches. Every decision must answer "why".
4. **Cut noise** — Output only decision-critical information.

## Development Mode

**SPEC mode is the default for all tasks.** Mode is enforced by complexity score before any generation begins.

### Enforcement Matrix

**SPEC is the default for every task.** For large/complex tasks it is also enforced (cannot be skipped).

| Score | Level | Default | Can Skip To | Expert Panel |
|-------|-------|---------|-------------|-------------|
| 1–3 | trivial | **spec** | plan, direct | — |
| 4–6 | simple | **spec** | plan, direct | — |
| 7–10 | moderate | **spec** (enforced) | plan only | — |
| 11–15 | complex | **spec** (enforced) | — | auto (skippable) |
| 16+ | critical | **spec** (enforced) | — | auto (**required**) |

**Flags:**
- `--auto` — skip all prompts, accept defaults
- `--no-panel` — skip expert panel (only valid if `expertPanelCanSkip: true` for that level)
- `--init` — force Initial Mode
- `--resume <taskId>` — resume from checkpoint

### Mode Selection Step (Step 0)

Before any generation in Initial or Code Generation mode:

```
1. CALL complexity-analyzer.js estimate "<task description>"
   → { score, level }

2. CALL select.js mode select <score> <level> "<task description>" [--auto] [--no-panel]
   → Shows enforcement UI, returns { defaultMode, allowedModes, expertPanel }

3. Wait for user choice (or use default if --auto)
```

### openspec Integration

When SPEC mode is selected, the SDD pipeline enforces strict stage ordering:

```
STAGE 1: Requirements Design
  → Generate spec outline (openspec or built-in fallback)
  → Write .comate/specs/{feature}/doc.md
  → User must confirm requirements before proceeding

STAGE 2: Task Decomposition
  → Break down requirements into ordered tasks
  → Write .comate/specs/{feature}/tasks.md
  → User must confirm task plan before proceeding

STAGE 3: Implementation
  → Execute tasks following tasks.md sequentially
  → Each task marked complete before next begins

STAGE 4: Completion Summary
  → Write .comate/specs/{feature}/summary.md
  → Document accomplishments
```

**Critical Enforcement:**
- **Cannot skip stages**: doc.md → tasks.md → implementation → summary.md
- **Cannot skip order**: tasks.md CANNOT be created before doc.md is complete
- **Cannot start implementation**: Until tasks.md is finalized

**openspec Integration Flow:**

```
1. CALL select.js spec detect
   → { installed: bool }

2a. IF installed:
    Delegate full SDD workflow to openspec plugin:
    → Stage 1: doc.md generation → user confirms
    → Stage 2: tasks.md generation → user confirms
    → Stage 3: Implementation (delegated back to harness-apply)
    → Stage 4: summary.md generation

2b. IF NOT installed:
    CALL select.js spec outline '<context-json>'
    → Stage 1: Show pre-filled spec outline to user
    → Wait for: yes (proceed) | edit (revise outline) | cancel (abort)
    → On yes: write .comate/specs/{taskId}/doc.md from confirmed outline
    → Recommend OpenSpec installation:
      https://github.com/Fission-AI/OpenSpec
      claude plugin marketplace add fission-ai/openspec-market

    → Stage 2: Prompt user to decompose tasks
    → Generate .comate/specs/{taskId}/tasks.md from requirements
    → Wait for: confirm | edit | cancel

3. Proceed to generate.js only AFTER Stage 2 (tasks.md) is confirmed
```

### Expert Panel Auto-Routing

When `expertPanel: true` is returned from mode selection:

```
1. CALL expert-panel.js assemble <taskId> [--roles architect,implementer,reviewer]
   → Show panel composition: "Assembling Expert Panel: Architect, Implementer, Reviewer"

2. Wait for user confirmation (or proceed if --auto)

3. CALL expert-panel.js execute <taskId>
   → Parallel analysis → synthesize → vote/consensus → execute decision

4. Continue with generate.js using panel's recommended approach
```

### Harness Mode (vs. Development Mode)

Harness mode (Initial / Code Generation / Reentry) is determined separately from development mode:

```
if .harness/manifest.json does NOT exist:
  → Initial Mode (generate full .harness/)

if .harness/manifest.json EXISTS:
  → Check user intent:
  if user says "add-api" | "add-model" | "add-service" | "add-handler":
    → Code Generation Mode
  else:
    → Reentry Mode (scan code changes, incremental update)

if user says --init:
  → Force Initial Mode
```

**Trigger keywords:** "harness-apply", "apply", "harness-build", "generate-rules", "harness-rules", "harness-loop", "quality loop", "add-api", "add-model", "add-service", "add-handler"

## Tool Protocol

### Tool Locations
All tools are in `plugins/harness-pilot/skills/harness-apply/tools/`:
- `detect.js` — Project detection
- `select.js` — Mode selection, component/capability selection, openspec integration
- `generate.js` — Template generation
- `loop.js` — Ralph Wiggum Loop with JiT test generation
- `change-tracker.js` — Code change detection and manifest update
- `complexity-analyzer.js` — Task complexity scoring
- `expert-panel.js` — Multi-agent expert panel coordinator
- `install-skills.js` — Ducc skills installation (icafe, icode, ku-doc-manage)

### Initial Mode Workflow

```
0. CALL select.js mode select <score> <level> "<desc>"   ← NEW: mode selection first
   Confirm development mode (default: spec)

   IF spec mode:
     Run openspec integration (detect plugin → delegate or fallback outline)
     Wait for spec confirmation before continuing

   IF expert panel triggered:
     Assemble and confirm panel

1. CALL install-skills.js install
   Checks and installs default ducc skills (icafe, icode, ku-doc-manage)
   Output: { success, message, skills: [{ name, status, message }] }

   IF installation fails:
     Show warning but continue with harness generation
     (Skills are optional for harness functionality)

2. CALL detect()
   Input: none
   Output: { language, framework, structure, harness }

3. Show detection results to user, confirm

4. CALL select("components", "prompt")
   Shows interactive component selection prompt
   Wait for user to select (or use defaults if --auto)

5. Parse user selection:
   CALL select("components", "parse", user_input)
   Output: { mode, selected }

6. CALL generate("harness", { language, framework, components })
   Creates .harness/ directory structure
   Generates documentation from templates
   Creates manifest.json

7. CALL loop("run")
   Runs Ralph Wiggum Loop (max 3 iterations)
   Reviews, tests, and validates generated harness

8. Report success or issues
```

### Code Generation Mode Workflow

```
0. CALL select.js mode select <score> <level> "<desc>"   ← NEW: mode selection first
   Confirm development mode

1. CALL detect()
   Get current project context

2. Determine template type from user intent
   "add-api" → API endpoint template
   "add-model" → Data model template
   "add-service" → Service layer template
   "add-handler" → Handler/controller template

3. Ask user for details (name, fields, etc.)

4. CALL generate("code", { template, name, language, framework })
   Renders code template
   Writes to appropriate location

5. CALL loop("run")
   Validates generated code

6. Report success or issues
```

### Reentry Mode Workflow

```
(No mode selection — mode is carried from prior session or manifest)

1. CALL detect()
   Check harness status

2. CALL change-tracker.js detect
   Get files modified/added/deleted since last apply
   Output: { modified: [], added: [], deleted: [] }

3. CALL change-tracker.js update
   Update manifest.changeLog and manifest.checkpoints
   Output: { changes, affectedRules, commit }

4. CALL generate("incremental", {
     language,
     framework,
     projectDir,
     changeLog: changeLog.result  // Pass change info
   })
   - Only regenerate components based on changeLog.rulesAffected
   - Skip unchanged components
   - Preserves custom rules

5. IF result.requiresConfirmation:
   - Show message: "AGENTS.md not managed by harness-pilot. Generate or append?"
   - Wait for user choice
   - If yes: CALL generate("harness", { language, framework, components: ['AGENTS'] })

6. CALL loop("run", {
     focusFiles: changeLog.getFilesToRevalidate()  // Only validate changed files
   })
   Targeted validation for changed files only

7. Report changes made

8. CALL loop("analyze")
   Show evolution insights (recurring failure patterns)
```


## Ralph Wiggum Loop

The loop tool orchestrates the review-test-fix cycle with JiT test generation:

```
MAX_ITERATIONS = 3

for iteration in 1..MAX_ITERATIONS:
  1. Review phase
     - Invoke code-reviewer agent on changes
     - Check architecture compliance
     - Check code quality

  2. Test phase
     - Run: build → lint-arch → lint-quality → test → validate
     - Check test coverage report
     - Identify uncovered files

  3. JiT Test Generation (NEW)
     IF jitTestEnabled AND failures.type IN [test-coverage, missing-test]:
       - Collect uncovered files
       - Call test-generator agent
       - Generate test files adjacent to source
       - Re-run test phase

  4. If passed:
     - Return APPROVED

  5. Fix phase
     - Record failure to .harness/trace/failures/
     - Attempt auto-fix for simple issues
     - If fix fails, suggest manual action

  6. Continue to next iteration

If loop exhausted:
  - Output unresolved issues
  - Suggest manual intervention
```

## Handoff (Cross-Session Resume)

**Trigger conditions:**
1. Context window approaching limit (tokens > 100k)
2. Loop iterations exhausted with unresolved issues
3. User explicitly requests handoff

**Handoff flow:**
```
1. CALL loop("checkpoint", { state, changes })
   Saves current execution state

2. CALL loop("handoff", { taskId, reason })
   Creates handoff artifacts:
   - .harness/tasks/{taskId}/checkpoint.json
   - .harness/tasks/{taskId}/next-steps.json
   - .harness/handoffs/{sessionId}/agent-state.json
   - .harness/handoffs/{sessionId}/resume.json

3. Output resume instructions:
   === Handoff Triggered ===
   Reason: {reason}
   Task ID: {taskId}
   Resume: /harness-apply --resume {taskId}
```

**Resume flow:**
```
1. Detect resume intent:
   - User says "continue", "resume", "--resume"
   - User provides task ID

2. CALL loop("resolve", [handoffId])
   Loads handoff artifacts
   Verifies checksum

3. From clean context:
   - Load contextSummary from resume.json
   - Load keyFiles mentioned in state
   - Execute next-steps.json sequentially

4. Continue from checkpoint
```

### CLI Usage

```bash
# Change tracking commands (standalone)
node change-tracker.js detect
node change-tracker.js update
node change-tracker.js hasChanged <file>
node change-tracker.js filesToRevalidate
node change-tracker.js cleanup [days]

# Loop commands (standalone)
node loop.js start
node loop.js checkpoint
node loop.js handoff <id> <reason>
node loop.js resolve [id]
```

### Handoff (Cross-Session Resume)

**Trigger conditions:**
1. Context window approaching limit (tokens > 100k)
2. Loop iterations exhausted with unresolved issues
3. User explicitly requests handoff

**Handoff flow:**
```
1. CALL loop("checkpoint", { state, changes })
   Saves current execution state

2. CALL loop("handoff", { taskId, reason })
   Creates handoff artifacts:
   - .harness/tasks/{taskId}/checkpoint.json
   - .harness/tasks/{taskId}/next-steps.json
   - .harness/handoffs/{sessionId}/agent-state.json
   - .harness/handoffs/{sessionId}/resume.json

3. Output resume instructions:
   === Handoff Triggered ===
   Reason: {reason}
   Task ID: {taskId}
   Resume: /harness-apply --resume {taskId}
```

**Resume flow:**
```
1. Detect resume intent:
   - User says "continue", "resume", "--resume"
   - User provides task ID

2. CALL loop("resolve", [handoffId])
   Loads handoff artifacts
   Verifies checksum

3. From clean context:
   - Load contextSummary from resume.json
   - Load keyFiles mentioned in state
   - Execute next-steps.json sequentially

4. Continue from checkpoint
```

## Superpowers Detection

Before starting, check if Superpowers is installed:

```bash
SP_INSTALLED=false
if [ -d "$HOME/.claude/plugins/superpowers" ] || \n   command -v claude >/dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q "superpowers"; then
  SP_INSTALLED=true
fi
```

If not installed, display recommendation (does not block the flow):

```
┌─────────────────────────────────────────────────────────┐
│  [Recommended] Superpowers not installed                 │
│                                                          │
│  Harness reuses Superpowers capabilities:                │
│  - brainstorm (requirements exploration)                 │
│  - planning (task breakdown)                             │
│  - TDD (test-driven development)                         │
│  - code-reviewer (code review, used by Loop)             │
│  - git worktree (parallel development)                   │
│                                                          │
│  Install:                                                │
│  claude plugin marketplace add obra/superpowers-marketplace│
│  claude plugin install superpowers@superpowers-marketplace │
└─────────────────────────────────────────────────────────┘
```

## Ducc Skills Auto-Installation

During Initial Mode, harness-apply automatically installs default ducc skills:

### Default Skills

| Skill | Required | URL | Description |
|-------|----------|-----|-------------|
| icafe-official | Yes | https://console.cloud.baidu-int.com/onetool/skills/2082 | iCAFE integration |
| icode | Yes | https://console.cloud.baidu-int.com/onetool/skills/2057 | iCode integration |
| ku-doc-manage | No | https://console.cloud.baidu-int.com/onetool/skills/154 | Knowledge base management (optional) |

### Installation Process

1. **Check ducc availability** — Verify `ducc` command is accessible
2. **Check installed skills** — Query `ducc skill list` for each skill
3. **Install missing skills** — Run `ducc skill install <name>` for uninstalled skills
4. **Provide post-install guidance** — Show login commands or hints

### Configuration

Skills are configured in `config/defaults.json`:

```json
{
  "ducc": {
    "autoInstallSkills": true,
    "skills": [
      {
        "name": "icafe-official",
        "required": true,
        "installCommand": "ducc skill install icafe-official",
        "postInstallAction": "icafe-cli login"
      },
      {
        "name": "icode",
        "required": true,
        "installCommand": "ducc skill install icode",
        "postInstallHint": "请在 ducc/claude 中输入『帮我登录 iCode』进行登录"
      }
    ]
  }
}
```

### Tool Usage

```bash
# Check installation status
node install-skills.js check

# Install all missing skills
node install-skills.js install

# List configured skills
node install-skills.js list
```

### Behavior Notes

- **Non-blocking**: Installation failures don't stop harness generation
- **Idempotent**: Already-installed skills are skipped
- **Flexible**: Set `autoInstallSkills: false` to disable
- **Configurable**: Add/remove skills in `defaults.json`

## Error Handling

- **Tool failure**: Show error, suggest retry, do not continue
- **Validation failure**: Record to trace/, suggest fix, attempt auto-fix if possible
- **Loop exhausted**: Output all unresolved issues, stop

## Output Format

Always output in this structure:

```
=== harness-apply: {mode} ===

{action description}

✓ {files created/modified}

{validation results if applicable}

{loop verdict: APPROVED / NEEDS_CHANGES / LOOP_EXHAUSTED}
```

## Template Engine Integration

Generate context and render templates:

```bash
# Example context
CONTEXT='{
  "PROJECT_NAME": "my-app",
  "LANGUAGE": "typescript",
  "FRAMEWORK": "nextjs",
  "GENERATED_DATE": "2026-04-24",
  "LAYER_MAPPING": [...],
  "CURRENT_YEAR": "2026"
}'

# Render template
node plugins/harness-pilot/scripts/template-engine.js <template> "$CONTEXT"
```

### Render Documents

```bash
# AGENTS.md — agent navigation map (always generated)
node plugins/harness-pilot/scripts/template-engine.js \n  plugins/harness-pilot/templates/base/AGENTS.md.template "$CONTEXT" > AGENTS.md

# ARCHITECTURE.md — priority: framework > language > base
TEMPLATE=""
if [ "$FRAMEWORK" != "none" ] && [ -f "plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/frameworks/$FRAMEWORK/ARCHITECTURE.md.template"
elif [ -f "plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template" ]; then
  TEMPLATE="plugins/harness-pilot/templates/languages/$LANGUAGE/ARCHITECTURE.md.template"
else
  TEMPLATE="plugins/harness-pilot/templates/base/ARCHITECTURE.md.template"
fi
node plugins/harness-pilot/scripts/template-engine.js "$TEMPLATE" "$CONTEXT" > .harness/docs/ARCHITECTURE.md

# DEVELOPMENT.md
node plugins/harness-pilot/scripts/template-engine.js \n  plugins/harness-pilot/templates/base/DEVELOPMENT.md.template "$CONTEXT" > .harness/docs/DEVELOPMENT.md

# PRODUCT_SENSE.md
node plugins/harness-pilot/scripts/template-engine.js \n  plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template "$CONTEXT" > .harness/docs/PRODUCT_SENSE.md
```

## Configuration

All configuration is in `plugins/harness-pilot/skills/harness-apply/config/`:
- `defaults.json` — Default quality rules and capabilities
- `detection-rules.json` — Language and framework detection
- `development-modes.json` — Mode definitions, complexity levels, and enforcement rules
- `layer-mappings.json` — Default layer mappings by framework
- `quality-rules.json` — Language-specific quality rules

Key enforcement fields in `development-modes.json`:

| Field | Default | Meaning |
|-------|---------|---------|
| `enforcement.largeTaskThreshold` | 7 | Score ≥ this → SPEC forced |
| `enforcement.expertPanelAutoThreshold` | 11 | Score ≥ this → Expert Panel auto-assembled |
| `enforcement.criticalForceThreshold` | 16 | Score ≥ this → SPEC + Panel, no override |
| `enforcement.openspecEnabled` | true | Enable openspec plugin detection |
| `enforcement.openspecPluginId` | "openspec" | Plugin identifier to look up |
| `userPreferences.defaultMode` | "spec" | Fallback default if no enforcement applies |

To add support for a new framework:
1. Add entry to `detection-rules.json`
2. Add layer mapping to `layer-mappings.json`
3. Create template in `templates/frameworks/{name}/`

No changes to this SKILL.md needed.