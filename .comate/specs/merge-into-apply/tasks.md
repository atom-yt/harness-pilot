# 合并 harness-generate-rules 和 harness-guide 到 harness-apply

- [x] Task 1: 重写 harness-apply/SKILL.md，合并三个 skill 的逻辑
    - 1.1: 编写文件头部（name, description, announce）和 Overview 段落，说明默认交互模式 + --auto 自动模式
    - 1.2: 编写模式选择逻辑段落（如何判断交互/自动模式）
    - 1.3: 编写共享逻辑段落（detect_language, detect_framework, detect_structure, 模板引擎集成, 模板优先级）
    - 1.4: 编写交互模式段落（Step 1-6 完整流程，从 harness-guide 迁移，Step 6 包含 rules 生成）
    - 1.5: 编写自动模式段落（从原 harness-apply 迁移，包含 rules 生成逻辑）
    - 1.6: 编写成功输出、错误处理、模板变量参考等段落

- [x] Task 2: 更新 plugin.json，删除 harness-guide 和 harness-generate-rules 的 skill 声明
    - 2.1: 删除 harness-guide 和 harness-generate-rules 的 skill 条目
    - 2.2: 更新 harness-apply 的 description 和 trigger 列表（合并原有 trigger 关键词）

- [x] Task 3: 更新根 skills/SKILL.md，移除对已删除 skill 的引用
    - 3.1: 更新模式列表，将三种模式改为两种（harness-analyze + harness-apply）
    - 3.2: 更新 harness-apply 描述为包含交互/自动两种模式
    - 3.3: 移除 harness-guide 和 harness-generate-rules 的子 skill 引用

- [x] Task 4: 删除 harness-guide 和 harness-generate-rules 的 SKILL.md 文件
    - 4.1: 删除 plugins/harness-pilot/skills/harness-guide/SKILL.md
    - 4.2: 删除 plugins/harness-pilot/skills/harness-generate-rules/SKILL.md
