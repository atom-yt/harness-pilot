# 将 rules/、scripts/、harness/ 统一收纳到 .harness/ 隐藏目录

- [x] Task 1: 更新 harness-apply/SKILL.md 中所有输出路径
    - 1.1: mkdir 命令 — `scripts/verify` → `.harness/scripts/verify`，`rules/common` → `.harness/rules/common`，`rules/$LANGUAGE` → `.harness/rules/$LANGUAGE`，`harness/memory/...` → `.harness/memory/...`，`harness/tasks` → `.harness/tasks`，`harness/trace/...` → `.harness/trace/...`
    - 1.2: 模板输出命令 — `> scripts/xxx` → `> .harness/scripts/xxx`，`> rules/xxx` → `> .harness/rules/xxx`
    - 1.3: chmod 命令 — `chmod +x scripts/xxx` → `chmod +x .harness/scripts/xxx`
    - 1.4: echo 进度输出 — 同步更新路径显示
    - 1.5: 组件表格、交互选择 UI、规则说明中的路径
    - 1.6: 命令示例（TypeScript/Python/Go 的 lint_arch/validate 配置）
    - 1.7: 成功输出示例中的文件列表
    - 1.8: 文本描述、Next Steps、checklist 中的路径
    - 1.9: harness/ placeholder README 输出路径 → `.harness/`

- [x] Task 2: 更新 harness-analyze/SKILL.md 和 harness-improve/SKILL.md
    - 2.1: harness-analyze — `scripts/lint-deps.*` → `.harness/scripts/lint-deps.*`，`scripts/lint-quality.*` → `.harness/scripts/lint-quality.*`
    - 2.2: harness-improve — `scripts/lint-deps.*` → `.harness/scripts/lint-deps.*`

- [x] Task 3: 更新 base 模板文件
    - 3.1: AGENTS.md.template — 脚本调用路径更新为 `.harness/scripts/`
    - 3.2: exec-plan.md.template — `scripts/verify-action` → `.harness/scripts/verify-action`

- [x] Task 4: 更新语言模板文件（TypeScript、Python、Go）
    - 4.1: TypeScript — lint-deps.ts.template, lint-quality.ts.template, validate.ts.template, verify-action.ts.template
    - 4.2: Python — lint-deps.py.template, lint-quality.py.template, validate.py.template, verify-action.py.template
    - 4.3: Go — validate.go.template, verify-action.go.template

- [x] Task 5: 更新 session-start hook 和文档文件
    - 5.1: session-start — 检测 harness 基础设施的路径更新为 `.harness/`
    - 5.2: README.md — 目录结构说明更新
    - 5.3: docs/API.md — 输出结构说明更新

- [x] Task 6: 验证并提交
    - 6.1: 运行模板引擎测试确保通过
    - 6.2: 全局搜索确认无遗漏的旧路径引用
    - 6.3: 提交代码
