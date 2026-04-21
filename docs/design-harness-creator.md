# Harness Creator 设计文档

> 一个为代码库生成 Harness 基础设施的工具

---

## 目录

- [设计背景](#设计背景)
- [核心问题](#核心问题)
- [设计目标](#设计目标)
- [功能概览](#功能概览)
- [模板系统](#模板系统)
- [记忆系统](#记忆系统)
- [自进化机制](#自进化机制)
- [实施计划](#实施计划)

---

## 设计背景

### 为什么需要 Harness？

当 AI Agent 开始在代码库中协作时，我们观察到一个反复出现的问题模式：

```
用户: "添加一个用户认证功能"
Agent: [思考] "好的，我需要创建一个类型文件..."
       [写代码] 200 行代码完成
       [运行 lint] ❌ 失败！types 不能 import config
       [修复] 移动代码到合适位置
       [再运行 lint] ❌ 又失败！另一个违规
       [循环 3 次] 上下文窗口被错误日志填满，Agent 开始"遗忘"目标
```

这不是 Agent 不够聪明——这是 Agent **看不见**。

### 问题出在哪？

- **Prompt 写得再好，也没法穷尽代码库的所有隐式规则**
- **上下文窗口再大，也装不下整个仓库的架构决策**
- **规范文档放在 Wiki 上，AI 读不到；依赖 AI 的"常识"，不同模型表现差异大**

### Harness 的核心思路

**与其教 Agent 怎么做，不如让它自己验证做得对不对。**

靠代码、linter、测试来保证正确性，而不是靠 LLM 的"直觉"。

这些机械化检查不会出错，不会遗忘，也不会被上下文压缩掉。

---

## 业界方案分析

### 对比维度：执行模型、内存管理、测试验证

AI Coding Harness 领域有多个主流方案，各有侧重：

| 方案 | 作者/来源 | 核心特点 |
|------|-----------|----------|
| **Anthropic Harness** | Anthropic Engineering | Initializer agents、feature lists、`init.sh`、自验证、跨上下文窗口的手工制品 |
| **OpenAI Harness** | OpenAI | 架构约束、仓库本地指令、浏览器验证、遥测 |
| **LangChain DeepAgents** | LangChain | 中件层、状态管理、工具编排 |
| **Meta JiT Test Harness** | Meta Engineering | 即时测试生成，PR 阶段自动生成回归测试 |
| **Agent Arena / SWE-Bench** | 社区基准 | 端到端任务评估，真实 GitHub issues |

### 执行循环模型对比

| 模型 | 描述 | 适用场景 | 代表工具 |
|------|------|---------|---------|
| **ReAct** | Reason（思考）→ Act（行动）→ 观察 → 循环 | 需要多步推理的复杂任务 | AutoGPT、LangChain Agents |
| **Reflexion** | 行动 → 反思 → 改进 → 重试 | 需要自我纠错的场景 | OpenClaw |
| **Planner-Executor** | 先规划、后执行、检查点 | 长任务、需要恢复能力 | Claude Code、Anthropic Harness |
| **JiT Verification** | 代码生成后即时生成测试并验证 | PR 阶段质量保证 | Meta JiT Test Harness |

### 内存与上下文管理策略

| 策略 | 核心思想 | 代表方案 |
|--------|----------|---------|
| **KV Cache Locality** | 将高频访问的键值对保持在缓存中 | Manus, OpenHands |
| **Context Condensification** | 保留目标、进度、关键文件，丢弃噪声 | OpenHands Context Condensensation |
| **Filesystem Memory** | 将中间状态写入文件，必要时读取 | LangChain, Manus |
| **Conversation Boundaries** | 定期开启新会话，携带摘要 | Anthropic Effective Harnesses |
| **Workspace Isolation** | 使用 Git Worktree 沙箱化执行 | Superpowers, Citadel |

### 测试验证机制

| 机制 | 触发时机 | 覆盖范围 |
|------|----------|---------|
| **静态 Lint** | 写代码后 / 提交前 | 架构约束、代码风格 |
| **单元测试** | 编写代码时 | 函数/方法正确性 |
| **集成测试** | 功能完成后 | 模块间交互 |
| **端到端验证** | 阶段完成 / PR 时 | 用户路径 |
| **JiT 测试生成** | PR 评审阶段 | 补充缺失测试 |

---

## 核心问题

### 问题 1：约束是隐式的

代码库中的规则往往是隐式的：

- "大家都知道 internal/api 不应该 import internal/ui"
- "但新人不知道，Agent 也不知道"

**Harness 解决方案**：将约束编码为可执行的验证脚本。

### 问题 2：Agent 上下文窗口有限

中等复杂度的任务，Agent 会在 40-60 次 tool call 后开始"遗忘"早期决策。

**Harness 解决方案**：分层架构，协调者只规划，子代理执行。

### 问题 3：规则不断演进

今天正确的规则，明天可能就过时了。

**Harness 解决方案**：规则和代码一起版本化，自进化机制。

### 问题 4：验证滞后

CI/CD 发现问题时，代码已经写完了，修复成本高。

**Harness 解决方案**：预验证，在操作前检查合法性。

---

## 设计目标

| 目标 | 说明 |
|------|------|
| **零配置启动** | 任何项目可直接使用，无复杂安装步骤 |
| **渐进式改进** | 从最小化 AGENTS.md 开始，逐步完善 |
| **语言无关** | 支持 TypeScript、Python、Go 等主流语言 |
| **模板化** | 通过模板系统适配不同项目结构 |
| **自进化** | 从失败中学习，自动改进规则 |
| **可扩展** | 用户可自定义模板和规则 |

---

## 功能概览

### 三种工作模式

| 模式 | 用途 | 适用场景 |
|------|------|---------|
| **dryrun** | 分析项目健康状况，不生成文件 | 首次接触项目，评估需求 |
| **guide** | 交互式配置，逐步构建基础设施 | 需要定制化的项目 |
| **auto** | 一键生成，使用默认配置 | 标准结构的项目 |

### 功能矩阵

| 功能 | dryrun | guide | auto |
|------|--------|-------|------|
| 项目语言/框架检测 | ✓ | ✓ | ✓ |
| Import 关系分析 | ✓ | ✓ | ✓ |
| 健康度评分 | ✓ | ✓ | ✓ |
| 层级映射建议 | ✓ | ✓ | ✓ |
| 交互式配置 | - | ✓ | - |
| 自动生成文件 | - | ✓ | ✓ |
| 验证脚本可用性 | - | ✓ | ✓ |

---

## 模板系统

### 模板目录结构

```
templates/
├── base/                          # 基础模板（无语言特定）
│   ├── AGENTS.md.template
│   ├── ARCHITECTURE.md.template
│   └── DEVELOPMENT.md.template
│
├── languages/                      # 语言特定模板
│   ├── typescript/
│   ├── python/
│   ├── go/
│   └── rust/
│
├── frameworks/                     # 框架特定扩展
│   ├── nextjs/
│   ├── react/
│   ├── express/
│   ├── django/
│   ├── fastapi/
│   └── gin/
│
└── custom/                        # 用户自定义模板
    └── README.md
```

### 模板选择优先级

```
用户自定义 (custom/) > 框架特定 (frameworks/) > 语言特定 (languages/) > 基础 (base/)
```

例如：Next.js + TypeScript 项目

```
AGENTS.md → languages/typescript/AGENTS.md.template
ARCHITECTURE.md → frameworks/nextjs/ARCHITECTURE.md.template
DEVELOPMENT.md → frameworks/nextjs/DEVELOPMENT.md.template
lint-deps → languages/typescript/lint-deps.ts.template
verify → frameworks/nextjs/verify/*.ts.template
```

### 支持的语言

| 语言 | 状态 | 模板覆盖 |
|------|------|----------|
| TypeScript | ✓ | lint-deps, lint-quality, validate |
| JavaScript | ✓ | lint-deps, lint-quality |
| Python | ✓ | lint-deps, lint-quality, validate |
| Go | ✓ | lint-deps, validate |
| Rust | ✓ | lint-deps, validate |

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

---

## 记忆系统

### 三种记忆类型

```
harness/memory/
├── episodic/          # 情景记忆 - 具体事件和教训
├── procedural/         # 程序记忆 - 成功的操作步骤
└── failures/          # 失败记忆 - 供 Critic 分析
```

| 类型 | 用途 | 示例 |
|------|------|------|
| **情景记忆** | 记录具体问题场景和解决方案 | macOS /var 符号链接问题的处理方式 |
| **程序记忆** | 记录标准化操作流程 | 添加 API 端点的 5 步标准流程 |
| **失败记忆** | 供 Critic 分析失败模式 | 失败模式统计和根因分析 |

### 记忆存储格式

#### 情景记忆示例

```markdown
# macOS /var 符号链接问题

## 问题
macOS 下 /var 是 /private/var 的符号链接，会导致工作区路径比较失败。

## 场景
在 macOS 上运行验证脚本时，路径 `/var/folders/...` 与 `/private/var/folders/...` 不匹配。

## 解决方案
始终使用 `realpath` 或 `fs.realpath()` 解析路径后再比较。

## 加载建议
当检测到 macOS 平台时，自动加载此记忆。
```

#### 程序记忆示例

```markdown
# 添加 API 端点的标准流程

## 成功率: 90%
## 最后更新: 2026-04-21

## 5 步标准流程

1. 创建类型文件 `src/types/endpoint-name.ts`
2. 编写服务方法 `src/services/endpoint-name.ts`
3. 添加 handler `src/handlers/endpoint-name.ts`
4. 注册路由 `src/api/routes.ts`
5. 编写测试 `tests/endpoint-name.test.ts`

## 常见陷阱
- 忘记导出类型定义
- handler 中直接使用 db 而非服务层
- 路由路径命名不一致
```

---

## 自进化机制

### Critic → Refiner 循环

```
┌─────────────────────────────────────────────────────────────┐
│                  自进化闭环                            │
├─────────────────────────────────────────────────────────────┤
│                                                         │
│   Agent 执行                                             │
│      ↓                                                   │
│   验证失败 → 记录到 harness/trace/failures/              │
│      ↓                                                   │
│   Critic 分析 → 识别模式和根因                             │
│      ↓                                                   │
│   Refiner 修复 → 更新 linter、文档、记忆                  │
│      ↓                                                   │
│   下一个 Agent 受益                                      │
└─────────────────────────────────────────────────────────────┘
```

### Critic 分析

定期分析 `harness/trace/failures/`，找出：

| 模式类型 | 示例 |
|-----------|------|
| 包未在层级映射中 | internal/cache 被 7 次违规 import |
| 错误信息不清楚 | "Forbidden import" 导致 5 次重试 |
| 流程不一致 | 添加 API 端点流程不一致（12 次） |

### Refiner 修复

根据 Critic 建议，自动更新：

- 将遗漏的包加入层级映射
- 改进错误消息，添加修复建议
- 创建程序记忆记录标准流程
- 补充缺失的文档

### 轨迹编译

当同一任务被成功执行 3+ 次且步骤高度一致时，编译成确定性脚本：

```bash
#!/bin/bash
# Auto-compiled Harness script for: add_api_endpoint
# Generated: 2026-04-21T10:30:00Z

ENDPOINT_NAME=${1:?Usage: $0 <endpoint-name>}

# Step 1: Create type file
# Step 2: Create service
# Step 3: Create handler
# Step 4: Register route
# Step 5: Create test
```

以后同类任务直接执行脚本，无需 Agent 参与。

---

## 生成的文件结构

```
my-project/
├── AGENTS.md                    # 导航地图（~100 行）
├── docs/
│   ├── ARCHITECTURE.md          # 架构、层级、依赖规则
│   ├── DEVELOPMENT.md           # 构建/测试/lint 命令
│   ├── design-docs/            # 组件设计文档
│   └── exec-plans/            # 执行计划（active / completed）
├── scripts/
│   ├── lint-deps.*            # 层级依赖检查
│   ├── lint-quality.*         # 代码质量规则
│   ├── verify/                # 端到端功能验证
│   └── validate.*            # 统一验证管道
└── harness/
    ├── tasks/                 # 任务状态和检查点
    ├── trace/                # 执行轨迹和失败记录
    └── memory/              # 经验教训存储
```

### 文件说明

| 文件 | 用途 |
|------|------|
| AGENTS.md | 给 Agent 看的导航地图，~100 行，只做索引 |
| docs/ARCHITECTURE.md | 项目架构、分层规则、数据流 |
| docs/DEVELOPMENT.md | 构建、测试、lint 命令 |
| scripts/lint-deps.* | 检查依赖方向，确保层级规则 |
| scripts/lint-quality.* | 强制代码质量规范 |
| scripts/validate.* | 统一验证入口：build → lint → test → verify |
| harness/memory/ | 三种记忆系统，积累项目经验 |
| harness/trace/ | 失败记录，供 Critic 分析 |

---

## 验证机制

### 验证顺序

```
build → lint-arch → test → verify
  │        │         │       │
  │        │         │       └─ 端到端功能验证
  │        │         └─ 单元/集成测试
  │        └─ 架构和质量合规
  └─ 代码能否编译
```

### 预验证

写代码前先检查操作合法性：

```bash
# 验证创建文件
python3 scripts/verify_action.py --action "create file internal/types/user.go"
# ✓ VALID: internal/types/ is Layer 0, user.go follows naming convention

# 验证跨层 import
python3 scripts/verify_action.py --action "import internal/core from internal/handler"
# ✗ INVALID: internal/handler (L4) cannot import internal/core (L3)
#   Fix: handler should depend on core through interfaces
```

### 质量规则

常见的可配置规则：

| 规则 | 说明 |
|------|------|
| 禁止 console.log / print() | 要求使用结构化日志 |
| 单文件不超过 500 行 | 避免文件过大难以维护 |
| 禁止硬编码字符串 | 使用常量或配置 |
| TypeScript strict mode | 强制类型安全 |

---

## 实施计划

### Phase 1: 核心功能（MVP）

- [ ] dryrun 模式：项目分析和健康度评分
- [ ] guide 模式：交互式配置
- [ ] auto 模式：一键生成
- [ ] TypeScript 模板支持
- [ ] 基础记忆系统

### Phase 2: 多语言支持

- [ ] Python 模板
- [ ] Go 模板
- [ ] JavaScript 模板
- [ ] Rust 模板

### Phase 3: 框架扩展

- [ ] Next.js 模板
- [ ] React 模板
- [ ] Django 模板
- [ ] FastAPI 模板
- [ ] Express 模板

### Phase 4: 自进化

- [ ] Critic 分析脚本
- [ ] Refiner 自动修复
- [ ] 轨迹编译机制
- [ ] 失败模式识别

### Phase 5: 高级功能

- [ ] 自定义模板支持
- [ ] 跨项目经验共享
- [ ] 可视化配置界面
- [ ] CLI 工具独立发布

---

## 使用场景

### 场景一：首次接触项目

```bash
分析这个项目，看看有哪些可以优化的项
```

**输出示例**：

```
=== Harness 健康度报告 ===

总分: 35/100 (需要改进)

📋 文档覆盖率: 20/100
  ❌ 缺失 AGENTS.md
  ❌ 缺失 docs/ARCHITECTURE.md
  ✅ 存在 README.md

🏗️ 架构约束: 0/100
  ❌ 无层级依赖检查脚本
  ❌ 无包层级映射配置

📏 质量规则: 0/100
  ❌ 无代码质量 lint 脚本
  ⚠️ 检测到 23 个 console.log (应使用结构化日志)
```

### 场景二：引导式构建

```bash
帮我把这个项目做 harness 化改造
```

**交互流程**：

```
Agent: 检测到这是一个 TypeScript + Next.js 项目
       语言: TypeScript
       框架: Next.js
       目录: app/, components/, lib/, types/, utils/

       是否正确？

User: 对的

Agent: 请选择要创建的组件：
       ☑ AGENTS.md (导航地图)
       ☑ docs/ARCHITECTURE.md (架构文档)
       ☑ scripts/lint-deps.ts (依赖检查)
       ☐ scripts/validate.ts (验证管道)

User: 全选

Agent: 推荐的层级映射：
       Layer 0: types/ (无内部依赖)
       Layer 1: utils/ (依赖 Layer 0)
       Layer 2: lib/ (依赖 Layer 0-1)
       Layer 3: components/, services/ (依赖 Layer 0-2)
       Layer 4: app/, api/ (依赖 Layer 0-3)

       [使用此映射] [自定义]
```

### 场景三：一键生成

```bash
一键生成完整的 Harness，用默认配置
```

**输出**：

```
✓ Harness 基础设施生成完成！

使用配置:
  - 语言: TypeScript
  - 框架: Next.js
  - 模板: frameworks/nextjs/
  - 层级: 自动检测
  - 质量规则: 默认集合

已创建:
  - 8 个文件
  - 3 个可执行脚本
  - 3 个目录
```

### 场景四：验证代码

```bash
验证一下刚才的代码是否符合 Harness 规则
```

**输出**：

```
=== Harness 验证结果 ===

✓ build: 通过 (2.3s)
✗ lint-arch: 失败 (0.8s)

发现 2 个架构违规:

1. src/handler/user.ts
   ❌ imports internal/config (Layer 4 → Layer 2)
   修复: 将 config 作为参数传递，或在 Layer 3 创建接口

2. src/api/auth.ts
   ❌ imports src/handler/helper.ts (Layer 4 互引)
   修复: 将 helper 移至 Layer 2，或创建公共服务

建议修复后重新运行:
  npm run validate
```

---

## 技术原则

### 原则 1：仓库是唯一事实来源

- 规则必须在代码库中，不能只在 Wiki 或口头约定
- Git 版本化，随代码演进
- Agent 打开项目就能读取一切

### 原则 2：AGENTS.md 是地图不是手册

- 控制在 ~100 行
- 只做索引和指路
- 详细内容放在 docs/ 目录按需加载

### 原则 3：只管边界不管实现

- 定义层级依赖规则
- 不规定设计模式或编码风格（除非是质量规则）
- 边界内如何实现自由决定

### 原则 4：协调者不写代码

- 中等复杂度以上任务必须委派子代理
- 协调者只做规划、调度、汇总
- 每个子代理从干净上下文开始

### 原则 5：事前验证优于事后检查

- 结构性操作前先验证合法性
- 写代码前问"能不能做"而非写完再修
- 降低修复成本

---

## 参考研究

### AI Coding Harnesses: Agent Execution Model, Memory, and Context Management

**作者**：David A. Mitchell (GitHub 研究)

**核心内容**：

对比主流商业 / 开源 AI Coding 工具（Claude Code、GitHub Copilot、OpenClaw、AutoGPT）的 Harness 设计：

| 维度 | 分析要点 |
|------|----------|
| **执行循环** | ReAct vs Reflexion 模式的优劣对比 |
| **内存管理** | KV Cache、Filesystem Memory、Context Condensification |
| **上下文管理** | Conversation Boundaries、Workspace Isolation |
| **工具调用与沙箱** | 工具接口设计、执行隔离 |
| **测试验证** | 静态检查、动态验证、端到端测试 |

**借鉴点**：

1. **执行循环选择** - 不同任务类型适合不同循环模型
   - 简单任务 → ReAct（快速迭代）
   - 需要自纠错的任务 → Reflexion
   - 长任务 → Planner-Executor（检查点恢复）

2. **内存分层** - 不是全部堆在上下文，而是分层存储
   - 热数据（最近决策）→ 上下文保留
   - 温数据（文档摘要）→ 文件系统
   - 冷数据（历史轨迹）→ 按需加载

### Just-in-Time (JiT) Test Harness for AI-Generated Code

**来源**：Meta Engineering Blog (2026.4)

**核心内容**：

动态即时测试 Harness：在 PR / 代码评审阶段自动生成回归测试，而非依赖静态测试集。

**关键发现**：

| 指标 | 传统测试 | JiT Test Harness |
|-------|----------|----------------|
| 测试覆盖率 | 60-70% | 85-95% |
| 缺陷检出率 | 1x | 4x |
| 测试生成速度 | 手工编写 | 自动化生成（秒级） |
| 与 AI 生成速度匹配 | 落后 | 同步 |

**借鉴点**：

1. **测试生成时机** - 不是写代码时，而是在 PR 阶段自动补充
   - Agent 生成代码后，JiT Harness 分析变更
   - 针对变更路径生成补充测试
   - 确保覆盖新边界和回归场景

2. **测试质量保证** - 自动生成的测试需要验证
   - 基于现有测试模式推断
   - 执行生成测试确保通过
   - 失败的测试标记为需人工审查

### Harness Engineering with LangChain DeepAgents and LangSmith

**平台**：Analytics Vidhya (2026.3)

**核心内容**：

Harness 定义：**系统提示 + 工具 + 测试环境 + 中间件 = 可靠 Agent**

手把手用 LangChain 构建代码生成 Agent，用 HumanEval 基准评测。

**架构图**：

```
┌─────────────────────────────────────────────────────┐
│              LangChain DeepAgents             │
├─────────────────────────────────────────────────────┤
│                                                  │
│  System Prompt                               │
│       ↓                                          │
│  Planner (LLM)  ─→  Plan                  │
│       ↓                                          │
│  Executor (LLM)  ─→  Action                 │
│       ↓                                          │
│  ┌─────────────────────────────┐               │
│  │         Middleware          │               │
│  │  • State Management       │               │
│  │  • Tool Validation      │               │
│  │  • Retry Logic         │               │
│  └─────────────────────────────┘               │
│       ↓                                          │
│  Tools (Read, Write, Bash, ...)              │
│       ↓                                          │
│  ┌─────────────────────────────┐               │
│  │    Test Environment        │               │
│  │  • Execution Sandbox       │               │
│  │  • Evaluation Runner      │               │
│  └─────────────────────────────┘               │
│       ↓                                          │
│  LangSmith (Trace & Eval)                   │
└─────────────────────────────────────────────────────┘
```

**借鉴点**：

1. **中间件层** - 在 LLM 和工具之间插入可检查点
   - 每次工具调用前后记录
   - 支持重试和回滚
   - 可插入自定义验证逻辑

2. **LangSmith 追踪** - 结构化记录 Agent 行为
   - 记录每次 tool call 的输入输出
   - 可用于事后分析和评估
   - 支持多 agent 对比

### 从规则到测试：构建你的 AI 测试 Harness

**作者**：沈宥（腾讯云）

**核心内容**：

工程化指南：**规则提取 → LLM 理解 → 自动生成单元测试**闭环。

覆盖分支解析、条件还原、边界用例、Mock 与断言。

**闭环流程**：

```
代码规则提取
    ↓
LLM 理解规则
    ↓
生成测试用例
    ↓
Mock 依赖
    ↓
写断言
    ↓
执行验证
```

**测试生成技术**：

| 技术 | 说明 | 示例 |
|------|------|------|
| **分支解析** | 分析代码中的 if/switch 分支 | `if (user.role === 'admin')` → 生成 admin 和 non-admin 两种测试 |
| **条件还原** | 从复杂条件中拆分独立用例 | `x > 0 && x < 100 && x % 2 === 0` → 生成边界和中间值测试 |
| **边界用例** | 测试输入边界 | `[0, 1, max-1, max, max+1]` |
| **Mock 策略** | 自动识别外部依赖并 Mock | `fetch('/api/user')` → `mockFetch()` |

**借鉴点**：

1. **规则即测试** - 从代码约束自动派生测试
   - 类型约束 → 类型验证测试
   - 层级规则 → 依赖方向测试
   - 质量规则 → 代码风格测试

2. **测试与代码同步演进** - 不是一次性生成，而是持续更新
   - 代码变更时自动触发测试生成
   - 删除失效测试
   - 补充新场景

---

## 借鉴优化：当前方案如何吸收业界经验

### 执行循环：支持多模式切换

当前设计偏向 Planner-Executor，可增加：

| 模式 | 适用场景 | 集成点 |
|------|----------|---------|
| **ReAct** | 快速任务、简单修改 | 子代理层默认模式 |
| **Reflexion** | 失败后需要自纠错 | Critic 回调时切换 |
| **Planner-Executor** | 长任务、需要恢复 | 协调者默认模式 |

### 内存管理：引入分层存储

当前 `harness/memory/` 已有分类，可增加：

| 层级 | 存储位置 | 访问频率 |
|------|----------|----------|
| **热内存** | 任务上下文 | 每次操作 |
| **温内存** | harness/tasks/ | 阶段检查 |
| **冷内存** | harness/trace/ | Critic 分析时 |

### 测试验证：增加 JiT 测试生成

在 `verify/` 目录基础上增加：

```
scripts/
├── verify/
│   ├── e2e/              # 端到端验证（当前）
│   └── jit/               # 即时测试生成（新增）
│       ├── test-generator.py  # 基于代码变更生成测试
│       └── test-validator.py # 验证生成测试通过
```

### 中间件层：工具调用前后的检查点

当前验证集中在 `validate.py`，可增加细粒度检查：

```
┌─────────────────────────────────────────┐
│  Agent Tool Call                   │
├─────────────────────────────────────────┤
│                                 │
│  Before Check                      │
│    ├─ 操作合法性验证                │
│    ├─ 预估 token 消耗            │
│    └─ 检查点快照                │
│         ↓                        │
│  Execute Tool                    │
│         ↓                        │
│  After Check                       │
│    ├─ 结果验证                    │
│    ├─ 误差记录                    │
│    └─ 更新任务状态                │
└─────────────────────────────────────────┘
```

---

## 参考资源

- [AGENTS.md 标准](https://github.com/agentsmd/agents.md)
- [Awesome Harness Engineering](https://github.com/walkinglabs/awesome-harness-engineering)
- [Claude Code 最佳实践](https://code.claude.com/docs)
- [Superpowers](https://github.com/obra/superpowers)
