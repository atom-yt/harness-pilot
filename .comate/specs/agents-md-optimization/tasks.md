# AGENTS.md 优化任务计划

- [x] Task 1: 新建 .harness/docs/WORKFLOW.md
    - 1.1: 承接当前 AGENTS.md 中 SDD Pipeline 5 阶段表 + Enforcement Rules + Bypass 条件
    - 1.2: 承接当前 AGENTS.md "Workflow" 代码块（analyze→apply→develop→ship 流程）
    - 1.3: 补充 SDD 流水线 vs 校验流水线（build/lint/test/verify）的关系说明，避免与 README 重叠概念混淆
    - 1.4: 末尾加"何时 bypass / 何时强制 SDD"的判断指南

- [x] Task 2: 新建 .harness/docs/BAD_CASES.md
    - 2.1: 写文件头部使用说明（什么是 bad case，如何提交，如何升格到 AGENTS.md）
    - 2.2: 写案例模板（编号、现象、根因、修复落点、关联 trace、状态）
    - 2.3: 给一个示例案例（基于 .harness/trace/failures/ 中已有的真实失败记录提炼）
    - 2.4: 末尾加"如何把 bad case 升格为硬性规则"的流程图（BAD_CASES → AGENTS.md hand-maintained 区段 / lint 脚本）

- [x] Task 3: 重写根目录 AGENTS.md
    - 3.1: 第 1 节 项目概述（5-10 行讲清楚 harness-pilot 是什么、技术栈、dogfood 关系）
    - 3.2: 第 2 节 快速命令（pnpm install/build/test，validate 一键校验）
    - 3.3: 第 3 节 仓库结构（ASCII 树，标注 plugins/.harness/docs/test-projects/utils 等目录用途）
    - 3.4: 第 4 节 核心模块说明（plugins/harness-pilot 下 skills/lib/templates/agents/hooks 简述）
    - 3.5: 第 5 节 关键约定（7 条硬性规则，每条 WHAT+WHY+HOW），并加 hand-maintained 区段标记
    - 3.6: 第 6 节 本地开发与验证闭环（改→validate→trace→auto-commit skill）
    - 3.7: 第 7 节 SDD 工作流入口（仅复杂度门槛 + bypass 条件，详细链接 .harness/docs/WORKFLOW.md）
    - 3.8: 第 8 节 质量检查命令矩阵（暴露 .harness/scripts/ 下 6 个 lint 脚本统一入口）
    - 3.9: 第 9 节 文档导航表（docs/ 下 7 个 + .harness/docs/ 下 5 个，共 12 项）
    - 3.10: 删除原"First Principles / Available Harness Skills / Recommended Plugin"等元信息或下沉为引用
    - 3.11: 末尾加 Claude Code 软链说明 + "本文件可手动编辑 hand-maintained 区段"提示
    - 3.12: 检查总行数 ≤ 200

- [x] Task 4: 微调 README.md
    - 4.1: 在 Quick Start 或末尾合适位置增加 Claude Code 兼容软链说明（ln -s AGENTS.md CLAUDE.md）
    - 4.2: 检查 README 与新版 AGENTS.md 的内容重叠是否合理（保留少量项目概述重叠，避免命令矩阵重复）

- [x] Task 5: 验收与一致性检查
    - 5.1: 验证 AGENTS.md 中所有命令在本仓库能跑通（pnpm tsx .harness/scripts/*.ts 等存在且可执行）
    - 5.2: 验证 AGENTS.md 文档导航表所有链接路径真实存在
    - 5.3: 验证 hand-maintained 区段标记语法清晰、注释明确
    - 5.4: 对照 doc.md 第 8 节验收标准逐条勾对
