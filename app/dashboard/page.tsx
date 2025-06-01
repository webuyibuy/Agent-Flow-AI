import { getSupabaseFromServer } from "@/lib/supabase/server"
import AppleLayout from "@/components/apple-layout"
import AppleCard from "@/components/apple-card"
import AppleButton from "@/components/apple-button"
import { PlusIcon, BrainIcon, TargetIcon, TrendingUpIcon, CheckCircleIcon } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = getSupabaseFromServer()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Mock data for demonstration
  const stats = [
    { label: "Active Agents", value: "12", change: "+2", trend: "up", icon: BrainIcon },
    { label: "Completed Tasks", value: "847", change: "+23", trend: "up", icon: CheckCircleIcon },
    { label: "Dependencies", value: "3", change: "-1", trend: "down", icon: TargetIcon },
    { label: "Success Rate", value: "94%", change: "+2%", trend: "up", icon: TrendingUpIcon },
  ]

  const recentAgents = [
    { id: 1, name: "Customer Support Agent", status: "active", lastActive: "2 minutes ago" },
    { id: 2, name: "Sales Lead Generator", status: "working", lastActive: "5 minutes ago" },
    { id: 3, name: "Content Creator", status: "paused", lastActive: "1 hour ago" },
  ]

  const recentTasks = [
    {
      id: 1,
      title: "Process customer inquiries",
      agent: "Customer Support Agent",
      status: "completed",
      priority: "high",
    },
    { id: 2, title: "Generate sales leads", agent: "Sales Lead Generator", status: "in_progress", priority: "medium" },
    { id: 3, title: "Create blog content", agent: "Content Creator", status: "pending", priority: "low" },
  ]

  const user = session?.user
    ? {
        name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
        email: session.user.email || "user@example.com",
      }
    : {
        name: "Demo User",
        email: "demo@agentflow.com",
      }

  return (
    <AppleLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}! Here's what's happening with your agents.</p>
          </div>
          <AppleButton variant="primary" size="lg" icon={<PlusIcon className="w-5 h-5" />}>
            <Link href="/dashboard/agents/new">Create Agent</Link>
          </AppleButton>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AppleCard key={stat.label} variant="elevated" hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last week</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.trend === "up" ? "bg-green-100" : "bg-red-100"}`}>
                  <stat.icon className={`w-6 h-6 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                </div>
              </div>
            </AppleCard>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Agents */}
          <AppleCard variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Agents</h2>
              <Link href="/dashboard/agents" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        agent.status === "active"
                          ? "bg-green-500"
                          : agent.status === "working"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.lastActive}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agent.status === "active"
                        ? "bg-green-100 text-green-800"
                        : agent.status === "working"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </AppleCard>

          {/* Recent Tasks */}
          <AppleCard variant="elevated">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
              <Link href="/dashboard/dependencies" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{task.agent}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AppleCard>
        </div>

        {/* Quick Actions */}
        <AppleCard variant="glass">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppleButton variant="secondary" size="lg" className="justify-start">
              <BrainIcon className="w-5 h-5" />
              Create New Agent
            </AppleButton>
            <AppleButton variant="secondary" size="lg" className="justify-start">
              <TargetIcon className="w-5 h-5" />
              Review Dependencies
            </AppleButton>
            <AppleButton variant="secondary" size="lg" className="justify-start">
              <TrendingUpIcon className="w-5 h-5" />
              View Analytics
            </AppleButton>
          </div>
        </AppleCard>
      </div>
    </AppleLayout>
  )
}
