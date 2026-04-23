# Harness Simplify - 精简到 2 Skill 并聚焦质量闭环

- [x] Task 1: 删除被移除的 skill 和 agent 文件
    - 1.1: 删除 `plugins/harness-pilot/skills/harness-spec/SKILL.md`（Superpowers 替代）
    - 1.2: 删除 `plugins/harness-pilot/skills/harness-review/SKILL.md`（合并到 apply Loop）
    - 1.3: 删除 `plugins/harness-pilot/skills/harness-evolve/SKILL.md`（合并到 apply Loop）
    - 1.4: 删除 `plugins/harness-pilot/agents/planner.md`（Superpowers planning 替代）
    - 1.5: 删除 `plugins/harness-pilot/agents/harness-guardian.md`（合并到 code-reviewer）

- [x] Task 2: 删除被移除的模板文件
    - 2.1: 删除 `plugins/harness-pilot/templates/base/AGENTS.md.template`（不再生成 AGENTS.md）
    - 2.2: 删除 `plugins/harness-pilot/templates/base/exec-plan.md.template`（Superpowers planning 替代）
    - 2.3: 删除 `plugins/harness-pilot/templates/rules/common/roles.md.template`（5D 角色过重，移除）

- [x] Task 3: 重写 harness-analyze SKILL.md
    - 3.1: 移除 Step 0（模板可用性检查），简化为直接检测
    - 3.2: 更新所有文档路径引用：`docs/ARCHITECTURE.md` → `.harness/docs/ARCHITECTURE.md` 等
    - 3.3: 重写 Step 7（报表生成），使用可视化评分卡格式（进度条 + 表格 + 分类评分）
    - 3.4: 简化 Toolchain Recommendation：移除 harness-spec/review/evolve 推荐，保留 Superpowers + harness-apply
    - 3.5: 更新 "After Analysis" 部分，引导用户到 harness-apply（而非多个 skill）

- [x] Task 4: 重写 harness-apply SKILL.md - 模式与路由
    - 4.1: 重写 Overview 和 Mode Selection，定义三种模式：首次生成 / 重入更新+Loop / --init 强制重建
    - 4.2: 添加模式自动路由逻辑（检测 .harness/manifest.json 存在与否）
    - 4.3: 添加 Superpowers 检测逻辑，未安装时输出安装提示（不阻塞流程）
    - 4.3: 更新所有生成路径：docs 收归 .harness/docs/，移除 AGENTS.md、design-docs/、exec-plans/、tasks/、verify-action、verify/、roles.md
    - 4.4: 更新目录结构创建脚本（mkdir 命令），反映新的精简结构
    - 4.5: 更新 Component Selection（Step 2），移除已删减的组件

- [x] Task 5: 重写 harness-apply SKILL.md - 可重入设计
    - 5.1: 定义 manifest.json 数据结构（version, generated_at, language, framework, layer_mapping, quality_rules, custom_rules, files_generated）
    - 5.2: 编写重入检测逻辑（读取 manifest → 扫描代码库 → 对比差异）
    - 5.3: 编写增量更新策略（新目录 → layer mapping，新依赖 → lint-deps，docs → 重新生成）
    - 5.4: 编写自定义规则保护逻辑（manifest.custom_rules 不覆盖）
    - 5.5: 添加 manifest.json 生成逻辑到首次生成流程末尾
    - 5.6: 添加 manifest.json 更新逻辑到重入流程末尾

- [x] Task 6: 重写 harness-apply SKILL.md - Ralph Wiggum Loop
    - 6.1: 编写 Loop 流程定义（Orchestrate → Review → Test → Decision → Fix → Re-Review）
    - 6.2: 编写 Review 阶段：dispatch code-reviewer + lint-deps + lint-quality
    - 6.3: 编写 Test 阶段：运行 validate pipeline（build → lint → test → validate）
    - 6.4: 编写 Fix 阶段：自动修复逻辑 + failure 记录到 trace/failures/
    - 6.5: 编写闭环控制（MAX_ITERATIONS=3，pass/fail 判定，人工介入出口）
    - 6.6: 编写 evolve 附属输出（同类 failure 3+ 次建议更新规则）
    - 6.7: 编写 Loop 报告格式（可视化输出，含 iteration history + evolution insights）

- [x] Task 7: 重写 harness-apply SKILL.md - Hooks 机制
    - 7.1: 更新 session-start hook 脚本，增加 manifest 新鲜度检查
    - 7.2: 编写 .harness/hooks/post-commit git hook 模板
    - 7.3: 在 harness-apply 生成流程中添加 hooks 安装选项
    - 7.4: 更新 hooks.json 配置

- [x] Task 8: 更新 code-reviewer agent，合并 harness-guardian 能力
    - 8.1: 读取现有 harness-guardian.md 的架构检查逻辑
    - 8.2: 将架构验证（layer compliance、dependency direction、module boundaries）合并到 code-reviewer.md
    - 8.3: 添加对 .harness/docs/ARCHITECTURE.md 的读取指令（替代原来的 docs/ARCHITECTURE.md）

- [x] Task 9: 更新模板文件的输出路径
    - 9.1: 更新 ARCHITECTURE.md.template 中的路径引用
    - 9.2: 更新 DEVELOPMENT.md.template 中的路径引用
    - 9.3: 更新 PRODUCT_SENSE.md.template 中的路径引用

- [x] Task 10: 更新项目文档
    - 10.1: 更新 README.md：2 skill 架构、新目录结构、Ralph Wiggum Loop 描述
    - 10.2: 更新 docs/overview-design.md：架构图、Loop 流程、精简后的能力矩阵
    - 10.3: 更新 docs/detailed-design.md：移除 harness-spec/review/evolve 章节，增加 Loop 和可重入章节
    - 10.4: 更新 docs/API.md：反映 2 skill 接口（analyze + apply）
    - 10.5: 更新 docs/CONTRIBUTING.md：更新项目结构和开发指南
