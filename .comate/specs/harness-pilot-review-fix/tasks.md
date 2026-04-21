# Harness Pilot Review 问题修复任务计划

- [x] Task 1: 修复 session-start hook JSON 转义和可移植性问题
    - 1.1: 将 `build_output()` 中 `echo "$output"` 改为 `printf '%s' "$output"`
    - 1.2: 替换第 57 行 sed 转义链，增加 `\t`、`\r` 转义，使用 `printf` + `tr` 方案
    - 1.3: 删除冗余的 `hooks/hooks.json` 文件

- [x] Task 2: 修复模板引擎代码 bug
    - 2.1: 将 `#each` 正则从 `(\w+)` 改为 `(\w+(?:\.\w+)*)` 支持点号路径
    - 2.2: 重构循环渲染中 Object.assign 逻辑，确保 `@index`/`@first`/`@last` 不被覆盖

- [x] Task 3: 修复测试文件问题
    - 3.1: 添加 `expectExact` 精确比较函数，更新 Test 12 使用精确比较
    - 3.2: 删除 CJS 导出死代码块（第 293-298 行）

- [x] Task 4: 同步 plugin.json 与实际模板状态
    - 4.1: 从 `supportedLanguages` 移除 `rust`
    - 4.2: 从 `supportedFrameworks` 移除 `flask`
    - 4.3: 修正 `templates.languages` 中 `javascript` 条目和各语言混入的 `development.md`

- [x] Task 5: 更新 README.md 与 plugin.json 保持一致
    - 5.1: 更新四个模式描述为 analyze/apply/execute/improve
    - 5.2: 更新 Quick Start 命令
    - 5.3: 更新支持语言/框架表格与实际模板状态一致

- [x] Task 6: 修复 SKILL.md 标题、描述和引用链接
    - 6.1: 标题从 "Harness Creator" 改为 "Harness Pilot"
    - 6.2: 修复第 178 行文档引用链接
    - 6.3: 更新支持语言/框架表格

- [x] Task 7: 更新 API.md 技能列表
    - 7.1: 重写 Skills 章节，移除 harness-guide/harness-generate-rules，添加 harness-execute/harness-improve
    - 7.2: 更新 Supported Frameworks 表格移除 Flask Planned

- [x] Task 8: 更新 CONTRIBUTING.md 和 OPTIMIZATION_PLAN.md
    - 8.1: 更新 CONTRIBUTING.md 目录树中技能目录名
    - 8.2: 更新 OPTIMIZATION_PLAN.md 已完成项 checkbox 和已知缺口表

- [x] Task 9: 清理空技能目录
    - 9.1: 删除 `skills/harness-guide/` 空目录
    - 9.2: 删除 `skills/harness-generate-rules/` 空目录

- [x] Task 10: 运行测试验证修复
    - 10.1: 运行模板引擎测试确认通过
    - 10.2: 运行 session-start hook 验证 JSON 输出格式
