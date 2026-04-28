# 任务计划 — AGENTS.md 自动生成和增量更新

## 任务分解

### Task 1: 实现 generateIncremental 函数
- [ ] 1.1: 在 `generate.js` 中添加 `generateIncremental(options)` 函数定义
- [ ] 1.2: 检查 manifest.json 是否存在（使用 `getManifestPath`）
- [ ] 1.3: 如果存在：
  - [ ] 1.3.1: 读取 manifest 获取 language 和 framework
  - [ ] 1.3.2: 构建模板 context（PROJECT_NAME, LANGUAGE, FRAMEWORK, GENERATED_DATE）
  - [ ] 1.3.3: 使用 TemplateEngine 渲染 AGENTS.md 模板
  - [ ] 1.3.4: 写入 AGENTS.md 文件
  - [ ] 1.3.5: 更新 manifest.lastApplied 时间戳
- [ ] 1.4: 如果不存在：返回 `{ success: true, requiresConfirmation: true }`

### Task 2: 修改 generate.js CLI 入口
- [ ] 2.1: 在第 278-284 行的 type 处理中添加 `incremental` 分支
- [ ] 2.2: 导出 `generateIncremental` 函数（添加到 export 列表）

### Task 3: 更新 SKILL.md Reentry Mode 工作流
- [ ] 3.1: 在 Reentry Mode Workflow 的步骤 2 添加 AGENTS.md 更新说明
- [ ] 3.2: 添加 `requiresConfirmation` 的处理逻辑说明

### Task 4: 测试与验证
- [ ] 4.1: 测试 Initial Mode 生成 AGENTS.md（现有功能，确认未被破坏）
- [ ] 4.2: 测试 Reentry Mode（有 manifest）更新 AGENTS.md
- [ ] 4.3: 测试 Reentry Mode（无 manifest）返回 requiresConfirmation
- [ ] 4.4: 验证 template-engine.test.js 仍通过

### Task 5: 文档更新
- [ ] 5.1: 生成 summary.md

## 依赖关系

```
Task 1 (实现函数) → Task 2 (修改入口) → Task 4 (测试) → Task 5 (文档)
                                        ↑
Task 3 (SKILL.md) ──────────────────────┘
```

## 预估工作量

| 任务 | 预估时间 |
|------|----------|
| Task 1 | 30 分钟 |
| Task 2 | 10 分钟 |
| Task 3 | 15 分钟 |
| Task 4 | 30 分钟 |
| Task 5 | 10 分钟 |
| **总计** | **1.5 小时** |

---
*Tasks generated from doc.md on 2026-04-28*