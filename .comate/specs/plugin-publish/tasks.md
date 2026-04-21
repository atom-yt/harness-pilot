# harness-pilot 插件发布到自建市场

- [x] Task 1: 创建市场目录结构并迁移插件文件
    - 1.1: 创建 `plugins/harness-pilot/` 目录及子目录（skills/, scripts/, templates/, tests/）
    - 1.2: 将 `.claude/plugins/harness-creator/skills/` 下所有子 skill 复制到 `plugins/harness-pilot/skills/`
    - 1.3: 将 `.claude/plugins/harness-creator/SKILL.md` 复制到 `plugins/harness-pilot/skills/SKILL.md`
    - 1.4: 将 `.claude/plugins/harness-creator/scripts/` 复制到 `plugins/harness-pilot/scripts/`
    - 1.5: 将 `.claude/plugins/harness-creator/templates/` 复制到 `plugins/harness-pilot/templates/`
    - 1.6: 将 `.claude/plugins/harness-creator/tests/` 复制到 `plugins/harness-pilot/tests/`

- [x] Task 2: 创建 marketplace.json
    - 2.1: 创建 `.claude-plugin/` 目录
    - 2.2: 创建 `.claude-plugin/marketplace.json`，包含 schema、name、version、owner、plugins 入口

- [x] Task 3: 创建插件 plugin.json
    - 3.1: 基于旧 plugin.json 创建 `plugins/harness-pilot/plugin.json`，将 name 改为 `harness-pilot`，保留 skills/templates/frameworks 定义

- [x] Task 4: 全局替换插件路径引用（插件内部文件）
    - 4.1: `plugins/harness-pilot/skills/SKILL.md` 中 `harness-creator` → `harness-pilot`
    - 4.2: `plugins/harness-pilot/skills/harness-analyze/SKILL.md` 中 `.claude/plugins/harness-creator/` → `plugins/harness-pilot/`
    - 4.3: `plugins/harness-pilot/skills/harness-apply/SKILL.md` 中 `.claude/plugins/harness-creator/` → `plugins/harness-pilot/`（22 处）
    - 4.4: `plugins/harness-pilot/skills/harness-guide/SKILL.md` 中 `.claude/plugins/harness-creator/` → `plugins/harness-pilot/`
    - 4.5: `plugins/harness-pilot/skills/harness-generate-rules/SKILL.md` 中 `.claude/plugins/harness-creator/` → `plugins/harness-pilot/`
    - 4.6: `plugins/harness-pilot/scripts/template-engine.js` 中 `.claude/plugins/harness-creator/` → `plugins/harness-pilot/`

- [x] Task 5: 更新根目录文档中的引用
    - 5.1: `README.md` 中 `/harness-creator:` → `/harness-pilot:`，新增 Installation 章节
    - 5.2: `API.md` 中 `.claude/plugins/harness-creator` → `plugins/harness-pilot`，`harness-creator` name → `harness-pilot`
    - 5.3: `CONTRIBUTING.md` 中 `harness-creator` 路径和目录树更新
    - 5.4: `FAQ.md` 中 `.claude/plugins/harness-creator` → `plugins/harness-pilot`
    - 5.5: `test.js` 中导入路径更新

- [x] Task 6: 更新测试项目中的引用
    - 6.1: `test-projects/harness-test-nextjs/package.json` 中 `harness-creator` → `harness-pilot`
    - 6.2: `test-projects/harness-test-python/pyproject.toml` 中 `harness-creator` → `harness-pilot`

- [x] Task 7: 删除旧插件目录
    - 7.1: 删除 `.claude/plugins/harness-creator/` 下所有文件和目录
