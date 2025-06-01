import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import { TestButton } from "./test-button"
import AgentDetailPageClient from "./AgentDetailPageClient"

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const agentId = params.id
  const supabase = getSupabaseFromServer()
  const userId = await getDefaultUserId()

  // Fetch agent details
  const { data: agent, error: agentError } = await supabase.from("agents").select("*").eq("id", agentId).single()

  if (agentError) {
    return <div>Error loading agent: {agentError.message}</div>
  }

  // Fetch tasks for this agent
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })

  if (tasksError) {
    return <div>Error loading tasks: {tasksError.message}</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agent Details</h1>
        <TestButton agentId={agentId} />
      </div>

      <AgentDetailPageClient agent={agent} tasksData={tasksData || []} agentId={agentId} />
    </div>
  )
}
