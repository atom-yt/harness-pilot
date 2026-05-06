"use client"

import { useEffect, useState } from "react"
import { Filter, Search, Clock, CheckCircle, XCircle, PlayCircle, AlertCircle } from "lucide-react"

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
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        setTasks(Object.values(data.tasks) as Task[])
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading tasks:", err)
        setLoading(false)
      })
  }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === "all" || task.status === filter
    const matchesSearch = 
      (task.title || "").toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      task.type.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "running":
      case "in-progress":
        return <PlayCircle className="w-5 h-5 text-blue-600" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "paused":
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      running: "bg-blue-100 text-blue-800",
      "in-progress": "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      paused: "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800",
    }
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">任务列表</h1>
          <p className="text-gray-600">查看和筛选所有自动化任务</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索任务..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="running">运行中</option>
                <option value="in-progress">进行中</option>
                <option value="failed">失败</option>
                <option value="paused">暂停</option>
                <option value="pending">待定</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">加载任务中...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">未找到任务</div>
            ) : (
              filteredTasks.map((task) => (
                <a
                  key={task.id}
                  href={`/task/${task.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <p className="font-medium text-gray-900">{task.title || task.type}</p>
                        <p className="text-sm text-gray-500">{task.id}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="bg-gray-100 px-2 py-1 rounded">{task.type}</span>
                          {task.mode && (
                            <span className="bg-gray-100 px-2 py-1 rounded">{task.mode}</span>
                          )}
                          {task.context?.language && (
                            <span className="bg-gray-100 px-2 py-1 rounded">{task.context.language}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                        {getStatusName(task.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(task.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
