# Harness Pilot 能力融合设计

> 策略：直接复用 Superpowers + gstack 成熟能力 + 自建 Harness 特有能力 + 推荐机制串联

---

## 一、核心策略：不重复造轮子

### 关键发现

**Superpowers**（163K stars）和 **gstack**（70K stars）都是 Claude Code 插件，可以和 Harness Pilot **并存安装**。

Superpowers 提供开发方法论：
- **brainstorm** — 苏格拉底式追问，将模糊想法变成设计文档
- **git worktree** — 隔离开发环境，基线检查 + 完成后验证
- **TDD** — 红绿重构强制执行
- **planning** — 结构化任务拆解
- **subagent execution** — 子代理编排执行
- **code review** — 两阶段代码评审

gstack 提供角色治理 + 工具链：
- **/careful + /freeze + /guard** — 安全护栏（危险命令警告、编辑范围锁定）
- **/investigate** — 系统化问题调查
- **/qa + /qa-only** — QA 视角测试
- **/ship + /land-and-deploy + /canary** — 发布流程
- **/plan-ceo-review + /plan-eng-review + /plan-design-review** — 多角色评审
- **/codex** — 跨模型交叉评审（调用 OpenAI Codex）
- **/browse** — 浏览器自动化
- **/autoplan** — 自动规划
- **/retro** — 复盘总结

安装方式：
```bash
# Superpowers
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

# gstack
git clone --single-branch --depth 1 https://github.com/garrytan/gstack ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

### 冲突分析

gstack 30+ skills 中，与 Harness Pilot 有功能重叠的只有 2 个：

| gstack Skill | 重叠点 | 结论 |
|---|---|---|
| `/review` | vs Harness code-reviewer agent | **互补不冲突**。gstack 是通用代码评审，Harness 是带架构层级规则的评审 |
| `/plan-eng-review` | vs harness-review 的架构评审 | **互补不冲突**。gstack 偏通用工程视角，Harness 有 lint-deps 数据支撑 |

其余 25+ 个 skill（/careful, /freeze, /browse, /investigate, /qa, /ship, /canary, /codex 等）与 Harness 完全不冲突。

### 策略决定

| 能力 | 方案 | 理由 |
|------|------|------|
| brainstorm | **直接用 Superpowers** | 成熟实现，苏格拉底式追问 |
| git worktree | **直接用 Superpowers** | 包含安全检查、基线验证、清理 |
| TDD 强制 | **直接用 Superpowers** | 红绿重构流程完整 |
| planning/execution | **直接用 Superpowers** | subagent-driven 执行成熟 |
| 安全护栏 | **直接用 gstack** | /careful + /freeze + /guard 成熟 |
| 问题调查 | **直接用 gstack** | /investigate 系统化 |
| QA 测试视角 | **直接用 gstack** | /qa + /qa-only 完整 |
| 发布流程 | **直接用 gstack** | /ship + /land-and-deploy + /canary 完整 |
| 多角色评审 | **直接用 gstack** | /plan-ceo-review + /plan-eng-review 等成熟 |
| 跨模型评审 | **直接用 gstack** | /codex 调用 OpenAI 做交叉检查 |
| 浏览器自动化 | **直接用 gstack** | /browse headless Chromium |
| Spec 需求管理 | **Harness 自建** | 与 harness 验证体系深度绑定 |
| 自进化（Critic→Refiner） | **Harness 自建** | Harness 独有能力，依赖 .harness/trace/ |
| 架构专项评审 | **Harness 自建** | 与 harness-guardian、lint-deps 深度集成 |
| 角色视角注入 | **Harness 自建（轻量）** | 提取核心视角注入现有 agent，比 gstack 角色系统更轻 |
| **推荐机制** | **Harness 自建** | 在 analyze/apply 中推荐 Superpowers + gstack + 自有 skills |

---

## 二、Harness Pilot 自建能力（Superpowers 不覆盖的部分）

### 选项 A：harness-spec skill（借鉴 OpenSpec）

**价值**：为功能开发提供"需求→实现"的结构化桥梁，与 harness 验证体系深度绑定。Superpowers 的 planning 只做任务拆解，不做需求规格管理。

**核心机制**：
- 在 `.harness/specs/<feature>/` 下创建轻量 spec 文件
- 三阶段状态：`draft` → `approved` → `archived`
- delta 标记：对于修改已有功能，用 `[ADDED]`/`[MODIFIED]`/`[REMOVED]` 标注变更
- **与 harness 验证的绑定**：spec 中的 Verification Criteria 直接引用 lint-deps、validate 等

**触发词**：`harness-spec`、`spec`、`write spec`、`feature spec`

**产出物**：
```
.harness/specs/<feature>/
├── spec.md          # 需求规格（目标、约束、影响范围、验证标准）
├── status           # 状态文件：draft | approved | archived
└── delta.md         # 仅修改已有功能时：变更标记文档
```

**spec.md 核心结构**：
```markdown
# Feature: <name>
## Status: draft
## Objective
<一句话描述这个功能要做什么>
## Constraints
- 必须遵守的层级规则
- 性能要求
- 兼容性要求
## Affected Files
- [ADDED] src/services/new-service.ts
- [MODIFIED] src/api/routes.ts — 添加新路由
- [REMOVED] src/legacy/old-handler.ts
## Verification Criteria
- [ ] lint-deps 通过
- [ ] 新增测试覆盖
- [ ] validate 管道全绿
## Approved By: <pending>
```

**与 Superpowers 的协作**：
- Superpowers brainstorm 产出设计文档 → 输入 harness-spec 形式化
- Superpowers planning 从 spec.md 读取约束生成 exec-plan
- harness-guardian 在 spec 阶段就能预检 Affected Files 是否合法

**影响文件**：新增 `plugins/harness-pilot/skills/harness-spec/SKILL.md`

---

### 选项 B：harness-review skill（多视角评审）

**价值**：Superpowers 的 code review 偏代码细节。harness-review 增加架构/产品/质量三个维度，与 harness 的 guardian 和 PRODUCT_SENSE.md 深度集成。

**三种评审视角**：

| 视角 | 关注点 | 底层能力 |
|------|--------|---------|
| **架构评审** | 层级合规、依赖方向、模块边界、扩展性 | 复用 harness-guardian agent |
| **产品评审** | 功能完整性、边界情况、用户体验影响 | 读取 docs/PRODUCT_SENSE.md |
| **质量评审** | 测试覆盖、边界测试、错误处理、性能 | 复用 code-reviewer agent |

**触发词**：`harness-review`、`review`、`design-review`、`arch-review`

**产出物**：
```markdown
## Review Report: <feature>
### Architecture Review
- Layer compliance: PASS/FAIL
- Dependency direction: PASS/FAIL
- Extensibility concerns: [list]
- Verdict: APPROVE / NEEDS_CHANGES

### Product Review
- Feature completeness: [checklist]
- Edge cases: [list]
- UX impact: [assessment]
- Verdict: APPROVE / NEEDS_CHANGES

### Quality Review
- Test coverage: [assessment]
- Error handling: [assessment]
- Performance: [assessment]
- Verdict: APPROVE / NEEDS_CHANGES

### Final Verdict: APPROVE / NEEDS_CHANGES
```

**影响文件**：新增 `plugins/harness-pilot/skills/harness-review/SKILL.md`

---

### 选项 C：harness-evolve skill（Critic→Refiner 闭环）

**价值**：Superpowers 不做失败学习。这是 Harness Pilot 设计文档中已描述但未实现的核心能力。

**触发词**：`harness-evolve`、`evolve`、`learn`、`improve harness`、`failure analysis`

**流程**：
```
Step 1: 收集 — 扫描 .harness/trace/failures/*.md，统计频次
Step 2: 识别 — 聚合同类失败，识别根因
Step 3: 建议 — 层级映射补充、规则补充、文档更新、程序记忆提取
Step 4: 应用 — 用户确认后自动更新配置，验证更新后规则仍通过
```

**产出物**：
```
=== Harness Evolution Report ===
分析了 N 条失败记录

模式 1: [描述] (出现 M 次)
  根因: [分析]
  建议: [具体修复]
  置信度: [high/medium/low]

轨迹编译候选:
  - "添加 API 端点" 已成功执行 5 次，步骤一致
    → 可编译为 .harness/scripts/compiled/add-api-endpoint.sh
```

**影响文件**：新增 `plugins/harness-pilot/skills/harness-evolve/SKILL.md`

---

### 选项 D：角色视角注入（借鉴 gstack，轻量化）

**价值**：不引入 gstack 的完整角色系统，而是提取核心视角作为 rules 模板注入现有 agent。

**实现方式**：新增 `.harness/rules/common/roles.md.template`

**角色视角定义**：

| 角色视角 | 适用阶段 | 关注点 |
|---------|---------|--------|
| **产品视角** | brainstorm、spec | 用户是谁、解决什么问题、怎么衡量成功 |
| **架构视角** | spec、planning | 层级合规、扩展性、技术债 |
| **工程视角** | 实现 | 实现质量、性能、可测试性 |
| **质量视角** | review | 测试覆盖、边界用例、错误处理 |
| **运维视角** | validate | 部署就绪、监控、日志、回滚能力 |

**注入方式**：
- harness-apply 生成 `.harness/rules/common/roles.md` 时包含角色定义
- planner 在 exec-plan 中引用角色视角检查清单
- code-reviewer 在评审时可启用多视角

**影响文件**：
- 新增 `plugins/harness-pilot/templates/rules/common/roles.md.template`
- 修改 `plugins/harness-pilot/agents/planner.md`（增加角色视角引用）
- 修改 `plugins/harness-pilot/agents/code-reviewer.md`（增加多视角选项）
- 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`（生成 roles.md）

---

## 三、推荐机制（核心串联能力）

### 选项 E：harness-analyze / harness-apply 增加工具链推荐

**价值**：这是串联所有能力的关键。让用户在分析或生成 harness 时，发现完整的开发质量工具链。

#### harness-analyze 健康报告增加推荐区域：

```
=== Harness 健康度报告 ===
总分: 75/100

... (现有报告内容) ...

🔗 推荐的开发质量工具链:

  外部插件 (直接安装):
    [推荐] Superpowers — brainstorm + TDD + git worktree + subagent 执行
      安装: /plugin marketplace add obra/superpowers-marketplace
            /plugin install superpowers@superpowers-marketplace
      原因: 提供结构化开发方法论，与 harness 验证体系互补

  Harness 内置增强 skills:
    [推荐] harness-spec — 结构化需求管理
      原因: 项目有多人协作，需要需求→实现的可追踪链路

    [可选] harness-review — 多视角评审
      原因: 项目复杂度较高，多视角评审可减少盲区

    [可选] harness-evolve — 从失败中学习
      原因: .harness/trace/failures/ 中有记录，可从中提取模式
```

#### harness-apply 生成完成后增加推荐：

```
✓ Harness 基础设施生成完成！

... (现有输出) ...

📋 完整开发质量工具链:

  Harness Pilot 核心 (已安装):
    ✅ harness-analyze — 健康度分析
    ✅ harness-apply — 基础设施生成
    ✅ planner agent — 执行计划
    ✅ code-reviewer agent — 代码评审
    ✅ harness-guardian agent — 架构守门

  Harness 增强 skills (可选启用):
    ☐ harness-spec — 写 spec 再写代码
    ☐ harness-review — 多视角评审
    ☐ harness-evolve — 从失败中学习

  推荐搭配的外部插件:
    ☐ Superpowers — brainstorm + TDD + worktree + 子代理执行
      安装: /plugin marketplace add obra/superpowers-marketplace
            /plugin install superpowers@superpowers-marketplace

    ☐ gstack — 安全护栏 + QA + 多角色评审 + 发布流程 + 浏览器自动化
      安装: git clone --depth 1 https://github.com/garrytan/gstack ~/.claude/skills/gstack
            cd ~/.claude/skills/gstack && ./setup

  推荐的完整工作流:
    brainstorm(SP) → spec(H) → plan(SP) → worktree(SP) → 实现 → review(H+G) → ship(G) → evolve(H)
    SP=Superpowers  H=Harness  G=gstack
```

#### 推荐逻辑：

| 条件 | 推荐内容 | 级别 |
|------|---------|------|
| 任何项目 | Superpowers 插件 | 推荐 |
| 任何项目 | gstack 插件 | 推荐 |
| 多人协作（>1 contributors） | harness-spec | 推荐 |
| 项目复杂度高（>50 文件） | harness-review + 角色视角 | 可选 |
| trace/failures/ 有记录 | harness-evolve | 可选 |

**影响文件**：
- 修改 `plugins/harness-pilot/skills/harness-analyze/SKILL.md`（Step 7 报告模板）
- 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`（成功输出模板）

---

## 四、完整工作流（融合后）

```
┌──────────────────────────────────────────────────────────────────┐
│                    完整开发质量工具链                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Superpowers]          [Harness Pilot]                          │
│                                                                  │
│  brainstorm ──────→ harness-spec ──────→ planner(SP)            │
│  (想清楚)           (写规格+验证标准)    (任务拆解+TDD)          │
│                           │                   │                  │
│                           │          harness-guardian             │
│                           │          (预检架构合规)               │
│                           ↓                   ↓                  │
│                     worktree(SP) ────→ subagent 执行(SP)         │
│                     (隔离环境)          (代码实现)                │
│                                              │                   │
│                                   ┌──────────┼──────────┐       │
│                                   ↓          ↓          ↓       │
│                              lint-deps   validate   code-review  │
│                              (层级检查)  (验证管道)  (SP+H评审)  │
│                                              │                   │
│                                    harness-review(H)             │
│                                    (架构/产品/质量多视角)         │
│                                              │                   │
│                                    harness-evolve(H)             │
│                                    (从失败中学习)                │
│                                                                  │
│  SP = Superpowers 提供    H = Harness Pilot 提供                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 五、实施优先级

### 第一轮（必做）

| 优先级 | 选项 | 理由 |
|--------|------|------|
| P0 | **E: 推荐机制** | 串联所有能力的入口，改动小（修改 2 个现有 SKILL.md） |
| P1 | **A: harness-spec** | 填补 Superpowers 不覆盖的需求管理空白 |

### 第二轮（增强）

| 优先级 | 选项 | 理由 |
|--------|------|------|
| P2 | **D: 角色视角** | 轻量注入，提升现有 agent 的思考深度 |
| P2 | **B: harness-review** | 多视角评审，与角色视角配合 |

### 第三轮（闭环）

| 优先级 | 选项 | 理由 |
|--------|------|------|
| P3 | **C: harness-evolve** | 自进化闭环，长期价值最大 |

---

## 六、不自建的能力（直接用 Superpowers）

| 能力 | Superpowers 对应 skill | 理由 |
|------|----------------------|------|
| brainstorm | Brainstorming Ideas Into Designs | 苏格拉底式追问，成熟 |
| git worktree | Using Git Worktrees | 安全检查 + 基线验证 + 清理 |
| TDD | Test-Driven Development | 红绿重构完整流程 |
| 结构化规划 | Writing Plans | 独立可验证的任务拆解 |
| 子代理执行 | Subagent-Driven Development | 上下文隔离执行 |
| 代码评审 | Requesting Code Review | 两阶段评审 |
| 系统调试 | Systematic Debugging / Root Cause Tracing | 四阶段调试框架 |

---

## 七、影响文件汇总

| 选项 | 修改类型 | 文件路径 |
|------|----------|---------|
| A | 新增 | `plugins/harness-pilot/skills/harness-spec/SKILL.md` |
| B | 新增 | `plugins/harness-pilot/skills/harness-review/SKILL.md` |
| C | 新增 | `plugins/harness-pilot/skills/harness-evolve/SKILL.md` |
| D | 新增 | `plugins/harness-pilot/templates/rules/common/roles.md.template` |
| D | 修改 | `plugins/harness-pilot/agents/planner.md` |
| D | 修改 | `plugins/harness-pilot/agents/code-reviewer.md` |
| D | 修改 | `plugins/harness-pilot/skills/harness-apply/SKILL.md` |
| E | 修改 | `plugins/harness-pilot/skills/harness-analyze/SKILL.md` |
| E | 修改 | `plugins/harness-pilot/skills/harness-apply/SKILL.md` |
