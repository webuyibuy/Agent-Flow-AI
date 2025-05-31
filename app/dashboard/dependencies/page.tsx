import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DependencyList, { type DependencyTask } from "@/components/dependency-list"
import { Suspense } from "react"
import type { Metadata } from "next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Info } from "lucide-react"
import RealtimeStatusIndicator from "@/components/realtime-status-indicator"

export const metadata: Metadata = {
  title: "Dependency Basket - AgentFlow",
}

async function FetchDependencies() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should ideally be caught by a layout or middleware protecting /dashboard routes
    redirect("/login")
  }

  // Fetch tasks that are dependencies, not done, and belong to the user's agents
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      blocked_reason,
      created_at,
      agent_id,
      agents (
        name
      )
    `,
    )
    .eq("is_dependency", true)
    .neq("status", "done") // Not equal to 'done'
    .eq("agents.owner_id", user.id) // Filter by owner_id on the related agents table
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching dependency tasks:", error)
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dependencies</AlertTitle>
        <AlertDescription>
          Could not fetch your pending dependencies at this time. Please try refreshing.
        </AlertDescription>
      </Alert>
    )
  }
  // Cast to DependencyTask[] as the select query structure matches
  return <DependencyList tasks={tasks as DependencyTask[]} />
}

export default async function DependenciesPage() {
  // Auth check can be part of a layout later
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-md font-semibold text-blue-800 dark:text-blue-200">Your Action Required</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  These tasks require your input or approval for your agents to proceed. Completing them will unblock
                  your agents and allow them to continue their work.
                </p>
              </div>
            </div>
            <RealtimeStatusIndicator />
          </div>
        </div>
        <Suspense
          fallback={
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-[#007AFF] mx-auto" />
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading your dependencies...</p>
            </div>
          }
        >
          <FetchDependencies />
        </Suspense>
      </div>
    </main>
  )
}
