# Harness Simplify - 完成总结

## 变更概要

将 Harness Pilot 从 5 Skill + 3 Agent 精简为 **2 Skill + 1 Agent** 架构，聚焦质量闭环。

### 架构对比

| 维度 | 变更前 | 变更后 |
|---|---|---|
| Skills | 5 (analyze, apply, spec, review, evolve) | **2** (analyze, apply) |
| Agents | 3 (planner, code-reviewer, harness-guardian) | **1** (code-reviewer，合并架构检查) |
| 顶层目录 | AGENTS.md + docs/ + .harness/ | **.harness/** 仅一个 |
| 质量闭环 | 无（review 单次） | **Ralph Wiggum Loop**（最多 3 轮自动闭环） |
| 可重入 | 不支持 | **支持**（manifest.json + 增量更新） |
| Hooks | 仅 session-start | session-start（新鲜度检查）+ git post-commit |

### 用户心智模型

- `harness-analyze` = **看**（只读诊断，可视化评分卡）
- `harness-apply` = **做**（生成/更新/质量闭环，默认包含 Loop）

## 执行的任务

### Task 1-2: 删除文件
- 删除 3 个 skill: harness-spec, harness-review, harness-evolve
- 删除 2 个 agent: planner, harness-guardian
- 删除 3 个模板: AGENTS.md.template, exec-plan.md.template, roles.md.template

### Task 3: 重写 harness-analyze
- 移除模板可用性检查（Step 0）
- 可视化评分卡（进度条 + 分类评分 + 整体打分）
- 简化推荐：只推荐 Superpowers + harness-apply

### Task 4-7: 重写 harness-apply
- **模式路由**: 自动检测 manifest.json，首次生成/重入更新/--init 强制重建
- **Superpowers 检测**: 未安装时输出安装提示（不阻塞）
- **可重入设计**: manifest.json 状态追踪，增量更新，自定义规则保护
- **Ralph Wiggum Loop**: Orchestrate → Review → Test → Fix → Re-Review（最多 3 轮）
- **Agent 互审**: dispatch code-reviewer + lint-deps + lint-quality
- **evolve 附属**: Loop 后自动分析 failure 模式
- **Hooks**: session-start 新鲜度检查 + git post-commit hook
- **docs 收归**: 所有文档生成到 .harness/docs/

### Task 8: 更新 code-reviewer
- 合并 harness-guardian 的架构检查能力（layer compliance, dependency direction, module boundaries）
- 更新数据源路径为 .harness/docs/

### Task 9: 更新模板路径
- 6 处 verify-action 模板中 `docs/ARCHITECTURE.md` → `.harness/docs/ARCHITECTURE.md`
- DEVELOPMENT.md.template 路径引用更新

### Task 10: 更新项目文档
- README.md: 2 skill 架构，新目录结构，Ralph Wiggum Loop
- API.md: 完整重写，反映新接口
- CONTRIBUTING.md: 更新项目结构和开发指南
- overview-design.md: 12 处定向编辑
- detailed-design.md: 11 处定向编辑

## 文件变更统计

| 类型 | 数量 |
|---|---|
| 删除 | 8 文件（3 skill + 2 agent + 3 template） |
| 重写 | 5 文件（2 skill + 1 agent + 1 hook + README） |
| 更新 | 9 文件（3 template + 4 docs + hooks.json + session-start） |
