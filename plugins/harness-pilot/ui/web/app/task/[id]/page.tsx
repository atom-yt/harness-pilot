"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle, XCircle, PlayCircle, AlertCircle, FileText, GitBranch, Code, TestTube, Cpu } from "lucide-react"

interface StageData {
  content?: string
  parsed?: {
    title: string
    sections: string[]
    tasks: Array<{
      section: string | null
      title: string
      completed: boolean
    }>
  }
}

interface Task {
  id: string
  type: string
  status: string
  title?: string
  startTime: string
  endTime?: string
  mode?: string
  context?: {
    language?: string
    framework?: string
    projectRoot?: string
  }
  stages?: {
    requirement?: { completed: boolean }
    plan?: { completed: boolean }
    development?: { completed: boolean }
    quality?: { completed: boolean }
    test?: { completed: boolean }
    review?: { completed: boolean }
    ci?: { completed: boolean }
  }
  // Full process data
  requirement?: StageData
  plan?: StageData
  development?: StageData
  quality?: StageData
  progress?: {
    currentStep?: string
    iteration?: number
    completedSteps?: string[]
  }
  metrics?: {
    iterationCount?: number
    totalToolCalls?: number
    errors?: number
  }
  failureReason?: string
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        const tasks = data.tasks as Record<string, Task>
        const foundTask = tasks[params.id as string]
        if (foundTask) {
          setTask(foundTask)
        } else {
          setError("Task not found")
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading task:", err)
        setError("Failed to load task")
        setLoading(false)
      })
  }, [params.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "running":
      case "in-progress":
        return <PlayCircle className="w-6 h-6 text-blue-600" />
      case "failed":
        return <XCircle className="w-6 h-6 text-red-600" />
      case "paused":
        return <Clock className="w-6 h-6 text-yellow-600" />
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />
    }
  }

  const getStepName = (step?: string) => {
    if (!step) return step
    const stepNames: Record<string, string> = {
      requirement: "需求分析",
      plan: "方案设计",
      development: "开发实现",
      review: "代码评审",
      test: "测试验证",
      ci: "持续集成",
      quality: "质量检查",
      init: "初始化",
      analyze: "分析",
      generate: "生成",
      review_fix: "评审修复",
      test_fix: "测试修复"
    }
    return stepNames[step] || step
  }

  const getStageName = (stage: string) => {
    const stageNames: Record<string, string> = {
      requirement: "需求分析",
      plan: "方案设计",
      development: "开发实现",
      review: "代码评审",
      test: "测试验证",
      ci: "持续集成",
      quality: "质量检查"
    }
    return stageNames[stage] || stage
  }

  const getStatusName = (status: string) => {
    const statusNames: Record<string, string> = {
      completed: "已完成",
      running: "运行中",
      "in-progress": "进行中",
      failed: "失败",
      paused: "暂停",
      pending: "待定"
    }
    return statusNames[status] || status
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "requirement":
        return <FileText className="w-5 h-5" />
      case "sdd":
        return <GitBranch className="w-5 h-5" />
      case "development":
        return <Code className="w-5 h-5" />
      case "review":
        return <AlertCircle className="w-5 h-5" />
      case "test":
        return <TestTube className="w-5 h-5" />
      case "ci":
        return <Cpu className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载任务中...</p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || "任务未找到"}</p>
          <button
            onClick={() => router.push("/tasks")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回任务列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push("/tasks")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            返回任务列表
          </button>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {getStatusIcon(task.status)}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title || task.type}</h1>
                <p className="text-gray-600">{task.id}</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {task.type}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">任务详情</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">状态</p>
                  <p className="text-lg font-semibold text-gray-900">{getStatusName(task.status)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">模式</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{task.mode || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">开始时间</p>
                  <p className="text-gray-900">{new Date(task.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">结束时间</p>
                  <p className="text-gray-900">{task.endTime ? new Date(task.endTime).toLocaleString() : "N/A"}</p>
                </div>
              </div>
              {task.failureReason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">失败原因</p>
                  <p className="text-red-700">{task.failureReason}</p>
                </div>
              )}
            </div>

            {task.context && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">上下文</h2>
                <div className="space-y-2">
                  {task.context.language && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">语言</p>
                      <p className="text-gray-900">{task.context.language}</p>
                    </div>
                  )}
                  {task.context.framework && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">框架</p>
                      <p className="text-gray-900">{task.context.framework}</p>
                    </div>
                  )}
                  {task.context.projectRoot && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">项目根目录</p>
                      <p className="text-gray-900 font-mono text-sm">{task.context.projectRoot}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {task.stages && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">任务全流程</h2>
                <div className="space-y-3">
                  {Object.entries(task.stages).map(([key, stage]: [string, any]) => (
                    <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className={stage.completed ? "text-green-600" : "text-gray-400"}>
                        {getStageIcon(key)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{getStageName(key)}</p>
                        <p className="text-sm text-gray-600">
                          {stage.completed ? "已完成" : "待完成"}
                        </p>
                      </div>
                      {stage.completed && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.requirement && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  需求分析
                </h2>
                {task.requirement.parsed?.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{task.requirement.parsed.title}</h3>
                )}
                {task.requirement.parsed?.tasks && task.requirement.parsed.tasks.length > 0 && (
                  <div className="space-y-2">
                    {task.requirement.parsed.tasks.map((taskItem, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`${taskItem.completed ? "text-green-600" : "text-gray-400"} mt-1`}>
                          {taskItem.completed ? "✓" : "○"}
                        </span>
                        <span className={taskItem.completed ? "text-gray-500 line-through" : "text-gray-900"}>
                          {taskItem.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {task.requirement.content && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      查看原始内容
                    </summary>
                    <pre className="mt-2 text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {task.requirement.content}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {task.plan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  方案设计
                </h2>
                {task.plan.parsed?.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{task.plan.parsed.title}</h3>
                )}
                {task.plan.parsed?.sections && task.plan.parsed.sections.length > 0 && (
                  <div className="space-y-3">
                    {task.plan.parsed.sections.map((section, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-gray-900">{section}</h4>
                        {task.plan?.parsed?.tasks
                          .filter(t => t.section === section)
                          .map((taskItem, taskIdx) => (
                            <div key={taskIdx} className="flex items-start gap-2 ml-2 mt-2">
                              <span className={`${taskItem.completed ? "text-green-600" : "text-gray-400"} mt-1`}>
                                {taskItem.completed ? "✓" : "○"}
                              </span>
                              <span className={taskItem.completed ? "text-gray-500 line-through" : "text-gray-800"}>
                                {taskItem.title}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                )}
                {task.plan.content && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      查看原始内容
                    </summary>
                    <pre className="mt-2 text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {task.plan.content}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {task.development && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  开发实现
                </h2>
                {task.development.parsed?.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{task.development.parsed.title}</h3>
                )}
                {task.development.parsed?.tasks && task.development.parsed.tasks.length > 0 && (
                  <div className="space-y-2">
                    {task.development.parsed.tasks.map((taskItem, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`${taskItem.completed ? "text-green-600" : "text-gray-400"} mt-1`}>
                          {taskItem.completed ? "✓" : "○"}
                        </span>
                        <span className={taskItem.completed ? "text-gray-500 line-through" : "text-gray-900"}>
                          {taskItem.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {task.development.content && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      查看原始内容
                    </summary>
                    <pre className="mt-2 text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {task.development.content}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {task.quality && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  质量检查
                </h2>
                {task.quality.parsed?.title && (
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{task.quality.parsed.title}</h3>
                )}
                {task.quality.parsed?.tasks && task.quality.parsed.tasks.length > 0 && (
                  <div className="space-y-2">
                    {task.quality.parsed.tasks.map((taskItem, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`${taskItem.completed ? "text-green-600" : "text-gray-400"} mt-1`}>
                          {taskItem.completed ? "✓" : "○"}
                        </span>
                        <span className={taskItem.completed ? "text-gray-500 line-through" : "text-gray-900"}>
                          {taskItem.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {task.quality.content && (
                  <details className="mt-4">
                    <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">
                      查看原始内容
                    </summary>
                    <pre className="mt-2 text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {task.quality.content}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {task.metrics && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">指标</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">迭代次数</span>
                    <span className="font-semibold text-gray-900">{task.metrics.iterationCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">工具调用</span>
                    <span className="font-semibold text-gray-900">{task.metrics.totalToolCalls || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">错误数</span>
                    <span className="font-semibold text-red-600">{task.metrics.errors || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {task.progress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">进度</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">当前步骤</p>
                    <p className="text-gray-900">{getStepName(task.progress.currentStep) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">迭代</p>
                    <p className="text-gray-900">{task.progress.iteration || 0}</p>
                  </div>
                  {task.progress.completedSteps && task.progress.completedSteps.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">已完成步骤</p>
                      <ul className="mt-2 space-y-1">
                        {task.progress.completedSteps.map((step, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            {getStepName(step)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
