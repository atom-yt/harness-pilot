# move-rules-scripts-under-harness

## 需求背景

harness-apply 在目标项目根目录生成的结构中，`rules/`、`scripts/`、`harness/` 直接放在项目根目录下，污染了项目根目录。应将它们统一收纳到 `.harness/` 隐藏目录下（类似 `.git`、`.vscode` 的惯例），使所有 harness 基础设施聚合在一处。

### 当前生成结构
```
PROJECT_ROOT/
  AGENTS.md
  docs/
  scripts/           ← 根目录
  rules/             ← 根目录
  harness/           ← 根目录
    memory/
    tasks/
    trace/
```

### 目标生成结构
```
PROJECT_ROOT/
  AGENTS.md
  docs/
  .harness/          ← 统一隐藏目录
    scripts/
    rules/
    memory/
    tasks/
    trace/
```

## 修改范围

三组路径变更：
- `scripts/xxx` → `.harness/scripts/xxx`
- `rules/xxx` → `.harness/rules/xxx`
- `harness/xxx` → `.harness/xxx`（memory, tasks, trace）

涉及文件（共约 20 个）：

### 1. harness-apply/SKILL.md（主要修改）
- **路径**: `plugins/harness-pilot/skills/harness-apply/SKILL.md`
- **修改类型**: 批量替换输出路径
- **关键位置**:
  - mkdir 命令: `mkdir -p scripts/verify` → `mkdir -p .harness/scripts/verify`，`mkdir -p rules/common` → `mkdir -p .harness/rules/common`，`mkdir -p harness/memory/...` → `mkdir -p .harness/memory/...`
  - 模板引擎输出: `> scripts/xxx` → `> .harness/scripts/xxx`
  - 规则文件输出: `> rules/xxx` → `> .harness/rules/xxx`
  - chmod 命令: 同步更新路径
  - echo 进度输出: 同步更新路径
  - 组件表格: 更新路径显示
  - 交互式选择 UI: 更新路径显示
  - 规则说明: 更新路径
  - 成功输出示例: 更新路径
  - 命令示例: 更新脚本路径
  - 文本描述: 更新路径引用
  - harness/ placeholder READMEs: `> harness/memory/README.md` → `> .harness/memory/README.md` 等

### 2. harness-analyze/SKILL.md
- **路径**: `plugins/harness-pilot/skills/harness-analyze/SKILL.md`
- **修改**: `scripts/lint-deps.*` → `.harness/scripts/lint-deps.*`，`scripts/lint-quality.*` → `.harness/scripts/lint-quality.*`

### 3. harness-improve/SKILL.md
- **路径**: `plugins/harness-pilot/skills/harness-improve/SKILL.md`
- **修改**: `scripts/lint-deps.*` → `.harness/scripts/lint-deps.*`

### 4. 模板文件 - AGENTS.md.template
- **路径**: `plugins/harness-pilot/templates/base/AGENTS.md.template`
- **修改**: 脚本调用路径 `scripts/xxx` → `.harness/scripts/xxx`

### 5. 模板文件 - exec-plan.md.template
- **路径**: `plugins/harness-pilot/templates/base/exec-plan.md.template`
- **修改**: `scripts/verify-action` → `.harness/scripts/verify-action`

### 6. TypeScript 模板文件（4 个）
- `templates/languages/typescript/lint-deps.ts.template` - Usage 注释
- `templates/languages/typescript/lint-quality.ts.template` - Usage 注释
- `templates/languages/typescript/validate.ts.template` - 命令路径
- `templates/languages/typescript/verify-action.ts.template` - Usage/命令

### 7. Python 模板文件（4 个）
- `templates/languages/python/lint-deps.py.template` - Usage 注释
- `templates/languages/python/lint-quality.py.template` - Usage 注释
- `templates/languages/python/validate.py.template` - Usage/命令路径
- `templates/languages/python/verify-action.py.template` - Usage/命令

### 8. Go 模板文件（2 个）
- `templates/languages/go/validate.go.template` - 命令路径
- `templates/languages/go/verify-action.go.template` - 命令路径引用

### 9. 文档文件
- `README.md` - 目录结构说明（如有引用）
- `docs/API.md` - 输出结构说明（如有引用）

### 10. Session hook
- `plugins/harness-pilot/hooks/session-start` - 如有检测 `harness/` 目录的逻辑需更新为 `.harness/`

## 实现细节

核心操作是全局替换三组路径：

1. **scripts/ 输出路径**: `scripts/` → `.harness/scripts/`
   - 注意：不修改 `plugins/harness-pilot/scripts/template-engine.js` 等插件自身的脚本路径
2. **rules/ 输出路径**: `rules/` → `.harness/rules/`
   - 注意：不修改 `plugins/harness-pilot/templates/rules/` 等模板源路径
3. **harness/ 输出路径**: `harness/` → `.harness/`
   - 注意：不修改 `plugins/harness-pilot/` 等插件自身路径，不修改 harness-pilot 名称中的 harness

### 区分规则

需要替换的模式（目标项目输出路径）：
- `> scripts/` → `> .harness/scripts/`
- `> rules/` → `> .harness/rules/`
- `mkdir -p scripts/` → `mkdir -p .harness/scripts/`
- `mkdir -p rules/` → `mkdir -p .harness/rules/`
- `mkdir -p harness/` → `mkdir -p .harness/`
- `chmod +x scripts/` → `chmod +x .harness/scripts/`
- `scripts/lint-deps` → `.harness/scripts/lint-deps`
- `scripts/lint-quality` → `.harness/scripts/lint-quality`
- `scripts/validate` → `.harness/scripts/validate`
- `scripts/verify-action` → `.harness/scripts/verify-action`
- `scripts/verify/` → `.harness/scripts/verify/`
- `rules/common/` → `.harness/rules/common/`
- `rules/$LANGUAGE/` → `.harness/rules/$LANGUAGE/`
- `rules/{{LANGUAGE}}` → `.harness/rules/{{LANGUAGE}}`
- `harness/memory/` → `.harness/memory/`
- `harness/tasks/` → `.harness/tasks/`
- `harness/trace/` → `.harness/trace/`

**不替换**的模式（插件自身路径）：
- `plugins/harness-pilot/scripts/template-engine.js`（插件工具）
- `plugins/harness-pilot/templates/rules/`（模板源文件）
- `harness-pilot`（插件名称）
- `plugins/harness-pilot/`（插件目录）

## 边界条件

- AGENTS.md.template 中有条件块，替换后需保持 `{{#if}}` 结构完整
- 模板文件中的 Usage 注释需同步更新
- harness-apply SKILL.md 中的 ASCII art UI 框需注意对齐
- session-start hook 中检测 harness 基础设施的逻辑需更新

## 预期结果

- harness-apply 生成的目录结构更清晰，只有 `AGENTS.md`、`docs/`、`.harness/` 三个产物
- `.harness/` 作为隐藏目录不干扰项目根目录
- 所有脚本调用路径、文档路径、模板路径保持一致
- 测试仍然通过（模板引擎测试不涉及路径，不受影响）
