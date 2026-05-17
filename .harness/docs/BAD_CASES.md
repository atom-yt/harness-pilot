# BAD CASES：AI Bad Case 反馈通道

> 本文档是 AI Coding bad case 的中转站。bad case 在这里登记 → 归纳 → 升格为 AGENTS.md 硬性规则或 lint 脚本。
> 不要把零散规则直接塞进 AGENTS.md，先在这里登记。

## 这是什么

「Bad case」指 AI Agent 在本仓库工作时产出的不符合预期的结果：

- 用错命名风格、跨层引依赖、跳过 SDD 直接写实现
- 改了代码忘了跑 validate、failure 没落 trace
- 用错命令（如 `npm run build` 但根目录无 package.json）
- 重复犯过的低级错误

## 提交一个 bad case

直接在本文档"案例列表"下追加一条，使用以下模板：

```markdown
### YYYY-MM-DD-N：{一句话描述}
- **现象**：贴一段错误代码或行为描述
- **根因**：缺少哪条上下文/规则
- **修复落点**：[ ] AGENTS.md 关键约定 / [ ] .harness/rules/.../*.md / [ ] lint 脚本 / [ ] 仅记录暂不修复
- **关联 trace**：.harness/trace/failures/...（如有）
- **状态**：pending / addressed
- **升格**：（已升格时填写最终落点链接）
```

## 升格流程

```
单次 bad case → 登记本文档 status=pending
   ↓
同类 ≥ 3 次 / 影响重大 → 进入升格评估
   ↓
判断落点：
   ├─ 全局硬性规则 → 升格到 AGENTS.md 第 5 节 hand-maintained 区段
   ├─ 模块级规则   → 升格到 .harness/rules/{lang}/development.md
   ├─ 可机械检查   → 新增/修改 .harness/scripts/lint-*.ts
   └─ 工作流问题   → 升格到 .harness/docs/WORKFLOW.md
   ↓
升格完成 → 状态置 addressed，填"升格"字段链接
```

## 案例列表

### 2026-04-29-1：AI 用 `npm run build` 触发 ENOENT
- **现象**：harness-apply Loop 在仓库根目录执行 `npm run build`，因为根目录无 `package.json` 报 ENOENT。
- **根因**：harness-pilot 仓库根不是 Node 项目（plugins/harness-pilot 才是），AGENTS.md 也未澄清"用什么命令构建"。
- **修复落点**：[x] AGENTS.md 第 2 节快速命令 / [x] .harness/docs/WORKFLOW.md 校验流水线说明
- **关联 trace**：`.harness/trace/failures/2026-04-29T15-49-28-013Z-loop.md`、`-086Z-loop.md`、`-155Z-loop.md`
- **状态**：addressed
- **升格**：AGENTS.md 第 2 节"快速命令"明确了真实可用的命令（`npx ts-node .harness/scripts/validate.ts`）。

<!-- 在此处追加新案例 -->
