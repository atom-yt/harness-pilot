# Harness Pilot Review 问题修复

## 需求概述

修复代码审查中发现的各类问题，涵盖代码 bug、文档不一致、冗余文件、过时内容等。

---

## 修复项清单

### 1. [High] Session-Start Hook JSON 转义不完整

**文件**: `plugins/harness-pilot/hooks/session-start:57`

**问题**: 手动 `sed` 转义漏掉 `\t`、`\r`、`\b`、`\f` 等控制字符，导致含 tab 的 AGENTS.md 输出无效 JSON。同时 `echo "$output"` 在 zsh/bash 下行为不一致。

**修复**:
- 将第 57 行的 sed 链替换为使用 `printf '%s'` + `sed` 更完整的转义方案（考虑到目标环境可能没有 jq，使用纯 bash 方案）
- 将 `build_output()` 中 `echo "$output"` 改为 `printf '%s' "$output"` 确保可移植性
- 对 `\t`、`\r` 等控制字符也做转义

```bash
# 修复后的转义逻辑
json_output=$(printf '%s' "$raw_output" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/\t/\\t/g' -e 's/\r/\\r/g' -e '$!s/$/\\n/' | tr -d '\n')
```

**影响函数**: `build_output()`, JSON 输出块

### 2. [High] README 与 plugin.json 技能列表不一致

**文件**: `README.md:9-14, 42-56`

**问题**: README 列出 `harness-guide` 和 `harness-generate-rules`，但 plugin.json 中这两个已合并到 `harness-apply`，且遗漏了 `harness-execute` 和 `harness-improve`。

**修复**:
- 更新 README 的四个模式为: `harness-analyze`、`harness-apply`、`harness-execute`、`harness-improve`
- 更新 Quick Start 命令
- 说明 `harness-apply` 支持交互式引导和自动模式

### 3. [High] plugin.json 声称支持但无模板的语言/框架

**文件**: `plugins/harness-pilot/plugin.json:50-51, 55-58`

**问题**:
- `supportedLanguages` 包含 `rust` 但无任何模板
- `supportedFrameworks` 包含 `flask` 但无任何模板
- `templates.languages` 中 `javascript`、`python`、`go` 混入了 `development.md`（属于 rules 类别）

**修复**:
- 从 `supportedLanguages` 移除 `rust`
- 从 `supportedFrameworks` 移除 `flask`
- 从 `templates.languages` 中移除 `javascript` 条目（无语言脚本）和各语言的 `development.md`（属于 rules）

### 4. [Medium] 模板引擎 `#each` 不支持点号路径

**文件**: `plugins/harness-pilot/scripts/template-engine.js:94`

**问题**: `#if` 支持 `config.items` 路径，`#each` 只匹配 `\w+`。

**修复**: 将正则从 `(\w+)` 改为 `(\w+(?:\.\w+)*)`

### 5. [Medium] 模板引擎 Object.assign 原型污染风险

**文件**: `plugins/harness-pilot/scripts/template-engine.js:114`

**问题**: 直接 `Object.assign(tempContext, item)` 可覆盖 `@index` 等元数据。

**修复**: 将 item 属性放到合并之前，让元数据在后面覆盖：
```javascript
const tempContext = {
  ...this.context,
  ...(typeof item === 'object' && item !== null ? item : {}),
  '@index': index,
  '@first': index === 0,
  '@last': index === value.length - 1,
};
if (typeof item !== 'object' || item === null) {
  tempContext.this = item;
}
```

### 6. [Medium] 测试 expectEqual 隐藏空白符 bug

**文件**: `plugins/harness-pilot/tests/template-engine.test.js:8-16`

**问题**: 所有空白折叠为单空格，无法检测换行/缩进错误。

**修复**: 增加 `expectExact` 函数用于空白敏感测试，`expectEqual` 保留用于空白不敏感场景。更新 Test 12 使用精确比较。

### 7. [Medium] 测试文件混用 ESM/CJS

**文件**: `plugins/harness-pilot/tests/template-engine.test.js:293-298`

**问题**: ESM 文件中的 `module.exports` 块是死代码。

**修复**: 删除 CJS 导出块。

### 8. [Low] SKILL.md 标题和引用错误

**文件**: `plugins/harness-pilot/skills/SKILL.md:6, 12, 178`

**问题**:
- 标题 "Harness Creator" 应为 "Harness Pilot"
- 第 12 行 "Harness Creator is a tool" 应为 "Harness Pilot"
- 第 178 行引用 `../design-harness-pilot.md`，文件名和路径均错误

**修复**:
- 标题改为 "# Harness Pilot"
- 描述改为 "Harness Pilot is a tool..."
- 链接改为 `../../../docs/design-harness-creator.md`

### 9. [Low] hooks.json 与 plugin.json 重复

**文件**: `plugins/harness-pilot/hooks/hooks.json`

**问题**: 内容完全重复。

**修复**: 删除 `hooks.json` 文件。

### 10. [Low] 空技能目录

**文件**: `plugins/harness-pilot/skills/harness-guide/`, `plugins/harness-pilot/skills/harness-generate-rules/`

**问题**: 空目录，功能已合并到 harness-apply。

**修复**: 删除这两个空目录。

### 11. [Low] API.md 技能列表过时

**文件**: `docs/API.md:35-87`

**问题**: 仍列出 `harness-guide` 和 `harness-generate-rules` 为独立技能，遗漏 `harness-execute` 和 `harness-improve`。

**修复**: 重写 Skills 章节，与 plugin.json 保持一致。

### 12. [Low] CONTRIBUTING.md 技能列表过时

**文件**: `docs/CONTRIBUTING.md:38-41`

**问题**: 列出旧技能名。

**修复**: 更新目录树中技能目录为 `harness-analyze`、`harness-apply`、`harness-execute`、`harness-improve`。

### 13. [Low] OPTIMIZATION_PLAN.md 严重过时

**文件**: `docs/OPTIMIZATION_PLAN.md`

**问题**: 多个标记为未完成的任务实际已完成。

**修复**: 更新各 checkbox 状态，标注已完成项。更新"已知缺口"表。

### 14. [Low] README 支持语言/框架表与实际不符

**文件**: `README.md:84-103`

**问题**: Python/Go 标为 "rules only" 但实际已有 lint 脚本；多个框架标为 Planned 但模板已存在。

**修复**: 更新表格与实际模板状态保持一致。

### 15. [Low] SKILL.md 支持语言/框架表不准确

**文件**: `plugins/harness-pilot/skills/SKILL.md:122-138`

**问题**: 声称 Rust、JavaScript 有完整模板支持，与实际不符。

**修复**: 更新表格与实际模板状态一致。

---

## 不做修改的项（已知限制，仅文档说明）

- 嵌套 `{{#if}}`/`{{#each}}` 块：正则引擎固有限制，需重写为递归解析器，超出本次修复范围
- `{{else}}` 支持：功能扩展，非 bug
- 循环 `join('\n')` 双换行问题：取决于模板作者意图，保持现状
