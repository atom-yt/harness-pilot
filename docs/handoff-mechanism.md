# Harness Pilot Handoff 机制设计

> 基于 Anthropic Effective Harnesses 的跨会话状态恢复设计
>
> **状态：已实现 ✓** (2026-04-24)

---

## 快速开始

## 设计背景

### 问题：上下文窗口限制

LLM 的上下文窗口是有限的。在长任务执行过程中：

```
Agent 执行 40-60 次 tool call 后：
  - 早期决策信息被压缩/丢弃
  - Agent 开始"遗忘"最初的目标
  - 代码 diff、错误日志填满窗口
  - 上下文被噪声污染
```

### Anthropic 的解决方案：Context Reset + Structured Handoff

Anthropic 提出的关键设计：

> "context resets — clearing context window entirely and starting a fresh agent,
> combined with a structured handoff that carries previous agent's state and next steps"

核心思想：
1. **定期清空上下文窗口**，避免噪声累积
2. **结构化 handoff**，携带前一个 agent 的状态和下一步
3. **通过 artifacts 传递上下文**，而不是依赖记忆

---

## 设计目标

| 目标 | 说明 |
|------|------|
| **跨会话恢复** | 支持从断点恢复长任务 |
| **状态持久化** | 将 agent 状态序列化为可读的 artifact |
| **下一步明确** | handoff artifact 包含清晰的 next steps |
| **工具驱动** | 通过 loop.js 工具实现，不依赖 agent "记忆" |
| **向后兼容** | 不破坏现有 manifest.json 机制 |

---

## Handoff Artifact 结构

### 目录布局

\`\`\`
my-project/
\`\`\`.harness/
    ├── manifest.json              # 全局状态
    ├── tasks/                    # 任务 artifacts（单次执行）
    │   ├── {task-id}/
    │   │   ├── task.json         # 任务状态
    │   │   ├── checkpoint.json    # 检查点
    │   │   └── next-steps.json   # 下一步骤
    │   └── .current              # 符号链接 → 当前任务目录
    └── handoffs/                 # 跨会话 handoffs
        ├── {session-id}/
        │   ├── agent-state.json  # 前一个 agent 的状态
        │   ├── context.json      # 上下文摘要
        │   └── resume.json      # 恢复指令
        └── .latest              # 符号链接 → 最新 handoff
\`\`\`

### task.json 结构

\`\`\`json
{
  "taskId": "task_20260424_143022_a1b2c3d4",
  "type": "harness-apply|code-review|e2e-test",
  "status": "running|paused|completed|failed",
  "startTime": "2026-04-24T14:30:22.000Z",
  "lastCheckpoint": "2026-04-24T15:45:10.000Z",
  "mode": "initial|codegen|reentry",
  "context": {
    "language": "typescript",
    "framework": "nextjs",
    "projectRoot": "/path/to/project"
  },
  "progress": {
    "completedSteps": ["detect", "select", "generate"],
    "currentStep": "loop",
    "remainingSteps": ["loop:iteration-2", "finalize"]
  },
  "metrics": {
    "iterationCount": 1,
    "totalToolCalls": 47,
    "errors": 2,
    "contextTokens": 85420
  }
}
\`\`\`

### checkpoint.json 结构

\`\`\`json
{
  "checkpointId": "cp_20260424_154510",
  "timestamp": "2026-04-24T15:45:10.000Z",
  "state": {
    "phase": "Ralph Wiggum Loop",
    "iteration": 1,
    "reviewResult": {
      "approved": false,
      "issues": [
        {
          "file": "src/handler/auth.ts",
          "type": "architecture",
          "message": "Missing error path test"
        }
      ]
    },
    "testResult": {
      "build": "passed",
      "lintArch": "failed",
      "unitTest": "passed"
    },
    "changes": [
      {
        "path": "src/handler/auth.ts",
        "action": "modified",
        "lines": "+12, -5"
      }
    ]
  },
  "memorySnapshot": {
    "keyDecisions": [
      "Use Layer 3 for auth handler",
      "Implement JWT validation"
    ],
    "pendingQuestions": [],
    "assumptions": [
      "User has TypeScript strict mode enabled"
    ]
  }
}
\`\`\`

### next-steps.json 结构

\`\`\`json
{
  "nextAction": "continue-loop",
  "priority": "immediate",
  "steps": [
    {
      "id": "step-1",
      "action": "call-code-reviewer",
      "params": {
        "target": "src/handler/auth.ts",
        "focus": ["error-path", "test-coverage"]
      },
      "expectedOutput": "Review with specific issues to fix"
    },
    {
      "id": "step-2",
      "action": "auto-fix",
      "condition": "review.issues.length > 0",
      "params": {
        "issues": "from-step-1"
      },
      "expectedOutput": "Fixed code or explanation of manual fix needed"
    },
    {
      "id": "step-3",
      "action": "validate",
      "params": {
        "pipeline": ["build", "lint-arch", "test"]
      },
      "expectedOutput": "All checks passed or failure details"
    }
  ],
  "fallback": {
    "condition": "iteration >= 3 && !allPassed",
    "action": "report-failure",
    "message": "Unable to auto-fix after 3 iterations"
  }
}
\`\`\`

---

## 跨会话恢复流程

### 流程图

\`\`\`
Session A（原始会话）
  harness-apply 开始执行
       ↓
  detect() → select() → generate()
       ↓
  loop() 开始 Ralph Wiggum Loop
       ↓
  iteration-1: review → 发现问题 → auto-fix → 验证失败
       ↓
  检测到上下文接近限制 (tokens > 100k)
       ↓
  触发 handoff:
    1. 创建 task artifact
    2. 创建 handoff artifact (agent-state.json, resume.json)
    3. 更新 .harness/tasks/.current 符号链接
    4. 输出 handoff 指令
       ↓
       ▼
Handoff Artifact（跨会话）
  .harness/handoffs/sess_20260424_143022/
    ├── agent-state.json  ← Session A 的状态
    ├── context.json      ← 上下文摘要
    └── resume.json      ← 恢复指令
       ↓
       ▼
Session B（恢复会话）
  用户发起恢复: "继续之前的 harness-apply 任务"
       ↓
  loop.js handoff-resolve 工具执行
    1. 检查 .harness/handoffs/.latest
    2. 读取 resume.json
    3. 验证 checksum
    4. 加载 task artifact
    5. 输出恢复摘要
       ↓
  Agent 从干净上下文开始，加载 contextSummary 和 keyFiles
       ↓
  继续执行 next-steps.json 中的步骤
       ↓
  任务完成或需要再次 handoff
\`\`\`

### 用户触发恢复

\`\`\`bash
# 方式 1：自然语言
用户：继续之前的 harness-apply 任务

# 方式 2：明确参数
用户：/harness-apply --resume

# 方式 3：指定任务 ID
用户：/harness-apply --resume task_20260424_143022_a1b2c3d4
\`\`\`

---

## loop.js 工具实现

### 工具接口

\`\`\`javascript
// tools/loop.js

const commands = {
  /**
   * 开始 Ralph Wiggum Loop
   * 输入: { changes, config }
   * 输出: { iterations, review, test, verdict }
   */
  start: async (changes, config) => { ... },

  /**
   * 创建检查点
   * 输入: { state, changes }
   * 输出: { checkpointId, path }
   */
  checkpoint: async (state, changes) => { ... },

  /**
   * 触发 handoff
   * 输入: { taskId, reason }
   * 输出: { handoffId, resumeCommand }
   */
  handoff: async (taskId, reason) => { ... },

  /**
   * 解析 handoff（恢复会话）
   * 输入: { handoffId }
   * 输出: { taskArtifact, resumeInstruction, nextSteps }
   */
  resolve: async (handoffId) => { ... }
};

module.exports = commands;
\`\`\`

---

## 扩展 manifest.json

### 增加字段

\`\`\`json
{
  "version": "0.3.0",
  "language": "typescript",
  "framework": "nextjs",
  "components": ["ARCHITECTURE", "DEVELOPMENT"],
  "lastApplied": "2026-04-24T00:02:01.526Z",
  "capabilities": {
    "jitTest": true,
    "codeTemplates": true,
    "refactoring": true,
    "e2e": true,
    "security": false,
    "monitoring": false
  },
  "tasks": {
    "current": "task_20260424_143022_a1b2c3d4",
    "history": [
      {
        "taskId": "task_20260423_100000_xxxxxxxx",
        "status": "completed",
        "endTime": "2026-04-23T10:45:00.000Z"
      }
    ]
  },
  "handoffs": {
    "latest": "sess_20260424_143022",
    "enabled": true
  }
}
\`\`\`

---

## 实施计划

### Phase 1: 基础结构（1 天）
- [ ] 创建 `.harness/tasks/` 目录结构
- [ ] 创建 `.harness/handoffs/` 目录结构
- [ ] 实现 task.json, checkpoint.json, next-steps.json 结构
- [ ] 实现 agent-state.json, resume.json 结构

### Phase 2: loop.js 工具实现（2 天）
- [ ] 实现 `start()` 方法 - Ralph Wiggum Loop
- [ ] 实现 `checkpoint()` 方法 - 创建检查点
- [ ] 实现 `handoff()` 方法 - 触发 handoff
- [ ] 实现 `resolve()` 方法 - 恢复会话
- [ ] 添加 checksum 验证

### Phase 3: SKILL 集成（1 天）
- [ ] 更新 harness-apply/SKILL.md - 添加 handoff 流程
- [ ] 更新 harness-analyze/SKILL.md - 添加任务状态显示
- [ ] 实现 resume 意图检测
- [ ] 集成 Agent tool resume 参数

### Phase 4: manifest.json 扩展（0.5 天）
- [ ] 扩展 manifest.json 结构
- [ ] 添加 tasks 字段
- [ ] 添加 handoffs 字段
- [ ] 更新 manifest 更新逻辑

### Phase 5: 测试与文档（0.5 天）
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新用户文档
- [ ] 添加使用示例

---

## 使用示例

### 示例 1：自动 handoff

\`\`\`bash
用户: 帮我给这个项目加 Harness，包括完整验证

Agent: ...
       [执行 47 次 tool call 后]
       检测到上下文接近限制，触发 handoff

=== Handoff Triggered ===
Reason: Context window approaching limit (tokens: 124,500)

Task ID: task_20260424_143022_a1b2c3d4
Status: Paused at Ralph Wiggum Loop - Iteration 1

Resume with:
  /harness-apply --resume task_20260424_143022_a1b2c3d4

Or simply say: "continue the previous task"

Pending issues:
  1. src/handler/auth.ts - Missing error path test
  2. src/handler/auth.ts - Architecture violation (imports internal/config)
\`\`\`

### 示例 2：恢复会话

\`\`\`bash
用户: 继续之前的任务

Agent: [调用 loop.resolve()]
       检测到未完成的 task: task_20260424_143022_a1b2c3d4

=== Resume Summary ===
Task Type: harness-apply reentry
Phase: Ralph Wiggum Loop - Iteration 1 completed
Last Decision: Attempt auto-fix of error path test and architecture issues

Key Files:
  - src/handler/auth.ts
  - .harness/scripts/lint-deps.ts

Loaded Memories:
  - macOS /var 符号链接问题处理
  - 添加 API 端点标准流程

=== Continuing from Iteration 2 ===

[执行 iteration-2]
✓ Code reviewer: 2 issues found
✓ Auto-fix: Fixed error path test, architecture issue needs manual fix
✓ Validate: build passed, lint-arch passed, test passed

=== Ralph Wiggum Loop Complete ===
Total Iterations: 2
Files Modified: 3
Test Results: All passed

Harness 应用完成！
\`\`\`

---

## 技术考虑

### Token 估算

| 方法 | 说明 |
|------|------|
| **API 查询** | 通过 `/v1/messages` API 的 usage 字段获取 |
| **本地估算** | 基于 Claude Tokenizer 进行估算（准确度 ~95%） |
| **启发式** | 基于历史 tool call 数量推算（保守估计） |

### 清理策略

| 类型 | 保留时间 | 清理触发 |
|------|----------|----------|
| **task artifacts** | 7 天 | 手动清理或 cron job |
| **handoff artifacts** | 3 天 | 成功 resume 后立即清理 |
| **completed tasks** | 30 天 | 定期归档 |

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| **Handoff artifact 丢失** | 文件系统持久化 + 备份机制 |
| **Checksum 验证失败** | 抛出明确错误，提供恢复选项 |
| **上下文恢复不完整** | 包含 keyDecisions 和 assumptions 字段 |
| **循环 handoff** | 限制最大 handoff 次数（如 5 次） |
| **任务状态不一致** | 使用事务式更新，确保原子性 |

---

## CLI 快速参考

### loop.js 命令

```bash
# 查看帮助
node loop.js

# 创建检查点
node loop.js checkpoint

# 触发 handoff
node loop.js handoff <taskId> <reason>
# 示例
node loop.js handoff task_20260424_a1b2c3d4 "context-limit"

# 恢复会话
node loop.js resolve [sessionId]
# 示例（使用最新）
node loop.js resolve
# 示例（指定会话）
node loop.js resolve sess_1713945022000
```

### 检查当前状态

```bash
# 检查是否有活动任务
cat .harness/tasks/.current/task.json 2>/dev/null || echo "No active task"

# 检查是否有未恢复的 handoff
cat .harness/handoffs/.latest/resume.json 2>/dev/null || echo "No pending handoff"
```

---

## 实施状态

| Phase | 内容 | 状态 | 日期 |
|-------|------|------|
| 1 | 基础结构 + JSON Schemas | ✓ 完成 | 2026-04-24 |
| 2 | loop.js 工具实现 | ✓ 完成 | 2026-04-24 |
| 3 | SKILL 集成 | ✓ 完成 | 2026-04-24 |
| 4 | manifest.json 扩展 | ✓ 完成 | 2026-04-24 |
| 5 | 测试与文档 | ✓ 完成 | 2026-04-24 |

---

## 参考资源

- [Anthropic: Effective Harnesses for AI Coding](https://code.claude.com/docs)
- [Superpowers: Using Git Worktrees](https://github.com/obra/superpowers)
- [Agent Tool Documentation](https://github.com/anthropics/claude-code)
