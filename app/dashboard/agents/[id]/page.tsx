import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import AgentDetailPageClient from "./AgentDetailPageClient"
import { isValidUuid } from "@/lib/utils" // Import the new utility function

// Define types for Agent and Task for this page
interface AgentDetails {
  id: string
  name: string | null
  template_slug: string | null
  goal: string | null
  status: string | null
  created_at: string
  updated_at: string
  parent_agent_id: string | null // Include parent_agent_id
}

interface Task {
  id: string
  title: string | null
  is_dependency: boolean | null
  status: string | null
  blocked_reason: string | null
  created_at: string
  description?: string | null // Added description for potential future use
  depends_on_task_id?: string | null // Include new dependency fields
  depends_on_agent_id?: string | null // Include new dependency fields
  output_summary?: string | null // Include output_summary
}

// Define a type for child agents (similar to Agent in AgentCard)
interface ChildAgent {
  id: string
  name: string | null
  template_slug: string | null
  goal: string | null
  status: string | null
  created_at: string
}

// Define a type for simplified agent list for dropdowns
interface SimpleAgent {
  id: string
  name: string | null
}

// Define a type for simplified task list for dropdowns
interface SimpleTask {
  id: string
  title: string | null
  agent_id: string // Needed to filter tasks by agent
  output_summary?: string | null // Include output_summary for simple tasks
}

interface PageProps {
  params: {
    id: string // Agent ID
  }
  searchParams?: {
    taskQuery?: string
    taskStatus?: string
    // other search params can be added here
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Handle "new" case for metadata as well
  if (params.id === "new") {
    return {
      title: "Create New Agent - AgentFlow",
    }
  }

  // Validate UUID before fetching metadata for actual agent IDs
  if (!isValidUuid(params.id)) {
    return {
      title: "Invalid Agent ID - AgentFlow",
    }
  }

  const supabase = getSupabaseFromServer()
  const { data: agent } = await supabase.from("agents").select("name").eq("id", params.id).single()

  return {
    title: `${agent?.name || "Agent"} Details - AgentFlow`,
  }
}

export default async function AgentDetailPage({ params, searchParams }: PageProps) {
  const agentId = params.id
  const taskQuery = searchParams?.taskQuery
  const taskStatus = searchParams?.taskStatus

  // *** IMPORTANT: Handle the "new" case first and redirect immediately ***
  if (agentId === "new") {
    redirect("/dashboard/agents/new")
  }

  // Validate agentId as a UUID early for all other cases
  if (!isValidUuid(agentId)) {
    console.error(`Invalid agent ID format: ${agentId}`)
    redirect("/dashboard?error=invalid_agent_id")
  }

  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, template_slug, goal, status, created_at, updated_at, parent_agent_id") // Select parent_agent_id
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single<AgentDetails>()

  if (agentError || !agent) {
    console.error("Error fetching agent or agent not found/not owned:", agentError)
    redirect("/dashboard?error=agent_not_found")
  }

  // Fetch parent agent's name if parent_agent_id exists
  let parentAgentName: string | null = null
  if (agent.parent_agent_id) {
    const { data: parentAgent, error: parentAgentError } = await supabase
      .from("agents")
      .select("name")
      .eq("id", agent.parent_agent_id)
      .single()

    if (parentAgentError) {
      console.error("Error fetching parent agent name:", parentAgentError)
    } else if (parentAgent) {
      parentAgentName = parentAgent.name
    }
  }

  // Fetch all agents owned by the user to populate the parent agent dropdown
  const { data: userAgents, error: userAgentsError } = await supabase
    .from("agents")
    .select("id, name")
    .eq("owner_id", user.id)
    .neq("id", agentId) // Exclude the current agent from the list of potential parents

  if (userAgentsError) {
    console.error("Error fetching user agents for parent selection:", userAgentsError)
    // Continue, but the parent selection dropdown might be empty
  }

  // Fetch child agents
  const { data: childAgentsData, error: childAgentsError } = await supabase
    .from("agents")
    .select("id, name, template_slug, goal, status, created_at")
    .eq("parent_agent_id", agentId)
    .eq("owner_id", user.id) // Ensure only owned child agents are fetched
    .order("created_at", { ascending: true })

  if (childAgentsError) {
    console.error("Error fetching child agents:", childAgentsError)
    // Continue, but the child agents section might be empty
  }

  // Fetch all tasks owned by the user for dependency selection and output summary display
  const { data: allUserTasksData, error: allUserTasksError } = await supabase
    .from("tasks")
    .select("id, title, agent_id, output_summary") // Include output_summary here
    .in(
      "agent_id",
      (userAgents || [])
        .map((a) => a.id)
        .concat(agentId), // Include current agent's tasks and other user agents' tasks
    )
    .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude placeholder/invalid task IDs if any
    .order("created_at", { ascending: true })

  if (allUserTasksError) {
    console.error("Error fetching all user tasks for dependency selection:", allUserTasksError)
  }

  let tasksQueryBuilder = supabase
    .from("tasks")
    .select(
      "id, title, description, is_dependency, status, blocked_reason, created_at, depends_on_task_id, depends_on_agent_id, output_summary",
    ) // Include output_summary for current agent's tasks
    .eq("agent_id", agentId)

  if (taskQuery) {
    tasksQueryBuilder = tasksQueryBuilder.ilike("title", `%${taskQuery}%`)
  }

  if (taskStatus && taskStatus !== "all") {
    tasksQueryBuilder = tasksQueryBuilder.eq("status", taskStatus)
  }

  tasksQueryBuilder = tasksQueryBuilder.order("created_at", { ascending: true })

  const { data: tasksData, error: tasksError } = await tasksQueryBuilder

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError)
    // Don't redirect, just show an error or empty state in the client
  }

  return (
    <AgentDetailPageClient
      agent={agent}
      tasksData={(tasksData as Task[]) || []}
      agentId={agentId}
      initialTaskQuery={taskQuery}
      initialTaskStatus={taskStatus}
      userAgents={userAgents || []} // Pass user agents for dropdown
      parentAgentName={parentAgentName} // Pass parent agent name
      childAgents={(childAgentsData as ChildAgent[]) || []} // Pass child agents
      allUserAgents={(userAgents || []).concat({ id: agentId, name: agent.name }) as SimpleAgent[]} // Pass all user agents including current
      allUserTasks={(allUserTasksData as SimpleTask[]) || []} // Pass all user tasks
    />
  )
}
