"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().min(1, "Goal is required"),
})

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>

export async function updateAgent(agentId: string, data: UpdateAgentInput) {
  try {
    // Validate input
    const validatedData = updateAgentSchema.parse(data)

    // Get supabase client
    const supabase = createServerActionClient({ cookies })

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Authentication required" }
    }

    // Verify agent ownership
    const { data: agent, error: fetchError } = await supabase
      .from("agents")
      .select("user_id")
      .eq("id", agentId)
      .single()

    if (fetchError || !agent) {
      return { success: false, error: "Agent not found" }
    }

    if (agent.user_id !== user.id) {
      return { success: false, error: "You don't have permission to edit this agent" }
    }

    // Update agent
    const { error: updateError } = await supabase
      .from("agents")
      .update({
        name: validatedData.name,
        description: validatedData.description || null,
        goal: validatedData.goal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      console.error("Error updating agent:", updateError)
      return { success: false, error: "Failed to update agent" }
    }

    // Revalidate paths
    revalidatePath(`/dashboard/agents/${agentId}`)
    revalidatePath(`/dashboard/agents/manage`)
    revalidatePath(`/dashboard`)

    return { success: true }
  } catch (error) {
    console.error("Error in updateAgent:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}
