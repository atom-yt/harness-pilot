# Summary：AGENTS.md 优化（agents-md-optimization）

## 完成情况

5 个任务全部完成。

## 产出

| 文件 | 操作 | 关键变化 |
|---|---|---|
| `AGENTS.md` | 重写（87 → 157 行） | 重新组织为 10 节，前 15 行建立项目心智模型；元信息（First Principles / SDD 详解）下沉为引用；暴露 7 个 lint 命令；新增 hand-maintained 区段标记 |
| `.harness/docs/WORKFLOW.md` | 新建 | 承接 SDD 4 阶段、bypass 条件、SDD vs 校验流水线对比、Ralph Loop |
| `.harness/docs/BAD_CASES.md` | 新建 | bad-case 登记模板与升格流程；含一条基于真实 trace 提炼的样例（npm run build ENOENT）|
| `README.md` | 微调 | 末尾增加"For AI Agents"段，含 Claude Code 软链说明 |

## 关键修正（实施过程发现）

1. **doc.md 中 `pnpm tsx` 命令不准确**：实际项目使用 `npx ts-node`（与 `.harness/scripts/` 下脚本 shebang 和 `loop.js` 中的真实调用一致）。AGENTS.md 实施时已按真实命令落地。
2. **根目录无 package.json**：明确写入 AGENTS.md 第 2 节"重要"提示与第 5 节硬性规则第 7 条，并把 `npm run build` 作为首条 BAD_CASES 案例归档。

## 对照文章方法论的覆盖度

| 文章实践 | 落地情况 |
|---|---|
| 实践一：仓库聚合 | 本仓库本身已是 monorepo（plugins + .harness + docs + test-projects），无需调整 |
| 实践二：统一环境配置 | 无环境变量需求，不适用 |
| 实践三：验证闭环 | AGENTS.md 第 6 节明确"改→validate→trace→commit"闭环 |
| 实践四：自动化检查 | 7 个 lint 脚本已暴露给 AI（第 2/8 节），与硬性规则一一映射 |
| 实践五：参考项目 | 本仓库无参考项目（自身即工具），不适用 |
| 模板：9 节结构 | 全部覆盖 |
| 200 行上限 | 157 行 |
| Bad Case 驱动迭代 | 通过 BAD_CASES.md + hand-maintained 区段制度化 |
| 多工具兼容 | AGENTS.md 第 10 节 + README 提示 Claude Code 软链 |

## 后续可改进项（不在本次范围）

1. **`/harness-apply` 识别 hand-maintained 区段并跳过覆盖**：当前仅落了标记，apply skill 的覆盖逻辑改造作为 follow-up
2. **post-commit hook 识别新增 trace 时提示更新 BAD_CASES.md**：把"bad case 登记"流程进一步机械化
3. **AGENTS.md 在 plugins/harness-pilot 子目录下也放一份**：嵌套 AGENTS.md 让 AI 在子项目中读到更聚焦的上下文（OpenAI 自家仓库 88 个 AGENTS.md 的做法）

## 一句话总结

把原 AGENTS.md 从"自动生成的元信息说明"重塑为"AI 工作的真实导航地图"——前 15 行回答"是什么"，第 2 节回答"怎么跑"，第 5 节回答"有哪些规矩"，第 9 节回答"详细信息在哪"。以 BAD_CASES.md + hand-maintained 区段制度化承接团队后续的 bad-case 驱动迭代。
