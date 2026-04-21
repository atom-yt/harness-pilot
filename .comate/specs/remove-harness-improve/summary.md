# 移除 harness-improve 完成总结

## 变更概览

将 harness-pilot 插件从 3 个 skill 精简为 2 个，删除了 harness-improve，将其有价值的审计功能合并到 harness-analyze。

## 已完成的变更

### 删除
- `plugins/harness-pilot/skills/harness-improve/SKILL.md` — 整个 skill 目录已删除

### 修改的文件（6 个）

| 文件 | 变更内容 |
|------|---------|
| `plugins/harness-pilot/skills/harness-analyze/SKILL.md` | 增加审计触发词、新增 Step 6: Audit Analysis（文档过期检测 + Lint 覆盖率 gap 检测）、更新报告模板、移除 harness-improve 引用 |
| `README.md` | "三个模式"改为"两个模式"，移除 harness-improve 介绍和示例 |
| `docs/API.md` | 删除 harness-improve 段落，增强 harness-analyze 的触发词和功能描述 |
| `docs/CONTRIBUTING.md` | 目录树中移除 harness-improve 行 |
| `plugins/harness-pilot/agents/harness-guardian.md` | "feed into harness-improve" 改为 "feed into harness-analyze" |

### 向后兼容

- 用户说 "harness-improve"、"harness-health"、"harness-audit" 时，会触发 harness-analyze 接管
- 原 harness-improve 的文档过期检测和 lint 覆盖率 gap 检测功能已保留在 harness-analyze 的 Step 6 中

### 丢弃的功能

- 失败模式分析（Critic）— 依赖不存在的数据源，无实际价值
- 自动修复（Refiner）— 能力太浅，不值得维护
- 健康分数历史追踪 — 过度设计
