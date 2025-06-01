"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"

interface DeleteAgentResult {
  success: boolean
  message: string
  agentId?: string
}

export async function deleteAgent(
  prevState: DeleteAgentResult | undefined,
  formData: FormData,
): Promise<DeleteAgentResult> {
  try {
    const agentId = formData.get("agentId") as string

    if (!agentId) {
      return {
        success: false,
        message: "Agent ID is required",
      }
    }

    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    console.log(`[deleteAgent] Starting deletion process for agent ${agentId}`)

    // First, verify the agent exists and belongs to the user
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, status")
      .eq("id", agentId)
      .eq("owner_id", userId)
      .single()

    if (agentError || !agent) {
      console.error(`[deleteAgent] Agent not found or access denied:`, agentError)
      return {
        success: false,
        message: "Agent not found or you don't have permission to delete it",
      }
    }

    // Check for active dependencies that would be orphaned
    const { data: activeDependencies, error: depError } = await supabase
      .from("tasks")
      .select("id, title")
      .eq("agent_id", agentId)
      .eq("is_dependency", true)
      .in("status", ["pending", "in_progress"])

    if (depError) {
      console.error(`[deleteAgent] Error checking dependencies:`, depError)
      return {
        success: false,
        message: "Error checking agent dependencies",
      }
    }

    if (activeDependencies && activeDependencies.length > 0) {
      return {
        success: false,
        message: `Cannot delete agent with ${activeDependencies.length} active dependencies. Complete or reassign them first.`,
      }
    }

    // Start deletion process
    console.log(`[deleteAgent] Proceeding with deletion of agent "${agent.name}"`)

    // 1. Delete or update child agents that reference this agent as parent
    const { error: childAgentsError } = await supabase
      .from("agents")
      .update({ parent_agent_id: null })
      .eq("parent_agent_id", agentId)

    if (childAgentsError) {
      console.warn(`[deleteAgent] Warning: Could not update child agents:`, childAgentsError)
    }

    // 2. Handle tasks - mark dependency tasks as orphaned, delete regular tasks
    const { error: orphanTasksError } = await supabase
      .from("tasks")
      .update({
        status: "orphaned",
        metadata: {
          orphaned_at: new Date().toISOString(),
          original_agent_id: agentId,
          orphaned_reason: "Agent deleted",
        },
      })
      .eq("agent_id", agentId)
      .eq("is_dependency", true)

    if (orphanTasksError) {
      console.warn(`[deleteAgent] Warning: Could not orphan dependency tasks:`, orphanTasksError)
    }

    // Delete non-dependency tasks
    const { error: deleteTasksError } = await supabase
      .from("tasks")
      .delete()
      .eq("agent_id", agentId)
      .eq("is_dependency", false)

    if (deleteTasksError) {
      console.warn(`[deleteAgent] Warning: Could not delete regular tasks:`, deleteTasksError)
    }

    // 3. Delete agent logs
    const { error: logsError } = await supabase.from("agent_logs").delete().eq("agent_id", agentId)

    if (logsError) {
      console.warn(`[deleteAgent] Warning: Could not delete agent logs:`, logsError)
    }

    // 4. Delete notifications related to this agent
    const { error: notificationsError } = await supabase
      .from("notifications")
      .delete()
      .or(`agent_id.eq.${agentId},metadata->>agent_id.eq.${agentId}`)

    if (notificationsError) {
      console.warn(`[deleteAgent] Warning: Could not delete notifications:`, notificationsError)
    }

    // 5. Finally, delete the agent itself
    const { error: deleteAgentError } = await supabase.from("agents").delete().eq("id", agentId).eq("owner_id", userId)

    if (deleteAgentError) {
      console.error(`[deleteAgent] Failed to delete agent:`, deleteAgentError)
      return {
        success: false,
        message: "Failed to delete agent. Please try again.",
      }
    }

    console.log(`[deleteAgent] Successfully deleted agent "${agent.name}" (${agentId})`)

    // Revalidate relevant pages
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")
    revalidatePath("/dashboard/agents/manage")
    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: `Agent "${agent.name}" has been successfully deleted.`,
      agentId,
    }
  } catch (error) {
    console.error("[deleteAgent] Unexpected error:", error)
    return {
      success: false,
      message: "An unexpected error occurred while deleting the agent.",
    }
  }
}
