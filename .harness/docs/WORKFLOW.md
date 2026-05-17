# SDD Workflow（Spec-Driven Development）

> 本文档承接 `AGENTS.md` 第 7 节"SDD 工作流入口"。AGENTS.md 只放门槛与 bypass 条件；本文档放完整流程、产物、与其他流水线的关系。

## 1. SDD 流水线（Spec 流水线）

四阶段、严格顺序、每阶段都有产物：

| 阶段 | 产物 | 描述 | 准入门槛 |
|---|---|---|---|
| Requirements | `.comate/specs/{feature}/doc.md` | 分析与澄清需求 | 必须最先完成 |
| Decomposition | `.comate/specs/{feature}/tasks.md` | 拆解为可执行任务 | doc.md 已确认 |
| Implementation | 代码 + 测试 | 按 tasks.md 顺序执行 | tasks.md 已确认 |
| Summary | `.comate/specs/{feature}/summary.md` | 完成总结 | 实现已落地 |

### 强制规则
- `tasks.md` 不允许在 `doc.md` 完成前创建
- 实现代码不允许在 `tasks.md` 定稿前开始
- 复杂度 ≥ 7 的任务由复杂度分析强制走 SPEC 模式

## 2. 何时 bypass

只有满足以下全部条件，才允许使用 `--mode direct` 绕过 SDD：

- 复杂度 ≤ 6（修一个错别字、一行修改、单文件局部调整）
- 不涉及跨模块/跨层影响
- 无新增公共接口

bypass 操作：
- 显式 `--mode direct` 标志
- 在复杂度分析提示处确认 bypass

## 3. SDD 流水线 vs 校验流水线

二者是**正交关系**，不要混淆：

| 维度 | SDD 流水线 | 校验流水线 |
|---|---|---|
| 解决的问题 | 写之前怎么想清楚 | 写完之后怎么验证 |
| 阶段 | Requirements → Decomposition → Implementation → Summary | build → lint-arch → test → verify |
| 产物 | doc.md / tasks.md / summary.md | trace/failures/*.md（失败记录） |
| 入口命令 | （流程性约束，无单一命令） | `npx ts-node .harness/scripts/validate.ts` |
| 触发时机 | 任务开始前 | 任务结束后、commit 前 |

> 一句话：SDD 让你"做对的事"，校验流水线让你"把事做对"。两者都跑完，才算完成一个任务。

## 4. Ralph Wiggum Loop

`/harness-apply` 在已存在 harness 的项目上自动触发的循环：

```
Orchestrate → Review → Test → Fix → Re-Review（最多 3 轮）
```

- **Review**：code-reviewer 做架构合规与代码质量复检
- **Test**：跑校验流水线（build → lint → test → validate）
- **Fix**：能自动修就修，修不掉的写到 `.harness/trace/failures/`
- **Evolve**：循环结束后归纳失败模式，建议规则更新

Loop 不替代 SDD，它是 SDD 的 Implementation 阶段尾声的质量闸门。

## 5. 推荐顺序

```
analyze（体检）→ apply（生成 harness）→ SDD: doc → tasks → impl → summary → apply（Loop 校验）→ ship（auto-commit skill）
```

## 6. bypass 与失败的反馈通道

- bypass 后若发现仍有疏漏 → 把现象记录到 `.harness/docs/BAD_CASES.md`
- 校验流水线失败 → 写 `.harness/trace/failures/{ts}-{topic}.md`
- 同类失败 ≥ 3 次 → 应升格为 AGENTS.md 第 5 节硬性规则或新增 lint 脚本（详见 BAD_CASES.md 升格流程）
