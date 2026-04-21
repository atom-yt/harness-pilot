# 更新项目文档

## 背景

项目经过多次重构（合并技能、移动目录到 `.harness/`、删除 `harness-improve`），文档未同步更新，存在大量过时引用。

## 需要修改的文件和内容

### 1. README.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/README.md`

**修改内容**:
- Documentation 部分补充 API.md、CONTRIBUTING.md、FAQ.md 链接

```markdown
## Documentation

- [API Documentation](docs/API.md) - Full API reference
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute
- [Harness Report](docs/harness-report.md) - A reader-friendly introduction
- [Design Document](docs/design-harness-creator.md) - Technical design details
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [Optimization Plan](docs/OPTIMIZATION_PLAN.md) - Optimization roadmap
```

### 2. docs/API.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/API.md`

**修改内容**:
- 移除 Configuration 部分对不存在的 `plugin.json` 的引用（项目中不存在此文件）
- Supported Languages 表中移除 `Rust | Planned | N/A`（无实际模板支持）

### 3. docs/CONTRIBUTING.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/CONTRIBUTING.md`

**修改内容**:
- Project Structure 部分补充 `agents/`、`hooks/`、`tests/` 目录
- 移除对 `plugin.json` 的引用

更新后的结构：
```
harness-pilot/
├── plugins/
│   └── harness-pilot/
│       ├── agents/                  # AI agent definitions
│       │   ├── code-reviewer.md
│       │   ├── harness-guardian.md
│       │   └── planner.md
│       ├── hooks/                   # Session hooks
│       │   ├── hooks.json
│       │   └── session-start
│       ├── scripts/
│       │   └── template-engine.js
│       ├── skills/
│       │   ├── harness-analyze/
│       │   └── harness-apply/
│       ├── templates/
│       │   ├── base/
│       │   ├── languages/
│       │   ├── frameworks/
│       │   └── rules/
│       └── tests/
│           └── template-engine.test.js
├── test-projects/
├── docs/
│   ├── API.md
│   ├── CONTRIBUTING.md
│   ├── design-harness-creator.md
│   ├── FAQ.md
│   ├── harness-report.md
│   └── OPTIMIZATION_PLAN.md
├── README.md
```

### 4. docs/FAQ.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/FAQ.md`

**修改内容**:
- "Which mode should I use?" 表格：移除 `harness-guide` 和 `harness-generate-rules`，更新为当前的两个技能 `harness-analyze` 和 `harness-apply`（含交互模式和自动模式）
- "How do I update my harness?" 部分：将 `harness-guide` 引用改为 `harness-apply`
- "Can I use Harness Pilot on existing projects?" 部分：同上

### 5. docs/OPTIMIZATION_PLAN.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/OPTIMIZATION_PLAN.md`

**修改内容**:
- "已实现功能" 表格：`harness-guide` 和 `harness-apply` 合并为 `harness-apply (interactive/auto)`；移除 `harness-generate-rules`（已合并）

### 6. docs/design-harness-creator.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/design-harness-creator.md`

**修改内容**:
- "生成的文件结构" 部分（约 line 359-378）：将 `scripts/` 和 `harness/` 更新为 `.harness/scripts/` 和 `.harness/` 下的子目录
- "文件说明" 表格（约 line 380-391）：更新路径前缀为 `.harness/`

### 7. docs/harness-report.md

**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/harness-report.md`

**修改内容**:
- "文件结构长什么样？" 部分（约 line 296-313）：将 `scripts/` 和 `harness/` 更新为 `.harness/` 下的结构

## 不修改的文件

- **test-projects/**: 保留，作为手动测试验证目标，在 CONTRIBUTING.md 中被引用
- **SKILL.md 文件**: 已在之前的提交中更新
- **agents/harness-guardian.md**: 已是最新状态

## 预期结果

所有文档与当前项目实际结构保持一致：
- 技能名统一为 `harness-analyze` 和 `harness-apply`
- 生成目录统一为 `.harness/` 前缀
- 项目结构描述包含所有实际存在的目录
- 移除对不存在文件（plugin.json）的引用
