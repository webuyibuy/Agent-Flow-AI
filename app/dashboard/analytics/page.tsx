import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import AnalyticsDashboard from "@/components/analytics-dashboard"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Analytics - AgentFlow",
}

async function AnalyticsDataFetcher() {
  const adminSupabase = getSupabaseAdmin()
  let userId: string

  try {
    userId = await getDefaultUserId()
  } catch (error) {
    console.error("Failed to get default user ID for analytics:", error)
    redirect("/login")
  }

  // Fetch comprehensive analytics data
  const [
    { data: agents, error: agentsError },
    { data: tasks, error: tasksError },
    { data: xpLogs, error: xpError },
    { data: agentLogs, error: logsError },
  ] = await Promise.all([
    adminSupabase
      .from("agents")
      .select("id, name, template_slug, status, created_at, updated_at")
      .eq("owner_id", userId),
    adminSupabase
      .from("tasks")
      .select(
        `
        id, 
        title, 
        status, 
        is_dependency, 
        created_at, 
        updated_at,
        agent_id,
        agents!inner(owner_id)
      `,
      )
      .eq("agents.owner_id", userId),
    adminSupabase.from("xp_log").select("points, created_at, task_id").eq("owner_id", userId),
    adminSupabase
      .from("agent_logs")
      .select("log_type, timestamp, agent_id") // Changed created_at to timestamp
      .eq("user_id", userId)
      .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // Changed created_at to timestamp
  ])

  if (agentsError || tasksError || xpError || logsError) {
    console.error("Error fetching analytics data:", { agentsError, tasksError, xpError, logsError })
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading analytics data. Please try again later.</p>
      </div>
    )
  }

  return (
    <AnalyticsDashboard agents={agents || []} tasks={tasks || []} xpLogs={xpLogs || []} agentLogs={agentLogs || []} />
  )
}

export default async function AnalyticsPage() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Insights into your agent performance, task completion, and productivity trends.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#007AFF]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <AnalyticsDataFetcher />
      </Suspense>
    </main>
  )
}
