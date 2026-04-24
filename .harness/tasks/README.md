# Tasks Directory

任务 artifacts 存储目录，记录单次任务执行的完整状态。

## 目录结构

```
tasks/
├── {task-id}/
│   ├── task.json         # 任务状态和进度
│   ├── checkpoint.json    # 执行检查点
│   └── next-steps.json   # 下一步骤指令
└── .current              # 符号链接 → 当前任务目录
```

## Task ID 格式

```
task_YYYYMMDDTHHMMSS_AABBCCDD
```

例如：`task_20260424T143022_a1b2c3d4`

## 文件说明

### task.json

任务主状态文件，包含：
- `taskId`: 唯一标识符
- `type`: 任务类型
- `status`: running | paused | completed | failed
- `progress`: 完成步骤、当前步骤、剩余步骤
- `metrics`: 迭代次数、tool call 数量、错误数

### checkpoint.json

检查点文件，记录：
- 执行阶段和迭代次数
- review 结果
- test 结果
- 代码变更摘要
- 记忆快照

### next-steps.json

继续执行的步骤列表：
- `nextAction`: 下一个动作
- `steps`: 步骤数组
- `fallback`: 失败后的回退方案

## 生命周期

```
创建 → running → (paused) → completed/failed
            ↓          ↓
         handoff   resume
```

## 清理策略

- **running/tasks**: 保留 7 天
- **completed/tasks**: 保留 30 天后归档
- **failed/tasks**: 保留 7 天
