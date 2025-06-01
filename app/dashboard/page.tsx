import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import AppLayout from "@/components/layout/app-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import {
  BrainIcon,
  CheckCircleIcon,
  TargetIcon,
  TrendingUpIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
  ActivityIcon,
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = getSupabaseFromServer()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch data
  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false }).limit(5)

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, agents(name)")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: dependencies } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_dependency", true)
    .order("created_at", { ascending: false })

  // Calculate stats
  const totalAgents = agents?.length || 0
  const activeAgents = agents?.filter((a) => a.status === "active").length || 0
  const totalTasks = tasks?.length || 0
  const completedTasks = tasks?.filter((t) => t.status === "done").length || 0
  const pendingDependencies = dependencies?.length || 0

  const user = {
    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
    email: session.user.email || "user@example.com",
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.name}! Here's what's happening with your AI agents.
            </p>
          </div>
          <Button size="lg" icon={<PlusIcon />}>
            <Link href="/dashboard/agents/new">Create Agent</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Agents"
            value={activeAgents}
            change="+2"
            trend="up"
            icon={<BrainIcon />}
            description={`${totalAgents} total agents`}
          />
          <StatCard
            title="Completed Tasks"
            value={completedTasks}
            change="+12"
            trend="up"
            icon={<CheckCircleIcon />}
            description={`${totalTasks} total tasks`}
          />
          <StatCard
            title="Dependencies"
            value={pendingDependencies}
            change="-1"
            trend="down"
            icon={<TargetIcon />}
            description="Requiring attention"
          />
          <StatCard
            title="Success Rate"
            value="94%"
            change="+2%"
            trend="up"
            icon={<TrendingUpIcon />}
            description="Last 30 days"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Agents</CardTitle>
              <Link
                href="/dashboard/agents"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agents && agents.length > 0 ? (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <BrainIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{agent.name}</p>
                          <p className="text-sm text-gray-500 truncate">{agent.goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            agent.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {agent.status}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Link href={`/dashboard/agents/${agent.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BrainIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first agent.</p>
                    <div className="mt-6">
                      <Button>
                        <Link href="/dashboard/agents/new">Create Agent</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <Link
                href="/dashboard/tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              task.status === "done"
                                ? "bg-green-100"
                                : task.status === "in_progress"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                            }`}
                          >
                            {task.status === "done" ? (
                              <CheckCircleIcon
                                className={`h-5 w-5 ${
                                  task.status === "done"
                                    ? "text-green-600"
                                    : task.status === "in_progress"
                                      ? "text-blue-600"
                                      : "text-gray-600"
                                }`}
                              />
                            ) : task.status === "in_progress" ? (
                              <ActivityIcon className="h-5 w-5 text-blue-600" />
                            ) : (
                              <ClockIcon className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-sm text-gray-500 truncate">{task.agents?.name || "No agent assigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === "done"
                              ? "bg-green-100 text-green-800"
                              : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {task.status === "in_progress" ? "In Progress" : task.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <TargetIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                    <p className="mt-1 text-sm text-gray-500">Tasks will appear here when agents create them.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/agents/new"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all duration-200"
              >
                <div className="flex-shrink-0">
                  <PlusIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Create New Agent</p>
                  <p className="text-sm text-gray-500 truncate">Set up a new AI agent</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                href="/dashboard/dependencies"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all duration-200"
              >
                <div className="flex-shrink-0">
                  <TargetIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">Review Dependencies</p>
                  <p className="text-sm text-gray-500 truncate">Manage pending approvals</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                href="/dashboard/analytics"
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all duration-200"
              >
                <div className="flex-shrink-0">
                  <TrendingUpIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-500 truncate">Performance insights</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
