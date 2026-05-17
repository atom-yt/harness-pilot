import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

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
    requirement?: { completed: boolean; time?: string }
    sdd?: { completed: boolean; file?: string; version?: string }
    development?: { completed: boolean; filesChanged?: number; duration?: string }
    review?: { completed: boolean; result?: string; comments?: number; duration?: string }
    test?: { completed: boolean; pending?: boolean }
    ci?: { completed: boolean; pending?: boolean }
  }
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

interface TrackerData {
  tasks: Record<string, Task>
  stats: {
    total: number
    completed: number
    inProgress: number
    failed: number
  }
  lastUpdated: string
}

export async function GET() {
  try {
    const trackerPath = join(process.cwd(), '../tracker/task-tracker.json')
    const fileContents = await readFile(trackerPath, 'utf-8')
    const data: TrackerData = JSON.parse(fileContents)

    const tasks = data.tasks || {}
    const taskList = Object.values(tasks)

    const stats = {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'running' || t.status === 'in-progress').length,
      failed: taskList.filter(t => t.status === 'failed').length,
    }

    return NextResponse.json({
      tasks,
      stats,
      lastUpdated: data.lastUpdated,
    })
  } catch (error) {
    console.error('Error reading task tracker:', error)
    return NextResponse.json(
      {
        error: 'Failed to load task data',
        tasks: {},
        stats: { total: 0, completed: 0, inProgress: 0, failed: 0 },
      },
      { status: 500 }
    )
  }
}