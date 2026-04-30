# Harness Pilot UI Task Tracker Design

**设计日期**: 2026-04-30
**版本**: 1.0
**设计师**: Ducc (Claude Code)

---

## 目录

- [1. 概述](#1-概述)
- [2. 需求分析](#2-需求分析)
- [3. 架构设计](#3-架构设计)
- [4. 数据模型](#4-数据模型)
- [5. 功能设计](#5-功能设计)
- [6. 实现计划](#6-实现计划)

---

## 1. 概述

### 1.1 目标

为 harness-pilot 添加 UI 任务追踪系统，支持从需求到 CI 的完整开发闭环监控。

### 1.2 核心场景

| 场景 | 描述 |
|------|------|
| 开发人员自检 | 开发者查看当前任务进度和状态 |
| 质量追溯分析 | 回顾历史任务，分析质量和效率问题 |
| 实时监控 | Dashboard 形式展示实时状态 |

### 1.3 实现方式

CLI + Web 混合方案：
- CLI：快速查看、命令操作
- Web：可视化分析、深度详情

---

## 2. 需求分析

### 2.1 任务生命周期

```
需求 → SDD → 开发 → Review → 测试 → CI
```

每个阶段需要追踪：

| 阶段 | 追踪数据 |
|------|---------|
| 需求 | 需求描述、创建时间、创建者 |
| SDD | SPEC 文件路径、生成时间、版本 |
| 开发 | 代码变更量、涉及文件数、开发耗时 |
| Review | 审查结果（通过/待修复/拒绝）、审查意见数量、审查耗时 |
| 测试 | 测试用例数、通过率、失败原因 |
| CI | 构建状态、lint 结果、测试结果、耗时 |

### 2.2 功能需求

#### CLI 功能

- 快速查看任务状态摘要
- 切换查看不同任务
- 触发 Web Dashboard
- 命令操作（重试、标记完成等）
- 实时日志流

#### Web 功能

- 总览看板：统计卡片、状态分布
- 任务列表：可筛选、可排序
- 任务详情：完整生命周期追踪
- 质量分析：趋势图表、失败模式分析
- 实时监控：当前执行任务的实时日志

### 2.3 数据来源

- 读取现有 `.harness/` 数据：`tasks/`、`trace/`、`memory/`
- 新增追踪文件：`task-tracker.json`
- 与现有 Skill 集成：harness-apply、harness-analyze 自动写入

---

## 3. 架构设计

### 3.1 目录结构

```
plugins/harness-pilot/
├── skills/
│   ├── harness-status.md      # CLI 快速查看技能
│   └── harness-ui.md         # Web Dashboard 技能
├── ui/
│   ├── tracker/
│   │   ├── task-tracker.json  # 任务状态存储
│   │   └── tracker.js        # 数据同步逻辑
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx     # 根布局
│   │   │   ├── page.tsx       # 总览看板
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx   # 任务列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # 任务详情
│   │   │   └── analytics/
│   │   │       └── page.tsx   # 质量分析
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts   # 获取任务列表
│   │   │       └── [id]/
│   │   │           └── route.ts # 获取单个任务
│   │   ├── components/
│   │   │   ├── TaskCard.tsx    # 任务卡片
│   │   │   ├── StageProgress.tsx # 阶段进度条
│   │   │   └── StatusBadge.tsx  # 状态徽章
│   │   ├── lib/
│   │   │   └── tracker.ts     # 数据访问层
│   │   └── package.json
│   └── cli/
│       └── status.js        # CLI 状态展示
```

### 3.2 数据流

```
harness-apply / harness-analyze 执行
    ↓
写入 .harness/tasks/、.harness/trace/
    ↓
tracker.js 解析并同步到 task-tracker.json
    ↓
CLI 和 Web UI 读取 task-tracker.json
```

### 3.3 集成点

| 集成点 | 触发动作 | 同步内容 |
|--------|---------|---------|
| harness-apply 创建任务 | SDD 生成开始 | 创建任务记录，设置 requirement → completed |
| harness-apply SDD 完成 | SDD 文件创建 | 更新 sdd → completed，记录文件路径 |
| Git commit | 检测代码变更 | 更新 development → in_progress |
| code-reviewer 执行 | 审查完成 | 更新 review 状态和结果 |
| 测试执行 | 测试完成 | 更新 test 阶段统计 |
| CI pipeline | CI 完成 | 更新 ci 阶段结果 |

---

## 4. 数据模型

### 4.1 task-tracker.json 结构

```json
{
  "version": "1.0",
  "last_updated": "2026-04-30T14:30:00Z",
  "tasks": {
    "task_20260430T143000_xyz123": {
      "id": "task_20260430T143000_xyz123",
      "title": "添加用户认证功能",
      "description": "实现基于 JWT 的用户登录和注册功能",
      "status": "in_review",
      "stages": {
        "requirement": {
          "status": "completed",
          "completed_at": "2026-04-30T14:30:00Z",
          "created_by": "user"
        },
        "sdd": {
          "status": "completed",
          "completed_at": "2026-04-30T14:45:00Z",
          "file": ".harness/docs/sdd-auth.md",
          "version": "1.2"
        },
        "development": {
          "status": "completed",
          "completed_at": "2026-04-30T17:00:00Z",
          "duration_minutes": 135,
          "files_changed": 12,
          "commits": 5,
          "test_cases_added": 8
        },
        "review": {
          "status": "in_progress",
          "started_at": "2026-04-30T17:15:00Z",
          "result": null,
          "comments_count": 3,
          "issues_found": 2,
          "issues_fixed": 1
        },
        "test": {
          "status": "pending",
          "test_cases": 0,
          "pass_rate": null,
          "failures": []
        },
        "ci": {
          "status": "pending",
          "build_result": null,
          "lint_result": null,
          "test_result": null,
          "duration_minutes": null
        }
      },
      "metadata": {
        "created_at": "2026-04-30T14:30:00Z",
        "created_by": "user",
        "updated_at": "2026-04-30T17:15:00Z",
        "priority": "high",
        "project": "harness-pilot"
      }
    }
  },
  "stats": {
    "total": 1,
    "pending": 0,
    "in_progress": 1,
    "completed": 0,
    "failed": 0,
    "avg_development_time": null,
    "success_rate": null
  }
}
```

### 4.2 类型定义

```typescript
enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

enum Stage {
  REQUIREMENT = 'requirement',
  SDD = 'sdd',
  DEVELOPMENT = 'development',
  REVIEW = 'review',
  TEST = 'test',
  CI = 'ci'
}

enum StageStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

enum ReviewResult {
  PASSED = 'passed',
  NEEDS_FIX = 'needs_fix',
  REJECTED = 'rejected'
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  stages: {
    requirement: RequirementStage;
    sdd: SDDStage;
    development: DevelopmentStage;
    review: ReviewStage;
    test: TestStage;
    ci: CIStage;
  };
  metadata: TaskMetadata;
}

interface RequirementStage {
  status: StageStatus;
  completed_at?: string;
  created_by?: string;
}

interface SDDStage {
  status: StageStatus;
  completed_at?: string;
  file?: string;
  version?: string;
}

interface DevelopmentStage {
  status: StageStatus;
  completed_at?: string;
  duration_minutes?: number;
  files_changed?: number;
  commits?: number;
  test_cases_added?: number;
}

interface ReviewStage {
  status: StageStatus;
  started_at?: string;
  completed_at?: string;
  result?: ReviewResult;
  comments_count?: number;
  issues_found?: number;
  issues_fixed?: number;
}

interface TestStage {
  status: StageStatus;
  completed_at?: string;
  test_cases?: number;
  pass_rate?: number;
  failures?: string[];
}

interface CIStage {
  status: StageStatus;
  completed_at?: string;
  build_result?: 'success' | 'failure';
  lint_result?: 'success' | 'failure';
  test_result?: 'success' | 'failure';
  duration_minutes?: number;
}

interface TaskMetadata {
  created_at: string;
  created_by: string;
  updated_at?: string;
  priority?: 'low' | 'medium' | 'high';
  project?: string;
}

interface TrackerData {
  version: string;
  last_updated: string;
  tasks: Record<string, Task>;
  stats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    avg_development_time: number | null;
    success_rate: number | null;
  };
}
```

---

## 5. 功能设计

### 5.1 CLI 功能

#### `/harness-status` skill

**功能**：
- 显示当前任务状态摘要
- 列出所有任务（可筛选状态）
- 显示任务详情
- 触发 Web UI

**输出示例**：

```
=== Harness Task Tracker ===

当前项目: harness-pilot
任务总数: 3
  ✅ 已完成: 1
  🔄 进行中: 1
  ⏳ 待处理: 1
  ❌ 失败: 0

最新任务:
  task_20260430T143000_xyz123 - 添加用户认证功能
    状态: in_review
    当前进度: [✓需求 ✓SDD ✓开发 ○审查 ○测试 ○CI]
    最后更新: 5分钟前

使用 /harness-ui 打开 Web Dashboard
使用 /harness-status <task-id> 查看详情
```

#### `/harness-ui` skill

**功能**：
- 启动 Next.js Web Dashboard
- 显示访问 URL
- 支持 `--port` 参数自定义端口

### 5.2 Web 功能

#### 总览看板 (`/`)

- 统计卡片：任务总数、完成率、平均开发时间
- 状态分布图
- 最近活动列表
- 快速操作按钮

#### 任务列表 (`/tasks`)

- 可筛选：状态、优先级、时间范围
- 可排序：创建时间、更新时间、优先级
- 任务卡片展示关键信息
- 点击查看详情

#### 任务详情 (`/tasks/[id]`)

- 任务基本信息
- 生命周期时间线
- 每个阶段详细数据
- 相关文件链接
- 操作按钮（重试、标记完成等）

#### 质量分析 (`/analytics`)

- 趋势图表：任务完成速度、成功率
- 失败模式分析
- 阶段耗时统计
- 改进建议

---

## 6. 实现计划

### Phase 1: 核心数据层 (优先级: P0)

- [ ] 创建 `tracker.js` 数据同步逻辑
- [ ] 定义 `task-tracker.json` 数据结构
- [ ] 实现从 `.harness/` 解析数据的函数
- [ ] 实现数据更新和持久化函数
- [ ] 编写单元测试

### Phase 2: CLI Skills (优先级: P0)

- [ ] 创建 `harness-status.md` skill
- [ ] 实现状态摘要显示
- [ ] 实现任务列表展示
- [ ] 创建 `harness-ui.md` skill
- [ ] 实现 Web 服务启动逻辑

### Phase 3: Web Dashboard 基础 (优先级: P1)

- [ ] 初始化 Next.js 项目
- [ ] 创建基础布局和导航
- [ ] 实现总览看板页面
- [ ] 实现 API 路由

### Phase 4: 任务详情页面 (优先级: P1)

- [ ] 实现任务列表页面
- [ ] 实现任务详情页面
- [ ] 创建复用组件

### Phase 5: 质量分析 (优先级: P2)

- [ ] 实现质量分析页面
- [ ] 添加图表组件
- [ ] 实现趋势分析

### Phase 6: 集成与优化 (优先级: P2)

- [ ] 与 harness-apply 集成
- [ ] 与 harness-analyze 集成
- [ ] 实现实时更新
- [ ] 性能优化
- [ ] 错误处理和日志

---

## 7. 技术栈

| 组件 | 技术 |
|------|------|
| CLI | Node.js |
| Web | Next.js 14 (App Router) |
| UI 组件 | React + Tailwind CSS |
| 数据存储 | JSON 文件 |
| 图表 | Recharts |
| 类型检查 | TypeScript |

---

## 8. 风险与依赖

| 风险 | 缓解措施 |
|------|---------|
| 数据同步冲突 | 使用文件锁和原子写入 |
| 大量任务时性能 | 实现分页和懒加载 |
| 跨平台兼容 | 使用 path.join 而非硬编码路径 |
| 现有 Skill 集成难度 | 保持 API 简单，最小化侵入性 |

---

**文档结束**