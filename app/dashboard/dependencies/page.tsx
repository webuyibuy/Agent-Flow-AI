import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import DependencyManager from "@/components/dependency-manager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react"

export default async function DependenciesPage() {
  const supabase = getSupabaseFromServer()

  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Authentication Required</h1>
          <p className="text-gray-600 mt-2">Please log in to view your dependencies.</p>
        </div>
      </div>
    )
  }

  console.log("🔍 Fetching dependencies for user:", userId)

  // Get all dependency tasks for user's agents with better filtering
  // CRITICAL FIX: Only get tasks where is_dependency=true to avoid showing moved tasks
  const { data: dependencies, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      blocked_reason,
      created_at,
      updated_at,
      status,
      metadata,
      is_dependency,
      auto_generated,
      agent_id,
      agents (
        id,
        name,
        owner_id
      )
    `)
    .eq("agents.owner_id", userId) // Filter by agent owner
    .eq("is_dependency", true) // CRITICAL: Only show actual dependencies
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching dependencies:", error)
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Dependencies</h1>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <p className="text-sm text-red-500 mt-2">{error.message}</p>
        </div>
      </div>
    )
  }

  console.log(`📊 Found ${dependencies?.length || 0} total dependencies`)

  // All dependencies should already be filtered by user ownership
  const userDependencies = dependencies || []

  // Categorize dependencies
  const pendingDeps = userDependencies.filter((dep) => dep.status !== "done")
  const completedDeps = userDependencies.filter((dep) => dep.status === "done")

  // Use metadata for additional properties
  const urgentDeps = pendingDeps.filter(
    (dep) =>
      dep.metadata?.priority === "urgent" ||
      dep.metadata?.priority === "high" ||
      dep.blocked_reason?.toLowerCase().includes("urgent"),
  )

  const taskbarDeps = pendingDeps.filter((dep) => dep.metadata?.in_taskbar === true)

  console.log(`📈 Categorized: ${pendingDeps.length} pending, ${completedDeps.length} completed`)

  // EMERGENCY FIX: If we still don't have dependencies, try a direct query for blocked tasks
  let emergencyDeps: any[] = []
  if (pendingDeps.length === 0) {
    console.log("⚠️ No dependencies found with standard query, trying emergency query...")

    const { data: blockedTasks } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        blocked_reason,
        created_at,
        updated_at,
        status,
        metadata,
        agent_id,
        agents (
          id,
          name,
          owner_id
        )
      `)
      .eq("status", "blocked")
      .eq("is_dependency", true) // CRITICAL: Only include actual dependencies
      .order("created_at", { ascending: false })

    if (blockedTasks && blockedTasks.length > 0) {
      console.log(`🚨 Emergency query found ${blockedTasks.length} blocked tasks`)

      // Filter to only those owned by this user
      emergencyDeps = blockedTasks.filter((task) => task.agents?.owner_id === userId)
      console.log(`🚨 After filtering, found ${emergencyDeps.length} emergency dependencies`)

      // Add these to our pending deps
      pendingDeps.push(...emergencyDeps)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dependency Management</h1>
          <p className="text-gray-600 mt-2">Manage tasks that your AI agents need you to complete</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeps.length}</div>
            <p className="text-xs text-gray-600">Awaiting your action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentDeps.length}</div>
            <p className="text-xs text-gray-600">High priority items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Taskbar</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskbarDeps.length}</div>
            <p className="text-xs text-gray-600">Added to your taskbar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedDeps.length}</div>
            <p className="text-xs text-gray-600">Recently finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-blue-700 space-y-1">
              <p>User ID: {userId}</p>
              <p>Total Dependencies Found: {userDependencies.length}</p>
              <p>Pending: {pendingDeps.length}</p>
              <p>Completed: {completedDeps.length}</p>
              <p>Emergency Dependencies: {emergencyDeps.length}</p>
              <p>Query: is_dependency=true</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Dependencies Message */}
      {pendingDeps.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-yellow-800">No Dependencies Found</h3>
            <p className="text-sm text-yellow-700 mt-2">
              We couldn't find any dependencies that need your attention. This might be because:
            </p>
            <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700 space-y-1">
              <li>Your agents haven't created any dependencies yet</li>
              <li>All dependencies have been completed</li>
              <li>You've moved all dependencies to your active tasks</li>
            </ul>
            <p className="text-sm text-yellow-700 mt-4">
              Try creating a new agent or checking your home dashboard to see if there are any tasks you're currently
              working on.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dependency Manager */}
      <DependencyManager pendingDependencies={pendingDeps} completedDependencies={completedDeps} />
    </div>
  )
}
