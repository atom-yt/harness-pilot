"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Task {
  id: string
  type: string
  status: string
  title?: string
  startTime: string
  endTime?: string
  metrics?: {
    iterationCount?: number
    totalToolCalls?: number
    errors?: number
  }
}

interface Stats {
  total: number
  completed: number
  inProgress: number
  failed: number
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, inProgress: 0, failed: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        setTasks(Object.values(data.tasks) as Task[])
        setStats(data.stats)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading analytics:", err)
        setLoading(false)
      })
  }, [])

  const getStatusData = () => {
    return [
      { name: "Completed", value: stats.completed },
      { name: "In Progress", value: stats.inProgress },
      { name: "Failed", value: stats.failed },
    ]
  }

  const getTypeData = () => {
    const typeCounts = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
  }

  const getDurationData = () => {
    return tasks
      .filter(task => task.startTime && task.endTime)
      .map(task => {
        const start = new Date(task.startTime).getTime()
        const end = new Date(task.endTime!).getTime()
        const duration = Math.round((end - start) / 1000 / 60) // minutes
        return {
          id: task.id,
          duration: duration > 0 ? duration : 0,
          type: task.type,
        }
      })
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 10)
  }

  const getMetricsData = () => {
    return tasks
      .filter(task => task.metrics)
      .map(task => ({
        id: task.id,
        iterations: task.metrics?.iterationCount || 0,
        toolCalls: task.metrics?.totalToolCalls || 0,
        errors: task.metrics?.errors || 0,
      }))
      .slice(0, 10)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Task performance and statistics</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTypeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Duration (Top 10)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDurationData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="id" type="category" width={150} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => `${value} min`} />
                <Bar dataKey="duration" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMetricsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="iterations" stroke="#3B82F6" name="Iterations" />
                <Line type="monotone" dataKey="toolCalls" stroke="#10B981" name="Tool Calls" />
                <Line type="monotone" dataKey="errors" stroke="#EF4444" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {stats.total === 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600">No data available for analytics</p>
          </div>
        )}
      </main>
    </div>
  )
}
