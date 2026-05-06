"use client"

import { useEffect, useState } from "react"
import { Activity, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react"

interface Task {
  id: string
  type: string
  status: string
  title?: string
  startTime: string
  endTime?: string
}

interface Stats {
  total: number
  completed: number
  inProgress: number
  failed: number
}

function getStatusName(status: string) {
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

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, failed: 0 })
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        setStats(data.stats)
        const tasks = Object.values(data.tasks) as Task[]
        setRecentTasks(tasks.slice(0, 5))
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading dashboard:", err)
        setLoading(false)
      })
  }, [])

  const statCards = [
    { name: "任务总数", value: stats.total, icon: Activity, color: "bg-blue-500" },
    { name: "已完成", value: stats.completed, icon: CheckCircle, color: "bg-green-500" },
    { name: "进行中", value: stats.inProgress, icon: Clock, color: "bg-yellow-500" },
    { name: "失败", value: stats.failed, icon: XCircle, color: "bg-red-500" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Harness Pilot 控制台</h1>
          <p className="text-gray-600">监控和管理自动化任务</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => (
                <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">最近任务</h2>
                <a href="/tasks" className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="divide-y divide-gray-200">
                {recentTasks.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">暂无任务</div>
                ) : (
                  recentTasks.map((task) => (
                    <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{task.title || task.type}</p>
                          <p className="text-sm text-gray-500">{task.id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.status === "completed" ? "bg-green-100 text-green-800" :
                          task.status === "running" || task.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                          task.status === "failed" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getStatusName(task.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
