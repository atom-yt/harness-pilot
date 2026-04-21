# Harness Creator

> Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes
> 将任意项目转换为 harness 兼容形式，支持干运行分析、引导构建和自动生成模式

---

## What is Harness Creator? / 什么是 Harness Creator？

Harness Creator is a Claude Code plugin that transforms any codebase into a harness-compatible form. It provides three modes:

Harness Creator 是一个 Claude Code 插件，可以将任何代码库转换为 harness 兼容形式。它提供四种模式：

- **harness-analyze** (dryrun) - Analyze project structure and generate health report without making changes
  分析项目结构并生成健康报告，不进行任何修改
- **harness-guide** (guide mode) - Interactive guided build with step-by-step configuration
  交互式引导构建，逐步配置
- **harness-apply** (auto mode) - One-click generation with default settings
  一键生成，使用默认设置
- **harness-generate-rules** - Generate AI rules for safety, git workflow, and language-specific development
  生成 AI 规则，包括安全约束、Git 工作流和语言特定的开发指南

## Quick Start / 快速开始

```bash
# Analyze project health (no changes made) / 分析项目健康状况（不修改代码）
/harness-creator:harness-analyze

# Interactive guided build / 交互式引导构建
/harness-creator:harness-guide

# Auto-generate with defaults / 使用默认设置自动生成
/harness-creator:harness-apply

# Generate AI rules only / 仅生成 AI 规则
/harness-creator:harness-generate-rules
```

## What is a Harness? / 什么是 Harness？

A Harness is a set of infrastructure that helps AI Agents work reliably in a codebase:

Harness 是一套基础设施，帮助 AI Agent 在代码库中可靠地工作：

```
my-project/
├── AGENTS.md              # Navigation map (~100 lines) / 导航地图（约100行）
├── docs/
│   ├── ARCHITECTURE.md    # Architecture, layers, dependency rules / 架构、分层、依赖规则
│   └── DEVELOPMENT.md     # Build, test, lint commands / 构建、测试、Lint 命令
├── scripts/
│   ├── lint-deps.*        # Layer dependency checking / 分层依赖检查
│   ├── lint-quality.*     # Code quality rules / 代码质量规则
│   └── validate.*         # Unified validation pipeline / 统一验证流水线
├── harness/
│   ├── memory/            # Three types of memory / 三种类型的记忆
│   ├── tasks/             # Task state and checkpoints / 任务状态和检查点
│   └── trace/             # Execution trace and failure records / 执行跟踪和失败记录
└── rules/
    ├── common/
    │   ├── safety.md      # AI safety constraints / AI 安全约束
    │   └── git-workflow.md # Git workflow rules / Git 工作流规则
    └── {language}/
        └── development.md # Language-specific guidelines / 语言特定指南
```

## Supported Languages / 支持的语言

| Language | 语言 | Status / 状态 |
|----------|------|---------------|
| TypeScript | TypeScript | ✓ |
| JavaScript | JavaScript | ✓ |
| Python | Python | ✓ (rules only / 仅规则) |
| Go | Go | ✓ (rules only / 仅规则) |
| Rust | Rust | Planned / 计划中 |

## Supported Frameworks / 支持的框架

| Framework | 框架 | Language | 语言 | Status / 状态 |
|-----------|------|----------|------|---------------|
| Next.js | Next.js | TypeScript | TypeScript | ✓ |
| React | React | TypeScript/JS | TypeScript/JS | Planned / 计划中 |
| Express.js | Express.js | JavaScript | JavaScript | Planned / 计划中 |
| Django | Django | Python | Python | Planned / 计划中 |
| FastAPI | FastAPI | Python | Python | Planned / 计划中 |
| Gin | Gin | Go | Go | Planned / 计划中 |

## Documentation / 文档

- [Harness Report](harness-report.md) - A reader-friendly introduction / 读者友好的介绍
- [Design Document](design-harness-creator.md) - Technical design details / 技术设计详情

## AI Rules / AI 规则

The `rules/` directory contains AI-enforceable constraints that guide agent behavior:

`rules/` 目录包含 AI 可执行的约束，用于指导 Agent 行为：

- **rules/common/safety.md** - Safety constraints (no destructive operations, secrets management)
  安全约束（禁止破坏性操作、密钥管理）
- **rules/common/git-workflow.md** - Git workflow rules (commit format, branch naming)
  Git 工作流规则（提交格式、分支命名）
- **rules/{language}/development.md** - Language-specific development guidelines
  语言特定的开发指南

Rules are automatically detected and enforced when AI agents work on the codebase. Use `harness-generate-rules` to generate rules for your project.

规则会在 AI Agent 工作时自动检测和执行。使用 `harness-generate-rules` 为您的项目生成规则。

## License / 许可证

MIT