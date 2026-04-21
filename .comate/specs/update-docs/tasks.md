# 更新项目文档以匹配当前结构

- [x] Task 1: 更新 README.md Documentation 部分
    - 1.1: 补充 API.md、CONTRIBUTING.md、FAQ.md、OPTIMIZATION_PLAN.md 链接

- [x] Task 2: 更新 docs/API.md
    - 2.1: 移除 Supported Languages 表中 Rust 行
    - 2.2: 移除 Configuration 部分对 plugin.json 的引用，改为说明插件通过目录结构约定配置

- [x] Task 3: 更新 docs/CONTRIBUTING.md
    - 3.1: 更新 Project Structure 部分，补充 agents/、hooks/、tests/ 目录
    - 3.2: 移除 Adding a New Language 和 Adding a New Framework 中对 plugin.json 的引用

- [x] Task 4: 更新 docs/FAQ.md
    - 4.1: 更新 "Which mode should I use?" 表格，统一为 harness-analyze 和 harness-apply
    - 4.2: 将所有 harness-guide 引用改为 harness-apply
    - 4.3: 将 harness-generate-rules 引用改为 harness-apply

- [x] Task 5: 更新 docs/OPTIMIZATION_PLAN.md
    - 5.1: 更新已实现功能表格，合并 harness-guide/harness-apply/harness-generate-rules 为 harness-apply

- [x] Task 6: 更新 docs/design-harness-creator.md
    - 6.1: 更新"生成的文件结构"图，将 scripts/ 和 harness/ 改为 .harness/ 下的子目录
    - 6.2: 更新"文件说明"表格中的路径前缀

- [x] Task 7: 更新 docs/harness-report.md
    - 7.1: 更新"文件结构长什么样？"部分，将 scripts/ 和 harness/ 改为 .harness/ 下的结构
