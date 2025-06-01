"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { startAgentExecution, stopAgentExecution } from "./execution-actions"
import { createTask } from "./task-actions"
import { AlertCircle, CheckCircle, Clock, Play, Square } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  agent_id: string
  priority: number
  due_date: string | null
  assigned_to: string | null
  completion_percentage: number
}

interface Agent {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  owner_id: string
  type: string
  config: any
}

interface AgentDetailPageClientProps {
  agent: Agent
  tasksData: Task[]
  agentId: string
}

export default function AgentDetailPageClient({ agent, tasksData, agentId }: AgentDetailPageClientProps) {
  const [tasks, setTasks] = useState<Task[]>(tasksData)
  const [activeTab, setActiveTab] = useState("overview")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLogs, setExecutionLogs] = useState<string[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "paused":
        return <Badge className="bg-yellow-500">Paused</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500">Failed</Badge>
      case "executing":
        return <Badge className="bg-purple-500">Executing</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  // Handle agent execution
  const handleStartExecution = async () => {
    setIsExecuting(true)
    setExecutionLogs((prev) => [...prev, "🚀 Initializing AI execution engine..."])

    try {
      const result = await startAgentExecution(agentId)
      if (result.success) {
        setExecutionLogs((prev) => [
          ...prev,
          "✅ Agent execution started successfully",
          "🧠 AI engine is now processing tasks",
          "📊 Monitor progress in real-time below",
          ...(result.logs || []),
        ])
      } else {
        setExecutionLogs((prev) => [...prev, `❌ Execution error: ${result.error}`])
      }
    } catch (error) {
      console.error("Execution error:", error)
      setExecutionLogs((prev) => [
        ...prev,
        `❌ Execution failed: ${error instanceof Error ? error.message : String(error)}`,
      ])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleStopExecution = async () => {
    try {
      const result = await stopAgentExecution(agentId)
      setExecutionLogs((prev) => [...prev, result.message])
    } catch (error) {
      console.error("Stop execution error:", error)
      setExecutionLogs((prev) => [
        ...prev,
        `Failed to stop execution: ${error instanceof Error ? error.message : String(error)}`,
      ])
    }
    setIsExecuting(false)
  }

  // Handle task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    try {
      const result = await createTask({
        agentId,
        title: newTaskTitle,
        description: newTaskDescription,
        priority: 1,
      })

      if (result.success && result.task) {
        setTasks((prev) => [result.task, ...prev])
        setNewTaskTitle("")
        setNewTaskDescription("")
      }
    } catch (error) {
      console.error("Task creation error:", error)
    }
  }

  // Task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{agent.name}</CardTitle>
              <CardDescription className="mt-1">{agent.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(agent.status)}
              {isExecuting ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopExecution}
                  className="flex items-center gap-1"
                >
                  <Square className="h-4 w-4" />
                  Stop AI Execution
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartExecution}
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  <Play className="h-4 w-4" />
                  Start AI Execution
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="execution">Execution Logs</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Agent Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Type:</dt>
                        <dd>{agent.type || "Standard"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Created:</dt>
                        <dd>{new Date(agent.created_at).toLocaleDateString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Last Updated:</dt>
                        <dd>{new Date(agent.updated_at).toLocaleDateString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Status:</dt>
                        <dd>{getStatusBadge(agent.status)}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Total Tasks:</dt>
                        <dd>{tasks.length}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Completed:</dt>
                        <dd>{tasks.filter((t) => t.status === "completed").length}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">In Progress:</dt>
                        <dd>{tasks.filter((t) => t.status === "in_progress").length}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500">Pending:</dt>
                        <dd>{tasks.filter((t) => t.status === "pending").length}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasks</CardTitle>
                  <CardDescription>Manage tasks for this agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTask} className="mb-4 space-y-2">
                    <input
                      type="text"
                      placeholder="New task title"
                      className="w-full p-2 border rounded"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <textarea
                      placeholder="Task description (optional)"
                      className="w-full p-2 border rounded"
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      rows={2}
                    />
                    <Button type="submit">Add Task</Button>
                  </form>

                  <div className="space-y-2 mt-4">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div key={task.id} className="p-3 border rounded hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {getTaskStatusIcon(task.status)}
                                {task.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                            </div>
                            <Badge>{task.status}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">No tasks yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Execution Logs</CardTitle>
                  <CardDescription>Real-time agent execution logs</CardDescription>
                </CardHeader>
                <CardContent>
                  {isExecuting && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="font-medium">AI Agent is actively working...</span>
                      </div>
                    </div>
                  )}
                  <ScrollArea className="h-[400px] border rounded p-2 bg-gray-50">
                    {executionLogs.length > 0 ? (
                      <div className="space-y-1 font-mono text-sm">
                        {executionLogs.map((log, i) => (
                          <div key={i} className="py-1">
                            <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No execution logs yet. Click "Start AI Execution" to begin.
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agent Configuration</CardTitle>
                  <CardDescription>View and edit agent configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(agent.config || {}, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
