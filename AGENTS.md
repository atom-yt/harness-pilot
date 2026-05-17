# AGENTS.md — harness-pilot

> 给 AI Coding Agent 的项目导航地图。读完这一份文件，你应该能：知道项目是什么、跑什么命令、有哪些规矩、失败了去哪查。
> 详细内容下沉到 `docs/` 与 `.harness/docs/`，本文件只放索引和硬性约束。

## 1. 项目概述

**harness-pilot** 是一个 Claude Code 插件，把任意代码仓库改造成"对 AI Agent 友好"的形态——通过 `.harness/` 基础设施（架构文档、lint 脚本、规则、记忆、trace）让 Agent 在改代码前能读上下文、改代码后能机械验证。

- **形态**：Claude Code marketplace plugin（也兼容 Cursor / Comate / Codex 等读 AGENTS.md 的工具）
- **技术栈**：TypeScript + Node（lint 脚本通过 `ts-node` 直接运行）
- **两个核心 skill**：`harness-analyze`（只读体检）、`harness-apply`（生成/更新 .harness 基础设施 + Ralph Wiggum Loop）
- **dogfood**：本仓库自身就跑这套规范——`.harness/` 是 AI 的工作上下文，`plugins/harness-pilot/` 是插件实现，`docs/` 是设计文档。

## 2. 快速命令

> 重要：根目录**没有** `package.json`，不要用 `npm run build`。脚本通过 `npx ts-node` 直接执行 TS。

| 用途 | 命令 |
|---|---|
| 一键校验（推荐） | `npx ts-node .harness/scripts/validate.ts` |
| TS 编译检查 | `npx ts-node .harness/scripts/lint-tsc.ts` |
| 分层依赖检查 | `npx ts-node .harness/scripts/lint-deps.ts` |
| 导入约束检查 | `npx ts-node .harness/scripts/lint-imports.ts` |
| 综合质量检查 | `npx ts-node .harness/scripts/lint-quality.ts` |
| 业务语义检查 | `npx ts-node .harness/scripts/lint-semantic.ts` |
| 单测自动生成 | `bash .harness/scripts/generate-test.sh <file>` |
| 体检（只读） | Claude Code 内：`/harness-pilot:harness-analyze` |
| 应用 / Loop 修复 | Claude Code 内：`/harness-pilot:harness-apply` |

子项目各自独立，按需进入子目录执行：
- `plugins/harness-pilot/ui/web/` 与 `test-projects/harness-test-nextjs/` 是独立 Node 项目，自带 `package.json`，需 `cd` 进去再 `pnpm install`。

## 3. 仓库结构

```
harness-pilot/
├── AGENTS.md                  本文件（AI 入口）
├── README.md                  人类入口（项目介绍/安装/使用）
├── plugins/harness-pilot/     插件本体（核心实现，详见第 4 节）
├── .harness/                  AI 工作基础设施（dogfood 自用）
│   ├── docs/                  ARCHITECTURE/DEVELOPMENT/WORKFLOW/BAD_CASES/PRODUCT_SENSE
│   ├── scripts/               lint-*.ts / validate.ts（详见第 8 节）
│   ├── rules/                 common/{safety,git-workflow}.md, typescript/development.md
│   ├── memory/                Agent 经验存储（episodic/procedural）
│   ├── trace/failures/        失败记录，用于模式归纳
│   ├── hooks/                 git hooks
│   └── tasks/                 task 状态
├── docs/                      面向人类的设计文档（详见第 9 节）
├── test-projects/             插件自测床（Next.js / Python）
├── utils/                     公共工具（string-utils 等）
└── .comate/specs/             SDD 产物（每个 feature 一个目录）
```

## 4. 核心模块（plugins/harness-pilot）

```
plugins/harness-pilot/
├── .claude-plugin/      插件元数据 plugin.json
├── .harness/            插件自身的 harness（dogfood 二阶）
├── skills/
│   ├── harness-analyze/   只读体检 skill
│   └── harness-apply/     生成/更新 + Ralph Loop
├── agents/              code-reviewer / refactoring-agent
├── lib/                 共享工具（Layer 2）：config / fs-utils / detect-language ...
├── templates/           代码生成模板（base / languages / frameworks / rules）
├── schemas/             JSON schemas
├── scripts/             template-engine.js 等
├── hooks/               session hooks
├── ui/web/              （独立子项目）web UI
└── tests/               插件测试
```

## 5. 关键约定（硬性规则）

> 违反以下任一条都会被 lint 拦截或在 review 中要求改正。

1. **改完代码必须跑 `npx ts-node .harness/scripts/validate.ts`**，全绿才允许 commit。理由：本仓库的核心理念是 *verify before act*。
2. **失败必须落 trace**：写到 `.harness/trace/failures/{ISO时间戳}-{topic}.md`，便于 Loop 归纳模式。
3. **复杂度 ≥ 7 强制走 SDD**：产物在 `.comate/specs/{feature}/{doc,tasks,summary}.md`。详见 [.harness/docs/WORKFLOW.md](.harness/docs/WORKFLOW.md)。bypass 仅限复杂度 ≤ 6 且无跨模块影响。
4. **跨层 import 禁止**：依赖方向单向（高层→低层），由 `lint-deps.ts` 拦截，规则见 [.harness/docs/ARCHITECTURE.md](.harness/docs/ARCHITECTURE.md)。
5. **commit 必须用 `auto-commit` skill** 绑定 iCafe 卡片，禁止裸 `git commit`。Git 工作流详见 [.harness/rules/common/git-workflow.md](.harness/rules/common/git-workflow.md)。
6. **TS / 安全规则**：详见 [.harness/rules/typescript/development.md](.harness/rules/typescript/development.md) 与 [.harness/rules/common/safety.md](.harness/rules/common/safety.md)。
7. **不要在仓库根跑 `npm run build`**：根目录不是 Node 项目，根命令统一通过 `npx ts-node .harness/scripts/*` 调度。

<!-- BEGIN: hand-maintained (do not regenerate) -->
<!--
此区段由团队基于 bad case 手工增补，/harness-apply 必须保留不覆盖。
新规则的添加流程：先登记到 .harness/docs/BAD_CASES.md，复发 ≥ 3 次或重大影响后升格到此处。
-->

（暂无团队增补规则，待第一条 bad case 升格）

<!-- END: hand-maintained -->

## 6. 本地开发与验证闭环

```
读 AGENTS.md → 必要时深读 docs/ 与 .harness/docs/
   ↓
（复杂度 ≥ 7）写 .comate/specs/{feature}/doc.md → tasks.md
   ↓
改代码（plugins/harness-pilot/ 或对应子项目）
   ↓
npx ts-node .harness/scripts/validate.ts
   ├─ 通过 → auto-commit skill 绑卡 → push
   └─ 失败 → 写 .harness/trace/failures/{ts}-{topic}.md → 修复 → 再 validate
   ↓
（SDD 路径）写 .comate/specs/{feature}/summary.md
```

任何一步卡住都不要绕过：bypass 校验 = 累积技术债。

## 7. SDD 工作流入口

默认 SPEC（Spec-Driven Development）模式。四阶段：**Requirements → Decomposition → Implementation → Summary**，产物在 `.comate/specs/{feature}/`。

- 复杂度 ≥ 7：强制走完整 SDD
- 复杂度 ≤ 6 且无跨模块影响：可 `--mode direct` bypass
- 详细规则、Ralph Wiggum Loop、bypass 判据：[.harness/docs/WORKFLOW.md](.harness/docs/WORKFLOW.md)

## 8. 质量检查矩阵

`.harness/scripts/` 下脚本统一通过 `npx ts-node` 执行（已在第 2 节列全）。校验流水线顺序：

```
build → lint-arch (lint-deps) → lint-imports → lint-tsc → lint-quality → lint-semantic → test → verify
```

`validate.ts` 是上述流程的统一入口，按 `.harness/capabilities.json` 启停具体步骤。

## 9. 文档导航

| 文档 | 用途 | 读者 |
|---|---|---|
| [docs/overview-design.md](docs/overview-design.md) | 设计哲学、架构决策、行业对比（中文） | 人 + AI |
| [docs/detailed-design.md](docs/detailed-design.md) | 技术实现细节 | AI 优先 |
| [docs/API.md](docs/API.md) | API 参考 | AI 优先 |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | 贡献指南 | 人 |
| [docs/FAQ.md](docs/FAQ.md) | 常见问题 | 人 + AI |
| [docs/handoff-mechanism.md](docs/handoff-mechanism.md) | Agent handoff 机制 | AI 优先 |
| [docs/OPTIMIZATION_PLAN.md](docs/OPTIMIZATION_PLAN.md) | 优化计划 | 人 |
| [.harness/docs/ARCHITECTURE.md](.harness/docs/ARCHITECTURE.md) | 分层架构与依赖规则 | AI |
| [.harness/docs/DEVELOPMENT.md](.harness/docs/DEVELOPMENT.md) | 开发环境与命令细节 | AI |
| [.harness/docs/PRODUCT_SENSE.md](.harness/docs/PRODUCT_SENSE.md) | 产品语义与领域知识 | AI |
| [.harness/docs/WORKFLOW.md](.harness/docs/WORKFLOW.md) | SDD/Ralph Loop 完整流程 | AI |
| [.harness/docs/BAD_CASES.md](.harness/docs/BAD_CASES.md) | bad case 反馈与升格通道 | AI + 人 |

## 10. 工具兼容性

- **Claude Code**：仍读 `CLAUDE.md`；建议在仓库根做软链 `ln -s AGENTS.md CLAUDE.md`（已在 README 提示）。
- **Cursor / Comate / Codex / Copilot**：原生识别 AGENTS.md。
- **本文件可手动编辑**：仅限 `<!-- BEGIN: hand-maintained -->` 区段；其余区域由 `/harness-apply` 维护。

---

*版本：v2（2026-05-17 由 SDD agents-md-optimization 重写）*
