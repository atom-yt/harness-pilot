# harness-pilot 插件功能增强任务计划

- [x] Task 1: 创建 Hook 系统（SessionStart 自动加载）
    - 1.1: 创建 `plugins/harness-pilot/hooks/session-start` 脚本，实现 AGENTS.md 检测、内容读取、活跃任务检测、多平台输出格式（Claude Code / Codex / Cursor）
    - 1.2: 创建 `plugins/harness-pilot/hooks/hooks.json`，注册 SessionStart 事件
    - 1.3: 修改 `plugins/harness-pilot/plugin.json`，添加 hooks 注册信息
    - 1.4: 验证 session-start 脚本可执行权限和输出格式正确性

- [x] Task 2: 创建 Agent 定义（planner / code-reviewer / harness-guardian）
    - 2.1: 创建 `plugins/harness-pilot/agents/planner.md`，定义规划专家角色、流程、输出格式、约束
    - 2.2: 创建 `plugins/harness-pilot/agents/code-reviewer.md`，定义代码审查角色、检查维度、输出格式
    - 2.3: 创建 `plugins/harness-pilot/agents/harness-guardian.md`，定义 harness 守护者角色、预验证流程、输出格式
    - 2.4: 修改 `plugins/harness-pilot/plugin.json`，添加 agents 注册信息

- [x] Task 3: 创建 harness-execute 技能（执行引擎）
    - 3.1: 创建 `plugins/harness-pilot/skills/harness-execute/SKILL.md`，包含完整执行流程：环境检测 → 复杂度判断 → 计划生成 → 子代理委派 → 验证闭环 → 检查点 → 记忆记录
    - 3.2: 修改 `plugins/harness-pilot/skills/SKILL.md`，在模式选择菜单中增加 harness-execute 选项
    - 3.3: 修改 `plugins/harness-pilot/plugin.json`，注册 harness-execute skill 及触发关键词

- [x] Task 4: 创建 Pre-validation 模板（verify-action 事前验证脚本）
    - 4.1: 创建 `plugins/harness-pilot/templates/languages/typescript/verify-action.ts.template`，实现层级映射读取、操作解析、合法性校验、教学性错误输出
    - 4.2: 创建 `plugins/harness-pilot/templates/languages/python/verify-action.py.template`，同上 Python 版本
    - 4.3: 创建 `plugins/harness-pilot/templates/languages/go/verify-action.go.template`，同上 Go 版本
    - 4.4: 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`，在组件选择和生成流程中加入 verify-action
    - 4.5: 修改 `plugins/harness-pilot/plugin.json`，templates.languages 中注册 verify-action

- [x] Task 5: 创建 harness-improve 技能（自检与改进）
    - 5.1: 创建 `plugins/harness-pilot/skills/harness-improve/SKILL.md`，包含：运行健康检查、分析失败记录模式、检查 lint 覆盖缺口、检查文档同步、生成改进建议、自动执行修复
    - 5.2: 修改 `plugins/harness-pilot/skills/SKILL.md`，在模式选择菜单中增加 harness-improve 选项
    - 5.3: 修改 `plugins/harness-pilot/plugin.json`，注册 harness-improve skill 及触发关键词

- [x] Task 6: 扩充模板（PRODUCT_SENSE.md + exec-plan.md）
    - 6.1: 创建 `plugins/harness-pilot/templates/base/PRODUCT_SENSE.md.template`，包含产品描述、核心用户旅程、业务规则、领域术语、不可随意修改的关键路径
    - 6.2: 创建 `plugins/harness-pilot/templates/base/exec-plan.md.template`，包含目标、影响分析、分步骤计划、回退策略、验证命令
    - 6.3: 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`，在组件选择中增加 PRODUCT_SENSE.md 和 exec-plan 模板，在生成流程中增加渲染逻辑
    - 6.4: 修改 `plugins/harness-pilot/plugin.json`，templates.base 中注册新模板

- [x] Task 7: 增强 Linter 错误信息模板（教学性输出）
    - 7.1: 修改 `plugins/harness-pilot/templates/languages/typescript/lint-deps.ts.template`，将错误输出改为包含：违反规则 + 原因 + 修复建议的教学格式
    - 7.2: 修改 `plugins/harness-pilot/templates/languages/python/lint-deps.py.template`，同上
    - 7.3: 修改 `plugins/harness-pilot/templates/languages/go/lint-deps.go.template`，同上
    - 7.4: 修改 `plugins/harness-pilot/templates/languages/typescript/lint-quality.ts.template`，同上增强质量规则错误信息
    - 7.5: 修改 `plugins/harness-pilot/templates/languages/python/lint-quality.py.template`，同上
    - 7.6: 修改 `plugins/harness-pilot/templates/languages/go/lint-quality.go.template`，同上
