# Harness Pilot 优化计划

> 项目优化路线图与实施计划

---

## 当前状态分析

### 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| harness-analyze | ✅ | Dryrun 分析模式，健康评分 |
| harness-guide | ✅ | 6步交互式引导构建 |
| harness-apply | ✅ | 自动生成模式 |
| harness-generate-rules | ✅ | AI 规则生成 |
| TypeScript 模板 | ✅ | 完整的 lint 脚本 |
| Python/Go 规则 | ✅ | development.md 模板 |

### 已知缺口

| 缺口 | 优先级 | 影响范围 |
|------|--------|----------|
| ~~JavaScript 规则目录为空~~ | ~~🔴 高~~ | ✅ 已完成 |
| ~~Python/Go 无 lint 脚本~~ | ~~🔴 高~~ | ✅ 已完成 |
| ~~框架模板仅 Next.js~~ | ~~🟡 中~~ | ✅ 已完成（React, Express, Django, FastAPI, Gin） |
| ~~无模板引擎实现~~ | ~~🔴 高~~ | ✅ 已完成 |
| 无增量更新支持 | 🟡 中 | 无法更新现有 harness |
| 无配置文件 | 🟡 中 | 自定义图层映射困难 |

---

## 优化计划 (Phase 1 - Phase 4)

### Phase 1: 补全现有语言支持 (高优先级)

#### 1.1 JavaScript 规则模板
- [x] 创建 `templates/rules/javascript/development.md.template`
- [x] 覆盖：命名规范、模块化、异步模式、测试、安全、性能
- [x] 参考 TypeScript 规则，移除类型相关内容

#### 1.2 Python Lint 脚本
- [x] `templates/languages/python/lint-deps.py.template`
  - 5 层依赖模型
  - import 语句解析
  - 循环依赖检测
- [x] `templates/languages/python/lint-quality.py.template`
  - no print() / logging 规则
  - 文件行数限制
  - PEP8 风格检查
- [x] `templates/languages/python/validate.py.template`
  - 统一验证流水线

#### 1.3 Go Lint 脚本
- [x] `templates/languages/go/lint-deps.go.template`
  - Go module 解析
  - 依赖包分析
- [x] `templates/languages/go/lint-quality.go.template`
  - golint 集成
  - 复杂度检查
- [x] `templates/languages/go/validate.go.template`
  - build → test → lint 流水线

**交付物**: 7 个新模板文件

---

### Phase 2: 扩展框架支持 (中优先级)

#### 2.1 React 框架
- [x] `templates/frameworks/react/ARCHITECTURE.md.template`
- [x] 图层映射: 0:types, 1:utils, 2:hooks/contexts, 3:components/services, 4:pages/app

#### 2.2 Express.js 框架
- [x] `templates/frameworks/express/ARCHITECTURE.md.template`
- [x] 图层映射: 0:types, 1:utils, 2:services, 3:routes, 4:server.js

#### 2.3 Python 框架
- [x] `templates/frameworks/django/ARCHITECTURE.md.template`
  - 图层: models → utils → services → views → urls/admin
- [x] `templates/frameworks/fastapi/ARCHITECTURE.md.template`
  - 图层: types/models → utils → services → api → main.py

#### 2.4 Go 框架
- [x] `templates/frameworks/gin/ARCHITECTURE.md.template`
  - 图层: types → utils → services → handlers → main.go

#### 2.5 E2E 验证脚本
- [ ] `templates/base/verify.test.template`
  - 基础验证脚本模板
- [ ] 框架特定验证脚本

**交付物**: 6+ 个新框架模板

---

### Phase 3: 模板引擎实现 (高优先级)

当前 SKILL 文件中包含 `{{VARIABLE}}` 占位符，但无实际渲染逻辑。

#### 3.1 基础模板引擎
- [x] 创建 `scripts/template-engine.js`
  - 简单变量替换: `{{VAR}}`
  - 条件渲染: `{{#if VAR}}...{{/if}}`
  - 循环渲染: `{{#each ITEMS}}...{{/each}}`

#### 3.2 上下文构建
- [ ] 项目检测逻辑提取
- [ ] 配置文件读取 (harness.config.json)
- [ ] 默认值注入

#### 3.3 集成到 SKILL
- [ ] 修改 SKILL 文件，调用模板引擎
- [ ] 替换硬编码模板内容

**交付物**: 可工作的模板引擎 + 集成

---

### Phase 4: 高级功能 (中优先级)

#### 4.1 配置文件支持
- [ ] `harness.config.json` 格式设计
  ```json
  {
    "language": "typescript",
    "framework": "nextjs",
    "layers": {
      "0": ["types"],
      "1": ["utils"],
      "2": ["lib"],
      "3": ["components"],
      "4": ["app"]
    },
    "qualityRules": {
      "noConsoleLog": true,
      "maxFileSize": 500
    }
  }
  ```
- [ ] 配置文件生成
- [ ] 配置文件读取和验证

#### 4.2 增量更新
- [ ] 检测现有 harness 文件
- [ ] 对比差异
- [ ] 智能合并策略

#### 4.3 Harness 导出/导入
- [ ] `harness-export` 技能
- [ ] `harness-import` 技能
- [ ] 跨项目 harness 共享

#### 4.4 集成现有 scripts
- [ ] 检测 package.json scripts
- [ ] 自动添加 `npm run lint-arch` 等
- [ ] 提供集成选项

#### 4.5 CLI 参数解析
- [ ] 支持命令行参数覆盖配置
- [ ] `--dry-run` 仅显示将要生成的文件
- [ ] `--force` 强制覆盖
- [ ] `--minimal` 最小化生成

---

### Phase 5: 质量保证 (中优先级)

#### 5.1 测试套件
- [x] 单元测试 (模板引擎)
- [ ] 集成测试 (完整流程)
- [ ] E2E 测试 (实际项目上运行)

#### 5.2 示例项目
- [x] 创建测试项目 harness-test-nextjs
- [x] 创建测试项目 harness-test-python
- [ ] 验证各模式功能

#### 5.3 文档完善
- [x] API 文档
- [x] 贡献指南
- [x] 常见问题 FAQ

#### 5.4 CI/CD 集成
- [ ] GitHub Actions 模板
- [ ] 预提交钩子
- [ ] 自动化测试

---

## 实施优先级

| Phase | 预计工作量 | 优先级 | 依赖 |
|-------|------------|--------|------|
| Phase 1: 补全语言支持 | 2-3 天 | 🔴 P0 | 无 |
| Phase 2: 扩展框架支持 | 2-3 天 | 🟡 P1 | Phase 1 |
| Phase 3: 模板引擎 | 3-4 天 | 🔴 P0 | Phase 1 |
| Phase 4: 高级功能 | 4-5 天 | 🟡 P1 | Phase 3 |
| Phase 5: 质量保证 | 3-4 天 | 🟢 P2 | Phase 1-4 |

---

## 技术决策点

### 模板引擎选择
| 方案 | 优点 | 缺点 | 建议 |
|------|------|------|------|
| Handlebars | 成熟生态 | 依赖重，启动慢 | ❌ |
| simple-template | 轻量，Node 原生 | 功能有限 | ✅ |
| 内联实现 | 零依赖 | 需自己维护 | ✅ |

**建议**: 实现一个轻量级内联模板引擎，仅支持必需功能。

### 配置文件格式
| 方案 | 优点 | 缺点 | 建议 |
|------|------|------|------|
| JSON | 通用，易解析 | 无注释 | ✅ |
| YAML | 可读性好 | 依赖解析库 | ❌ |
| TOML | 简洁 | 生态小 | ❌ |

**建议**: 使用 JSON，未来可扩展支持 TOML。

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 模板引擎复杂度过高 | 延期 | 保持最小功能集 |
| 框架差异大，模板难复用 | 维护成本 | 框架特定模板与通用模板分离 |
| 用户自定义需求复杂 | 用户不满意 | 提供配置文件支持 |

---

## 成功指标

- [ ] 所有支持语言有完整的 lint 脚本
- [ ] 模板引擎能正确渲染所有变量
- [ ] 增量更新不破坏现有文件
- [ ] 测试覆盖率达到 80%+
- [ ] 在 3+ 实际项目上验证成功

---

## 下一步行动

1. **立即开始 Phase 1** - 补全 JavaScript/Python/Go 支持
2. **并行开始 Phase 3** - 模板引擎基础实现
3. **完成后扩展** - Phase 2+4 高级功能

---

*最后更新: 2026-04-21*