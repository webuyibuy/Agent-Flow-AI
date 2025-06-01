import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import AppleLayout from "@/components/apple-layout"
import { BrainIcon, CheckCircleIcon, TargetIcon, TrendingUpIcon, PlusIcon, ArrowRightIcon } from "lucide-react"

export default async function DashboardPage() {
  const supabase = getSupabaseFromServer()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch agents
  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false }).limit(3)

  // Fetch tasks
  const { data: tasks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(3)

  // User data
  const user = {
    name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
    email: session.user.email || "user@example.com",
  }

  return (
    <AppleLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Here's what's happening with your agents</p>
          </div>
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
            Create Agent
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Agents */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BrainIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Agents</dt>
                    <dd>
                      <div className="text-3xl font-semibold text-gray-900">12</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+2</span>
                <span className="ml-1 text-gray-500">from last week</span>
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                    <dd>
                      <div className="text-3xl font-semibold text-gray-900">847</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+23</span>
                <span className="ml-1 text-gray-500">from last week</span>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TargetIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dependencies</dt>
                    <dd>
                      <div className="text-3xl font-semibold text-gray-900">3</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 font-medium">-1</span>
                <span className="ml-1 text-gray-500">from last week</span>
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd>
                      <div className="text-3xl font-semibold text-gray-900">94%</div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+2%</span>
                <span className="ml-1 text-gray-500">from last week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Agents and Tasks */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Agents */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900">Recent Agents</h2>
                <Link href="/dashboard/agents" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all
                </Link>
              </div>
              <div className="mt-6 flow-root">
                <ul className="divide-y divide-gray-200">
                  {agents && agents.length > 0 ? (
                    agents.map((agent) => (
                      <li key={agent.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <BrainIcon className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{agent.name}</p>
                            <p className="truncate text-sm text-gray-500">{agent.goal}</p>
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/agents/${agent.id}`}
                              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-sm font-medium leading-5 text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-sm text-gray-500">No agents found</li>
                  )}
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard/agents/new"
                  className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Create New Agent
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900">Recent Tasks</h2>
                <Link href="/dashboard/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View all
                </Link>
              </div>
              <div className="mt-6 flow-root">
                <ul className="divide-y divide-gray-200">
                  {tasks && tasks.length > 0 ? (
                    tasks.map((task) => (
                      <li key={task.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center
                                ${task.priority === "high" ? "bg-red-100" : task.priority === "medium" ? "bg-yellow-100" : "bg-green-100"}
                              `}
                            >
                              <TargetIcon
                                className={`h-4 w-4 
                                  ${task.priority === "high" ? "text-red-600" : task.priority === "medium" ? "text-yellow-600" : "text-green-600"}
                                `}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
                            <p className="truncate text-sm text-gray-500">
                              {task.status === "completed"
                                ? "Completed"
                                : task.status === "in_progress"
                                  ? "In Progress"
                                  : "Pending"}
                            </p>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                ${
                                  task.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : task.status === "in_progress"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }
                              `}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center text-sm text-gray-500">No tasks found</li>
                  )}
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/dashboard/tasks/new"
                  className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Create New Task
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/agents/new"
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <PlusIcon className="mr-3 h-5 w-5 text-gray-400" />
                Create New Agent
                <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/dependencies"
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <TargetIcon className="mr-3 h-5 w-5 text-gray-400" />
                Review Dependencies
                <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <TrendingUpIcon className="mr-3 h-5 w-5 text-gray-400" />
                View Analytics
                <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppleLayout>
  )
}
