"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { Users, CheckCircle, Clock, Zap } from "lucide-react"
import { useMemo } from "react"

interface Agent {
  id: string
  name: string | null
  template_slug: string | null
  status: string | null
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  title: string | null
  status: string | null
  is_dependency: boolean | null
  created_at: string
  updated_at: string
  agent_id: string
}

interface XpLog {
  points: number
  created_at: string
  task_id: string | null
}

interface AgentLog {
  log_type: string
  timestamp: string // Changed from created_at
  agent_id: string
}

interface AnalyticsDashboardProps {
  agents: Agent[]
  tasks: Task[]
  xpLogs: XpLog[]
  agentLogs: AgentLog[]
}

const COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#00C7BE"]

export default function AnalyticsDashboard({ agents, tasks, xpLogs, agentLogs }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    // Basic metrics
    const totalAgents = agents.length
    const activeAgents = agents.filter((a) => a.status === "active").length
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "done").length
    const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "in_progress").length
    const blockedTasks = tasks.filter((t) => t.status === "blocked").length
    const totalXp = xpLogs.reduce((sum, log) => sum + log.points, 0)

    // Completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Agent type distribution
    const agentTypeDistribution = agents.reduce(
      (acc, agent) => {
        const type = agent.template_slug || "custom"
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const agentTypePieData = Object.entries(agentTypeDistribution).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
    }))

    // Task status distribution
    const taskStatusDistribution = tasks.reduce(
      (acc, task) => {
        const status = task.status || "unknown"
        acc[status] = (acc[status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const taskStatusData = Object.entries(taskStatusDistribution).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      count,
    }))

    // XP over time (last 30 days)
    const xpOverTime = xpLogs
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .reduce(
        (acc, log) => {
          const date = new Date(log.created_at).toLocaleDateString()
          const existing = acc.find((item) => item.date === date)
          if (existing) {
            existing.xp += log.points
            existing.cumulative += log.points
          } else {
            const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0
            acc.push({
              date,
              xp: log.points,
              cumulative: prevCumulative + log.points,
            })
          }
          return acc
        },
        [] as { date: string; xp: number; cumulative: number }[],
      )

    // Activity over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toLocaleDateString()
    }).reverse()

    const activityData = last7Days.map((date) => {
      const logsForDay = agentLogs.filter((log) => new Date(log.timestamp).toLocaleDateString() === date) // Changed log.created_at
      return {
        date: date.split("/").slice(0, 2).join("/"), // MM/DD format
        logs: logsForDay.length,
        errors: logsForDay.filter((log) => log.log_type === "error").length,
        successes: logsForDay.filter((log) => log.log_type === "success").length,
      }
    })

    // Agent performance
    const agentPerformance = agents.map((agent) => {
      const agentTasks = tasks.filter((t) => t.agent_id === agent.id)
      const agentCompletedTasks = agentTasks.filter((t) => t.status === "done").length
      const agentTotalTasks = agentTasks.length
      const agentCompletionRate = agentTotalTasks > 0 ? (agentCompletedTasks / agentTotalTasks) * 100 : 0

      return {
        name: agent.name || "Unnamed Agent",
        completedTasks: agentCompletedTasks,
        totalTasks: agentTotalTasks,
        completionRate: agentCompletionRate,
        status: agent.status,
      }
    })

    // Recent trends
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentTasks = tasks.filter((t) => new Date(t.created_at) >= last30Days)
    const recentCompletedTasks = recentTasks.filter((t) => t.status === "done")
    const recentXp = xpLogs.filter((log) => new Date(log.created_at) >= last30Days)

    const avgTasksPerDay = recentTasks.length / 30
    const avgXpPerDay = recentXp.reduce((sum, log) => sum + log.points, 0) / 30

    return {
      totalAgents,
      activeAgents,
      totalTasks,
      completedTasks,
      pendingTasks,
      blockedTasks,
      totalXp,
      completionRate,
      agentTypePieData,
      taskStatusData,
      xpOverTime,
      activityData,
      agentPerformance,
      avgTasksPerDay,
      avgXpPerDay,
    }
  }, [agents, tasks, xpLogs, agentLogs])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeAgents} active • {analytics.totalAgents - analytics.activeAgents} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedTasks}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={analytics.completionRate} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">{analytics.completionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalXp}</div>
            <p className="text-xs text-muted-foreground">{analytics.avgXpPerDay.toFixed(1)} XP/day average (30d)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.blockedTasks} blocked • {analytics.pendingTasks - analytics.blockedTasks} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>XP Progress Over Time</CardTitle>
            <CardDescription>Your cumulative experience points growth</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.xpOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cumulative" stroke="#007AFF" fill="#007AFF" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Type Distribution</CardTitle>
            <CardDescription>Breakdown of your agents by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.agentTypePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.agentTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Current status of all your tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#007AFF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Trends (7 Days)</CardTitle>
            <CardDescription>Daily agent activity and error rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="logs" stroke="#007AFF" name="Total Logs" />
                <Line type="monotone" dataKey="successes" stroke="#34C759" name="Successes" />
                <Line type="monotone" dataKey="errors" stroke="#FF3B30" name="Errors" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Individual agent statistics and completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.agentPerformance.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {agent.completedTasks} of {agent.totalTasks} tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.completionRate.toFixed(1)}%</div>
                    <Progress value={agent.completionRate} className="w-20 h-2" />
                  </div>
                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className={
                      agent.status === "active"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }
                  >
                    {agent.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            ))}
            {analytics.agentPerformance.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No agents found. Create your first agent to see performance metrics.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
