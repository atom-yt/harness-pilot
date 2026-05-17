# AGENTS.md 优化方案设计

## 1. 背景与目标

### 1.1 问题陈述
当前仓库根目录的 `AGENTS.md`（87 行，自动由 `/harness-apply` 生成）作为 AI Agent 的导航地图，存在以下与"AI Coding 实践第六篇：怎么写好一份 AGENTS.md"方法论的偏差：

| 文章建议 | 当前现状 | 偏差 |
|---|---|---|
| 前 10 行建立项目心智模型 | 前 42 行讲 SDD/First Principles 元规则 | 黄金位置被元信息占据 |
| Project Overview 一段话讲清楚做什么 | 仅"Language: typescript / Framework: nextjs"两行 | 严重不足 |
| 快速命令章节（build/test/lint/start） | 完全缺失 | AI 不知道怎么跑项目 |
| 后端/前端架构 + 目录结构树 | 完全缺失 | AI 必须从零探索 |
| 关键约定（硬性规则、违反必报错） | 仅 4 条抽象 First Principles | 无可执行约束力 |
| 本地开发与验证闭环 | 完全缺失 | 改→构建→启动→验证链条不闭合 |
| 质量检查命令矩阵 | 完全缺失 | `.harness/scripts/` 下 6 个脚本未在 AGENTS.md 暴露 |
| 文档导航表 | 仅列 .harness/docs/ 三个文件 | 遗漏 docs/ 下 7 个核心设计文档 |
| 自动生成与人工增补共存 | "Do not edit manually" + 无 hand-maintained 区段 | bad-case 驱动迭代会被覆盖 |

### 1.2 优化目标
- 让 AI 打开仓库读完 AGENTS.md 后能立即建立项目心智模型并知道怎么跑、怎么验证
- 关键规则有自动化检查兜底（命令在 AGENTS.md 暴露，违反时报错信息可指导修复）
- `/harness-apply` 自动生成与团队 bad-case 驱动增补能共存，互不覆盖
- 控制 AGENTS.md 在 200 行以内（文章建议上限）

### 1.3 非目标
- 不重构 `.harness/` 内部目录结构
- 不修改 `/harness-apply` skill 的代码逻辑（本次仅在 AGENTS.md 标记 hand-maintained 区段，由后续任务实现保留逻辑）
- 不新增 lint 脚本，仅暴露已有脚本

## 2. 技术方案

### 2.1 文档结构调整

**AGENTS.md（约 130-150 行）** 重新组织为 9 节，对齐文章模板：

```
1. 项目概述（5-10 行讲清楚 harness-pilot 是什么）
2. 快速命令（构建/测试/lint/validate/install/update）
3. 仓库结构（ASCII 树，每个目录一行注释）
4. 核心模块说明（plugins/harness-pilot 下 skills/lib/templates/agents）
5. 关键约定（硬性规则，每条带 lint 命令或文档链接）
6. 本地开发与验证闭环（改→validate→trace→commit）
7. SDD 工作流（仅入口与 bypass 条件，详细流程链接到 .harness/docs/WORKFLOW.md）
8. 质量检查矩阵（已有 6 个 lint 脚本统一入口）
9. 文档导航（docs/ + .harness/docs/ 全索引）
```

被下沉到独立文档的内容：
- First Principles → 当前 README.md 已有"Design Philosophy → Key Principles"，AGENTS.md 中保留一行引用即可
- SDD Pipeline 详细 5 阶段说明 → 新建 `.harness/docs/WORKFLOW.md`
- Available Harness Skills 表 → README.md 已覆盖，AGENTS.md 中删除

### 2.2 hand-maintained 区段标记

在 AGENTS.md 关键约定章节加入显式标记：

```markdown
<!-- BEGIN: hand-maintained (do not regenerate) -->
... 团队基于 bad case 增补的项目特定规则 ...
<!-- END: hand-maintained -->
```

`/harness-apply` 后续应识别该标记并跳过覆盖（本 spec 仅落标记，覆盖逻辑改造作为 follow-up）。

### 2.3 BAD_CASES.md 反馈通道

新建 `.harness/docs/BAD_CASES.md`，作为 bad-case → AGENTS.md 规则的中转站。模板：

```markdown
## 案例编号：YYYY-MM-DD-N
- **现象**：AI 犯了什么错（贴一段代码或行为描述）
- **根因**：缺少哪条规则
- **修复落点**：[ ] AGENTS.md 关键约定 / [ ] .harness/rules/.../*.md / [ ] lint 脚本 / [ ] 暂不修复
- **关联 trace**：.harness/trace/failures/...（如有）
- **状态**：pending / addressed
```

### 2.4 .harness/docs/WORKFLOW.md

承接当前 AGENTS.md 中 SDD Pipeline + Workflow 两节内容，作为完整的 SDD 流程文档，被 AGENTS.md 第 7 节引用。

## 3. 影响文件清单

| 路径 | 操作 | 说明 |
|---|---|---|
| `/Users/yangtong07/Desktop/code/harness/harness-pilot/AGENTS.md` | 重写 | 全文重构为 9 节结构 |
| `/Users/yangtong07/Desktop/code/harness/harness-pilot/.harness/docs/WORKFLOW.md` | 新建 | 承接 SDD 详细流程 |
| `/Users/yangtong07/Desktop/code/harness/harness-pilot/.harness/docs/BAD_CASES.md` | 新建 | bad-case 反馈通道与模板 |
| `/Users/yangtong07/Desktop/code/harness/harness-pilot/README.md` | 微调 | 末尾加 Claude Code 软链兼容说明 |

不动：`.harness/docs/ARCHITECTURE.md`、`DEVELOPMENT.md`、`PRODUCT_SENSE.md`、所有 lint 脚本、manifest.json。

## 4. 内容设计要点

### 4.1 AGENTS.md 第 1 节"项目概述"草案

```
harness-pilot 是一个 Claude Code 插件，把任意代码仓库改造成"对 AI Agent 友好"的形态。
两个核心 skill：harness-analyze（只读体检）与 harness-apply（生成/更新 .harness 基础设施 + Ralph Wiggum Loop 质量循环）。
本仓库自身遵循其产出的规范（dogfood）：根目录 .harness/ 是 AI 的工作上下文，plugins/harness-pilot 是插件实现，docs/ 是设计文档。
技术栈：TypeScript + Node，分发为 Claude Code marketplace plugin。
```

### 4.2 AGENTS.md 第 5 节"关键约定"硬性规则候选

每条形如 "WHAT + WHY + HOW（自动化检查命令）"：

1. 修改代码后必须 `pnpm tsx .harness/scripts/validate.ts`，通过才允许 commit（HOW 命令；WHY：本仓库的核心理念是"verify before act"）
2. 失败必须落 trace 到 `.harness/trace/failures/{ts}-{topic}.md`，便于模式归纳
3. 复杂度 ≥ 7 走 SDD，产物在 `.comate/specs/{feature}/`，详见 .harness/docs/WORKFLOW.md
4. 跨层 import 禁止（API→Service→Lib→Util→Type 单向），`lint-deps.ts` 拦截
5. 提交流程必须用 `auto-commit` skill 绑定 iCafe 卡片，禁止裸 `git commit`
6. Claude Code 用户：`ln -s AGENTS.md CLAUDE.md` 维持兼容
7. TS 规则详见 `.harness/rules/typescript/development.md`，安全规则详见 `.harness/rules/common/safety.md`

### 4.3 AGENTS.md 第 8 节"质量检查矩阵"

| 用途 | 命令 |
|---|---|
| 一键综合 | `pnpm tsx .harness/scripts/validate.ts` |
| TS 编译 | `pnpm tsx .harness/scripts/lint-tsc.ts` |
| 分层依赖 | `pnpm tsx .harness/scripts/lint-deps.ts` |
| 导入约束 | `pnpm tsx .harness/scripts/lint-imports.ts` |
| 综合质量 | `pnpm tsx .harness/scripts/lint-quality.ts` |
| 业务语义 | `pnpm tsx .harness/scripts/lint-semantic.ts` |
| 单测生成 | `bash .harness/scripts/generate-test.sh <file>` |

### 4.4 文档导航表

需覆盖：`docs/{overview-design,detailed-design,API,CONTRIBUTING,FAQ,handoff-mechanism,OPTIMIZATION_PLAN}.md` + `.harness/docs/{ARCHITECTURE,DEVELOPMENT,PRODUCT_SENSE,WORKFLOW,BAD_CASES}.md`，共 12 项。

## 5. 数据流与使用流

```
AI 打开仓库
   ↓
读 AGENTS.md（130 行）→ 1 分钟内获得：项目定位、目录、命令、规则、文档地图
   ↓
按需深读 → docs/ 或 .harness/docs/ 下的具体文档
   ↓
写代码 → 命令在 AGENTS.md 第 8 节直接可用 → validate
   ↓
失败 → 写 trace → 必要时把规律提炼到 BAD_CASES.md → 升格到 AGENTS.md 第 5 节
```

## 6. 边界条件与异常

- **/harness-apply 覆盖**：本次仅引入 hand-maintained 标记，不改 apply 逻辑；如下次重新生成把人工增补覆盖了，应将 hand-maintained 区段单独保存到 `.harness/docs/HAND_RULES.md` 然后由 AGENTS.md include（作为兜底降级方案，本 spec 不实现，作为 follow-up 风险记录）
- **README 与 AGENTS.md 内容重叠**：项目概述、命令矩阵会少量重叠；按文章建议保留少量重叠（侧重点不同：README 给人，AGENTS.md 给 AI）
- **WORKFLOW.md 与现有 SDD 文档冲突**：当前没有专门的 SDD 流程文档，新建不会冲突；与 README.md 中的 "Validation Pipeline Order" 章节存在概念重叠（一个是 SDD 流水线，一个是 lint 流水线），WORKFLOW.md 中明确二者区别

## 7. 预期成果

- AGENTS.md 行数：87 → ~140，但信息密度从"元信息为主"转为"项目本体信息为主"
- AI 首次接触本仓库时，无需读其他文件即可知道："是什么 / 怎么跑 / 有哪些规矩 / 失败了去哪查"
- 团队 bad-case 增补有制度化通道（BAD_CASES.md → AGENTS.md hand-maintained 区段）
- 已有 6 个 lint 脚本资产被显式暴露给 AI

## 8. 验收标准

1. AGENTS.md 9 节齐全，行数 ≤ 200
2. 前 15 行能让一个完全没读过 README 的 AI 说出 harness-pilot 是什么
3. AGENTS.md 中所有命令在本机可以直接执行（不需要再查文档）
4. hand-maintained 区段标记存在且语义明确
5. `.harness/docs/WORKFLOW.md` 与 `BAD_CASES.md` 能被 AGENTS.md 文档导航表正确链接
6. README.md 末尾包含 Claude Code 软链说明
