"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { addAgentLog } from "./actions"
import { getDefaultUserId } from "@/lib/default-user"

const AgentEditSchema = z.object({
  name: z
    .string()
    .min(3, "Agent name must be at least 3 characters.")
    .max(50, "Agent name must be 50 characters or less."),
  goal: z.string().min(10, "Goal must be at least 10 characters.").max(500, "Goal must be 500 characters or less."),
  behavior: z.string().max(1000, "Behavior description must be 1000 characters or less.").optional(),
  parent_agent_id: z
    .union([z.string().uuid().optional(), z.literal("").optional()])
    .transform((e) => (e === "" ? null : e)), // Allow empty string to mean null
})

export interface AgentEditState {
  message?: string
  errors?: {
    name?: string[]
    goal?: string[]
    behavior?: string[]
    parent_agent_id?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function updateAgent(
  agentId: string,
  prevState: AgentEditState | undefined,
  formData: FormData,
): Promise<AgentEditState> {
  const supabaseServer = getSupabaseFromServer()
  const supabaseAdmin = getSupabaseAdmin()

  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return { errors: { _form: ["Authentication required."] } }
  }

  // Verify agent ownership
  const { data: agentData, error: agentFetchError } = await supabaseServer
    .from("agents")
    .select("id, owner_id, name, parent_agent_id") // Fetch parent_agent_id for logging
    .eq("id", agentId)
    .single()

  if (agentFetchError || !agentData) {
    return { errors: { _form: ["Agent not found."] } }
  }

  if (agentData.owner_id !== userId) {
    return { errors: { _form: ["You do not have permission to edit this agent."] } }
  }

  const validatedFields = AgentEditSchema.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal"),
    behavior: formData.get("behavior"),
    parent_agent_id: formData.get("parent_agent_id"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the fields.",
    }
  }

  const { name, goal, behavior, parent_agent_id } = validatedFields.data

  // Prevent an agent from being its own parent
  if (parent_agent_id === agentId) {
    return { errors: { parent_agent_id: ["An agent cannot be its own parent."] } }
  }

  // Optional: Validate that the selected parent_agent_id belongs to the user
  if (parent_agent_id) {
    const { data: parentAgent, error: parentAgentError } = await supabaseServer
      .from("agents")
      .select("id, owner_id")
      .eq("id", parent_agent_id)
      .single()

    if (parentAgentError || !parentAgent || parentAgent.owner_id !== userId) {
      return { errors: { parent_agent_id: ["Selected parent agent is invalid or not owned by you."] } }
    }
  }

  try {
    const { error: updateError } = await supabaseAdmin
      .from("agents")
      .update({
        name: name.trim(),
        goal: goal.trim(),
        behavior: behavior?.trim(), // Update behavior as well
        parent_agent_id: parent_agent_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      console.error("Error updating agent:", updateError)
      return { errors: { _form: [`Failed to update agent: ${updateError.message}`] } }
    }

    // Log the agent update
    const logMessageParts = []
    if (agentData.name !== name) {
      logMessageParts.push(`name changed from "${agentData.name}" to "${name}"`)
    }
    if (agentData.goal !== goal) {
      logMessageParts.push(`goal updated`)
    }
    if (agentData.parent_agent_id !== parent_agent_id) {
      const oldParent = agentData.parent_agent_id ? `from ${agentData.parent_agent_id}` : "from no parent"
      const newParent = parent_agent_id ? `to ${parent_agent_id}` : "to no parent"
      logMessageParts.push(`parent agent changed ${oldParent} ${newParent}`)
    }

    if (logMessageParts.length > 0) {
      await addAgentLog(
        agentId,
        "milestone",
        `Agent configuration updated: ${logMessageParts.join(", ")}.`,
        undefined,
        {
          previousName: agentData.name,
          newName: name,
          previousParentId: agentData.parent_agent_id,
          newParentId: parent_agent_id,
          updatedBy: userId,
        },
        userId,
      )
    }

    revalidatePath(`/dashboard/agents/${agentId}`)
    revalidatePath("/dashboard")

    return { success: true, message: "Agent updated successfully!" }
  } catch (error) {
    console.error("Unexpected error updating agent:", error)
    return { errors: { _form: ["An unexpected error occurred. Please try again."] } }
  }
}

export async function deleteAgent(agentId: string): Promise<{ success?: boolean; error?: string }> {
  const supabaseServer = getSupabaseFromServer()
  const supabaseAdmin = getSupabaseAdmin()

  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    return { error: "Authentication required." }
  }

  // Verify agent ownership
  const { data: agentData, error: agentFetchError } = await supabaseServer
    .from("agents")
    .select("id, owner_id, name")
    .eq("id", agentId)
    .single()

  if (agentFetchError || !agentData) {
    return { error: "Agent not found." }
  }

  if (agentData.owner_id !== userId) {
    return { error: "You do not have permission to delete this agent." }
  }

  try {
    // Delete related data first (tasks, logs, etc.)
    // Note: In a production system, you might want to archive instead of delete

    // Set parent_agent_id to NULL for any agents that had this agent as a parent
    const { error: updateChildrenError } = await supabaseAdmin
      .from("agents")
      .update({ parent_agent_id: null })
      .eq("parent_agent_id", agentId)

    if (updateChildrenError) {
      console.error("Error updating child agents:", updateChildrenError)
      // Continue with deletion, but log the issue
    }

    // Delete agent logs
    const { error: logsDeleteError } = await supabaseAdmin.from("agent_logs").delete().eq("agent_id", agentId)

    if (logsDeleteError) {
      console.error("Error deleting agent logs:", logsDeleteError)
      // Continue with deletion, logs are not critical
    }

    // Delete tasks
    const { error: tasksDeleteError } = await supabaseAdmin.from("tasks").delete().eq("agent_id", agentId)

    if (tasksDeleteError) {
      console.error("Error deleting agent tasks:", tasksDeleteError)
      // Continue with deletion, tasks are not critical
    }

    // Finally, delete the agent
    const { error: deleteError } = await supabaseAdmin.from("agents").delete().eq("id", agentId)

    if (deleteError) {
      console.error("Error deleting agent:", deleteError)
      return { error: `Failed to delete agent: ${deleteError.message}` }
    }

    revalidatePath("/dashboard")
    redirect("/dashboard")

    // This won't be reached due to redirect, but for type consistency
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting agent:", error)
    return { error: "An unexpected error occurred while deleting the agent." }
  }
}
