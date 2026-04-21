# Summary: 合并 harness-generate-rules 和 harness-guide 到 harness-apply

## 完成的变更

### 1. 重写 harness-apply/SKILL.md
- 合并了三个 skill 的全部逻辑为统一的 SKILL.md（约 530 行）
- **默认交互模式**：6 步引导流程（项目检测 → 组件选择 → 层级映射 → 质量规则 → 验证管线 → 确认生成）
- **自动模式（--auto）**：一键生成，使用检测到的默认配置
- Rules 生成（safety, git-workflow, language-specific）集成在两种模式的生成流程中
- 共享逻辑提取为独立段落（检测函数、模板引擎、模板优先级、默认配置）

### 2. 更新 plugin.json
- 删除了 `harness-guide` 和 `harness-generate-rules` 两个 skill 声明
- 更新 `harness-apply` 的 description 和 trigger 列表
- 合并原有 trigger 关键词保证向后兼容（guide, harness-build, generate-rules, harness-rules 等）

### 3. 更新根 skills/SKILL.md
- 模式列表从 3 个精简为 2 个（harness-analyze + harness-apply）
- harness-apply 描述更新为包含交互/自动两种子模式
- 移除对 harness-guide 和 harness-generate-rules 的子 skill 引用
- Troubleshooting 表中引用更新

### 4. 删除废弃文件
- 删除 `plugins/harness-pilot/skills/harness-guide/SKILL.md`
- 删除 `plugins/harness-pilot/skills/harness-generate-rules/SKILL.md`

## 变更文件列表

| 文件 | 操作 |
|------|------|
| `plugins/harness-pilot/skills/harness-apply/SKILL.md` | 重写 |
| `plugins/harness-pilot/plugin.json` | 修改 |
| `plugins/harness-pilot/skills/SKILL.md` | 修改 |
| `plugins/harness-pilot/skills/harness-guide/SKILL.md` | 删除 |
| `plugins/harness-pilot/skills/harness-generate-rules/SKILL.md` | 删除 |
