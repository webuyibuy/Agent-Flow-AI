"use client"

import { useState, useEffect, useCallback, useActionState } from "react"
import {
  CheckCircleIcon,
  PlusCircle,
  ArrowRight,
  Clock,
  FileText,
  Bot,
  Loader2,
  AlertTriangle,
  Zap,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { completeTaskAndMoveToHistory } from "@/app/dashboard/dependencies/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: { created?: string }
}) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error" | "unauthenticated">(
    "checking",
  )
  const [agents, setAgents] = useState<any[]>([])
  const [activeTasks, setActiveTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const [completionState, completeTaskFormAction, isCompletingTask] = useActionState(
    completeTaskAndMoveToHistory,
    undefined,
  )

  // Auth handling
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const fetchUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          setConnectionStatus("unauthenticated")
          setLoading(false)
          router.push("/login")
          return
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setConnectionStatus("unauthenticated")
          setLoading(false)
          router.push("/login")
          return
        }

        setCurrentUser(user)
        setAuthError(null)
      } catch (error: any) {
        setAuthError(`Authentication failed: ${error.message}`)
        setConnectionStatus("error")
        setLoading(false)
      }
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null)
        setConnectionStatus("unauthenticated")
        router.push("/login")
      } else if (event === "SIGNED_IN" && session?.user) {
        setCurrentUser(session.user)
        setAuthError(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Data loading
  const loadData = useCallback(async (user: User) => {
    if (!user) return

    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (agentsError) {
        console.error("Error loading agents:", agentsError.message)
        setAgents([])
      } else {
        setAgents(agentsData || [])
      }

      // Fetch user's active tasks (from dependencies)
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          agents!inner(id, name, owner_id)
        `)
        .eq("agents.owner_id", user.id)
        .eq("is_dependency", false)
        .eq("status", "in_progress")
        .eq("metadata->>moved_to_tasks", "true")
        .eq("metadata->>workflow_status", "user_working")
        .order("created_at", { ascending: false })

      if (tasksError) {
        console.error("Error loading active tasks:", tasksError.message)
        setActiveTasks([])
      } else {
        setActiveTasks(tasksData || [])
      }

      setConnectionStatus("connected")
    } catch (error: any) {
      console.error("Critical error in loadData:", error.message)
      setConnectionStatus("error")
      setAgents([])
      setActiveTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadData(currentUser)
    }
  }, [currentUser, loadData])

  // Handle task completion
  useEffect(() => {
    if (completionState?.success && completionState.taskId) {
      setActiveTasks((prevTasks) => prevTasks.filter((task) => task.id !== completionState.taskId))
    }
  }, [completionState])

  const isNewlyCreated = searchParams?.created === "true"

  // Loading state
  if (loading && connectionStatus === "checking") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (connectionStatus === "error" || authError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{authError || "Please try refreshing the page."}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Unauthenticated state
  if (connectionStatus === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Success message for new agent */}
      {isNewlyCreated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircleIcon className="h-5 w-5" />
            <AlertTitle className="font-medium">🎉 Agent Created Successfully!</AlertTitle>
            <AlertDescription>
              Your agent is now analyzing your goal and starting to work. You'll see its thinking process below.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Task completion feedback */}
      {completionState?.message && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Alert
            className={
              completionState.success
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }
          >
            <CheckCircleIcon className="h-5 w-5" />
            <AlertTitle>{completionState.success ? "Task Completed!" : "Error"}</AlertTitle>
            <AlertDescription>{completionState.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Header */}
      <div className="space-y-6 sm:space-y-8">
        <div className="px-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Your AI Workspace</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your agents and complete tasks they need help with
          </p>
        </div>
      </div>

      {/* User Tasks Section - Clean Apple Design */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Tasks for You ({activeTasks.length})</CardTitle>
            </div>
            <Link
              href="/dashboard/dependencies"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Clock className="h-4 w-4" />
              View All Dependencies
            </Link>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-gray-900">
          {activeTasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks for you right now</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your agents are working autonomously. When they need your help, tasks will appear here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard/dependencies"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  Check Dependencies
                </Link>
                <Link
                  href="/dashboard/agents/new"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Another Agent
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <form action={completeTaskFormAction} className="mt-1">
                      <input type="hidden" name="taskId" value={task.id} />
                      <Checkbox
                        id={`task-checkbox-${task.id}`}
                        className="h-5 w-5 rounded border-2 border-blue-400 text-blue-600"
                        disabled={isCompletingTask && completionState?.taskId === task.id}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const formElement = document.getElementById(`task-checkbox-${task.id}`)?.closest("form")
                            if (formElement) {
                              formElement.requestSubmit()
                            }
                          }
                        }}
                      />
                    </form>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        {isCompletingTask && completionState?.taskId === task.id && (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                          >
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Completing...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {task.agents?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.metadata?.moved_at ? new Date(task.metadata.moved_at).toLocaleDateString() : "Recently"}
                        </span>
                      </div>
                      {task.metadata?.user_notes && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 p-2 rounded">
                          {task.metadata.user_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  ✅ Check the box when you complete a task
                </p>
                <Link
                  href="/dashboard/dependencies"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  <ArrowRight className="h-4 w-4" />
                  View all dependencies
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agents Overview */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Agents ({agents.length})</h2>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardContent className="py-16 text-center">
            <Zap className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Create Your First AI Agent</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Tell your agent what you want to achieve, and it will start working immediately while showing you its
              thinking process.
            </p>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              Create Your First Agent
              <ArrowRight className="h-5 w-5" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">{agent.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{agent.goal}</p>
                  </div>
                  <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/dashboard/agents/${agent.id}`}
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View Details <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
