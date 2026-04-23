# 方案 1: 工具驱动 + 配置文件设计

> 将提示词减少 85%+，通过工具和配置实现可扩展性

---

## 目标

- **harness-apply/SKILL.md**: 1386 行 → ~200 行 (-85%)
- **可维护性**: 添加新框架/语言只需改配置
- **可测试性**: 工具可以独立测试

---

## 整体架构

```
harness-apply/
├── SKILL.md                    # 精简提示词 (~200 行)
├── config/
│   ├── defaults.json          # 默认配置
│   ├── detection-rules.json   # 检测规则
│   ├── layer-mappings.json    # 层级映射
│   └── quality-rules.json     # 质量规则
├── tools/
│   ├── detect.js              # 项目检测工具
│   ├── select.js              # 交互选择工具
│   ├── generate.js            # 生成工具
│   └── loop.js                # Ralph Wiggum Loop
└── templates/                  # 现有模板目录
```

---

## 提示词结构 (SKILL.md)

### 精简后的结构 (~200 行)

```markdown
---
name: harness-apply
description: Generate and maintain harness infrastructure
---

# Core Protocol

## Mode Detection
- No `.harness/manifest.json` → Initial Mode
- Exists + user asks for "add-*" → Code Gen Mode
- Exists + other intent → Reentry Mode + Loop
- `--init` flag → Force Initial
- `--auto` flag → Non-interactive

## Tool Workflow

### Initial Mode
```
1. CALL detect() → get project info
2. CALL select(components) → user chooses
3. CALL generate(harness) → create .harness/
4. CALL loop() → Ralph Wiggum Loop
```

### Code Gen Mode
```
1. CALL detect() → get context
2. CALL select(template) → user chooses scaffolding
3. CALL generate(code) → scaffold from template
4. CALL loop() → Ralph Wiggum Loop
```

### Reentry Mode
```
1. CALL detect() → get changes since last apply
2. CALL generate(incremental) → update harness
3. CALL loop() → Ralph Wiggum Loop
```

## Ralph Wiggum Loop
```
MAX_ITERATIONS = 3
for iteration in 1..MAX_ITERATIONS:
  review = CALL code-reviewer(changes)
  if review.approved:
    success()
  test = CALL validate(pipeline)
  if test.passed:
    success()
  fix = CALL auto-fix(issues)
  if fix.success:
    continue
  else:
    report(unresolved)
    break
```

## Error Handling
- Tool failure → show error, suggest retry
- Validation failure → record to trace/, suggest fix
- Loop exhausted → output summary, stop

## Output Format
Always output in this structure:
```
=== harness-apply: {mode} ===
{action description}
✓ {files created/modified}
```
```

---

## 工具定义

### 1. detect.js - 项目检测工具

**输入:** 无

**输出:**
```json
{
  "language": "typescript|javascript|python|go|rust",
  "framework": "nextjs|react|express|django|fastapi|gin|none",
  "structure": {
    "sourceDirs": ["types/", "utils/", "components/"],
    "configFiles": ["package.json", "tsconfig.json"]
  },
  "hasHarness": false,
  "lastApply": null
}
```

**职责:**
- 检测项目语言 (配置文件、扩展名)
- 检测框架 (依赖、目录结构)
- 检测目录结构
- 检查 harness 状态

---

### 2. select.js - 交互选择工具

**输入:**
```json
{
  "mode": "components|capabilities|template",
  "context": {...},
  "defaults": {...}
}
```

**输出:**
```json
{
  "selected": ["docs", "lint-deps", "validate"],
  "skipped": []
}
```

**职责:**
- 展示交互选项 (components, capabilities, templates)
- 处理用户选择
- 返回选择结果

**协议:**
- 输出可复制的交互文本给 Agent 展示
- 等待用户确认
- 解析用户选择

---

### 3. generate.js - 生成工具

**输入:**
```json
{
  "type": "harness|code|incremental",
  "components": [...],
  "context": {...},
  "templates": {...}
}
```

**输出:**
```json
{
  "files": [
    {"path": ".harness/docs/ARCHITECTURE.md", "created": true},
    {"path": ".harness/scripts/lint-deps.ts", "created": true}
  ],
  "errors": []
}
```

**职责:**
- 解析模板
- 渲染上下文
- 写入文件
- 更新 manifest.json

---

### 4. loop.js - Ralph Wiggum Loop 工具

**输入:**
```json
{
  "changes": [...],
  "config": {...}
}
```

**输出:**
```json
{
  "iterations": 2,
  "review": {"approved": true, "issues": 0},
  "test": {"passed": true, "failures": 0},
  "verdict": "APPROVED"
}
```

**职责:**
- 调用 code-reviewer
- 执行验证管道
- 自动修复简单问题
- 记录失败到 trace/

---

## 配置文件结构

### config/defaults.json

```json
{
  "qualityRules": {
    "noConsoleLog": true,
    "maxFileSize": 500,
    "typescriptStrictMode": true,
    "noHardcodedStrings": false
  },
  "loop": {
    "maxIterations": 3,
    "autoFixEnabled": true,
    "recordTrace": true
  },
  "capabilities": {
    "jitTest": false,
    "codeTemplates": true,
    "refactoring": false,
    "e2e": false,
    "security": false,
    "monitoring": false
  }
}
```

---

### config/detection-rules.json

```json
{
  "languages": {
    "typescript": {
      "files": ["tsconfig.json", "*.ts", "*.tsx"],
      "packageKey": "typescript"
    },
    "javascript": {
      "files": ["package.json", "*.js", "*.jsx"],
      "exclude": "tsconfig.json"
    },
    "python": {
      "files": ["requirements.txt", "pyproject.toml", "setup.py", "*.py"]
    },
    "go": {
      "files": ["go.mod", "*.go"]
    },
    "rust": {
      "files": ["Cargo.toml", "*.rs"]
    }
  },
  "frameworks": {
    "nextjs": {
      "language": "typescript",
      "files": ["package.json"],
      "dependencies": ["next"],
      "directories": ["app/", "pages/"]
    },
    "react": {
      "language": "typescript",
      "files": ["package.json"],
      "dependencies": ["react"]
    },
    "express": {
      "language": "javascript",
      "files": ["package.json"],
      "dependencies": ["express"]
    },
    "django": {
      "language": "python",
      "files": ["settings.py", "manage.py"]
    },
    "fastapi": {
      "language": "python",
      "files": ["requirements.txt", "pyproject.toml"],
      "dependencies": ["fastapi"]
    },
    "gin": {
      "language": "go",
      "files": ["go.mod"],
      "dependencies": ["gin"]
    }
  }
}
```

---

### config/layer-mappings.json

```json
{
  "nextjs": {
    "0": ["types/"],
    "1": ["utils/"],
    "2": ["lib/"],
    "3": ["components/", "services/"],
    "4": ["app/", "api/"]
  },
  "react": {
    "0": ["types/"],
    "1": ["utils/"],
    "2": ["hooks/", "contexts/"],
    "3": ["components/", "services/"],
    "4": ["pages/", "app/"]
  },
  "express": {
    "0": ["types/"],
    "1": ["utils/"],
    "2": ["services/"],
    "3": ["routes/"],
    "4": ["server.js"]
  },
  "django": {
    "0": ["types/", "models.py"],
    "1": ["utils/", "helpers/"],
    "2": ["services/", "managers/"],
    "3": ["views/", "api/"],
    "4": ["urls.py", "admin.py"]
  },
  "fastapi": {
    "0": ["types/", "models/"],
    "1": ["utils/"],
    "2": ["services/", "managers/"],
    "3": ["api/"],
    "4": ["main.py"]
  },
  "gin": {
    "0": ["types/"],
    "1": ["utils/"],
    "2": ["services/"],
    "3": ["handlers/"],
    "4": ["main.go"]
  }
}
```

---

### config/quality-rules.json

```json
{
  "typescript": {
    "lintDeps": {
      "enabled": true,
      "maxDepth": 3,
      "allowRelativeParents": false,
      "enforceExtensions": true
    },
    "lintQuality": {
      "enabled": true,
      "noConsoleLog": true,
      "maxFileSize": 500,
      "maxFunctionLines": 50
    },
    "lintCircularDeps": {
      "enabled": true
    }
  },
  "python": {
    "lintDeps": {
      "enabled": true,
      "maxDepth": 3
    },
    "lintQuality": {
      "enabled": true,
      "noPrint": true,
      "maxFileSize": 500
    }
  },
  "go": {
    "lintDeps": {
      "enabled": true
    },
    "lintQuality": {
      "enabled": true,
      "golint": true,
      "maxFunctionLines": 50
    }
  }
}
```

---

## 实施计划

### Phase 1: 配置文件 (1 天)
- [ ] 创建 config/ 目录
- [ ] 创建 defaults.json
- [ ] 创建 detection-rules.json
- [ ] 创建 layer-mappings.json
- [ ] 创建 quality-rules.json

### Phase 2: 检测工具 (1 天)
- [ ] 实现 tools/detect.js
- [ ] 实现 language detection
- [ ] 实现 framework detection
- [ ] 实现 directory detection
- [ ] 实现 harness status detection

### Phase 3: 交互工具 (1 天)
- [ ] 实现 tools/select.js
- [ ] 实现 components selection
- [ ] 实现 capabilities selection
- [ ] 实现 template selection

### Phase 4: 生成工具 (2 天)
- [ ] 实现 tools/generate.js
- [ ] 集成 template engine
- [ ] 实现文件写入逻辑
- [ ] 实现 manifest.json 更新

### Phase 5: Loop 工具 (1 天)
- [ ] 实现 tools/loop.js
- [ ] 集成 code-reviewer
- [ ] 实现验证管道
- [ ] 实现自动修复逻辑

### Phase 6: 提示词重构 (1 天)
- [ ] 重写 SKILL.md (目标 ~200 行)
- [ ] 验证工具调用协议
- [ ] 测试所有模式

---

## 成功指标

- [ ] SKILL.md 从 1386 行减少到 ~200 行
- [ ] 所有功能通过工具实现
- [ ] 添加新框架只需修改配置
- [ ] 工具可以独立测试
- [ ] 向后兼容现有 harness

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 工具过多增加复杂度 | 工具职责清晰，接口简单 |
| 配置迁移成本 | 保持旧配置兼容 |
| 工具失败无回退 | 实现工具级错误处理 |
| 提示词过度精简 | 保留核心逻辑描述 |