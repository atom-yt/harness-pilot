# 移除 harness-improve，精简为两个 skill

- [x] Task 1: 删除 harness-improve skill 目录
    - 1.1: 删除 `plugins/harness-pilot/skills/harness-improve/SKILL.md`
    - 1.2: 删除 `plugins/harness-pilot/skills/harness-improve/` 目录

- [x] Task 2: 增强 harness-analyze，合并审计功能
    - 2.1: 更新 description，增加 audit/health 关键词
    - 2.2: 在 "When to Activate" 增加原 harness-improve 的触发词
    - 2.3: 在 Step 5 之后新增 Step 6: Audit Analysis（文档过期检测 + Lint 覆盖率 gap 检测）
    - 2.4: 原 Step 6 改为 Step 7，更新报告模板增加审计输出区域
    - 2.5: 更新 "After Analysis" 和所有 next steps，去掉 harness-improve 引用

- [x] Task 3: 更新 README.md
    - 3.1: 移除 harness-improve 介绍行
    - 3.2: 移除 harness-improve Quick Start 示例
    - 3.3: 更新 harness-analyze 描述体现审计功能

- [x] Task 4: 更新 docs/API.md
    - 4.1: 删除 harness-improve 整个段落
    - 4.2: 更新 harness-analyze 段落，增加审计触发词和功能说明

- [x] Task 5: 更新 docs/CONTRIBUTING.md 和 harness-guardian agent
    - 5.1: 移除 CONTRIBUTING.md 目录树中 harness-improve 行
    - 5.2: harness-guardian.md 中 "feed into harness-improve" 改为 "feed into harness-analyze"
