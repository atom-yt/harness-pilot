# Summary: move-rules-scripts-under-harness

## 完成内容

将 harness-apply 生成的 `scripts/`、`rules/`、`harness/` 三个根目录级产物统一收纳到 `.harness/` 隐藏目录下。

### 变更前
```
PROJECT_ROOT/
  AGENTS.md, docs/, scripts/, rules/, harness/
```

### 变更后
```
PROJECT_ROOT/
  AGENTS.md, docs/, .harness/
    ├── scripts/   (lint-deps, lint-quality, validate, verify-action)
    ├── rules/     (common/, {language}/)
    ├── memory/    (episodic, procedural, failures)
    ├── tasks/
    └── trace/     (failures/)
```

## 修改文件（25 个）

| 类别 | 文件数 | 说明 |
|------|--------|------|
| SKILL.md | 3 | harness-apply, harness-analyze, harness-improve |
| Base 模板 | 2 | AGENTS.md.template, exec-plan.md.template |
| 语言模板 | 10 | TypeScript(4), Python(4), Go(2) |
| Session hook | 1 | session-start |
| Agents | 2 | harness-guardian.md, planner.md |
| 文档 | 5 | README.md, API.md, FAQ.md, design-harness-creator.md, harness-report.md |
| Spec 文件 | 2 | doc.md, tasks.md |

## 验证

- 模板引擎测试: 12/12 通过
- 全局搜索: 无遗漏旧路径
- Commit: `9d307f3` (已推送至 origin/main)
