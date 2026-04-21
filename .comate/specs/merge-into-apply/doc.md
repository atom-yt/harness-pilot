# 合并 harness-generate-rules 和 harness-guide 到 harness-apply

## 需求概述

将 `harness-generate-rules` 和 `harness-guide` 两个 skill 合并到 `harness-apply`，使 `harness-apply` 成为唯一的生成命令，默认采用交互模式。

### 当前状态

| Skill | 功能 | 模式 |
|-------|------|------|
| `harness-apply` | 全量自动生成（AGENTS.md, docs/, scripts/, harness/, rules/） | 非交互 |
| `harness-guide` | 6 步交互引导生成（检测→组件选择→层级映射→质量规则→验证管线→确认生成） | 交互 |
| `harness-generate-rules` | 仅生成 rules/ 目录 | 非交互 |

### 目标状态

合并后 `harness-apply` 提供两种模式：

| 模式 | 触发方式 | 行为 |
|------|----------|------|
| **交互模式（默认）** | `harness-apply` | 合并 harness-guide 的 6 步交互流程，包含 rules 生成 |
| **自动模式** | `harness-apply --auto` | 当前 harness-apply 的行为，使用默认配置一键生成 |

删除 `harness-generate-rules` 和 `harness-guide` 两个独立 skill。

## 架构与技术方案

### 影响的文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `plugins/harness-pilot/plugin.json` | **修改** | 删除 harness-guide 和 harness-generate-rules 的 skill 声明，更新 harness-apply 的 description 和 trigger |
| `plugins/harness-pilot/skills/harness-apply/SKILL.md` | **重写** | 合并三个 skill 的全部逻辑，默认交互模式 |
| `plugins/harness-pilot/skills/harness-guide/SKILL.md` | **删除** | 逻辑已合并到 harness-apply |
| `plugins/harness-pilot/skills/harness-generate-rules/SKILL.md` | **删除** | 逻辑已合并到 harness-apply |
| `plugins/harness-pilot/skills/SKILL.md` | **修改** | 更新根 skill 的模式说明，移除对 harness-guide 和 harness-generate-rules 的引用 |

### 合并后的 harness-apply SKILL.md 结构

```
# Harness Apply

## Overview
- 默认交互模式（6步引导）
- 支持 --auto 标志切换自动模式

## 模式选择逻辑
- 用户说 "harness-apply" / "apply" → 交互模式
- 用户说 "harness-apply --auto" / "auto" → 自动模式

## 共享逻辑（两种模式复用）
- 语言检测 (detect_language)
- 框架检测 (detect_framework)
- 目录结构检测 (detect_structure)
- 模板引擎集成
- 模板解析优先级: framework > language > base

## 交互模式（默认）
- Step 1: 项目检测（检测并确认）
- Step 2: 组件选择（选择要生成的组件）
- Step 3: 层级映射配置
- Step 4: 质量规则选择
- Step 5: 验证管线配置
- Step 6: 确认并生成（含 rules 生成）

## 自动模式
- 自动检测 → 默认配置 → 全量生成
- 包含 rules 生成（safety, git-workflow, language-specific）

## 生成步骤（共享）
- 创建目录结构
- 渲染 AGENTS.md, docs/, scripts/
- 渲染 rules/（从 harness-generate-rules 合并来的逻辑）
- 创建 harness/ 占位文件
- 设置脚本可执行权限

## 成功输出
## 错误处理
```

### 详细实现

#### 1. plugin.json 修改

删除 `harness-guide` 和 `harness-generate-rules` 的 skill 条目，更新 `harness-apply`：

```json
{
  "name": "harness-apply",
  "description": "Generate harness infrastructure with interactive guided mode (default) or auto mode",
  "trigger": ["harness-apply", "apply-harness", "harness-auto", "harness-guide", "guide", "harness-build", "harness-generate-rules", "generate-rules", "harness-rules"]
}
```

将被删除 skill 的 trigger 关键词合并到 harness-apply，保证向后兼容。

#### 2. harness-apply SKILL.md 重写

完整合并 harness-guide 的 6 步交互流程 + harness-generate-rules 的 rules 生成逻辑 + 原 harness-apply 的自动模式。

关键设计：
- **模式选择**：默认交互模式，用户明确说 `--auto` 或 "auto mode" 时切换自动模式
- **交互模式**：完整复用 harness-guide 的 Step 1-6 流程，Step 6 生成时包含 rules 生成
- **自动模式**：完整复用当前 harness-apply 的自动检测+默认配置+全量生成逻辑，包含 rules 生成
- **rules 生成**：两种模式都包含 rules 生成（safety, git-workflow, language-specific development），无需单独调用

#### 3. 根 SKILL.md 修改

更新模式列表：
- 移除 harness-guide 和 harness-generate-rules 的独立条目
- harness-apply 描述更新为包含两种模式
- 移除对已删除子 skill 的引用

```markdown
1. **harness-analyze** - Analyze project only (no changes)
2. **harness-apply** - Generate harness infrastructure (interactive by default, --auto for auto mode)
```

## 边界条件与异常处理

1. **向后兼容**：用户使用旧的 trigger 关键词（如 "harness-guide", "generate-rules"）仍可正常触发 harness-apply
2. **模式切换**：交互模式中任意步骤用户可选择 "use defaults" 跳过自定义，等价于该步骤使用自动模式默认值
3. **仅生成 rules**：用户说 "generate rules" 或 "harness-rules" 时触发 harness-apply，交互模式下 Step 2 组件选择中用户可以只勾选 rules 组件

## 预期结果

- `harness-generate-rules` 和 `harness-guide` skill 目录被删除
- `harness-apply` 成为唯一的生成入口，默认交互模式
- 所有原有功能完整保留，用户体验更简洁统一
- plugin.json 只保留 `harness-analyze` 和 `harness-apply` 两个 skill
