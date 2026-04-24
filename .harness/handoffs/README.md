# Handoffs Directory

跨会话 handoff artifacts 存储目录。

## 目录结构

```
handoffs/
├── {session-id}/
│   ├── agent-state.json  # 前一个 agent 的状态
│   ├── context.json      # 上下文摘要（可选）
│   └── resume.json      # 恢复指令
└── .latest              # 符号链接 → 最新 handoff
```

## Session ID 格式

```
sess_{timestamp}
```

例如：`sess_1713945022000`

## 文件说明

### agent-state.json

前一个 agent 的状态快照：
- `sessionId`: 会话标识
- `agentType`: agent 类型
- `terminationReason`: handoff 原因
- `stateSnapshot`: 终止时的状态
- `artifacts`: 相关 artifacts 路径

### resume.json

恢复指令：
- `resumeInstruction.action`: load-task | load-checkpoint | continue-step
- `resumeInstruction.contextSummary`: 上下文摘要
- `resumeInstruction.loadedMemories`: 已加载的记忆文件
- `validation.checksum`: SHA256 校验和

### context.json（可选）

额外的上下文信息，用于恢复时参考。

## 生命周期

```
创建 handoff → 等待 resume → resume → 清理
                                              ↓
                                   保留 3 天后删除
```

## 验证

每个 handoff 都包含 checksum，用于验证数据完整性：

```bash
# 计算 checksum
cat agent-state.json | sha256sum

# 验证
sha256sum -c resume.json.validation.checksum
```

## 使用示例

```bash
# 检查最新 handoff
cat .harness/handoffs/.latest/agent-state.json

# 恢复会话
/harness-apply --resume
```
