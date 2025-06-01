import { Suspense } from "react"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Loader2, Brain, Target, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = getSupabaseFromServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch agents
  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false }).limit(10)

  // Fetch tasks
  const { data: tasks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(20)

  // Fetch dependencies
  const { data: dependencies } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_dependency", true)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Business Dashboard</h1>
          <p className="text-gray-500">Manage your AI agents and business tasks</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agents/new">
            <Brain className="mr-2 h-4 w-4" />
            Create New Agent
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agents?.length || 0}</div>
            <p className="text-sm text-gray-500">Business AI agents deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Target className="mr-2 h-5 w-5 text-green-500" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tasks?.filter((t) => t.status === "in_progress").length || 0}</div>
            <p className="text-sm text-gray-500">Tasks currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-orange-500" />
              Pending Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dependencies?.length || 0}</div>
            <p className="text-sm text-gray-500">Items requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
              Business AI Agents
            </CardTitle>
            <CardDescription>Your active business automation agents</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto" />}>
              <div className="space-y-4">
                {agents && agents.length > 0 ? (
                  agents.map((agent) => (
                    <div key={agent.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{agent.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{agent.goal}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                            {agent.template_slug && <Badge variant="outline">{agent.template_slug}</Badge>}
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/agents/${agent.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No agents created yet</p>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/agents/new">Create Your First Agent</Link>
                    </Button>
                  </div>
                )}
              </div>
            </Suspense>
          </CardContent>
        </Card>

        {/* Dependencies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-orange-500" />
              Business Dependencies
            </CardTitle>
            <CardDescription>Items requiring your attention to move forward</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto" />}>
              <div className="space-y-4">
                {dependencies && dependencies.length > 0 ? (
                  dependencies.map((dependency) => (
                    <div key={dependency.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{dependency.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {dependency.metadata?.description || "No description"}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={
                                dependency.priority === "high"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : dependency.priority === "medium"
                                    ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                    : "border-green-300 text-green-700 bg-green-50"
                              }
                            >
                              {dependency.priority} priority
                            </Badge>
                            {dependency.metadata?.category && (
                              <Badge variant="secondary">{dependency.metadata.category}</Badge>
                            )}
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/dashboard/dependencies">Manage</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No dependencies requiring attention</p>
                  </div>
                )}
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
