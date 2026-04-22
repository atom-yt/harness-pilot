# Capability Fusion - 实施总结

## 完成的工作

### 策略
采用「直接复用 Superpowers + gstack + 自建 Harness 特有能力 + 推荐机制串联」的策略，避免重复造轮子。

### 新增文件（4 个）

| 文件 | 类型 | 说明 |
|------|------|------|
| `plugins/harness-pilot/skills/harness-spec/SKILL.md` | 新增 Skill | 结构化需求规格管理，三阶段状态机（draft→approved→archived），delta 标记，与 harness 验证体系绑定 |
| `plugins/harness-pilot/skills/harness-review/SKILL.md` | 新增 Skill | 三视角评审（架构/产品/质量），复用 harness-guardian 和 code-reviewer，产出结构化评审报告 |
| `plugins/harness-pilot/skills/harness-evolve/SKILL.md` | 新增 Skill | Critic→Refiner 自进化闭环，失败模式分析 + 轨迹编译，从 .harness/trace/failures/ 学习 |
| `plugins/harness-pilot/templates/rules/common/roles.md.template` | 新增模板 | 五种角色视角检查清单（产品/架构/工程/质量/运维） |

### 修改文件（4 个）

| 文件 | 修改内容 |
|------|---------|
| `plugins/harness-pilot/skills/harness-analyze/SKILL.md` | 健康报告末尾增加「推荐的开发质量工具链」（Superpowers + gstack + 内置 skills），增加条件化推荐逻辑 |
| `plugins/harness-pilot/skills/harness-apply/SKILL.md` | 成功输出增加完整工具链推荐，组件选择增加 roles.md，生成流程增加 roles 渲染 |
| `plugins/harness-pilot/agents/planner.md` | Load Context 增加读取 roles.md 和 spec.md，Generate Plan 增加角色视角检查 |
| `plugins/harness-pilot/agents/code-reviewer.md` | Load Context 增加读取 roles.md 和 spec.md，Review 增加多视角维度和 spec compliance 检查 |

### 融合后的完整工作流

```
brainstorm(SP) → spec(H) → plan(SP) → worktree(SP) → implement → review(H+G) → ship(G) → evolve(H)
SP=Superpowers  H=Harness  G=gstack
```

### 能力分布

| 来源 | 提供的能力 |
|------|-----------|
| **Superpowers（直接安装）** | brainstorm, TDD, git worktree, planning, subagent execution, code review |
| **gstack（直接安装）** | 安全护栏, QA, 多角色评审, 发布流程, 浏览器自动化, 问题调查 |
| **Harness Pilot（自建）** | spec 需求管理, 多视角评审(架构专项), 自进化, 角色视角, lint-deps, validate, guardian |
