import { getSupabaseAdmin } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"

export interface AnalyticsData {
  overview: {
    totalAgents: number
    activeAgents: number
    totalTasks: number
    completedTasks: number
    totalExecutions: number
    successRate: number
    avgExecutionTime: number
    totalTokensUsed: number
  }
  agentPerformance: Array<{
    agentId: string
    agentName: string
    tasksCompleted: number
    successRate: number
    avgExecutionTime: number
    tokensUsed: number
    lastExecution: string
  }>
  executionTrends: Array<{
    date: string
    executions: number
    successes: number
    failures: number
    avgTime: number
  }>
  taskDistribution: {
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    byType: Record<string, number>
  }
  recentActivity: Array<{
    id: string
    type: "execution" | "task_completed" | "agent_created" | "error"
    agentName: string
    message: string
    timestamp: string
    metadata?: any
  }>
}

export class AnalyticsService {
  private static instance: AnalyticsService

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Get comprehensive analytics data for user
   */
  async getAnalytics(userId?: string, timeRange: "24h" | "7d" | "30d" | "90d" = "7d"): Promise<AnalyticsData> {
    try {
      const supabase = getSupabaseAdmin()
      const actualUserId = userId || (await getDefaultUserId())

      const timeRangeMs = this.getTimeRangeMs(timeRange)
      const startDate = new Date(Date.now() - timeRangeMs).toISOString()

      console.log(`📊 Generating analytics for user ${actualUserId} (${timeRange})`)

      // Run all analytics queries in parallel
      const [overview, agentPerformance, executionTrends, taskDistribution, recentActivity] = await Promise.all([
        this.getOverviewData(actualUserId, startDate),
        this.getAgentPerformanceData(actualUserId, startDate),
        this.getExecutionTrendsData(actualUserId, startDate, timeRange),
        this.getTaskDistributionData(actualUserId, startDate),
        this.getRecentActivityData(actualUserId, startDate),
      ])

      return {
        overview,
        agentPerformance,
        executionTrends,
        taskDistribution,
        recentActivity,
      }
    } catch (error) {
      console.error("Error generating analytics:", error)
      throw error
    }
  }

  /**
   * Get overview statistics
   */
  private async getOverviewData(userId: string, startDate: string) {
    const supabase = getSupabaseAdmin()

    // Get agent counts
    const { data: agents } = await supabase.from("agents").select("id, status").eq("owner_id", userId)

    const totalAgents = agents?.length || 0
    const activeAgents = agents?.filter((a) => a.status === "active").length || 0

    // Get task counts
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, status, created_at")
      .eq("agent_id", "ANY(SELECT id FROM agents WHERE owner_id = $1)")
      .gte("created_at", startDate)

    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter((t) => t.status === "done").length || 0

    // Get execution data
    const { data: executions } = await supabase
      .from("agent_logs")
      .select("log_type, metadata, created_at")
      .eq("user_id", userId)
      .eq("log_type", "milestone")
      .gte("created_at", startDate)

    const totalExecutions = executions?.length || 0
    const successfulExecutions = executions?.filter((e) => !e.metadata?.error).length || 0
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

    // Calculate average execution time and token usage
    const executionTimes = executions
      ?.map((e) => e.metadata?.execution_time)
      .filter((t) => typeof t === "number") as number[]

    const avgExecutionTime =
      executionTimes?.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0

    const tokenUsages = executions?.map((e) => e.metadata?.tokens_used).filter((t) => typeof t === "number") as number[]

    const totalTokensUsed = tokenUsages?.length > 0 ? tokenUsages.reduce((a, b) => a + b, 0) : 0

    return {
      totalAgents,
      activeAgents,
      totalTasks,
      completedTasks,
      totalExecutions,
      successRate: Math.round(successRate),
      avgExecutionTime: Math.round(avgExecutionTime),
      totalTokensUsed,
    }
  }

  /**
   * Get agent performance data
   */
  private async getAgentPerformanceData(userId: string, startDate: string) {
    const supabase = getSupabaseAdmin()

    const { data: agents } = await supabase.from("agents").select("id, name").eq("owner_id", userId)

    if (!agents) return []

    const performanceData = await Promise.all(
      agents.map(async (agent) => {
        // Get tasks for this agent
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, status, created_at, metadata")
          .eq("agent_id", agent.id)
          .gte("created_at", startDate)

        const tasksCompleted = tasks?.filter((t) => t.status === "done").length || 0
        const totalTasks = tasks?.length || 0
        const successRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0

        // Get execution logs for this agent
        const { data: logs } = await supabase
          .from("agent_logs")
          .select("metadata, created_at")
          .eq("agent_id", agent.id)
          .gte("created_at", startDate)

        const executionTimes = logs
          ?.map((l) => l.metadata?.execution_time)
          .filter((t) => typeof t === "number") as number[]

        const avgExecutionTime =
          executionTimes?.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0

        const tokensUsed =
          logs
            ?.map((l) => l.metadata?.tokens_used)
            .filter((t) => typeof t === "number")
            .reduce((a, b) => a + b, 0) || 0

        const lastExecution = logs?.[0]?.created_at || ""

        return {
          agentId: agent.id,
          agentName: agent.name || "Unnamed Agent",
          tasksCompleted,
          successRate: Math.round(successRate),
          avgExecutionTime: Math.round(avgExecutionTime),
          tokensUsed,
          lastExecution,
        }
      }),
    )

    return performanceData.sort((a, b) => b.tasksCompleted - a.tasksCompleted)
  }

  /**
   * Get execution trends over time
   */
  private async getExecutionTrendsData(userId: string, startDate: string, timeRange: string) {
    const supabase = getSupabaseAdmin()

    const { data: logs } = await supabase
      .from("agent_logs")
      .select("log_type, metadata, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate)
      .order("created_at")

    if (!logs) return []

    // Group by date
    const groupedData: Record<string, { executions: number; successes: number; failures: number; times: number[] }> = {}

    logs.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split("T")[0]

      if (!groupedData[date]) {
        groupedData[date] = { executions: 0, successes: 0, failures: 0, times: [] }
      }

      if (log.log_type === "milestone") {
        groupedData[date].executions++

        if (log.metadata?.error) {
          groupedData[date].failures++
        } else {
          groupedData[date].successes++
        }

        if (typeof log.metadata?.execution_time === "number") {
          groupedData[date].times.push(log.metadata.execution_time)
        }
      }
    })

    return Object.entries(groupedData).map(([date, data]) => ({
      date,
      executions: data.executions,
      successes: data.successes,
      failures: data.failures,
      avgTime: data.times.length > 0 ? Math.round(data.times.reduce((a, b) => a + b, 0) / data.times.length) : 0,
    }))
  }

  /**
   * Get task distribution data
   */
  private async getTaskDistributionData(userId: string, startDate: string) {
    const supabase = getSupabaseAdmin()

    const { data: tasks } = await supabase
      .from("tasks")
      .select("status, priority, metadata")
      .eq("agent_id", "ANY(SELECT id FROM agents WHERE owner_id = $1)")
      .gte("created_at", startDate)

    if (!tasks) {
      return {
        byStatus: {},
        byPriority: {},
        byType: {},
      }
    }

    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    const byType: Record<string, number> = {}

    tasks.forEach((task) => {
      // Count by status
      byStatus[task.status] = (byStatus[task.status] || 0) + 1

      // Count by priority
      const priority = task.priority || "medium"
      byPriority[priority] = (byPriority[priority] || 0) + 1

      // Count by type (from metadata)
      const type = task.metadata?.type || "standard"
      byType[type] = (byType[type] || 0) + 1
    })

    return { byStatus, byPriority, byType }
  }

  /**
   * Get recent activity data
   */
  private async getRecentActivityData(userId: string, startDate: string) {
    const supabase = getSupabaseAdmin()

    const { data: logs } = await supabase
      .from("agent_logs")
      .select("id, log_type, message, metadata, created_at, agent_id")
      .eq("user_id", userId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false })
      .limit(20)

    if (!logs) return []

    // Get agent names
    const agentIds = [...new Set(logs.map((l) => l.agent_id))]
    const { data: agents } = await supabase.from("agents").select("id, name").in("id", agentIds)

    const agentNames = new Map(agents?.map((a) => [a.id, a.name]) || [])

    return logs.map((log) => ({
      id: log.id,
      type: this.mapLogTypeToActivityType(log.log_type),
      agentName: agentNames.get(log.agent_id) || "Unknown Agent",
      message: log.message,
      timestamp: log.created_at,
      metadata: log.metadata,
    }))
  }

  /**
   * Map log type to activity type
   */
  private mapLogTypeToActivityType(logType: string): "execution" | "task_completed" | "agent_created" | "error" {
    switch (logType) {
      case "milestone":
        return "execution"
      case "success":
        return "task_completed"
      case "error":
        return "error"
      default:
        return "execution"
    }
  }

  /**
   * Get time range in milliseconds
   */
  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case "24h":
        return 24 * 60 * 60 * 1000
      case "7d":
        return 7 * 24 * 60 * 60 * 1000
      case "30d":
        return 30 * 24 * 60 * 60 * 1000
      case "90d":
        return 90 * 24 * 60 * 60 * 1000
      default:
        return 7 * 24 * 60 * 60 * 1000
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()
