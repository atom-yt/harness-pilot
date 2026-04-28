# Harness Pilot 概要设计

> Harness Pilot 插件的设计文档——核心问题、解决思路、架构设计与实现细节

---

## 文档导航

| 章节 | 内容 | 读者 |
|------|------|------|
| 一、核心问题 | 问题简述 | 全部 |
| 二、解决思路 | 范式转换与差异化定位 | 全部 |
| 三、项目愿景与设计原则 | 目标、问题矩阵、四条设计原则 | 全部 |
| 四、核心功能 | 两个 Skill、Agent 体系、模板系统 | 用户 |
| 五、关键机制 | Ralph Wiggum Loop、Handoff、Hooks | 开发者 |
| 六、架构设计 | 插件结构、目录布局、共享工具库 | 开发者 |
| 七、业界对比 | 工具/循环/测试机制对比 | 全部 |
| 八、总结 | 核心理念与行动建议 | 全部 |
| 附录 | 语言与框架支持清单 | 用户 |

---

## 一、核心问题：AI Agent 在代码库中的协作挑战

AI Agent 在代码库协作中面临的核心问题是**可见性**——项目中的分层约束、命名规范、架构约定对 Agent 来说是隐性的。如果这些规则不在 Git 仓库中以明确形式存在，Agent 就无法感知，导致反复违规、修复循环、上下文被错误日志填满。

**隐性规则示例**：

| 隐性规则 | 来源 | Agent 能否感知 |
|---------|------|---------------|
| 新模块必须先写测试 | 工程文化 | ❌ |
| 包命名必须用 kebab-case | 开发规范文档（非项目内） | ❌ |
| 数据库查询只能在 `repository/` 层，`service/` 层不能直接调用 ORM | 架构评审会议纪要 | ❌ |
| 日志输出前必须脱敏（用户 ID、手机号、Token） | 安全合规 Wiki | ❌ |
| 错误码必须统一使用 `errors/` 目录下的枚举，不能硬编码字符串 | 历史 PR 评审意见 | ❌ |
| `utils/` 目录只允许纯函数，不能持有状态或产生副作用 | 设计评审记录 | ❌ |
| 新增对外 API 接口必须同步更新 `docs/API.md` | 团队口头约定 | ❌ |

---

## 二、解决思路：从"教"到"验"的范式转变

现有方案（System Prompt、RAG、CI/CD Lint 等）的根本限制在于：要么规则追不上代码变化，要么检查时机太晚，要么约束力靠"自觉"。

Harness Pilot 的差异化在于：**规则在 Git 仓库中版本化、在写代码前预验证、靠自动化脚本强制执行**。

| 维度 | 传统方法 | Harness Pilot 方法 |
|------|---------|------------------|
| 规则存储 | Wiki、Prompt、外部文档 | 项目 Git 仓库中，版本化追踪 |
| 检查时机 | 写代码后（CI/CD）或行动中（Prompt 提醒） | **写代码前**（预验证） |
| 约束力 | 依赖 Agent 理解和记忆 | **自动化脚本强制执行** |
| 更新机制 | 手动维护，容易过时 | session-start hook 自动检查新鲜度 |

---

## 三、项目愿景与设计原则

### 目标

让 AI Agent 在代码库中**可靠协作**，建立可复用的项目知识资产。

### 解决的问题矩阵

| 问题 | 根本原因 | Harness Pilot 的解法 |
|------|---------|---------------------|
| 新会话的 Agent 不知道项目规范 | 信息未版本化，存储在外部系统 | 规范在 Git 仓库中，随代码演进 |
| 规则频繁变化，Agent 跟不上 | 手动维护更新，有延迟 | session-start hook 自动检测文档新鲜度 |
| 代码写完才发现架构违规 | 检查时机太晚（CI/CD） | 写代码前预验证操作合法性 |
| 同类错误反复出现 | 没有失败模式分析和记忆 | Ralph Wiggum Loop 自动修复 + trace 记忆 |
| 长任务单会话跑不完 | 上下文窗口被错误信息填满 | Handoff 机制跨会话传递状态 |

### 四条设计原则

**1. 仓库是唯一事实来源**
- 规则必须在代码库中，不能只在 Wiki 或口头约定
- Git 版本化，随代码演进
- Agent 打开项目就能读取一切

**2. `.harness/` 是自包含的**
- 所有生成文件集中在 `.harness/` 目录，不污染项目根目录
- 文档放在 `.harness/docs/`，按需加载
- `manifest.json` 追踪状态，支持增量更新

**3. 只管边界不管实现**
- 定义层级依赖规则
- 不规定设计模式或编码风格（除非是质量规则）
- 边界内如何实现自由决定

**4. 事前验证优于事后检查**
- 结构性操作前先验证合法性
- 写代码前问"能不能做"而非写完再修
- 降低修复成本

---

## 四、核心功能

Harness Pilot 是一个 Claude Code 插件，提供两个核心 Skill、五个内置 Agent 和一套分层模板系统。运行 `harness-apply` 后，会在目标项目生成 `AGENTS.md` 导航地图和完整的 `.harness/` 基础设施。

### 生成的导航地图：AGENTS.md

`AGENTS.md` 是项目根目录的核心文件，AI Agent 打开项目时的第一站：

| 作用 | 说明 |
|------|------|
| **快速导航** | 索引关键文件位置，避免盲目搜索 |
| **项目概览** | 语言、框架、First Principles |
| **规则定位** | 指向 `.harness/rules/` 和 `.harness/docs/` |
| **工作流指引** | 标准流程：analyze → apply → develop → validate → ship |

**关键文件索引**：

| 文件 | 位置 | 用途 |
|------|------|------|
| `AGENTS.md` | 项目根目录 | 本文件——导航地图 |
| `.harness/docs/ARCHITECTURE.md` | `.harness/docs/` | 架构规则与层级依赖 |
| `.harness/docs/DEVELOPMENT.md` | `.harness/docs/` | 开发命令、测试方法 |
| `.harness/docs/PRODUCT_SENSE.md` | `.harness/docs/` | 业务上下文与领域知识 |
| `.harness/manifest.json` | `.harness/` | Harness 配置快照 |
| `.harness/capabilities.json` | `.harness/` | 已启用能力 |

### 两个 Skill

| Skill | 命令 | 用途 |
|-------|------|------|
| **harness-analyze** | `/harness-pilot:harness-analyze` | 分析项目结构、审计 Harness 健康度、生成可视化评分报告（只读，不修改任何文件） |
| **harness-apply** | `/harness-pilot:harness-apply` | 生成/增量更新 Harness 基础设施，内置 Ralph Wiggum Loop |

#### harness-analyze

分析流程分四步：

```
analyze-docs()       → 文档覆盖率
analyze-architecture() → 架构约束与层级合规
analyze-imports()    → 导入模式与循环依赖
generate-report()    → 可视化评分报告（A/B/C/D）
```

评分权重：文档覆盖 35%、架构合规 35%、测试覆盖 30%，并追踪历史趋势。

#### harness-apply

支持三种模式：

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **初始化** | 项目无 `.harness/` 目录 | 自动检测语言/框架，**选择开发模式**，交互式选择组件，生成完整结构 |
| **代码生成** | 脚手架新模块（API、Model、Service） | **选择开发模式**，基于模板生成代码骨架 |
| **增量更新** | `.harness/` 已存在 | 检测变更，保留用户自定义内容，仅更新需要变化的部分 |

#### 开发模式选择（Development Mode）

`harness-apply` 在初始化和代码生成模式中，**首先**进行开发模式选择（Step 0），再执行生成。默认使用 **SPEC（SDD）模式**，由复杂度分数强制执行。

**复杂度 → 模式 映射表**（SPEC 是所有任务的默认模式）：

| 分数 | 级别 | 默认模式 | 可降级至 | 专家团 |
|------|------|---------|---------|--------|
| 1–3 | trivial | **spec** | plan / direct | — |
| 4–6 | simple | **spec** | plan / direct | — |
| 7–10 | moderate | **spec（强制）** | plan | — |
| 11–15 | complex | **spec（强制）** | 不可降级 | 自动组建（可跳过） |
| 16+ | critical | **spec（强制）** | 不可降级 | 自动组建（**必须**） |

**openspec 插件集成**：选择 SPEC 模式后，自动检测 openspec 插件是否已安装：
- **已安装**：将完整 SDD 工作流（doc.md → tasks.md → 实现 → summary.md）委托给 openspec 插件
- **未安装**：使用内置 fallback（展示预填充 spec 大纲，用户确认后生成 `.comate/specs/{taskId}/` 产物）+ 推荐安装 openspec

**专家团自动路由**：分数 ≥ 11 时自动组建专家团（Architect、Implementer、Reviewer），展示团队构成后等待用户确认，再进入生成阶段。`--no-panel` 可跳过（critical 级别不可跳过）。

**覆盖标志**：
- `--auto` — 跳过所有提示，接受默认值
- `--no-panel` — 跳过专家团（仅在 `expertPanelCanSkip: true` 时有效）

### Agent 体系

Harness Pilot 内置五个专职 Agent，在特定场景下由 Skill 自动调度：

| Agent | 触发场景 | 职责 |
|-------|---------|------|
| **planner** | 需求模糊或跨 3+ 文件的变更 | 将模糊需求分解为有序的可执行步骤 |
| **code-reviewer** | Ralph Wiggum Loop 审查阶段 | 架构合规 + 代码质量双维度审查 |
| **test-generator** | PR 评审阶段 / Loop 测试阶段 | 基于 git diff 动态生成补充测试（JIT） |
| **e2e-executor** | 阶段完成验证 | 执行 API 测试 + Playwright 浏览器测试 |
| **refactoring-agent** | 检测到代码异味时 | 分析圈复杂度、深嵌套、上帝类等，给出重构建议 |

code-reviewer 检查维度：

| 审查维度 | 关注点 |
|----------|--------|
| **架构合规** | 层级依赖方向、循环引用检测、包边界 |
| **工程质量** | 可测试性、错误路径、命名清晰度 |
| **代码规范** | 边界条件、竞态风险、一致性 |

### 模板系统

`harness-apply` 使用分层覆盖机制生成文件，越靠后的层优先级越高：

```
base/ → languages/ → frameworks/ → rules/ → capabilities/
```

| 层 | 路径 | 内容 |
|----|------|------|
| **base** | `templates/base/` | 与语言/框架无关的通用模板（AGENTS、ARCHITECTURE、DEVELOPMENT、PRODUCT_SENSE） |
| **languages** | `templates/languages/{lang}/` | 语言特定覆盖（go、java、python、typescript） |
| **frameworks** | `templates/frameworks/{fw}/` | 框架特定覆盖（nextjs、react、express、django、fastapi、gin、spring-boot） |
| **rules** | `templates/rules/{lang}/` | 质量规则模板（common、go、java、javascript、python、typescript） |
| **capabilities** | `templates/capabilities/{cap}/` | 可选能力模板（e2e、jit-test、security、monitoring、logging、authorization 等） |

#### AGENTS.md：AI Agent 的导航地图

`AGENTS.md` 是 `harness-apply` 生成的核心文件之一，位于**项目根目录**（与 `.harness/` 同级）。它是 AI Agent 进入项目时的第一站，提供快速导航。

**生成的 AGENTS.md 结构**：

```markdown
# {PROJECT_NAME} - Agent Navigation Map

## First Principles
# 四条核心原则（从需求出发，而非模板）

## Project Overview
# 语言、框架信息

## Key Files
# 关键文件索引
# ├─ AGENTS.md（本文件）
# ├─ .harness/docs/ARCHITECTURE.md（架构规则）
# ├─ .harness/docs/DEVELOPMENT.md（开发命令）
# ├─ .harness/docs/PRODUCT_SENSE.md（业务上下文）
# ├─ .harness/manifest.json（配置快照）
# └─ .harness/capabilities.json（已启用能力）

## AI Rules Location
# 规则文件索引

## Available Harness Skills
# /harness-analyze、/harness-apply 命令说明

## Workflow
# 标准工作流：analyze → apply → develop → validate → ship
```

**设计目的**：
- 新会话的 Agent 打开项目首先读取 `AGENTS.md`，快速定位关键文件
- 避免在目录中盲目搜索，降低上下文消耗
- 包含 First Principles，确保 Agent 从核心需求出发而非模板化操作

**生成规则**：
- 文件路径：项目根目录 `/AGENTS.md`
- 生成时机：`harness-apply` 初始化或增量更新时
- 更新策略：可重新生成，保留用户自定义配置
- 元项目例外：`harness-pilot` 项目的 `AGENTS.md` 为手动维护，不通过 `harness-apply` 重新生成

模板使用轻量级 Mustache-like 引擎（`scripts/template-engine.js`）渲染，支持变量替换、条件块、循环，并内置 LRU 缓存提升性能。

---

## 五、关键机制

### 1. Ralph Wiggum Loop

自动化审查-测试-修复质量循环，`harness-apply` 执行后自动运行，最多 3 轮：

```
┌──────────────────────────────────────────────────────┐
│               Ralph Wiggum Loop                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  harness-apply 执行                                  │
│       ↓                                              │
│  code-reviewer 审查（架构合规 + 代码质量）             │
│       ↓                                              │
│  验证管道（build → lint-arch → lint-quality → test） │
│       ↓                                              │
│  APPROVED → 完成                                     │
│  NEEDS_CHANGES → 自动修复 → 下一轮                   │
│  LOOP_EXHAUSTED（3 轮后）→ 记录 trace，提示人工介入   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

失败轨迹记录在 `.harness/trace/failures/`，供后续会话复盘。

### 2. Handoff 跨会话机制

LLM 上下文窗口有限。随着 tool call 次数增加（约 40 次），早期关键信息会被压缩或丢弃。Handoff 机制通过**结构化 artifacts** 持久化状态，不依赖 AI 的"记忆"。

**触发条件**：
1. 上下文窗口接近限制（tokens > 100k）
2. Loop 迭代耗尽且问题未解决
3. 用户显式请求 handoff

**传递结构**：

```
Session A → 写到文件 → Session B

.harness/handoffs/{session-id}/
├── agent-state.json   ← 上一个 agent 的执行状态
├── context.json       ← 上下文摘要（目标、进度、关键文件）
└── resume.json        ← 下一个 session 的恢复指令
```

文件系统持久化——不会出错，不会遗忘，不会被上下文压缩掉。

### 3. Reentrant Apply

`manifest.json` 追踪状态，支持增量更新：
- 记录上次 apply 时间与版本
- 追踪层级映射和自定义规则
- 增量更新时保留用户自定义内容，仅覆盖标准生成部分

### 4. Hooks

| Hook | 触发时机 | 作用 |
|------|---------|------|
| **session-start** | Claude Code 会话启动 | 自动检查 `.harness/docs/` 文档新鲜度 |
| **git post-commit** | Git 提交后 | 触发验证管道，确保提交后合规 |

---

## 六、架构设计

### 插件内部结构

```
plugins/harness-pilot/
├── .claude-plugin/         ← 插件元数据（plugin.json）
├── skills/
│   ├── harness-analyze/    ← 分析 Skill（SKILL.md + 4 个工具）
│   └── harness-apply/      ← 生成 Skill（SKILL.md + 6 个工具 + config/）
│       └── tools/
│           ├── detect.js           ← 项目检测
│           ├── select.js           ← 模式选择 UI + openspec 集成
│           ├── generate.js         ← 模板生成
│           ├── loop.js             ← Ralph Wiggum Loop
│           ├── complexity-analyzer.js  ← 复杂度评分
│           └── expert-panel.js     ← 专家团协调器
├── agents/                 ← 5 个 Agent 定义（.md 文件）
├── templates/              ← 分层模板系统
│   ├── base/
│   ├── languages/
│   ├── frameworks/
│   ├── rules/
│   └── capabilities/
├── lib/                    ← 共享工具模块
│   ├── config.js
│   ├── constants.js
│   ├── detect-language.js
│   ├── fs-utils.js
│   └── path-utils.js
├── scripts/
│   ├── template-engine.js  ← 模板渲染引擎
│   └── generate-test.sh    ← JIT 测试生成脚本
├── hooks/                  ← session-start hook
└── tests/                  ← 单元测试
```

### 生成产物目录结构

应用 `harness-apply` 后，在目标项目中生成以下内容：

```
my-project/
├── AGENTS.md              ← AI Agent 导航地图（项目根目录）
└── .harness/              ← Harness 基础设施目录
    ├── manifest.json      ← 状态追踪（reentrant apply 用）
    ├── capabilities.json  ← 已启用能力快照
    ├── docs/
    │   ├── ARCHITECTURE.md    ← 项目架构、层级规则
    │   ├── DEVELOPMENT.md     ← 开发命令、测试方法
    │   └── PRODUCT_SENSE.md   ← 业务上下文
    ├── scripts/
    │   ├── lint-deps.*        ← 依赖方向检查
    │   ├── lint-quality.*     ← 代码质量检查
    │   ├── lint-imports.*     ← 导入限制与循环依赖检测
    │   ├── lint-semantic.*    ← 语义业务逻辑验证
    │   └── validate.*         ← 统一验证入口
    ├── rules/
    │   ├── common/
    │   │   ├── safety.md          ← AI 安全约束
    │   │   └── git-workflow.md    ← Git 工作流规则
    │   └── {language}/
    │       └── development.md     ← 语言特定开发规范
    ├── memory/                ← 三种记忆（情景/程序/失败）
    ├── trace/                 ← 失败轨迹
    ├── hooks/                 ← Git hooks（post-commit）
    ├── tasks/                 ← 任务状态与检查点
    │   ├── {task-id}/
    │   │   ├── task.json
    │   │   ├── checkpoint.json
    │   │   └── next-steps.json
    │   └── .current
    └── handoffs/              ← 跨会话 handoff artifacts
        ├── {session-id}/
        │   ├── agent-state.json
        │   ├── context.json
        │   └── resume.json
        └── .latest
```

### 共享工具库（lib/）

`lib/` 是插件内部的共享工具层，消除 Skill 和 Agent 之间的代码重复：

| 模块 | 职责 |
|------|------|
| `config.js` | 加载 `config/` 目录下的 JSON 配置，支持默认值和多文件批量加载 |
| `constants.js` | 集中管理路径常量、文件扩展名、分析阈值、Loop 参数 |
| `detect-language.js` | 自动检测项目语言（TypeScript/JavaScript/Python/Go/Java）和框架，读取 `detection-rules.json` 驱动 |
| `fs-utils.js` | 统一文件系统操作：JSON 读写、目录创建、文件存在性检查 |
| `path-utils.js` | 跨平台路径处理：`__filename`/`__dirname` ESM 兼容、路径规范化与拼接 |

---

## 七、业界在做什么？

AI Coding Harness 领域在 2026 年迎来爆发式发展，各大公司都从"模型中心"转向"系统中心"，验证了同一核心观点：**Agent 的能力天花板由 Harness 决定，而非模型参数规模**。

### 核心共识

| 公司 | 核心观点 |
|------|---------|
| **OpenAI** | Harness Engineering 让 Codex 在复杂任务中保持可靠 |
| **Anthropic** | "手"与"脑"的分离——Managed Agents 实现规模化 |
| **Google DeepMind** | 小模型 + 好 Harness > 大模型（Gemini Flash + AutoHarness > Gemini Pro） |
| **LangChain** | 五大 Harness 中间件让 Terminal Bench 得分 52.8% → 66.5%（Top5） |

### 一、业界 Harness 架构分类

#### 1. Meta-Harness（自动进化的 Harness）

| 团队 | 方案 | 核心机制 |
|------|------|---------|
| **Stanford/MIT** | Meta Harness | 让 Harness 自动进化，无需人工编写约束代码；全量历史文件系统存储候选方案 |
| **Google DeepMind** | AutoHarness | LLM 自己写 Harness 约束代码，防止非法动作（越权、格式错误） |
| **LangChain** | Trace Analyzer | AI 自动分析失败日志，动态生成修复建议 |

**关键洞察**：不要人工写死 Harness，让它从失败中学习、自动进化。

#### 2. 手-脑分离架构（Managed Agents 模式）

| 团队 | 方案 | 核心机制 |
|------|------|---------|
| **Anthropic** | Claude Managed Agents | Planner（脑）负责规划，Tool Executor（手）负责执行，通过 checkpoint 断点续传 |
| **OpenAI** | Harness Engineering | Codex App Server 作为中间层，隔离模型与工具调用 |
| **Meta** | Harnessing Llama | 状态分片存储 + 增量上下文加载，解决长会话遗忘 |

**关键机制**：
- **状态持久化**：中间状态写入文件系统（Anthropic、Meta、Harness Pilot）
- **上下文压缩**：只保留目标、进度、关键文件，丢弃噪声
- **断点续传**：通过 checkpoint/handoff 跨会话传递状态

#### 3. 双重评估器 Harness

| 团队 | 方案 | 核心机制 |
|------|------|---------|
| **Cursor** | Better Bugbot | 生成器模型 → 裁判模型（真机测试：浏览器自动化、错误栈验证、截图对比） |
| **HumanLayer** | Skill Issue | 子 Agent 作为上下文防火墙，隔离模型能力与环境复杂度 |
| **LangChain** | Loop Detection | 检测死循环，强制 break |

**关键机制**：引入独立的验证器（可以是 LLM 也可以是自动化测试），形成对抗循环。

#### 4. 事前验证 Harness

| 团队 | 方案 | 核心机制 |
|------|------|---------|
| **Harness Pilot** | Pre-completion Checklist | 写代码前预验证操作合法性（层级依赖、架构约束） |
| **LangChain** | Precompletion Checklist | 强制测试/验证在执行前运行 |
| **Google DeepMind** | AutoHarness | LLM 自动生成约束代码，防止非法动作 |

**关键机制**：在行动前问"能不能做"而非写完再修，降低修复成本。

---

### 二、五大 Harness 中间件（LangChain 汇总）

LangChain 对业界实践进行了系统性梳理，提炼出五大 Harness 中间件：

| 中间件 | 功能 | 效果 |
|--------|------|------|
| **Trace Analyzer** | AI 自动分析失败日志，动态生成修复建议 | Terminal Bench 得分 52.8% → 66.5% |
| **Precompletion Checklist** | 强制测试/验证在执行前运行 | 减少无效代码生成 |
| **Local Context** | 注入环境信息（文件系统、Git 历史、运行时配置） | 提升决策准确性 |
| **Loop Detection** | 检测死循环，强制 break | 避免无限重试 |
| **推理三明治** | 规划 / 执行 / 验证分层 | 提升复杂任务成功率 |

**Harness Pilot 对应**：
- Trace Analyzer → `code-reviewer` Agent + `.harness/trace/`
- Precompletion Checklist → `validate.*` 脚本
- Local Context → `manifest.json` + `capabilities.json`
- Loop Detection → Ralph Wiggum Loop（最多 3 轮）
- 推理三明治 → `planner` Agent → `harness-apply` → `e2e-executor`

---

### 三、执行循环模式演进

业界经历了三代执行循环模式：

```
┌─────────────────────────────────────────────────────────────┐
│                    执行循环模式演进                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  第一代：ReAct（思考-行动，2025）                             │
│  Reason → Act → Observe → Repeat                           │
│  适用：快速任务、简单修改                                    │
│  代表：AutoGPT、早期 LangChain                               │
│                                                             │
│  第二代：Reflexion（行动-反思，2025 Q4）                      │
│  Act → Observe → Reflect → Improve → Act                   │
│  适用：需要自纠错的场景                                      │
│  代表：OpenClaw、SWE-Agent                                   │
│                                                             │
│  第三代：Planner-Executor（规划-执行，2026）                   │
│  Plan → Checkpoint → Execute → Verify → Repeat             │
│  适用：长任务、需要恢复能力                                   │
│  代表：Claude Code、Harness Pilot、Managed Agents            │
│                                                             │
│  第四代：Meta-Harness（自动进化，2026 Q1+）                   │
│  Observe → Learn → Evolve → Plan → Execute → Verify        │
│  适用：持续优化的生产环境                                    │
│  代表：Meta Harness（Stanford/MIT）、AutoHarness（DeepMind） │
└─────────────────────────────────────────────────────────────┘
```

---

### 四、内存管理策略对比

| 策略 | 实现 | 代表团队 | Harness Pilot 对应 |
|------|------|---------|-------------------|
| **KV Cache Locality** | 高频访问的数据保持在缓存中 | Anthropic、OpenAI | - |
| **Context Condensification** | 保留目标、进度、关键文件，丢弃噪声 | Anthropic | `context.json` in handoffs |
| **Filesystem Memory** | 中间状态写入文件，必要时读取 | Anthropic、Meta | `.harness/memory/` |
| **Workspace Isolation** | 用 Git Worktree 沙箱化执行 | Claude Code | 可选支持 |
| **State Sharding** | 状态分片存储，增量加载 | Meta | `manifest.json` 分片 |
| **Trace Memory** | 失败轨迹记录，支持复盘 | LangChain、Harness Pilot | `.harness/trace/failures/` |

---

### 五、测试验证机制

| 机制 | 触发时机 | 覆盖范围 | 代表团队 |
|------|---------|---------|---------|
| **静态 Lint** | 写代码后 | 架构约束、代码风格 | Harness Pilot、Meta |
| **单元测试** | 编写代码时 | 函数/方法正确性 | 传统工程 |
| **集成测试** | 功能完成后 | 模块间交互 | 传统工程 |
| **端到端验证** | 阶段完成 / PR 时 | 用户路径 | Cursor、Harness Pilot |
| **JiT 测试生成** | PR 评审阶段 | 补充缺失测试 | Meta、Harness Pilot |
| **真机测试** | 代码生成后 | 浏览器自动化、截图对比 | Cursor |

Meta 研究发现，在 PR 阶段自动生成测试，能将 AI 代码缺陷检出率提升 **4 倍**（测试覆盖率从 60-70% 提升至 85-95%）。

**Harness Pilot 的对应机制**：
- `test-generator` Agent：基于 git diff 动态生成补充测试（JiT）
- `e2e-executor` Agent：执行 API 测试 + Playwright 浏览器测试
- `lint-*` 脚本：静态约束检查

---

### 六、Harness Pilot 在业界的定位

| 维度 | Harness Pilot | 业界典型方案 | 差异化 |
|------|---------------|-------------|--------|
| **规则存储** | Git 仓库中版本化 | 外部 Prompt / Wiki | 规则随代码演进，自动新鲜度检测 |
| **检查时机** | 写代码前预验证 | 写代码后（CI/CD） | 降低修复成本 |
| **Harness 来源** | 模板系统（可定制） | 人工编写 / 自动生成 | 可复用、可扩展 |
| **Handoff** | 结构化 artifacts | checkpoint / 工作区隔离 | 文件系统持久化，不会出错 |
| **循环机制** | Ralph Wiggum Loop（最多 3 轮） | ReAct / Reflexion | 有限迭代，避免无限循环 |
| **评估器** | code-reviewer Agent（架构+质量） | 裁判模型 / 自动化测试 | 双维度审查，可扩展 |

---

### 七、参考链接汇总

#### OpenAI
- [Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/)
- [Building the Codex App Server](https://www.techbytes.app/posts/openai-harness-engineering-codex-app-server/)

#### Anthropic
- [Harnessing Claude's intelligence](https://claude.com/blog/harnessing-claudes-intelligence)
- [Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Claude Managed Agents](https://claude.com/blog/claude-managed-agents)
- [Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents)
- [Building agents with the Claude Agent SDK](https://claude.com/blog/building-agents-with-the-claude-agent-sdk)

#### Google DeepMind
- [AutoHarness: Eliminates Illegal Moves](https://deepmind.google/discover/blog/autoharness/)
- [System-Level Optimization for LLM Agents](https://arxiv.org/abs/2602.05567)

#### LangChain
- [Improving Deep Agents with Harness Engineering](https://blog.langchain.com/improving-deep-agents-with-harness-engineering/)
- [The Anatomy of an Agent Harness](https://blog.langchain.com/the-anatomy-of-an-agent-harness/)

#### Meta
- [Harnessing Llama: Building Reliable Agents](https://ai.meta.com/blog/harnessing-llama-building-reliable-agents/)

#### Cursor
- [Building a better Bugbot](https://cursor.sh/blog/better-bugbot)

#### HumanLayer
- [Skill Issue: Harness Engineering for Coding Agents](https://humanlayer.dev/blog/skill-issue-harness-engineering)

#### Stanford/MIT
- [Meta Harness: End-to-End Optimization of Model Harnesses](https://arxiv.org/abs/2603.18952)

---

## 八、总结

### 核心理念

与其教 AI Agent 如何正确执行任务，不如让它能够**自动验证**执行结果的正确性。

靠代码、linter、测试来保证正确性，而不是靠 LLM 的"直觉"。

### 行动建议

1. 运行 `/harness-pilot:harness-analyze` 分析项目健康状况
2. 运行 `/harness-pilot:harness-apply` 生成基础 `.harness/` 结构
3. 调整 `lint-deps` 脚本，确定层级规则
4. 搭建完整验证管道（build → lint → test → validate）
5. 让 Ralph Wiggum Loop 和 Handoff 机制自动运行

---

## 附录

### 支持的语言

| 语言 | 状态 | 覆盖 |
|------|------|------|
| TypeScript | 完整 | lint 脚本 + 规则 + 模板 |
| JavaScript | 基础 | 规则 + 模板 |
| Python | 完整 | lint 脚本 + 规则 + 模板 |
| Go | 完整 | lint 脚本 + 规则 + 模板 |
| Java | 基础 | 规则 + 检测规则 |
| Rust | 规划中 | — |

### 支持的框架

| 框架 | 语言 | 状态 |
|-------|------|------|
| Next.js | TypeScript | ✓ |
| React | TypeScript/JavaScript | ✓ |
| Express.js | JavaScript | ✓ |
| Django | Python | ✓ |
| FastAPI | Python | ✓ |
| Flask | Python | ✓ |
| Gin | Go | ✓ |
| Spring Boot | Java | ✓ |
| Spring MVC | Java | ✓ |
