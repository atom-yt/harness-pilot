# 文档更新总结

## 修改的文件（7 个）

| 文件 | 修改内容 |
|------|----------|
| README.md | Documentation 部分补充 API.md、CONTRIBUTING.md、FAQ.md、OPTIMIZATION_PLAN.md 链接 |
| docs/API.md | 移除不存在的 plugin.json 引用；移除 Rust Planned 行 |
| docs/CONTRIBUTING.md | 项目结构补充 agents/、hooks/、tests/ 目录；移除 plugin.json 引用 |
| docs/FAQ.md | 将 harness-guide、harness-generate-rules 统一为 harness-apply |
| docs/OPTIMIZATION_PLAN.md | 合并已实现功能表中的旧技能名 |
| docs/design-harness-creator.md | 生成文件结构图从 scripts/ + harness/ 更新为 .harness/ |
| docs/harness-report.md | 同上，文件结构图更新为 .harness/ |

## 保留的内容

- **test-projects/**: 保留，作为 harness-analyze 和 harness-apply 的手动验证目标

## 核心变更点

1. **技能名统一**: harness-guide / harness-apply / harness-generate-rules → harness-analyze + harness-apply (interactive/auto)
2. **目录结构统一**: scripts/ + harness/ → .harness/ 下的子目录
3. **移除幽灵引用**: plugin.json（不存在）、Rust 支持（无模板）
4. **补全遗漏**: README 文档链接、CONTRIBUTING 目录结构
