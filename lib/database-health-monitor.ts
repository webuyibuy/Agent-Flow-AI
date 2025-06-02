import { getSupabaseFromServer } from "@/lib/supabase/server"

export interface DatabaseHealthStatus {
  isHealthy: boolean
  connectionStatus: "connected" | "disconnected" | "error"
  responseTime: number
  lastChecked: Date
  errors: string[]
  metrics: {
    totalTables: number
    totalRecords: number
    activeConnections: number
  }
}

export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor
  private lastHealthCheck: DatabaseHealthStatus | null = null
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor()
    }
    return DatabaseHealthMonitor.instance
  }

  async checkHealth(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now()
    const errors: string[] = []
    let connectionStatus: "connected" | "disconnected" | "error" = "disconnected"
    const metrics = {
      totalTables: 0,
      totalRecords: 0,
      activeConnections: 0,
    }

    try {
      const supabase = getSupabaseFromServer()

      // Test basic connection
      const { data: testData, error: testError } = await supabase.from("profiles").select("id").limit(1)

      if (testError) {
        errors.push(`Connection test failed: ${testError.message}`)
        connectionStatus = "error"
      } else {
        connectionStatus = "connected"

        // Get table count
        const { data: tables, error: tablesError } = await supabase.rpc("get_table_count").single()

        if (!tablesError && tables) {
          metrics.totalTables = tables.count || 0
        }

        // Get record counts for key tables
        const { count: profilesCount } = await supabase.from("profiles").select("*", { count: "exact", head: true })

        const { count: agentsCount } = await supabase.from("agents").select("*", { count: "exact", head: true })

        const { count: tasksCount } = await supabase.from("tasks").select("*", { count: "exact", head: true })

        metrics.totalRecords = (profilesCount || 0) + (agentsCount || 0) + (tasksCount || 0)
      }
    } catch (error: any) {
      errors.push(`Health check failed: ${error.message}`)
      connectionStatus = "error"
    }

    const responseTime = Date.now() - startTime
    const isHealthy = connectionStatus === "connected" && errors.length === 0

    this.lastHealthCheck = {
      isHealthy,
      connectionStatus,
      responseTime,
      lastChecked: new Date(),
      errors,
      metrics,
    }

    return this.lastHealthCheck
  }

  getLastHealthCheck(): DatabaseHealthStatus | null {
    return this.lastHealthCheck
  }

  startMonitoring(intervalMs = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.checkHealth()
      } catch (error) {
        console.error("Database health monitoring error:", error)
      }
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Named export for the health monitor
export const databaseHealthMonitor = DatabaseHealthMonitor.getInstance()
