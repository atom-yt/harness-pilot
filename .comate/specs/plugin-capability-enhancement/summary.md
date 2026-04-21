# harness-pilot 插件功能增强 — 完成总结

## 执行概览

7 个任务全部完成，harness-pilot 插件从**纯生成工具**升级为**完整的 harness 运行时环境**。

## 变更清单

### Task 1: Hook 系统
- **新增** `plugins/harness-pilot/hooks/session-start` — 会话启动脚本，自动检测 AGENTS.md 并加载上下文
- **新增** `plugins/harness-pilot/hooks/hooks.json` — SessionStart 事件注册
- **修改** `plugins/harness-pilot/plugin.json` — 添加 hooks 配置
- 支持 Claude Code / Codex / Cursor 三个平台的输出格式

### Task 2: Agent 定义
- **新增** `plugins/harness-pilot/agents/planner.md` — 规划专家，分解复杂任务为可验证步骤
- **新增** `plugins/harness-pilot/agents/code-reviewer.md` — 代码审查专家，关注机械 lint 发现不了的逻辑问题
- **新增** `plugins/harness-pilot/agents/harness-guardian.md` — Harness 守护者，事前验证+层级执法+诊断
- **修改** `plugins/harness-pilot/plugin.json` — 注册 3 个 agent

### Task 3: harness-execute 技能
- **新增** `plugins/harness-pilot/skills/harness-execute/SKILL.md` — 完整执行引擎（290+ 行）
  - 环境检测 → 复杂度判断 → 子代理委派 → 验证闭环 → 检查点 → 记忆记录
  - 复杂度三级：Simple（直接执行）/ Medium（子代理）/ Complex（子代理 + worktree 隔离）
  - 协调者铁律：中等以上任务绝不写代码
- **修改** `plugins/harness-pilot/skills/SKILL.md` — 模式选择菜单增加 execute 和 improve
- **修改** `plugins/harness-pilot/plugin.json` — 注册 skill 和触发词

### Task 4: Pre-validation 模板
- **新增** `templates/languages/typescript/verify-action.ts.template` — TypeScript 事前验证
- **新增** `templates/languages/python/verify-action.py.template` — Python 事前验证
- **新增** `templates/languages/go/verify-action.go.template` — Go 事前验证
- 支持三种操作：`create file`、`import ... from`、`move file ... to`
- 教学性输出：VALID/INVALID + Rule + Why + Fix
- Layer 4 互相导入检测
- **修改** harness-apply SKILL.md — 组件选择和生成流程增加 verify-action
- **修改** plugin.json — templates 注册

### Task 5: harness-improve 技能
- **新增** `plugins/harness-pilot/skills/harness-improve/SKILL.md` — 自检与改进引擎（240+ 行）
  - 7 步流程：健康检查 → 失败模式分析（Critic）→ lint 覆盖检测 → 文档新鲜度检查 → 错误信息质量评估 → 改进计划 → 自动修复（Refiner）
  - 改进历史记录到 harness/trace/improvements.md
- **修改** plugin.json — 注册 skill 和触发词

### Task 6: 模板扩充
- **新增** `templates/base/PRODUCT_SENSE.md.template` — 业务上下文模板（用户旅程、业务规则、领域术语、安全考量）
- **新增** `templates/base/exec-plan.md.template` — 执行计划模板（影响分析、分步骤、回退策略、架构决策记录）
- **修改** harness-apply SKILL.md — 组件选择增加 PRODUCT_SENSE.md，生成流程增加渲染逻辑
- **修改** plugin.json — templates.base 注册

### Task 7: Linter 错误信息增强
- **修改** 6 个 lint 模板文件，将错误输出从简短一行改为教学性格式：
  - `lint-deps.ts/py/go.template` — 层级违反错误增加 Rule + Why + Fix
  - `lint-quality.ts/py/go.template` — 每条规则错误增加 Rule + Why + Fix
  - 覆盖规则：no-console-log/print, max-file-size, no-debugger, no-any, no-debug

## 文件统计

| 类型 | 数量 |
|------|------|
| 新增文件 | 13 |
| 修改文件 | 9 |
| 新增 Skills | 2 (harness-execute, harness-improve) |
| 新增 Agents | 3 (planner, code-reviewer, harness-guardian) |
| 新增 Templates | 5 (verify-action x3, PRODUCT_SENSE.md, exec-plan.md) |
| 新增 Hooks | 1 (SessionStart) |

## 插件能力矩阵（增强前 vs 增强后）

| 能力 | 增强前 | 增强后 |
|------|--------|--------|
| 项目分析 | harness-analyze | harness-analyze |
| 基础设施生成 | harness-apply | harness-apply（+verify-action, +PRODUCT_SENSE.md） |
| 任务执行 | - | harness-execute（子代理架构） |
| 自检改进 | - | harness-improve（Critic→Refiner 循环） |
| 会话启动 | 手动触发 | Hook 自动加载 AGENTS.md |
| 子代理 | - | planner + code-reviewer + harness-guardian |
| 事前验证 | - | verify-action 脚本（3 语言） |
| 错误教学 | 简短报错 | Rule + Why + Fix 教学格式 |
| 跨平台 | Claude Code | Claude Code + Codex + Cursor |
