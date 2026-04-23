# Harness Simplify - 精简设计并聚焦质量闭环

## 1. 需求概述

当前 Harness Pilot 设计偏重（5 个 skill + 3 个 agent + 大量目录结构），需要精简非核心功能，聚焦在 **质量闭环** 这一核心价值上。

### 核心原则

- **Ralph Wiggum Loop（编排-审查-测试-修复闭环）** 是质量核心
- **Agent 互审代码** 替代单一 review skill
- **Superpower 已有能力不重复建设**（brainstorm、planning、TDD、code-review、git worktree）
- **apply 可重入**，支持基于代码改动增量更新知识
- **所有 docs 收归 .harness/**，减少顶层目录污染
- **hooks 机制**，代码更新后自动升级 harness

## 2. 架构变更：从 5 Skill 精简到 2 Skill

### 当前架构（过重）

```
Skills: harness-analyze, harness-apply, harness-spec, harness-review, harness-evolve
Agents: planner, code-reviewer, harness-guardian
生成目录: AGENTS.md(顶层), docs/(顶层), .harness/
```

### 目标架构（极简：看 + 做）

```
Skills: harness-analyze (看), harness-apply (做)
Agents: code-reviewer (复用 Superpowers 的 code-reviewer 协议)
生成目录: .harness/ (唯一)
```

用户心智模型：
- `harness-analyze` = 只读诊断，输出打分报表
- `harness-apply` = 所有行动（生成/更新/质量闭环），**默认包含 Loop**：
  - 首次运行（无 .harness/）：自动检测项目 → 生成 .harness/ → 运行首次 Loop 验证
  - 日常运行（已有 .harness/）：检测代码变更 → 增量更新 → 运行 Ralph Wiggum Loop
  - `harness-apply --init`：强制重新生成基础设施（跳过 Loop）
  - `harness-apply --auto`：非交互模式，使用检测到的默认值

### 精简决策

| 当前 Skill | 决策 | 理由 |
|---|---|---|
| harness-analyze | **保留并增强** | 核心入口，增加整体打分报表和美化输出 |
| harness-apply | **保留并大幅重构** | 成为唯一的"行动"skill，整合生成、重入、Loop、hooks |
| harness-spec | **移除** | Superpowers 的 brainstorm + planning 已覆盖需求定义和计划拆解 |
| harness-review | **合并到 harness-apply --loop** | 成为 Loop 中 review 阶段的一部分 |
| harness-evolve | **合并到 harness-apply --loop** | Critic->Refiner 本身就是 Loop 的核心环节 |

| 当前 Agent | 决策 | 理由 |
|---|---|---|
| planner | **移除** | Superpowers 有完善的 planning skill |
| code-reviewer | **保留并简化** | 作为 Loop 中 Agent 互审的执行者 |
| harness-guardian | **合并到 code-reviewer** | 架构检查应是 review 的一部分，不需独立 agent |

## 3. 新 Skill 详细设计

### 3.1 harness-analyze（增强：美化报表 + 整体打分）

**变更范围**: `plugins/harness-pilot/skills/harness-analyze/SKILL.md`

**核心改动**:

1. **整体打分报表**：输出结构化的可视化评分卡
2. **美化输出格式**：使用表格和进度条替代纯文本
3. **简化推荐逻辑**：不再推荐 harness-spec/harness-review/harness-evolve，改为推荐 harness-loop

**新的报表格式**:

```
╔══════════════════════════════════════════════════╗
║          Harness Health Report                   ║
║          Project: {name}                         ║
║          Score: 73/100 (B)                       ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Category          Score   Status                ║
║  ─────────────────────────────────────────────── ║
║  Documentation       80    ████████░░  Good      ║
║  Architecture        90    █████████░  Excellent ║
║  Quality Rules       60    ██████░░░░  Fair      ║
║  Test Coverage       55    █████░░░░░  Fair      ║
║  Validation          80    ████████░░  Good      ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Details                                         ║
║  ─────────────────────────────────────────────── ║
║  [v] .harness/docs/ARCHITECTURE.md               ║
║  [v] .harness/docs/DEVELOPMENT.md                ║
║  [x] .harness/docs/PRODUCT_SENSE.md  (missing)   ║
║  [v] .harness/scripts/lint-deps.ts               ║
║  [v] .harness/scripts/lint-quality.ts            ║
║  [x] .harness/scripts/validate.ts    (stale)     ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Recommendations                                 ║
║  1. Create PRODUCT_SENSE.md for business context ║
║  2. Update validate.ts (stale by 14 days)        ║
║  3. Run harness-loop to fix 3 quality gaps       ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Toolchain                                       ║
║  [Recommended] Superpowers (brainstorm/TDD/plan) ║
║  [Recommended] harness-loop (quality closure)    ║
╚══════════════════════════════════════════════════╝
```

**受影响函数/段落**:
- 删除 Step 0（模板检查），简化为直接检测
- 重写 Step 7（报表生成），使用新的可视化格式
- 删除 "Toolchain Recommendation Logic" 中对 harness-spec/review/evolve 的推荐
- 简化为只推荐 Superpowers + harness-loop

### 3.2 harness-apply（重构：可重入 + docs 收归 + hooks）

**变更范围**: `plugins/harness-pilot/skills/harness-apply/SKILL.md`

**核心改动**:

#### 3.2.1 Superpowers 检测与安装提示

apply 启动时检测 Superpowers 是否已安装，未安装时提示：

```bash
# 检测 Superpowers 是否可用
SP_INSTALLED=false
if [ -d "$HOME/.claude/plugins/superpowers" ] || \
   claude plugin list 2>/dev/null | grep -q "superpowers"; then
  SP_INSTALLED=true
fi
```

未安装时输出提示（不阻塞流程）：
```
┌─────────────────────────────────────────────────────────┐
│  [Recommended] Superpowers 未安装                        │
│                                                          │
│  Harness 复用 Superpowers 的以下能力:                     │
│  - brainstorm (需求脑暴)                                  │
│  - planning (任务规划)                                    │
│  - TDD (测试驱动开发)                                     │
│  - code-reviewer (代码审查, Loop 互审依赖)                │
│  - git worktree (并行开发)                                │
│                                                          │
│  安装命令:                                                │
│  claude plugin marketplace add obra/superpowers-marketplace│
│  claude plugin install superpowers@superpowers-marketplace │
│                                                          │
│  不安装也可继续，Loop 将使用内置 code-reviewer 替代       │
└─────────────────────────────────────────────────────────┘
```

同样在 harness-analyze 的 Toolchain 推荐中，如果未检测到 Superpowers，也输出安装提示。

#### 3.2.2 可重入设计

apply 不再是一次性生成，而是支持检测已有 harness 并增量更新：

```
首次运行 (无 .harness/):
  检测项目 → 生成完整 .harness/ → 首次 Loop 验证

再次运行 (已有 .harness/):
  1. 读取 manifest.json 获取上次快照
  2. 扫描当前代码库:
     - 目录结构变化（新增/删除的源码目录）
     - 依赖关系变化（新增的 import/跨层引用）
     - 框架/配置变化（新增的 package、tsconfig 变动等）
  3. 对比差异，增量更新:
     - 新增目录 → 自动建议加入 layer mapping
     - 新增跨层依赖 → 自动更新 lint-deps 规则
     - .harness/docs/ 文档 → 基于当前代码重新生成
  4. 保留用户自定义规则不覆盖
  5. 更新 manifest.json 快照
  6. 进入 Ralph Wiggum Loop
```

**重入检测逻辑**:
```bash
if [ -f ".harness/manifest.json" ]; then
  # 重入模式: 读取 manifest，对比当前代码，增量更新
  MODE="reentry"
else
  # 首次模式: 完整生成
  MODE="initial"
fi
```

**manifest.json** 记录上次生成的状态:
```json
{
  "version": "1.0",
  "generated_at": "2026-04-23T10:00:00Z",
  "language": "typescript",
  "framework": "nextjs",
  "layer_mapping": { ... },
  "quality_rules": { ... },
  "custom_rules": ["my-rule-1"],
  "files_generated": [".harness/scripts/lint-deps.ts", "..."]
}
```

重入时的增量更新策略:
- **对比目录结构**: 扫描源码目录 vs manifest 中的 layer_mapping，发现新目录自动建议加入
- **对比依赖**: 扫描 import 语句 vs 已有规则，发现新的跨层依赖自动标记
- **保护自定义**: manifest.custom_rules 中记录的规则不覆盖
- **重新生成知识**: 读取当前代码，更新 .harness/docs/ 中的文档

#### 3.2.2 docs 收归 .harness/

**变更前**（顶层目录过多）:
```
项目根目录/
  AGENTS.md
  docs/
    ARCHITECTURE.md
    DEVELOPMENT.md
    PRODUCT_SENSE.md
    design-docs/
    exec-plans/
  .harness/
    scripts/
    memory/
    ...
```

**变更后**（统一到 .harness/）:
```
项目根目录/
  .harness/
    docs/
      ARCHITECTURE.md
      DEVELOPMENT.md
      PRODUCT_SENSE.md
    scripts/
      lint-deps.{ext}
      lint-quality.{ext}
      validate.{ext}
    rules/
      common/
        safety.md
        git-workflow.md
      {language}/
        development.md
    memory/
      episodic/
      procedural/
    trace/
      failures/
    manifest.json
```

**移除的内容**:
- `AGENTS.md`（顶层）- Superpowers 有自己的导航机制，harness 不需要额外导航文件
- `docs/design-docs/` - 使用 Superpowers 的 planning 替代
- `docs/exec-plans/` - 使用 Superpowers 的 planning 替代
- `.harness/tasks/` - Superpowers 管理任务状态
- `.harness/rules/common/roles.md` - 5D 角色过重，简化为 code-reviewer 的 checklist
- `.harness/scripts/verify-action.{ext}` - 合并到 validate 中
- `.harness/scripts/verify/` - 使用项目自身测试替代

**减少的 agent**:
- `planner.md` - 由 Superpowers planning 替代
- `harness-guardian.md` - 合并到 code-reviewer 中

#### 3.2.3 hooks 机制

支持两种 hooks：

**a) Session Hook（已有，增强）**:

更新 `hooks/session-start` 脚本，在会话启动时：
```bash
#!/bin/bash
# 检查 harness 是否需要更新
if [ -f ".harness/manifest.json" ]; then
  MANIFEST_TIME=$(stat -f %m .harness/manifest.json 2>/dev/null || stat -c %Y .harness/manifest.json)
  LATEST_SRC=$(find . -name "*.ts" -o -name "*.py" -o -name "*.go" -not -path '*/node_modules/*' | \
    xargs stat -f %m 2>/dev/null | sort -rn | head -1)
  if [ "$LATEST_SRC" -gt "$MANIFEST_TIME" ]; then
    echo "[harness] Source code has changed since last harness update."
    echo "[harness] Run 'harness-apply' to update harness knowledge."
  fi
fi
```

**b) Git Hook（新增）**:

生成 `.harness/hooks/post-commit` 脚本，可由用户选择安装到 `.git/hooks/`：
```bash
#!/bin/bash
# Auto-check harness freshness after commit
echo "[harness] Checking harness freshness..."
# 标记 manifest 需要更新
touch .harness/.needs-update
```

**hooks 安装方式**（在 harness-apply 中提供选项）:
```bash
# 用户选择是否安装 git hooks
cp .harness/hooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

### 3.3 harness-loop（新建：Ralph Wiggum Loop）

**新文件**: `plugins/harness-pilot/skills/harness-loop/SKILL.md`

**核心理念**: 实现编排-审查-测试-修复的质量闭环，这是 harness 的核心价值。

#### Ralph Wiggum Loop 流程

```
                    ┌──────────────┐
                    │   Orchestrate │ ← 用户提交代码改动
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Review     │ ← Agent 互审代码
                    │  (lint-deps   │   (dispatch code-reviewer)
                    │  + arch check │
                    │  + quality)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     Test      │ ← 运行 validate pipeline
                    │  (build/lint  │   (build → lint → test → validate)
                    │  /test/e2e)   │
                    └──────┬───────┘
                           │
                     Pass? │
                    ┌──────▼───────┐
              No ── │   Decision    │ ── Yes → Done (输出报告)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │     Fix       │ ← 自动修复或提示修复
                    │  (auto-fix    │   (记录到 trace/failures)
                    │  + evolve)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Re-Review   │ ← 回到 Review（最多 3 轮）
                    └──────────────┘
```

#### Agent 互审机制

harness-loop 的 Review 阶段使用 **Agent 互审**:

1. **Dispatch code-reviewer agent** 审查代码改动
2. code-reviewer 使用 `.harness/docs/ARCHITECTURE.md` 中的 layer 规则检查架构合规
3. code-reviewer 使用 `.harness/scripts/lint-quality` 检查代码质量
4. 输出结构化的 review 结果

复用 Superpowers 的 `code-reviewer` agent 协议（Requesting Code Review skill），不自建。

#### 闭环控制

```
MAX_ITERATIONS = 3

for i in range(MAX_ITERATIONS):
    review_result = dispatch_code_reviewer(changed_files)
    test_result = run_validate_pipeline()

    if review_result.approved and test_result.passed:
        output_success_report()
        break

    failures = collect_failures(review_result, test_result)
    record_to_trace(failures)  # .harness/trace/failures/

    if can_auto_fix(failures):
        apply_auto_fix(failures)
    else:
        output_fix_suggestions(failures)
        break  # 需要人工介入

# 最终输出 Loop 报告
output_loop_report(iterations, results)
```

#### evolve 能力（从 harness-evolve 合并）

Loop 结束后自动执行轻量 evolve:
- 扫描 `.harness/trace/failures/` 中的新增记录
- 如果同类 failure 出现 3+ 次，建议更新 harness 规则
- 不再有独立的 evolve 入口，作为 Loop 的附属输出

#### Loop 报告格式

```
╔══════════════════════════════════════════════════╗
║          Harness Loop Report                     ║
║          Iterations: 2/3                         ║
║          Result: PASS                            ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Review Phase                                    ║
║  ─────────────────────────────────────────────── ║
║  Architecture: PASS (0 layer violations)         ║
║  Quality:      PASS (lint-quality clean)         ║
║  Code Review:  APPROVED (agent review)           ║
║                                                  ║
║  Test Phase                                      ║
║  ─────────────────────────────────────────────── ║
║  Build:   PASS                                   ║
║  Lint:    PASS                                   ║
║  Test:    PASS (42/42)                           ║
║  Validate: PASS                                  ║
║                                                  ║
║  Iteration History                               ║
║  ─────────────────────────────────────────────── ║
║  #1: FAIL → layer violation in services/api.ts   ║
║       → Auto-fixed: moved import to correct layer║
║  #2: PASS → all checks passed                    ║
║                                                  ║
╠══════════════════════════════════════════════════╣
║  Evolution Insights                              ║
║  - "services/ importing from app/" seen 3 times  ║
║    → Suggest: add lint-deps rule for services/   ║
╚══════════════════════════════════════════════════╝
```

## 4. 受影响文件清单

### 需要修改的文件

| 文件路径 | 修改类型 | 说明 |
|---|---|---|
| `plugins/harness-pilot/skills/harness-analyze/SKILL.md` | MODIFIED | 美化报表格式，增加整体打分，简化推荐 |
| `plugins/harness-pilot/skills/harness-apply/SKILL.md` | MODIFIED | 可重入设计，docs 收归 .harness/，hooks 支持，移除 AGENTS.md/design-docs/exec-plans/verify-action/verify/tasks/roles.md |
| `plugins/harness-pilot/agents/code-reviewer.md` | MODIFIED | 合并 harness-guardian 的架构检查能力 |
| `plugins/harness-pilot/hooks/hooks.json` | MODIFIED | 更新 session-start hook 逻辑 |
| `plugins/harness-pilot/hooks/session-start` | MODIFIED | 增加 harness 新鲜度检查 |

### 需要新建的文件

| 文件路径 | 说明 |
|---|---|
| `plugins/harness-pilot/skills/harness-loop/SKILL.md` | Ralph Wiggum Loop 质量闭环 skill |

### 需要删除的文件

| 文件路径 | 理由 |
|---|---|
| `plugins/harness-pilot/skills/harness-spec/SKILL.md` | Superpowers brainstorm + planning 已覆盖 |
| `plugins/harness-pilot/skills/harness-review/SKILL.md` | 合并到 harness-loop |
| `plugins/harness-pilot/skills/harness-evolve/SKILL.md` | 合并到 harness-loop |
| `plugins/harness-pilot/agents/planner.md` | Superpowers planning 替代 |
| `plugins/harness-pilot/agents/harness-guardian.md` | 合并到 code-reviewer |

### 需要更新的模板文件

| 文件路径 | 说明 |
|---|---|
| `plugins/harness-pilot/templates/base/AGENTS.md.template` | 删除（不再生成 AGENTS.md） |
| `plugins/harness-pilot/templates/base/exec-plan.md.template` | 删除（使用 Superpowers planning） |
| `plugins/harness-pilot/templates/base/ARCHITECTURE.md.template` | 更新输出路径为 .harness/docs/ |
| `plugins/harness-pilot/templates/base/DEVELOPMENT.md.template` | 更新输出路径为 .harness/docs/ |
| `plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template` | 更新输出路径为 .harness/docs/ |
| `plugins/harness-pilot/templates/rules/common/roles.md.template` | 删除（5D 角色过重） |

### 需要更新的文档

| 文件路径 | 说明 |
|---|---|
| `README.md` | 更新为 3 skill 架构，更新目录结构说明 |
| `docs/overview-design.md` | 更新架构图，增加 Ralph Wiggum Loop 描述 |
| `docs/detailed-design.md` | 更新详细设计，移除 harness-spec/review/evolve 章节 |
| `docs/API.md` | 更新 API 文档，反映新的 3 skill 接口 |
| `docs/CONTRIBUTING.md` | 更新贡献指南 |

## 5. 数据流

### 首次使用流程

```
用户项目 → harness-analyze (打分报表) → harness-apply (生成 .harness/) → 开发 → harness-loop (质量闭环)
```

### 日常开发流程

```
编写代码 → harness-loop → [Review → Test → Fix]* → Done
                              ↑                 │
                              └─────────────────┘ (最多3轮)
```

### 重入更新流程

```
代码改动 → session-start hook 提示 → harness-apply (重入模式)
  → 检测 manifest.json
  → 对比目录结构变化
  → 增量更新 layer mapping / rules / docs
  → 保留用户自定义规则
```

## 6. 边界条件和异常处理

| 场景 | 处理方式 |
|---|---|
| Loop 达到最大轮次仍失败 | 输出所有未解决问题，建议人工介入 |
| harness-apply 重入时 manifest.json 损坏 | 回退到首次生成模式，告知用户 |
| 用户自定义规则与新规则冲突 | 保留用户规则，输出冲突警告 |
| 项目无测试框架 | Loop 的 Test 阶段仅运行 lint 检查，跳过 test |
| code-reviewer agent 不可用 | Loop 的 Review 阶段仅运行 lint-deps + lint-quality |
| Superpowers 未安装 | harness-loop 仍可独立工作，review 使用内置 code-reviewer |

## 7. 预期结果

| 指标 | 变更前 | 变更后 |
|---|---|---|
| Skill 数量 | 5 | 3 |
| Agent 数量 | 3 | 1 |
| 顶层目录影响 | AGENTS.md + docs/ + .harness/ | .harness/ 仅一个 |
| 质量闭环 | 无（review 是单次的） | Ralph Wiggum Loop（最多 3 轮自动闭环） |
| 可重入 | 不支持（每次全量生成） | 支持（manifest + 增量更新） |
| hooks | 仅 session-start | session-start + git post-commit |
| 报表美化 | 纯文本 | 可视化评分卡 + 进度条 |
