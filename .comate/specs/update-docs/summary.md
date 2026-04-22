# 文档更新总结

## 完成内容

更新 5 个文档文件，使其反映能力融合（capability-fusion）架构的全部变更。

## 修改清单

| 文件 | 修改内容 |
|------|----------|
| `README.md` | 新增 3 个 skill 说明、Quick Start 示例、文件结构增加 specs/ 和 roles.md、新增 Recommended Toolchain 章节 |
| `docs/API.md` | 新增 harness-spec/harness-review/harness-evolve API 文档、新增 Agents 章节、更新文件结构 |
| `docs/CONTRIBUTING.md` | Project Structure 树增加 3 个新 skill 目录和 roles.md.template |
| `docs/detailed-design.md` | 新增"能力融合"章节（三方协作策略、推荐机制、完整工作流）、新增"角色视角系统"章节、harness-evolve skill 说明、更新文件结构和实施计划标记 |
| `docs/overview-design.md` | 新增场景五（多视角审查）和场景六（结构化需求规格）、更新文件结构树、补充 harness-evolve skill 说明 |

## 关键新增章节

1. **README: Recommended Toolchain** — 说明 Superpowers + gstack 互补推荐及完整工作流
2. **API: Agents** — 文档化 planner 和 code-reviewer 的角色视角增强
3. **detailed-design: 能力融合** — 三方协作策略、推荐机制逻辑、工作流图
4. **detailed-design: 角色视角系统** — 五维视角定义及 Agent 注入说明
5. **overview-design: 场景五/六** — 用户可感知的多视角审查和需求规格使用场景
