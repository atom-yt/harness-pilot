# harness-pilot 插件发布 - 完成总结

## 完成内容

将 `harness-creator` 本地插件改造为 Claude Code 自建市场标准格式，重命名为 `harness-pilot`，支持其他业务通过 marketplace 安装使用。

## 变更概览

### 新建文件
- `.claude-plugin/marketplace.json` - Claude Code 市场清单，注册 harness-pilot 插件
- `plugins/harness-pilot/plugin.json` - 插件 manifest（name: harness-pilot）
- `plugins/harness-pilot/skills/` - 5 个 SKILL.md（主入口 + 4 个子 skill）
- `plugins/harness-pilot/scripts/template-engine.js` - 模板引擎
- `plugins/harness-pilot/templates/` - 全部模板文件
- `plugins/harness-pilot/tests/` - 测试文件

### 修改文件（全局 harness-creator → harness-pilot 替换）
- `README.md` - 新增 Installation 章节（marketplace add + install 命令）
- `API.md` - 更新安装说明和路径引用
- `CONTRIBUTING.md` - 更新项目结构树和模板引擎路径
- `FAQ.md` - 更新安装说明和路径引用
- `test.js` - 更新 import 路径
- `test-projects/harness-test-nextjs/package.json` - 更新描述
- `test-projects/harness-test-python/pyproject.toml` - 更新描述

### 删除文件
- `.claude/plugins/harness-creator/` - 整个旧插件目录

## 其他业务使用方式

仓库推送到 GitHub 后，其他人可通过以下方式安装：

```bash
# 添加市场
/plugin marketplace add github:<owner>/harness-pilot

# 安装插件
/plugin install harness-pilot
```

## 统计
- 涉及文件：14 个（新建 + 修改 + 删除）
- 全局替换：64 处 `harness-creator` → `harness-pilot` / `plugins/harness-pilot/`
- 保留引用：5 处 `design-harness-creator.md`（实际文件名，非插件引用）
