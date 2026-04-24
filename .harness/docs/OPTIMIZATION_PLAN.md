# Harness-Pilot Plugins 优化设计文档

**版本**: v1.0
**日期**: 2026-04-24
**目标**: 系统化规划 plugins/harness-pilot 功能优化

---

## 1. 优化原则

1. **精简抽象**: 每个 prompt/tool 保持在 200 tokens 以内核心指令
2. **模块解耦**: 每个功能独立，减少相互依赖
3. **增量迭代**: 每个优化点独立可测、可提交
4. **向后兼容**: 不破坏现有功能

---

## 2. 优化项目矩阵

### P0 - 高优先级 (安全性/稳定性)

| ID | 模块 | 问题描述 | 优化方案 | Token 影响 |
|----|------|----------|----------|------------|
| P0-1 | `loop.js` | 命令运行假设 node | 支持多解释器 (node/python3/go/java) | -50 tokens |
| P0-2 | `session-start` | stat 命令兼容性 | 使用 Node.js fs.stat API | -30 tokens |
| P0-3 | `generate-test.sh` | 模板路径硬编码 | 使用 `$CLAUDE_PLUGIN_ROOT` 变量 | -20 tokens |
| P0-4 | `select.js` | 默认值未定义风险 | 添加严格类型检查 | -10 tokens |

---

### P1 - 中优先级 (功能完整性)

| ID | 模块 | 问题描述 | 优化方案 | Token 影响 |
|----|------|----------|----------|------------|
| P1-1 | `template-engine.js` | 无缓存机制 | 实现 LRU 缓存 (LRU_MAX=100) | -100 tokens (复用) |
| P1-2 | `analyze-imports.js` | 正则重复编译 | 预编译正则常量 | -200 tokens |
| P1-3 | `harness-analyze` | 缺乏增量分析 | 记录扫描时间戳 | -150 tokens |
| P1-4 | `lint-imports.ts.template` | findIndex 性能 | 一次性构建行号索引 | -300 tokens |
| P1-5 | `analyze-architecture.js` | 路径硬编码 | 支持环境变量覆盖 | -40 tokens |

---

### P2 - 低优先级 (体验优化)

| ID | 模块 | 问题描述 | 优化方案 | Token 影响 |
|----|------|----------|----------|------------|
| P2-1 | `select.js` | 无真正交互模式 | 实现 inquirer 交互 | +50 tokens |
| P2-2 | `detection-rules.json` | 无版本管理 | 添加 version 字段 | -20 tokens |
| P2-3 | `generate-test.sh` | 覆盖率阈值未使用 | 集成覆盖率报告 | -80 tokens |
| P2-4 | `generate-test.sh` | 分支检测缺失 | 使用 AST 解析 | -200 tokens |
| P2-5 | `template-engine.js` | 缺少转义机制 | 添加 escape 函数 | +30 tokens |
| P2-6 | `harness-analyze` | 评分权重硬编码 | 支持自定义权重 | -50 tokens |
| P2-7 | `harness-analyze` | 无历史对比 | 存储历史评分 | -100 tokens |

---

## 3. Java + Spring 框架支持

### 3.1 语言检测

```json
{
  "languages": {
    "java": {
      "files": ["pom.xml", "build.gradle", "build.gradle.kts"],
      "extensions": [".java"],
      "exclude": ["node_modules", ".git"]
    }
  }
}
```

### 3.2 框架检测

```json
{
  "frameworks": {
    "spring-boot": {
      "language": "java",
      "dependencies": ["spring-boot-starter"],
      "files": ["application.yml"],
      "directories": ["src/main/java"]
    },
    "spring-mvc": {
      "language": "java",
      "dependencies": ["spring-webmvc"]
    }
  }
}
```

### 3.3 新增文件清单

```
plugins/harness-pilot/
├── templates/
│   ├── languages/java/
│   │   ├── development.md.template      # Java 开发规范
│   │   ├── lint-deps.java.template     # 包依赖检查
│   │   ├── lint-quality.java.template  # Checkstyle 集成
│   │   ├── validate.java.template      # 统一验证
│   │   └── verify-action.java.template # 预动作验证
│   ├── frameworks/spring-boot/
│   │   └── ARCHITECTURE.md.template    # Spring 架构文档
│   └── capabilities/
│       ├── jit-test/generate-test.java.template
│       └── code-templates/templates/add-api/spring-java.template
```

---

## 4. 实施计划

### Phase 1: 稳定性修复
- 预计: 1-2 周
- 重点: 修复 P0 问题

### Phase 2: 性能优化
- 预计: 2-3 周
- 重点: 优化 P1 问题

### Phase 3: Java/Spring 支持
- 预计: 3-4 周
- 重点: 实现新功能

### Phase 4: 体验优化
- 预计: 2-3 周
- 重点: 优化 P2 问题

---

## 5. 验证标准

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 上下文 prompt < 200 tokens (核心指令)
- [ ] 无破坏性变更
- [ ] Git commit 通过