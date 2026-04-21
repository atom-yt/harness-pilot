# harness-pilot 插件发布

## 需求场景

将当前 `.claude/plugins/harness-creator/` 下的本地插件改造为 Codex 标准插件格式，重命名为 `harness-pilot`，使其可以通过 marketplace 被其他业务项目安装和使用。

## 现状分析

当前插件结构：
```
.claude/plugins/harness-creator/
├── plugin.json              # 旧格式，缺少 interface/标准字段
├── SKILL.md                 # 主入口 skill
├── scripts/
│   └── template-engine.js
├── skills/
│   ├── harness-analyze/SKILL.md
│   ├── harness-apply/SKILL.md
│   ├── harness-generate-rules/SKILL.md
│   └── harness-guide/SKILL.md
├── templates/               # 模板文件
└── tests/
```

**问题：**
- `plugin.json` 不在 `.codex-plugin/` 目录下，不符合 Codex 标准
- `plugin.json` 内容缺少 `interface` 展示信息、`author` 详情、`skills` 路径引用等标准字段
- 没有 `marketplace.json` 注册，其他项目无法发现和安装
- 插件名需从 `harness-creator` 更名为 `harness-pilot`

## 技术方案

### 1. 改造仓库为自建市场结构（推荐）

将本仓库整体改造为 Claude Code 自建市场格式，这样其他人可直接通过 `/plugin marketplace add` 命令安装。

**目标仓库结构：**
```
harness-pilot/                         # 仓库根目录
├── .claude-plugin/
│   └── marketplace.json               # 市场清单（Claude Code 标准）
├── plugins/
│   └── harness-pilot/                 # 插件目录
│       ├── plugin.json                # 插件 manifest
│       ├── skills/
│       │   ├── SKILL.md               # 主 skill（从上层移入）
│       │   ├── harness-analyze/SKILL.md
│       │   ├── harness-apply/SKILL.md
│       │   ├── harness-generate-rules/SKILL.md
│       │   └── harness-guide/SKILL.md
│       ├── scripts/
│       │   └── template-engine.js
│       ├── templates/                 # 保持不变
│       └── tests/
├── README.md
└── ... (其他文档)
```

### 2. 创建 marketplace.json

在 `.claude-plugin/marketplace.json` 创建市场清单：

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "Harness Pilot Marketplace",
  "version": "1.0.0",
  "description": "AI Agent harness infrastructure tools for any codebase",
  "owner": {
    "name": "harness-pilot",
    "email": ""
  },
  "plugins": [
    {
      "name": "harness-pilot",
      "version": "0.1.0",
      "description": "Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes",
      "source": "./plugins/harness-pilot",
      "author": { "name": "harness-pilot" },
      "keywords": ["harness", "project-structure", "lint", "architecture", "validation", "ai-agent"]
    }
  ]
}
```

### 3. 创建插件 plugin.json

`plugins/harness-pilot/plugin.json`，保留原有的 skills/templates/frameworks 定义，将 `name` 改为 `harness-pilot`：

```json
{
  "name": "harness-pilot",
  "version": "0.1.0",
  "description": "Transform any project into a harness-compatible form with dry-run analysis, guided build, and auto-generation modes",
  "author": "harness-pilot",
  "keywords": ["harness", "project-structure", "lint", "architecture", "validation"],
  "skills": [
    {
      "name": "harness-analyze",
      "description": "Analyze project structure and generate health report without making changes",
      "trigger": ["analyze", "harness-analyze", "project-analysis"]
    },
    {
      "name": "harness-guide",
      "description": "Interactive guided build mode with step-by-step configuration",
      "trigger": ["harness-guide", "guide", "harness-build"]
    },
    {
      "name": "harness-apply",
      "description": "Auto-generate complete harness infrastructure with default settings",
      "trigger": ["harness-apply", "apply-harness", "harness-auto"]
    },
    {
      "name": "harness-generate-rules",
      "description": "Generate AI rules for safety, git workflow, and language-specific development guidelines",
      "trigger": ["harness-generate-rules", "generate-rules", "harness-rules"]
    }
  ],
  "supportedLanguages": ["typescript", "javascript", "python", "go", "rust"],
  "supportedFrameworks": ["nextjs", "react", "express", "django", "fastapi", "flask", "gin"],
  "templates": { ... }
}
```

### 4. 更新 SKILL.md 中的插件引用名

所有 SKILL.md 中对 `harness-creator` 的引用需更新为 `harness-pilot`，包括：
- 主 SKILL.md 中的 `harness-creator:harness-analyze` 等调用 → `harness-pilot:harness-analyze`
- 各子 skill 的 name 前缀引用

### 5. 更新 README.md

README.md 需要更新以下内容：

1. Quick Start 中的命令前缀从 `harness-creator` 改为 `harness-pilot`
2. 新增「Installation」章节，说明其他项目如何安装使用：

```markdown
## Installation

### Install from marketplace (Recommended)

Add the Harness Pilot marketplace and install the plugin in Claude Code:

```bash
# Add marketplace
/plugin marketplace add github:<owner>/harness-pilot

# Install plugin
/plugin install harness-pilot
```

### Manual installation

1. Clone this repository:
   ```bash
   git clone <repo-url>
   ```

2. Copy the plugin directory to your project:
   ```bash
   cp -r harness-pilot/plugins/harness-pilot /path/to/your-project/plugins/
   ```

## Usage

Once installed, use the following commands in Claude Code:

```bash
/harness-pilot:harness-analyze         # Analyze project health (no changes)
/harness-pilot:harness-guide           # Interactive guided build
/harness-pilot:harness-apply           # Auto-generate with defaults
/harness-pilot:harness-generate-rules  # Generate AI rules
```
```

### 6. 清理旧结构

删除 `.claude/plugins/harness-creator/` 下的旧文件，避免重复。

## 受影响文件

| 操作 | 文件路径 |
|------|----------|
| 新建 | `plugins/harness-pilot/.codex-plugin/plugin.json` |
| 移动+重命名 | `plugins/harness-pilot/skills/` (从 .claude 下移入) |
| 移动+重命名 | `plugins/harness-pilot/scripts/` (从 .claude 下移入) |
| 移动+重命名 | `plugins/harness-pilot/templates/` (从 .claude 下移入) |
| 移动+重命名 | `plugins/harness-pilot/tests/` (从 .claude 下移入) |
| 移动 | `plugins/harness-pilot/skills/SKILL.md` (主 SKILL.md 移入 skills/) |
| 修改 | 所有 SKILL.md 中 `harness-creator` → `harness-pilot` 引用 |
| 新建 | `.agents/plugins/marketplace.json` |
| 修改 | `README.md` 中的插件调用命令更新 |
| 删除 | `.claude/plugins/harness-creator/` (旧目录) |

## 边界条件

- 移动文件后，SKILL.md 中的相对路径引用（如 `../design-harness-creator.md`）需要更新
- 旧目录已有 git 修改（M 状态），迁移前不需要 commit，但迁移后建议 commit
- `templates/` 目录下的模板文件内容不需要修改，只是位置变化
- tests 中的测试文件路径引用可能需要检查
- 插件名全局替换：`harness-creator` → `harness-pilot`

## 预期结果

完成后：
1. 插件以 `harness-pilot` 为名，符合 Codex 标准格式，位于 `plugins/harness-pilot/`
2. marketplace.json 注册完成，其他项目可通过 Codex UI 发现并安装
3. 旧的 `.claude/plugins/harness-creator/` 目录清理完毕
4. 所有 SKILL.md 和 README.md 中的引用已更新为 `harness-pilot`
5. 所有 skill 功能正常，模板引用正确
