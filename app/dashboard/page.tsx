"use client"

import { useState, useEffect } from "react"
import {
  CheckCircleIcon,
  PlusCircle,
  Settings,
  Zap,
  ArrowRight,
  Clock,
  Activity,
  FileText,
  Bot,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { completeTaskAndMoveToHistory } from "@/app/dashboard/dependencies/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useActionState } from "react"
import { AgentWorkingIndicator } from "@/components/agent-working-indicator"

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { query?: string; status?: string; newAgent?: string }
}) {
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "mock">("checking")
  const [agents, setAgents] = useState<any[]>([])
  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form state for task completion
  const [state, formAction, isPending] = useActionState(completeTaskAndMoveToHistory, undefined)

  // Check connection status and load data
  useEffect(() => {
    const checkConnectionAndLoadData = async () => {
      try {
        const supabase = getSupabaseBrowserClient()

        // Test real connection
        const { data, error } = await supabase.from("agents").select("*").limit(1)

        if (!error) {
          setConnectionStatus("connected")
          console.log("✅ Database connection successful")

          // Load real data
          await loadRealData()
        } else {
          console.warn("⚠️ Database connection failed, using mock mode:", error)
          setConnectionStatus("mock")
          loadMockData()
        }
      } catch (error) {
        console.error("❌ Connection check failed:", error)
        setConnectionStatus("mock")
        loadMockData()
      } finally {
        setLoading(false)
      }
    }

    checkConnectionAndLoadData()
  }, [])

  // Reload data when task is completed
  useEffect(() => {
    if (state?.success) {
      console.log("🔄 Task completed, reloading data...")
      loadRealData()
    }
  }, [state])

  const loadRealData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()

      // Load agents
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false })

      if (!agentsError && agentsData) {
        setAgents(agentsData)
      }

      // Load active tasks - Tasks that user has moved from dependencies and is working on
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          agents (
            id,
            name,
            owner_id
          )
        `)
        .eq("is_dependency", false) // Tasks moved from dependencies
        .eq("status", "in_progress") // Currently being worked on
        .order("created_at", { ascending: false })

      if (!tasksError && tasksData) {
        // Filter to only show tasks for current user's agents
        const userTasks = tasksData.filter((task) => task.agents?.owner_id && task.metadata?.moved_to_tasks)
        setActiveTasks(userTasks)
        console.log("✅ Active tasks loaded:", userTasks.length)
        console.log("📋 Active tasks data:", userTasks)
      } else {
        console.error("❌ Error loading tasks:", tasksError)
        setActiveTasks([])
      }

      console.log("✅ Real data loaded successfully")
    } catch (error) {
      console.error("❌ Failed to load real data:", error)
      loadMockData()
    }
  }

  const loadMockData = () => {
    // Use empty arrays for mock data to show accurate empty states
    setAgents([])
    setActiveTasks([])
    console.log("🔄 Using mock data (empty states)")
  }

  const newAgentId = searchParams?.newAgent

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] mb-4">
            <div className="h-8 w-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#8e8e93] dark:text-[#aeaeb2] font-medium">Connecting to database...</p>
        </div>
      </div>
    )
  }

  // Filter out tasks that are being completed
  const filteredTasks = activeTasks.filter((task) => !(isPending && state?.taskId === task.id))

  const renderTaskList = (tasks: any[]) => {
    // Show working agents at the top
    const workingAgents = agents.filter((agent) => agent.status === "active" && agent.metadata?.auto_working === true)

    if (tasks.length === 0 && workingAgents.length === 0) {
      return (
        <div className="text-center py-16 px-4">
          <div className="h-20 w-20 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-5 shadow-sm">
            <FileText className="h-10 w-10 text-[#34c759]" />
          </div>
          <p className="font-medium text-xl text-[#1c1c1e] dark:text-white mb-2">No Active Tasks</p>
          <p className="text-[#8e8e93] dark:text-[#aeaeb2] max-w-md mx-auto mb-6">
            You don't have any tasks to work on right now. Visit the Dependencies page to review what your agents need
            help with and move tasks to your workload.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/dependencies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Clock className="h-4 w-4" />
              View Dependencies
            </Link>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create Agent
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Working Agents Section */}
        {workingAgents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Agents Currently Working ({workingAgents.length})
              </h3>
            </div>
            <div className="grid gap-3">
              {workingAgents.map((agent) => (
                <AgentWorkingIndicator
                  key={agent.id}
                  agentId={agent.id}
                  agentName={agent.name}
                  workingStatus={agent.metadata?.workflow_status}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Tasks Section */}
        {tasks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Active Tasks ({tasks.length})
              </h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                From Dependencies
              </Badge>
            </div>
            <div className="grid gap-4">
              {tasks.map((task) => (
                <Card
                  key={task.id}
                  className="border border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/50 transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <form action={formAction} className="mt-1">
                        <input type="hidden" name="taskId" value={task.id} />
                        <Checkbox
                          className="h-5 w-5 rounded border-2 border-blue-400 text-blue-600 focus:ring-blue-500"
                          disabled={isPending && state?.taskId === task.id}
                          onChange={(e) => {
                            if (e.target.checked) {
                              e.target.closest("form")?.requestSubmit()
                            }
                          }}
                        />
                      </form>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{task.title || "Untitled Task"}</h4>
                          {isPending && state?.taskId === task.id && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Completing...
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {task.agents?.name || "Unnamed Agent"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Moved {new Date(task.metadata?.moved_at).toLocaleDateString()}
                          </span>
                        </div>
                        {task.metadata?.user_notes && (
                          <div className="bg-white/60 p-3 rounded-lg border border-blue-200/50 mb-3">
                            <p className="text-sm text-gray-700">{task.metadata.user_notes}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {task.metadata?.priority && (
                            <Badge
                              variant="outline"
                              className={`
                                ${
                                  task.metadata.priority === "urgent"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : task.metadata.priority === "high"
                                      ? "bg-orange-50 text-orange-700 border-orange-200"
                                      : task.metadata.priority === "medium"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-green-50 text-green-700 border-green-200"
                                }
                              `}
                            >
                              {task.metadata.priority}
                            </Badge>
                          )}
                          {task.metadata?.deadline && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              Due: {new Date(task.metadata.deadline).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 mb-3">
                ✅ Check the box when you've completed your research and work
              </p>
              <Link
                href="/dashboard/dependencies"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowRight className="h-4 w-4" />
                View completed tasks in Dependencies history
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Connection Status Alert */}
      {connectionStatus === "connected" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert className="bg-[#e1f0ff]/80 border border-[#5ac8fa]/30 text-[#0071e3] dark:bg-[#0d253a]/80 dark:border-[#0091ff]/30 dark:text-[#5ac8fa] rounded-2xl backdrop-blur-sm shadow-sm">
            <CheckCircleIcon className="h-5 w-5" />
            <AlertTitle className="font-medium text-base">Database Connected</AlertTitle>
            <AlertDescription className="text-[#0071e3]/80 dark:text-[#5ac8fa]/80">
              Successfully connected to Supabase. All features are now available.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Header Section */}
      <div>
        <motion.h1
          className="text-3xl font-semibold text-[#1c1c1e] dark:text-white"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Welcome to AgentFlow
        </motion.h1>
        <motion.p
          className="text-[#636366] dark:text-[#aeaeb2] text-lg mt-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {connectionStatus === "connected"
            ? "Manage your AI agents and complete dependency tasks"
            : "Database connection in progress - some features may be limited"}
        </motion.p>
      </div>

      {/* New Agent Alert */}
      {newAgentId && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert className="bg-[#e1f0ff]/80 border border-[#5ac8fa]/30 text-[#0071e3] dark:bg-[#0d253a]/80 dark:border-[#0091ff]/30 dark:text-[#5ac8fa] rounded-2xl backdrop-blur-sm shadow-sm">
            <CheckCircleIcon className="h-5 w-5" />
            <AlertTitle className="font-medium text-base">Agent Deployed</AlertTitle>
            <AlertDescription className="text-[#0071e3]/80 dark:text-[#5ac8fa]/80">
              Your new agent has been successfully created and initial tasks are being set up.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Success/Error Messages */}
      {state?.message && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert
            className={`rounded-2xl backdrop-blur-sm shadow-sm ${
              state.success
                ? "bg-green-50/80 border border-green-200/50 text-green-700 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-400"
                : "bg-red-50/80 border border-red-200/50 text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400"
            }`}
          >
            <CheckCircleIcon className="h-5 w-5" />
            <AlertTitle className="font-medium text-base">{state.success ? "Task Completed!" : "Error"}</AlertTitle>
            <AlertDescription>
              {state.message}
              {state.success && (
                <div className="mt-2">
                  <Link href="/dashboard/dependencies?tab=completed" className="text-blue-600 hover:underline">
                    View in completed history
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tasks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="overflow-hidden border border-[#e5e5ea]/50 dark:border-[#3a3a3c]/50 rounded-2xl shadow-sm bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#f9f9f9]/90 to-[#f2f2f7]/90 dark:from-[#2c2c2e]/90 dark:to-[#3a3a3c]/90 border-b border-[#e5e5ea]/50 dark:border-[#3a3a3c]/50 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0091ff] to-[#0066cc] flex items-center justify-center shadow-sm">
                  <CheckCircleIcon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold">Your Workspace</CardTitle>
              </div>
              <Link
                href="/dashboard/dependencies"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0071e3] dark:text-[#0091ff] bg-white dark:bg-[#1c1c1e] border border-[#d1d1d6] dark:border-[#3a3a3c] rounded-lg hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors"
              >
                <Clock className="h-4 w-4" />
                View Dependencies
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">{renderTaskList(filteredTasks)}</CardContent>
        </Card>
      </motion.div>

      {/* Agents Section Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold text-[#1c1c1e] dark:text-white">Your Agents</h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98] flex-1 md:flex-none"
          >
            <PlusCircle className="h-4 w-4" />
            New Agent
          </Link>
          <Link
            href="/dashboard/agents/manage"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#d1d1d6] bg-white hover:bg-[#f2f2f7] text-[#1c1c1e] font-medium rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] flex-1 md:flex-none"
          >
            <Settings className="h-4 w-4" />
            Manage Agents
          </Link>
        </div>
      </div>

      {/* Agents Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {agents.length === 0 ? (
          <Card className="border-2 border-dashed border-[#d1d1d6]/50 dark:border-[#48484a]/50 rounded-2xl bg-[#f9f9f9]/80 dark:bg-[#2c2c2e]/80 overflow-hidden backdrop-blur-sm shadow-sm">
            <CardContent className="py-16 px-8 flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0091ff] to-[#0066cc] flex items-center justify-center mb-6 shadow-md">
                <Zap className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1c1c1e] dark:text-white mb-3">
                {connectionStatus === "connected" ? "No Agents Yet" : "Getting Started"}
              </h3>
              <p className="text-[#8e8e93] dark:text-[#aeaeb2] mb-8 max-w-md mx-auto leading-relaxed text-center">
                {connectionStatus === "connected"
                  ? "Create your first AI agent to start automating your workflows."
                  : "Database connection established. Ready to create your first agent?"}
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[#0071e3] hover:bg-[#0077ED] text-white shadow-md px-8 font-medium border-0"
                >
                  <Link
                    href="/dashboard/agents/new"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Create Your First Agent
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className="border border-[#e5e5ea]/50 dark:border-[#3a3a3c]/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-sm overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-[#1c1c1e] dark:text-white">
                    {agent.name || "Unnamed Agent"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-[#8e8e93] dark:text-[#aeaeb2] line-clamp-2 mb-4">{agent.goal}</p>
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        agent.status === "active"
                          ? "bg-green-50/80 text-green-700 border-green-200/50"
                          : agent.status === "paused"
                            ? "bg-yellow-50/80 text-yellow-700 border-yellow-200/50"
                            : "bg-gray-50/80 text-gray-700 border-gray-200/50"
                      } px-3 py-1 capitalize
                    `}
                  >
                    {agent.status === "active" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                    )}
                    {agent.status}
                  </Badge>
                </CardContent>
                <CardFooter className="pt-0 border-t border-[#e5e5ea]/30 dark:border-[#3a3a3c]/30">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-[#0071e3] dark:text-[#0091ff] hover:bg-[#0071e3]/5 dark:hover:bg-[#0091ff]/10"
                  >
                    <Link href={`/dashboard/agents/${agent.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
