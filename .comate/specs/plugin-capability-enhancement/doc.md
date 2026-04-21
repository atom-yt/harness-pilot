# harness-pilot 插件功能增强设计文档

## 背景

当前 harness-pilot 插件仅具备 **creator** 能力（analyze + apply），即分析项目并生成 harness 基础设施。参考 everything-claude-code (ECC)、superpowers、qoder-harness.md 的最佳实践，插件在以下功能维度存在明显缺口：

1. 没有 Hook 系统——无法在会话启动时自动加载 harness 上下文
2. 没有 Agent 定义——无法利用子代理架构进行任务委派
3. 没有 Executor 技能——生成 harness 后缺少在 harness 内执行开发任务的能力
4. 没有事前验证（Pre-validation）模板——只有事后检查，缺少写代码前的合法性校验
5. 没有 Harness 自检/改进技能——无法周期性审计和自我进化
6. 缺少 PRODUCT_SENSE.md 等关键模板——业务上下文文档缺失
7. 仅支持 Claude Code——未适配 Codex、Cursor 等平台

## 功能增强清单

### 1. Hook 系统 —— 会话启动自动加载

**需求场景**：Agent 打开装有 harness 的项目时，应自动读取 AGENTS.md 并加载关键上下文，而非依赖用户手动触发。

**技术方案**：

新增 `plugins/harness-pilot/hooks/` 目录：

```
hooks/
├── hooks.json          # Claude Code hook 定义
└── session-start       # 会话启动脚本（可执行）
```

**hooks.json**：
```json
{
  "hooks": [
    {
      "type": "SessionStart",
      "command": "plugins/harness-pilot/hooks/session-start",
      "description": "Auto-load harness context on session start"
    }
  ]
}
```

**session-start 脚本逻辑**：
1. 检测当前项目是否存在 AGENTS.md
2. 如果存在，读取 AGENTS.md 内容作为 additionalContext 返回
3. 如果不存在，输出提示："No harness detected. Run harness-pilot to set up."
4. 同时检测 harness/ 目录下的 memory/、tasks/ 中是否有活跃内容

**受影响文件**：
- 新增 `plugins/harness-pilot/hooks/hooks.json`
- 新增 `plugins/harness-pilot/hooks/session-start`（shell 脚本）
- 修改 `plugins/harness-pilot/plugin.json`——注册 hooks

**实现细节**：

```bash
#!/usr/bin/env bash
# session-start hook for harness-pilot

AGENTS_FILE="AGENTS.md"
HARNESS_DIR="harness"

output=""

# Check for AGENTS.md
if [ -f "$AGENTS_FILE" ]; then
  agents_content=$(cat "$AGENTS_FILE")
  output="[harness-pilot] Harness detected. Loading project context from AGENTS.md.\n\n${agents_content}"

  # Check for active tasks
  if [ -d "$HARNESS_DIR/tasks" ]; then
    active_tasks=$(find "$HARNESS_DIR/tasks" -name "*.md" -newer "$HARNESS_DIR/tasks" 2>/dev/null | head -3)
    if [ -n "$active_tasks" ]; then
      output="${output}\n\n--- Active Tasks ---\n${active_tasks}"
    fi
  fi
else
  output="[harness-pilot] No harness detected in this project. Run 'harness-analyze' to assess or 'harness-apply' to generate harness infrastructure."
fi

# Output for Claude Code hook system
echo "{\"hookSpecificOutput\": {\"additionalContext\": \"$(echo "$output" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')\"}}"
```

---

### 2. Agent 定义 —— 子代理架构

**需求场景**：qoder-harness 强调"协调者不写代码"，ECC 有 48 个 agent。harness-pilot 应提供核心 agent 定义，让 Agent 能在 harness 环境中高效委派任务。

**技术方案**：

新增 `plugins/harness-pilot/agents/` 目录，定义 3 个核心 agent：

```
agents/
├── planner.md           # 规划专家
├── code-reviewer.md     # 代码审查专家
└── harness-guardian.md   # Harness 守护者（验证+规则执法）
```

**受影响文件**：
- 新增 `plugins/harness-pilot/agents/planner.md`
- 新增 `plugins/harness-pilot/agents/code-reviewer.md`
- 新增 `plugins/harness-pilot/agents/harness-guardian.md`
- 修改 `plugins/harness-pilot/plugin.json`——注册 agents

**planner.md 实现**：
```markdown
---
name: planner
description: Expert planning specialist for complex features. Creates detailed execution plans with task breakdown, impact analysis, and verification steps. Dispatched automatically for non-trivial tasks.
tools: ["Read", "Grep", "Glob", "Write"]
---

# Planner Agent

## Role
Break complex tasks into bite-sized, independently verifiable steps.

## Process
1. Read AGENTS.md and docs/ARCHITECTURE.md to understand project structure
2. Analyze the task scope and identify affected modules/layers
3. Create execution plan in docs/exec-plans/
4. Each step must include: what to do, which files, expected outcome, verification command

## Output Format
Write plan to `docs/exec-plans/{task-name}.md`:
- Task objective
- Impact analysis (affected files, layers, dependencies)
- Step-by-step plan (each step independently testable)
- Verification commands for each step
- Rollback strategy

## Constraints
- Never write implementation code
- Only read and plan
- Flag any step that crosses layer boundaries
```

**code-reviewer.md 实现**：
```markdown
---
name: code-reviewer
description: Senior code reviewer that checks implementation against plan, architecture rules, and quality standards. Uses a different perspective to catch logic issues mechanical linting misses.
tools: ["Read", "Grep", "Glob"]
---

# Code Reviewer Agent

## Role
Review code changes for correctness, architecture compliance, and quality.

## Process
1. Read the execution plan (if exists) from docs/exec-plans/
2. Read docs/ARCHITECTURE.md for layer rules
3. Review the diff/changed files
4. Check: logic correctness, edge cases, naming clarity, layer compliance, performance

## Output
- PASS or NEEDS_CHANGES
- For each issue: file, line, severity (Critical/Important/Suggestion), description, fix suggestion

## Constraints
- Read-only, never modify code
- Focus on issues linting can't catch: logic bugs, race conditions, missing edge cases
- Be specific and actionable
```

**harness-guardian.md 实现**：
```markdown
---
name: harness-guardian
description: Harness infrastructure guardian that validates operations before execution, enforces layer rules, and ensures harness health. Dispatched before structural changes.
tools: ["Read", "Grep", "Glob", "Bash"]
---

# Harness Guardian Agent

## Role
Pre-validate structural operations and enforce harness rules.

## When Dispatched
- Before creating files in new locations
- Before adding cross-package imports
- Before modifying layer configuration
- When lint/test failures occur repeatedly

## Process
1. Read layer mapping from docs/ARCHITECTURE.md
2. Validate the proposed operation against layer rules
3. Return VALID or INVALID with explanation and fix suggestion

## Output Format
For validation:
  VALID: {path} is in Layer {N}, operation is permitted
  INVALID: {path} (Layer {N}) cannot import {target} (Layer {M}). Fix: {suggestion}
```

---

### 3. harness-execute 技能 —— 执行引擎

**需求场景**：qoder-harness 描述了 executor 的完整工作流：检测环境 → 加载上下文 → 制定计划 → 人类批准 → 执行 → 验证 → 完成。当前插件生成 harness 后没有配套的执行技能。

**技术方案**：

新增 `plugins/harness-pilot/skills/harness-execute/SKILL.md`

**受影响文件**：
- 新增 `plugins/harness-pilot/skills/harness-execute/SKILL.md`
- 修改 `plugins/harness-pilot/plugin.json`——注册新 skill
- 修改 `plugins/harness-pilot/skills/SKILL.md`——在模式选择中增加 execute 选项

**核心流程**：

```
1. 环境检测
   - 检查 AGENTS.md 是否存在（不存在则自动触发 harness-apply）
   - 加载 docs/ARCHITECTURE.md 获取层级规则
   - 加载 docs/DEVELOPMENT.md 获取构建/测试命令
   - 查询 harness/memory/ 获取相关经验

2. 任务规划
   - 分析用户请求的复杂度
   - 简单任务（单文件、无跨层）：直接执行
   - 中等任务（多文件）：委派子代理
   - 复杂任务（架构变更）：委派子代理 + Git Worktree 隔离

3. 执行计划生成（中等+复杂任务）
   - 创建 docs/exec-plans/{task-name}.md
   - 包含：目标、影响范围、分步骤、验证方式、回退策略
   - 等待用户审批

4. 执行（按步骤）
   - 结构性操作前调用 harness-guardian 预验证
   - 每步完成后运行对应验证命令
   - 设置检查点到 harness/tasks/

5. 验证闭环
   - build → lint-arch → test → verify
   - 失败时自动修复（最多 3 轮）
   - 3 轮未修复则停止，交给人类

6. 完成
   - 更新 harness/tasks/ 状态
   - 记录经验到 harness/memory/
   - 记录失败到 harness/trace/（如有）
```

**复杂度判断规则**：
```
简单：能用一句话描述且不包含"和"字 → 直接执行
中等：需要清单来跟踪 → 委派子代理
复杂：需要设计决策和权衡 → 委派 + 隔离
```

**Skill 触发关键词**：`execute`, `harness-execute`, `dev`, `implement`, `build-feature`

---

### 4. Pre-validation 模板 —— 事前验证脚本生成

**需求场景**：qoder-harness 核心理念——"在动手之前先问'能不能做'"。当前 harness-apply 只生成事后检查脚本，缺少 `verify_action` 类型的事前验证。

**技术方案**：

为每种语言新增 `verify-action` 模板：

```
templates/
└── languages/
    ├── typescript/verify-action.ts.template
    ├── python/verify-action.py.template
    └── go/verify-action.go.template
```

**verify-action 脚本功能**：
- 输入：`--action "create file internal/types/user.go"` 或 `--action "import internal/core from internal/handler"`
- 读取 docs/ARCHITECTURE.md 中的层级映射
- 校验操作是否违反层级规则
- 输出带教学性质的结果：
  - VALID: 说明为什么合法
  - INVALID: 说明违反了什么规则 + 为什么是问题 + 怎么修

**受影响文件**：
- 新增 `plugins/harness-pilot/templates/languages/typescript/verify-action.ts.template`
- 新增 `plugins/harness-pilot/templates/languages/python/verify-action.py.template`
- 新增 `plugins/harness-pilot/templates/languages/go/verify-action.go.template`
- 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`——在生成流程中加入 verify-action
- 修改 `plugins/harness-pilot/plugin.json`——templates 注册

**TypeScript verify-action 模板核心逻辑**：
```typescript
// verify-action.ts.template
// Pre-validate structural operations against layer rules

interface LayerRule {
  layer: number;
  paths: string[];
}

const LAYER_MAP: LayerRule[] = [
  {{#each LAYERS}}
  { layer: {{this.level}}, paths: [{{#each this.paths}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}] },
  {{/each}}
];

function validateAction(action: string): { valid: boolean; message: string } {
  // Parse action: "create file <path>" or "import <target> from <source>"
  // Check against LAYER_MAP
  // Return detailed, educational error messages
}
```

---

### 5. harness-improve 技能 —— Harness 自检与改进

**需求场景**：qoder-harness 描述了周期性审计——creator 定期扫描代码库，指出 lint 覆盖缺口、文档过时等问题，然后 executor 实施修复。

**技术方案**：

新增 `plugins/harness-pilot/skills/harness-improve/SKILL.md`

**受影响文件**：
- 新增 `plugins/harness-pilot/skills/harness-improve/SKILL.md`
- 修改 `plugins/harness-pilot/plugin.json`——注册新 skill
- 修改 `plugins/harness-pilot/skills/SKILL.md`——在模式选择中增加 improve 选项

**核心流程**：
1. 运行 harness-analyze 获取当前健康分数
2. 分析 harness/trace/failures/ 中的失败记录，找出重复模式
3. 检查 lint 规则是否覆盖所有包/模块
4. 检查文档是否与代码同步（对比文件修改时间）
5. 生成改进建议清单
6. 用户确认后，自动执行修复：
   - 补充遗漏的包到 lint-deps 层级映射
   - 改写含糊的 linter 错误信息
   - 更新过时的文档
   - 将反复出现的 review 问题编码为新 lint 规则

**Skill 触发关键词**：`improve`, `harness-improve`, `harness-health`, `harness-audit`

---

### 6. 模板扩充 —— PRODUCT_SENSE.md 等

**需求场景**：qoder-harness 描述了目标项目应有 `PRODUCT_SENSE.md`（业务上下文）和 `docs/exec-plans/` 模板。当前模板体系缺失这些。

**技术方案**：

新增模板文件：

```
templates/
└── base/
    ├── PRODUCT_SENSE.md.template     # 业务上下文模板
    └── exec-plan.md.template          # 执行计划模板
```

**受影响文件**：
- 新增 `plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template`
- 新增 `plugins/harness-pilot/templates/base/exec-plan.md.template`
- 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`——在组件选择中增加新模板
- 修改 `plugins/harness-pilot/plugin.json`——templates.base 注册

**PRODUCT_SENSE.md.template**：
```markdown
# {{PROJECT_NAME}} - Product Context

## What This Project Does
<!-- One paragraph describing the product's purpose -->

## Core User Journeys
<!-- List the 3-5 most important user workflows -->
1.
2.
3.

## Business Rules
<!-- Non-obvious business logic that affects implementation -->

## Domain Terminology
<!-- Key terms and their meanings in this project's context -->
| Term | Meaning |
|------|---------|

## What NOT to Change Without Discussion
<!-- Critical paths, external contracts, API schemas that are stable -->
```

**exec-plan.md.template**：
```markdown
# Execution Plan: {{TASK_NAME}}

## Objective
<!-- What are we trying to achieve? -->

## Impact Analysis
- **Files to modify**: 
- **Files to create**: 
- **Affected layers**: 
- **Risk level**: Low / Medium / High

## Steps

### Step 1: 
- **Action**: 
- **Files**: 
- **Verify**: `command to verify this step`

### Step 2:
- **Action**: 
- **Files**: 
- **Verify**: `command to verify this step`

## Rollback Strategy
<!-- How to undo if things go wrong -->

## Validation
```bash
# Final validation sequence
{{BUILD_CMD}}
{{LINT_ARCH_CMD}}
{{TEST_CMD}}
{{VERIFY_CMD}}
```
```

---

### 7. 跨平台 Hook 支持 —— Codex + Cursor

**需求场景**：superpowers 的 session-start 脚本通过环境变量检测平台并输出不同格式的 hook 响应。harness-pilot 应至少支持 Claude Code、Codex、Cursor 三个平台。

**技术方案**：

修改 `hooks/session-start` 脚本，增加多平台检测：

```bash
# Platform detection
if [ -n "$CURSOR_PLUGIN_ROOT" ]; then
  # Cursor: output additional_context (snake_case)
  echo "{\"additional_context\": \"$output\"}"
elif [ -n "$CLAUDE_PLUGIN_ROOT" ]; then
  # Claude Code: output hookSpecificOutput.additionalContext (nested)
  echo "{\"hookSpecificOutput\": {\"additionalContext\": \"$output\"}}"
elif [ -n "$CODEX_PLUGIN_ROOT" ]; then
  # Codex: output additionalContext (SDK standard)
  echo "{\"additionalContext\": \"$output\"}"
else
  # Fallback: try Claude Code format
  echo "{\"hookSpecificOutput\": {\"additionalContext\": \"$output\"}}"
fi
```

**受影响文件**：
- 修改 `plugins/harness-pilot/hooks/session-start`——增加平台检测逻辑
- 新增 `plugins/harness-pilot/hooks/hooks-cursor.json`——Cursor 专用 hook 配置（如果格式不同）

---

### 8. Linter 错误信息增强模板

**需求场景**：qoder-harness 强调"一条好的报错本身就是一次教学"。当前 lint-deps 和 lint-quality 模板的错误信息需要增强为教学性质。

**技术方案**：

修改现有 lint 模板中的错误输出格式，从：
```
Forbidden import in core/types/user.go
```
改为：
```
core/types/user.go imports core/config (Layer 0 -> Layer 2).
  Rule: Layer 0 packages must have NO internal dependencies.
  Why: Types should be pure definitions that any layer can import safely.
  Fix: Move config-dependent logic to a higher layer, or pass the config value as a parameter.
```

**受影响文件**：
- 修改 `plugins/harness-pilot/templates/languages/typescript/lint-deps.ts.template`
- 修改 `plugins/harness-pilot/templates/languages/python/lint-deps.py.template`
- 修改 `plugins/harness-pilot/templates/languages/go/lint-deps.go.template`
- 修改 `plugins/harness-pilot/templates/languages/typescript/lint-quality.ts.template`
- 修改 `plugins/harness-pilot/templates/languages/python/lint-quality.py.template`
- 修改 `plugins/harness-pilot/templates/languages/go/lint-quality.go.template`

---

## 数据流总览

```
Session Start (Hook)
  │
  ├── AGENTS.md 存在 → 自动加载上下文
  │     │
  │     └── 用户发起任务
  │           │
  │           ├── harness-analyze → 健康报告
  │           ├── harness-apply → 生成/更新 harness
  │           ├── harness-execute → 在 harness 内执行任务
  │           │     ├── 简单 → 直接执行 + 验证
  │           │     ├── 中等 → planner → exec-plan → 子代理执行 → code-reviewer → 验证
  │           │     └── 复杂 → planner → exec-plan → 子代理(worktree) → code-reviewer → 验证
  │           └── harness-improve → 审计 + 自我修复
  │
  └── AGENTS.md 不存在 → 提示运行 harness-apply
```

## 边界条件与异常处理

| 场景 | 处理方式 |
|------|---------|
| Hook 在非 git 项目中运行 | 输出 "Not a git repository" 提示，不报错 |
| AGENTS.md 超过 200 行 | Hook 只加载前 100 行 + 摘要 |
| 子代理执行超时 | 保存检查点，允许从断点恢复 |
| verify-action 遇到未知目录 | 返回 UNKNOWN，建议手动确认 |
| harness-improve 发现 0 个失败记录 | 跳过 Critic 分析，只做文档同步检查 |
| 跨平台 Hook 环境变量均不存在 | 使用 Claude Code 格式作为 fallback |

## 预期成果

增强后的 harness-pilot 插件将从**纯生成工具**升级为**完整的 harness 运行时环境**：

- **会话启动**：自动加载项目上下文（Hook）
- **任务规划**：planner agent 分解复杂任务
- **安全执行**：事前验证 + 层级执法（harness-guardian + verify-action）
- **质量保证**：code-reviewer 交叉审查
- **持续改进**：harness-improve 审计和自我进化
- **跨平台**：Claude Code / Codex / Cursor 均可使用
