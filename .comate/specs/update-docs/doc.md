# 文档更新：反映能力融合架构

## 背景

Harness Pilot 已完成能力融合（capability-fusion）实现，新增了 3 个 skill、1 个角色模板、以及工具链推荐机制。现有文档未反映这些变更，需要同步更新。

## 新增/变更内容清单

### 新增文件
- `plugins/harness-pilot/skills/harness-spec/SKILL.md` — 结构化需求规格管理
- `plugins/harness-pilot/skills/harness-review/SKILL.md` — 多视角审查框架
- `plugins/harness-pilot/skills/harness-evolve/SKILL.md` — Critic→Refiner 自进化循环
- `plugins/harness-pilot/templates/rules/common/roles.md.template` — 五维角色视角模板

### 修改文件
- `plugins/harness-pilot/skills/harness-analyze/SKILL.md` — 新增工具链推荐逻辑
- `plugins/harness-pilot/skills/harness-apply/SKILL.md` — 新增角色模板生成 + 工具链推荐
- `plugins/harness-pilot/agents/planner.md` — 注入角色视角（架构 + 产品）
- `plugins/harness-pilot/agents/code-reviewer.md` — 注入角色视角（质量 + 工程）

## 需要更新的文档

### 1. README.md
**修改类型**: 编辑
**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/README.md`
**影响范围**:
- "What is Harness Pilot?" 部分：补充 3 个新 skill 的简要说明
- "Quick Start" 部分：增加新 skill 的使用示例
- "What is a Harness?" 文件结构树：增加 `roles.md` 和 `specs/` 目录
- "AI Rules" 部分：补充 roles.md 说明
- 新增 "Recommended Toolchain" 小节：说明 Superpowers + gstack 推荐

### 2. docs/API.md
**修改类型**: 编辑
**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/API.md`
**影响范围**:
- Skills 部分：新增 harness-spec、harness-review、harness-evolve 三个 skill 的 API 说明
- Generated File Structure：增加 roles.md 和 specs/ 目录
- 补充 Agents 小节说明 planner 和 code-reviewer 的角色视角增强

### 3. docs/CONTRIBUTING.md
**修改类型**: 编辑
**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/CONTRIBUTING.md`
**影响范围**:
- Project Structure 树：补充 3 个新 skill 目录和 roles.md.template

### 4. docs/detailed-design.md
**修改类型**: 编辑
**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/detailed-design.md`
**影响范围**:
- 功能概览：新增能力融合策略说明
- 新增"能力融合"章节：说明 Superpowers + gstack + Harness 三方协作架构
- 新增"角色视角系统"章节
- 自进化机制章节：补充 harness-evolve skill 的具体实现
- 生成的文件结构：增加 roles.md 和 specs/
- 实施计划：更新已完成的 Phase 标记

### 5. docs/overview-design.md
**修改类型**: 编辑
**路径**: `/Users/yangtong07/Desktop/code/harness/harness-pilot/docs/overview-design.md`
**影响范围**:
- 场景四之后新增"场景五：多视角审查"
- 文件结构树增加 roles.md 和 specs/
- "让 Harness 自己长大"部分补充 harness-evolve 的 skill 化说明

## 实现细节

### README.md 新增内容

Skills 列表扩展为：
```
- harness-analyze — 项目健康度分析（dryrun）
- harness-apply — 生成 harness 基础设施（guide / auto）
- harness-spec — 结构化需求规格管理（draft → approved → archived）
- harness-review — 多视角代码审查（架构/产品/质量/工程/运维）
- harness-evolve — 失败模式分析与自进化（Critic→Refiner）
```

Recommended Toolchain 小节：
```
Harness Pilot 在分析和生成时会推荐互补的开发质量工具链：
- Superpowers：brainstorm、plan、git worktree、subagent execution
- gstack：角色治理、CEO/工程经理/QA 视角评审
完整工作流：brainstorm(SP) → spec(H) → plan(SP) → implement → review(H+G) → evolve(H)
```

### docs/API.md 新增 Skill 文档格式

每个 skill 包含：Trigger 关键词、Usage 示例、Output 说明。

### docs/detailed-design.md 新增章节

"能力融合"章节包含：
- 策略说明：直接复用 + 自建互补能力
- 三方能力分布表
- 推荐机制逻辑（基于项目特征的条件推荐）
- 完整工作流图

## 边界条件

- 不修改任何 SKILL.md 或代码文件，仅修改文档
- 保持中文文档风格一致性（overview-design.md、detailed-design.md 为中文，API.md/README.md 为英文）
- 不新建文档文件，只编辑现有文档
