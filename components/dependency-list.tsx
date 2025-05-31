"use client"
import { useActionState, useEffect, useState, useCallback } from "react"
import { markTaskComplete, type MarkCompleteState } from "@/app/dashboard/dependencies/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Info, Loader2, UserCheck, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface DependencyTask {
  id: string
  title: string | null
  blocked_reason: string | null
  created_at: string
  agent_id: string
  status: string | null
  agents: {
    name: string | null
  } | null
}

interface DependencyListProps {
  tasks: DependencyTask[]
}

export default function DependencyList({ tasks: initialTasks }: DependencyListProps) {
  const [tasks, setTasks] = useState<DependencyTask[]>(initialTasks)
  const [realtimeStatus, setRealtimeStatus] = useState<string>("connecting")
  const supabase = getSupabaseBrowserClient()

  const initialState: MarkCompleteState = {}
  const [state, formAction, isPending] = useActionState(markTaskComplete, initialState)

  const handleTaskUpdate = useCallback((payload: any) => {
    console.log("Task update received via Realtime:", payload)
    const updatedTask = payload.new

    if (payload.eventType === "UPDATE") {
      setTasks((currentTasks) => {
        // If task is no longer a dependency or is done, remove it from the list
        if (!updatedTask.is_dependency || updatedTask.status === "done") {
          return currentTasks.filter((task) => task.id !== updatedTask.id)
        }
        // Otherwise update the task
        return currentTasks.map((task) =>
          task.id === updatedTask.id
            ? {
                ...task,
                title: updatedTask.title,
                blocked_reason: updatedTask.blocked_reason,
                status: updatedTask.status,
              }
            : task,
        )
      })
    } else if (payload.eventType === "INSERT") {
      // New dependency task created
      if (updatedTask.is_dependency && updatedTask.status !== "done") {
        // We'd need to fetch the agent name for this new task
        // For now, we'll add it without the agent name and it will show as "Unnamed Agent"
        const newTask: DependencyTask = {
          id: updatedTask.id,
          title: updatedTask.title,
          blocked_reason: updatedTask.blocked_reason,
          created_at: updatedTask.created_at,
          agent_id: updatedTask.agent_id,
          status: updatedTask.status,
          agents: null, // Would need a separate query to get agent name
        }
        setTasks((currentTasks) => [newTask, ...currentTasks])
      }
    }
  }, [])

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    // Setup Realtime subscription for task updates
    channel = supabase
      .channel("dependency-tasks")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "tasks",
          filter: "is_dependency=eq.true", // Only dependency tasks
        },
        handleTaskUpdate,
      )
      .subscribe((status, err) => {
        setRealtimeStatus(status)
        if (status === "SUBSCRIBED") {
          console.log("Realtime subscribed for dependency tasks!")
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime subscription error for dependency tasks:", status, err)
        }
      })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        console.log("Realtime unsubscribed for dependency tasks.")
      }
    }
  }, [supabase, handleTaskUpdate])

  // Update local tasks when a task is completed via the form action
  useEffect(() => {
    if (state?.success && state.taskId) {
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== state.taskId))
    }
  }, [state])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Real-time updates:</span>
          <Badge
            variant="outline"
            className={`text-xs ${
              realtimeStatus === "SUBSCRIBED"
                ? "bg-green-50 text-green-700 border-green-300"
                : "bg-yellow-50 text-yellow-700 border-yellow-300"
            }`}
          >
            {realtimeStatus === "SUBSCRIBED" ? (
              <>
                <Wifi className="mr-1 h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-3 w-3" />
                {realtimeStatus}
              </>
            )}
          </Badge>
        </div>
      </div>

      {state?.message && !state.error && (
        <Alert className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 !text-green-700 dark:!text-green-300" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {tasks.length === 0 && (
        <Card className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent>
            <UserCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Dependency Basket Empty!</h3>
            <p className="text-gray-500 dark:text-gray-400">"Nothing needs you right now. Enjoy the calm."</p>
          </CardContent>
        </Card>
      )}

      {tasks.map((task) => (
        <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">{task.title || "Untitled Task"}</CardTitle>
            <CardDescription>
              For agent:{" "}
              <Link href={`/dashboard/agents/${task.agent_id}`} className="text-[#007AFF] hover:underline font-medium">
                {task.agents?.name || "Unnamed Agent"}
              </Link>
              <br />
              Waiting since: {new Date(task.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          {task.blocked_reason && (
            <CardContent>
              <div className="flex items-start space-x-2 rounded-md bg-yellow-50 dark:bg-yellow-900/30 p-3 text-sm text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold">Reason:</span> {task.blocked_reason}
                </p>
              </div>
            </CardContent>
          )}
          <CardFooter>
            <form action={formAction} className="w-full">
              <input type="hidden" name="taskId" value={task.id} />
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isPending && state?.taskId === task.id}
              >
                {isPending && state?.taskId === task.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </form>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
