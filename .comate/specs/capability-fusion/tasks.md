# Harness Pilot 能力融合实施计划

- [x] Task 1: 在 harness-analyze 和 harness-apply 中增加工具链推荐机制（选项 E）
    - 1.1: 修改 `harness-analyze/SKILL.md` 的 Step 7 报告模板，在健康报告末尾增加「推荐的开发质量工具链」区域，包含 Superpowers、gstack 外部插件推荐（附安装命令）和 Harness 内置增强 skills 推荐
    - 1.2: 在 `harness-analyze/SKILL.md` 中增加推荐逻辑说明（根据项目特征条件化推荐：任何项目推荐 Superpowers+gstack，多人协作推荐 harness-spec，高复杂度推荐 harness-review，有失败记录推荐 harness-evolve）
    - 1.3: 修改 `harness-apply/SKILL.md` 的成功输出模板，在生成完成后增加「完整开发质量工具链」区域，包含已安装核心、增强 skills、外部插件推荐、完整工作流图

- [x] Task 2: 创建 harness-spec skill（选项 A）
    - 2.1: 创建 `plugins/harness-pilot/skills/harness-spec/SKILL.md`，包含 skill 元信息（name、description、触发词）
    - 2.2: 编写 Overview 和 When to Activate 部分（触发词：harness-spec、spec、write spec、feature spec）
    - 2.3: 编写三阶段流程：Step 1 收集需求信息（Objective、Constraints、Affected Files），Step 2 生成 spec.md 到 `.harness/specs/<feature>/`（包含 delta 标记），Step 3 状态管理（draft→approved→archived）
    - 2.4: 定义 spec.md 模板结构（Feature name、Status、Objective、Constraints、Affected Files with delta markers、Verification Criteria 引用 lint-deps/validate、Approved By）
    - 2.5: 编写与 Superpowers 的协作说明（brainstorm 产出→spec 输入，planning 从 spec 读取约束）和与 harness-guardian 的集成点（spec 阶段预检 Affected Files）
    - 2.6: 编写 Output Format 和 After Spec 的后续动作引导

- [x] Task 3: 创建角色视角 rules 模板并注入现有 agent（选项 D）
    - 3.1: 创建 `plugins/harness-pilot/templates/rules/common/roles.md.template`，定义五种角色视角（产品/架构/工程/质量/运维）及各自适用阶段和关注点检查清单
    - 3.2: 修改 `plugins/harness-pilot/agents/planner.md`，在 Load Context 步骤增加读取 `.harness/rules/common/roles.md`（如存在），在 Generate Plan 中增加"根据角色视角检查清单审查计划完整性"
    - 3.3: 修改 `plugins/harness-pilot/agents/code-reviewer.md`，在 Load Context 步骤增加读取 roles.md（如存在），在 Review Changed Files 中增加可选的多视角评审维度
    - 3.4: 修改 `plugins/harness-pilot/skills/harness-apply/SKILL.md`，在 Step 2 组件选择中增加 roles.md 为可选组件，在 Shared Generation Flow 中增加渲染 `.harness/rules/common/roles.md` 的步骤

- [x] Task 4: 创建 harness-review skill（选项 B）
    - 4.1: 创建 `plugins/harness-pilot/skills/harness-review/SKILL.md`，包含 skill 元信息和触发词（harness-review、review、design-review、arch-review）
    - 4.2: 编写三视角评审流程：架构评审（复用 harness-guardian 检查层级合规、依赖方向）、产品评审（读取 PRODUCT_SENSE.md 检查功能完整性）、质量评审（复用 code-reviewer 检查测试覆盖、边界用例）
    - 4.3: 定义结构化评审报告输出格式（每个视角的 PASS/FAIL 和 Verdict，最终 Final Verdict）
    - 4.4: 编写与 gstack 评审的差异说明（Harness review 绑定 lint-deps 数据，gstack review 是通用工程视角，可同时运行作为双重评审）

- [x] Task 5: 创建 harness-evolve skill（选项 C）
    - 5.1: 创建 `plugins/harness-pilot/skills/harness-evolve/SKILL.md`，包含 skill 元信息和触发词（harness-evolve、evolve、learn、improve harness、failure analysis）
    - 5.2: 编写四步流程：Step 1 收集（扫描 .harness/trace/failures/）、Step 2 识别（聚合同类失败+根因分析）、Step 3 建议（层级映射补充/规则补充/文档更新/程序记忆提取）、Step 4 应用（用户确认后更新配置+验证）
    - 5.3: 编写轨迹编译机制（同类任务成功 3+ 次且步骤一致时，建议编译为确定性脚本到 .harness/scripts/compiled/）
    - 5.4: 定义 Evolution Report 输出格式（模式列表+根因+建议+置信度+轨迹编译候选）
    - 5.5: 编写失败记录格式约定（.harness/trace/failures/ 下 markdown 文件的标准结构）
