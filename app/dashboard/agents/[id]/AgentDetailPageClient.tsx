"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Edit3,
  Trash2,
  ListChecks,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Loader2,
  TestTube,
  Plus,
  Activity,
  Zap,
  Settings,
  Workflow,
  LinkIcon,
  GitFork,
  Lock,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AgentLogDisplay, { type LogEntry } from "@/components/agent-log-display"
import {
  fetchAgentLogs,
  toggleAgentStatus,
  createTestLog,
  type ToggleAgentStatusResult,
  type CreateTestLogResult,
} from "./actions"
import { executeTaskWithWorker, testWorkerIntegrations, type ExecuteTaskResult } from "./worker-actions"
import { useState, useTransition, useEffect, useCallback } from "react"
import { seedDemoAgentLogs, type SeedLogsResult } from "./seed-logs-action"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import RealtimeStatusIndicator from "@/components/realtime-status-indicator"
import { testRealtimeFeatures, type RealtimeTestResult } from "./test-realtime-action"
import AgentEditForm from "@/components/agent-edit-form"
import TaskCreationForm from "@/components/task-creation-form"
import { deleteAgent } from "./edit-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import TaskFiltersClient from "@/components/task-filters-client" // Import the new component
import TaskExportButton from "@/components/task-export-button" // Import the new export button
import Link from "next/link" // Import Next.js Link for navigation
import AgentCard from "@/components/agent-card" // Import AgentCard

// Define types for Agent and Task for this page
interface AgentDetails {
  id: string
  name: string | null
  template_slug: string | null
  goal: string | null
  status: string | null
  created_at: string
  updated_at: string
  parent_agent_id: string | null // Include parent_agent_id
}

interface Task {
  id: string
  title: string | null
  description?: string | null
  is_dependency: boolean | null
  status: string | null
  blocked_reason: string | null
  created_at: string
  depends_on_task_id?: string | null // Include new dependency fields
  depends_on_agent_id?: string | null // Include new dependency fields
  output_summary?: string | null // Include output_summary
}

// Define a type for child agents (matching AgentCard's Agent prop)
interface ChildAgent {
  id: string
  name: string | null
  template_slug: string | null
  goal: string | null
  status: string | null
  created_at: string
}

// Define a type for simplified agent list for dropdowns
interface SimpleAgent {
  id: string
  name: string | null
}

// Define a type for simplified task list for dropdowns
interface SimpleTask {
  id: string
  title: string | null
  agent_id: string
  output_summary?: string | null // Include output_summary for simple tasks
}

interface PageProps {
  agent: AgentDetails
  tasksData: Task[] // This will now be the potentially filtered list from the server
  agentId: string
  initialTaskQuery?: string
  initialTaskStatus?: string
  userAgents: SimpleAgent[] // Add userAgents prop
  parentAgentName: string | null // Add parentAgentName prop
  childAgents: ChildAgent[] // Add childAgents prop
  allUserAgents: SimpleAgent[] // Pass all user agents for dependency dropdowns
  allUserTasks: SimpleTask[] // Pass all user tasks for dependency dropdowns
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
  paused:
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700",
  completed: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
  error: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
  default: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
}

const taskStatusIcons: Record<string, React.ElementType> = {
  todo: Clock,
  blocked: AlertTriangle,
  done: CheckCircle,
  // Add 'in_progress' if needed
}

const taskStatusColors: Record<string, string> = {
  todo: "text-gray-500 dark:text-gray-400",
  blocked: "text-red-500 dark:text-red-400",
  done: "text-green-500 dark:text-green-400",
  // Add 'in_progress' if needed
}

// AgentLogsSectionWithRealtime remains the same
function AgentLogsSectionWithRealtime({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connecting")
  const supabase = getSupabaseBrowserClient()

  const handleNewLog = useCallback((payload: any) => {
    console.log("New log received via Realtime:", payload.new)
    const newLogData = payload.new

    const newLog: LogEntry = {
      id: newLogData.id,
      timestamp: newLogData.timestamp,
      message: newLogData.message,
      type: newLogData.log_type as LogEntry["type"],
      taskId: newLogData.task_id,
    }

    setLogs((currentLogs) => {
      if (!currentLogs.find((log) => log.id === newLog.id)) {
        return [newLog, ...currentLogs].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
      }
      return currentLogs
    })
  }, [])

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    async function setupSubscription() {
      setIsLoading(true)
      const { logs: initialLogs, error: fetchError } = await fetchAgentLogs(agentId)
      if (fetchError) {
        setError(fetchError)
      } else {
        setLogs(initialLogs || [])
      }
      setIsLoading(false)

      channel = supabase
        .channel(`agent-logs-${agentId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "agent_logs",
            filter: `agent_id=eq.${agentId}`,
          },
          handleNewLog,
        )
        .subscribe((status, err) => {
          setRealtimeStatus(status)
          if (status === "SUBSCRIBED") {
            console.log(`Realtime subscribed for agent ${agentId} logs!`)
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error(`Realtime subscription error for agent ${agentId}:`, status, err)
            setError(`Realtime connection issue: ${status}`)
          }
        })
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        console.log(`Realtime unsubscribed for agent ${agentId} logs.`)
      }
    }
  }, [agentId, supabase, handleNewLog])

  if (error && !isLoading && logs.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Logs</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Realtime:</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              realtimeStatus === "SUBSCRIBED"
                ? "bg-green-50 text-green-700 border-green-300"
                : "bg-yellow-50 text-yellow-700 border-yellow-300"
            }`}
          >
            {realtimeStatus === "SUBSCRIBED" ? "Connected" : realtimeStatus}
          </Badge>
        </div>
      </div>
      <AgentLogDisplay logs={logs} isLoading={isLoading && logs.length === 0} />
    </div>
  )
}

// WorkerIntegrationControls remains the same
function WorkerIntegrationControls({ agentId, agent }: { agentId: string; agent: AgentDetails }) {
  const [workerTestResult, setWorkerTestResult] = useState<ExecuteTaskResult | null>(null)
  const [isTestingWorkers, setIsTestingWorkers] = useState(false)

  const handleTestWorkers = async () => {
    setIsTestingWorkers(true)
    setWorkerTestResult(null)
    const result = await testWorkerIntegrations(agentId)
    setWorkerTestResult(result)
    setIsTestingWorkers(false)
  }

  const handleExecuteTask = async (taskDescription: string) => {
    setWorkerTestResult(null)
    const result = await executeTaskWithWorker(
      agentId,
      `demo_task_${Date.now()}`,
      taskDescription,
      agent.template_slug || "custom",
    )
    setWorkerTestResult(result)
  }

  const sampleTasks = [
    "Analyze the latest sales data and generate insights",
    "Create a workflow to automate customer onboarding",
    "Research competitors and summarize findings",
    "Generate a marketing email campaign",
    "Set up automated reporting pipeline",
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleTestWorkers}
          variant="outline"
          size="sm"
          disabled={isTestingWorkers}
          className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
        >
          {isTestingWorkers ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Workflow className="mr-2 h-4 w-4" />
              Test Integrations
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isTestingWorkers}>
              <Zap className="mr-2 h-4 w-4" />
              Execute Sample Task
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            {sampleTasks.map((task, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => handleExecuteTask(task)}
                disabled={isTestingWorkers}
                className="whitespace-normal h-auto py-2"
              >
                {task}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {workerTestResult && (
        <Alert
          className={`${
            workerTestResult.success
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300"
          }`}
        >
          <AlertTitle>
            {workerTestResult.success ? "Worker Integration Success" : "Worker Integration Error"}
          </AlertTitle>
          <AlertDescription>
            {workerTestResult.message || workerTestResult.error}
            {workerTestResult.success && workerTestResult.integration && (
              <div className="mt-2 text-sm">
                <p>✅ Integration used: {workerTestResult.integration}</p>
                {workerTestResult.executionId && <p>🔗 Execution ID: {workerTestResult.executionId}</p>}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// SeedLogsButton remains the same
function SeedLogsButton({
  agentId,
  setSeedResult,
}: { agentId: string; setSeedResult: (result: SeedLogsResult | null) => void }) {
  const [isSeeding, setIsSeeding] = useState(false)

  const handleSeedLogs = async () => {
    setIsSeeding(true)
    setSeedResult(null)
    const result = await seedDemoAgentLogs(agentId)
    setSeedResult(result)
    setIsSeeding(false)
  }

  return (
    <Button onClick={handleSeedLogs} variant="outline" size="sm" disabled={isSeeding}>
      {isSeeding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Seeding...
        </>
      ) : (
        <>
          <TestTube className="mr-2 h-4 w-4" />
          Seed Demo Logs
        </>
      )}
    </Button>
  )
}

// TestLogButton remains the same
function TestLogButton({
  agentId,
  setTestResult,
}: { agentId: string; setTestResult: (result: CreateTestLogResult | null) => void }) {
  const [isCreating, setIsCreating] = useState(false)

  const createLog = async (type: LogEntry["type"], message: string) => {
    setIsCreating(true)
    setTestResult(null)
    const result = await createTestLog(agentId, type, message)
    setTestResult(result)
    setIsCreating(false)
  }

  const testLogs = [
    { type: "info" as const, message: "Test info log - checking system status" },
    { type: "success" as const, message: "Test success log - operation completed successfully" },
    { type: "error" as const, message: "Test error log - simulated connection timeout" },
    { type: "action" as const, message: "Test action log - processing user request" },
    { type: "milestone" as const, message: "Test milestone log - reached checkpoint" },
    { type: "task_update" as const, message: "Test task update log - status changed to in_progress" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Test Log
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {testLogs.map((log, index) => (
          <DropdownMenuItem key={index} onClick={() => createLog(log.type, log.message)} disabled={isCreating}>
            <span className="capitalize">{log.type}</span>: {log.message.substring(0, 30)}...
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function AgentDetailPageClient({
  agent: initialAgent,
  tasksData, // Renamed from tasks to tasksData to reflect it's from props
  agentId,
  initialTaskQuery,
  initialTaskStatus,
  userAgents, // Destructure userAgents
  parentAgentName, // Destructure parentAgentName
  childAgents, // Destructure childAgents
  allUserAgents, // New prop
  allUserTasks, // New prop
}: PageProps) {
  const [agent, setAgent] = useState<AgentDetails>(initialAgent)
  const [seedResult, setSeedResult] = useState<SeedLogsResult | null>(null)
  const [testResult, setTestResult] = useState<CreateTestLogResult | null>(null)
  const [statusToggleResult, setStatusToggleResult] = useState<ToggleAgentStatusResult | null>(null)
  const [isTogglingStatus, startStatusToggleTransition] = useTransition()
  const [realtimeTestResult, setRealtimeTestResult] = useState<RealtimeTestResult | null>(null)
  const [isTestingRealtime, setIsTestingRealtime] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // tasksData is now the potentially filtered list from the server
  const tasks = tasksData || []
  const statusColorClass = statusColors[agent.status || "default"] || statusColors.default

  const handleToggleStatus = () => {
    startStatusToggleTransition(async () => {
      setStatusToggleResult(null)
      const result = await toggleAgentStatus(agent.id, agent.status || "paused")
      setStatusToggleResult(result)
      if (result.success && result.newStatus) {
        setAgent((prev) => ({ ...prev, status: result.newStatus!, updated_at: new Date().toISOString() }))
      }
    })
  }

  const handleRealtimeTest = async () => {
    setIsTestingRealtime(true)
    setRealtimeTestResult(null)
    const result = await testRealtimeFeatures(agentId)
    setRealtimeTestResult(result)
    setIsTestingRealtime(false)
  }

  const isAgentActive = agent.status === "active"

  const handleDeleteAgent = async () => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const result = await deleteAgent(agent.id)
    if (result.error) {
      alert(`Failed to delete agent: ${result.error}`)
    }
    setIsDeleting(false)
    // If successful, user will be redirected to dashboard by the server action
  }

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      {statusToggleResult?.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Status Change Failed</AlertTitle>
          <AlertDescription>{statusToggleResult.error}</AlertDescription>
        </Alert>
      )}
      {statusToggleResult?.success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 !text-green-700 dark:!text-green-300" />
          <AlertTitle>Status Updated</AlertTitle>
          <AlertDescription>Agent is now {statusToggleResult.newStatus}.</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100">
                {agent.name || "Unnamed Agent"}
              </CardTitle>
              <CardDescription className="mt-1 text-base">
                Type: <span className="capitalize font-medium">{agent.template_slug || "N/A"}</span>
              </CardDescription>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              {agent.status && (
                <Badge variant="outline" className={`capitalize text-sm px-3 py-1 ${statusColorClass}`}>
                  Status: {agent.status}
                </Badge>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(agent.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Goal</h3>
              <p className="text-gray-700 dark:text-gray-300">{agent.goal || "No goal specified."}</p>
            </div>

            {/* Display Parent Agent */}
            {agent.parent_agent_id && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Parent Agent</h3>
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  {parentAgentName ? (
                    <Link href={`/dashboard/agents/${agent.parent_agent_id}`} className="underline hover:no-underline">
                      {parentAgentName}
                    </Link>
                  ) : (
                    "Loading..." // Or "Unknown Parent" if fetching failed
                  )}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              Agent ID: <span className="font-mono">{agent.id}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Created: {new Date(agent.created_at).toLocaleString()}
            </div>
          </div>
          <div className="mt-6 border-t pt-4 flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus || agent.status === "completed" || agent.status === "error"}
            >
              {isTogglingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isAgentActive ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isTogglingStatus ? "Updating..." : isAgentActive ? "Pause Agent" : "Resume Agent"}
            </Button>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Agent
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Agent</DialogTitle>
                  <DialogDescription>Update your agent's name, goal, and behavior settings.</DialogDescription>
                </DialogHeader>
                <AgentEditForm
                  agentId={agent.id}
                  currentName={agent.name || ""}
                  currentGoal={agent.goal || ""}
                  currentParentAgentId={agent.parent_agent_id} // Pass current parent ID
                  userAgents={userAgents} // Pass user agents for dropdown
                  onSuccess={() => {
                    setIsEditDialogOpen(false)
                    window.location.reload()
                  }}
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button variant="destructive" size="sm" onClick={handleDeleteAgent} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? "Deleting..." : "Delete Agent"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* New Worker Integration Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#007AFF]" />
            <CardTitle>Worker Integrations</CardTitle>
          </div>
          <CardDescription>
            Test and execute tasks using n8n workflows and Lyzr AI agents. Configure your API keys in Settings to enable
            these integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkerIntegrationControls agentId={agentId} agent={agent} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-[#007AFF]" />
                <CardTitle>Tasks</CardTitle>
              </div>
              <div className="flex gap-2">
                {" "}
                {/* Group buttons */}
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>Add a new task for {agent.name || "this agent"} to work on.</DialogDescription>
                    </DialogHeader>
                    <TaskCreationForm
                      agentId={agent.id}
                      onSuccess={(taskId) => {
                        setIsTaskDialogOpen(false)
                        window.location.reload()
                      }}
                      onCancel={() => setIsTaskDialogOpen(false)}
                      allUserAgents={allUserAgents} // Pass to form
                      allUserTasks={allUserTasks} // Pass to form
                    />
                  </DialogContent>
                </Dialog>
                <TaskExportButton agentId={agentId} agentName={agent.name || "Unnamed Agent"} />{" "}
                {/* Add export button */}
              </div>
            </div>
            <CardDescription>Tasks assigned to or managed by this agent.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Add TaskFiltersClient here */}
            <TaskFiltersClient initialTaskQuery={initialTaskQuery} initialTaskStatus={initialTaskStatus} />
            {tasks && tasks.length > 0 ? (
              <ul className="space-y-3 mt-4">
                {tasks.map((task) => {
                  const TaskIcon = taskStatusIcons[task.status || "todo"] || Clock
                  const taskColor = taskStatusColors[task.status || "todo"] || "text-gray-500"

                  // Find dependent task and agent names
                  const dependentTask = task.depends_on_task_id
                    ? allUserTasks.find((t) => t.id === task.depends_on_task_id)
                    : null
                  const dependentAgent = task.depends_on_agent_id
                    ? allUserAgents.find((a) => a.id === task.depends_on_agent_id)
                    : null

                  return (
                    <li
                      key={task.id}
                      className="p-3 border rounded-md bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{task.title}</span>
                        <div className={`flex items-center gap-1 text-xs capitalize ${taskColor}`}>
                          {task.status === "blocked" && <Lock className="h-3.5 w-3.5 text-red-500" />}
                          <TaskIcon className="h-3.5 w-3.5" />
                          {task.status || "todo"}
                        </div>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}
                      {task.is_dependency && !task.depends_on_task_id && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs border-orange-400 text-orange-600 dark:border-orange-600 dark:text-orange-400"
                        >
                          Human Approval Needed
                        </Badge>
                      )}
                      {task.depends_on_task_id && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <LinkIcon className="h-3.5 w-3.5" />
                          <span>
                            Depends on:{" "}
                            <Link
                              href={`/dashboard/agents/${dependentAgent?.id}/?taskQuery=${dependentTask?.title}`}
                              className="underline hover:no-underline font-medium"
                            >
                              {dependentTask?.title || "Unknown Task"}
                            </Link>{" "}
                            (from{" "}
                            <Link
                              href={`/dashboard/agents/${dependentAgent?.id}`}
                              className="underline hover:no-underline font-medium"
                            >
                              {dependentAgent?.name || "Unknown Agent"}
                            </Link>
                            )
                          </span>
                        </div>
                      )}
                      {task.depends_on_task_id && dependentTask?.output_summary && (
                        <div className="mt-2 p-2 border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-semibold flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Prerequisite Output:
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{dependentTask.output_summary}</p>
                        </div>
                      )}
                      {task.status === "blocked" && task.blocked_reason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Reason: {task.blocked_reason}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                {initialTaskQuery || (initialTaskStatus && initialTaskStatus !== "all")
                  ? "No tasks match the current filters."
                  : "No tasks found for this agent yet."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-[#007AFF]" />
                <CardTitle>Agent Log</CardTitle>
                <RealtimeStatusIndicator className="ml-2" />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRealtimeTest}
                  variant="outline"
                  size="sm"
                  disabled={isTestingRealtime}
                  className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  {isTestingRealtime ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Activity className="mr-2 h-4 w-4" />
                      Full Test
                    </>
                  )}
                </Button>
                <TestLogButton agentId={agentId} setTestResult={setTestResult} />
                <SeedLogsButton agentId={agentId} setSeedResult={setSeedResult} />
              </div>
            </div>
            <CardDescription>Recent activity and logs from this agent (updates in real-time).</CardDescription>
            {seedResult && (
              <Alert
                className={`mt-2 ${seedResult.success ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300"}`}
              >
                <AlertTitle>{seedResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{seedResult.message || seedResult.error}</AlertDescription>
              </Alert>
            )}
            {testResult && (
              <Alert
                className={`mt-2 ${testResult.success ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300"}`}
              >
                <AlertTitle>{testResult.success ? "Test Log Created" : "Error"}</AlertTitle>
                <AlertDescription>
                  {testResult.success
                    ? "Test log created successfully! It should appear above in real-time."
                    : testResult.error}
                </AlertDescription>
              </Alert>
            )}
            {realtimeTestResult && (
              <Alert
                className={`mt-2 ${realtimeTestResult.success ? "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/50 dark:border-purple-700 dark:text-purple-300" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300"}`}
              >
                <AlertTitle>{realtimeTestResult.success ? "Real-time Test Completed" : "Test Error"}</AlertTitle>
                <AlertDescription>
                  {realtimeTestResult.message || realtimeTestResult.error}
                  {realtimeTestResult.success && (
                    <div className="mt-2 text-sm">
                      <p>✅ Logs should appear above in real-time</p>
                      <p>✅ New dependency should appear in Dependency Basket</p>
                      <p>✅ Slack notification should be sent</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <AgentLogsSectionWithRealtime agentId={agentId} />
          </CardContent>
        </Card>
      </div>

      {/* New Child Agents Section */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitFork className="h-6 w-6 text-[#007AFF]" />
            <CardTitle>Child Agents</CardTitle>
          </div>
          <CardDescription>Agents that report to or are managed by this agent.</CardDescription>
        </CardHeader>
        <CardContent>
          {childAgents && childAgents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {childAgents.map((childAgent) => (
                <AgentCard key={childAgent.id} agent={childAgent} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">No child agents found for this agent yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
