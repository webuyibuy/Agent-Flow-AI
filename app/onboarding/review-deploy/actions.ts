"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import { addAgentLog } from "@/app/dashboard/agents/[id]/actions" // Assuming this action exists for logging

// Schema for agent data stored in cookies, matching AgentConfigSchema
const AgentDataFromCookieSchema = z.object({
  agentName: z.string().min(3).max(50),
  agentGoal: z.string().min(10).max(500),
  agentBehavior: z.string().max(1000).optional(),
  templateSlug: z.string(),
})

export interface DeployAgentState {
  message?: string
  errors?: {
    _form?: string[]
  }
  success?: boolean
  agentId?: string
}

export async function deployAgent(
  prevState: DeployAgentState | undefined,
  formData: FormData, // formData is not directly used but required by useActionState signature
): Promise<DeployAgentState> {
  const supabaseAdmin = getSupabaseAdmin()

  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    console.error("Authentication error during agent deployment:", error)
    return { errors: { _form: ["Authentication required to deploy agent."] } }
  }

  const onboardingAgentDataCookie = cookies().get("onboarding_agent_data")

  if (!onboardingAgentDataCookie) {
    return { errors: { _form: ["Agent configuration not found. Please restart the onboarding process."] } }
  }

  let agentData: z.infer<typeof AgentDataFromCookieSchema>
  try {
    agentData = AgentDataFromCookieSchema.parse(JSON.parse(onboardingAgentDataCookie.value))
  } catch (error) {
    console.error("Invalid agent data in cookie:", error)
    return { errors: { _form: ["Invalid agent configuration data. Please restart the onboarding process."] } }
  }

  try {
    const { data, error: insertError } = await supabaseAdmin
      .from("agents")
      .insert({
        name: agentData.agentName.trim(),
        goal: agentData.agentGoal.trim(),
        behavior: agentData.agentBehavior?.trim() || null,
        template_slug: agentData.templateSlug,
        owner_id: userId,
        status: "active", // Default status for new agents
      })
      .select("id")
      .single()

    if (insertError) {
      console.error("Error inserting new agent:", insertError)
      return { errors: { _form: [`Failed to create agent: ${insertError.message}`] } }
    }

    if (!data?.id) {
      return { errors: { _form: ["Failed to retrieve new agent ID after creation."] } }
    }

    // Clear the onboarding cookie
    cookies().delete("onboarding_agent_data")

    // Log the agent creation
    await addAgentLog(
      data.id,
      "milestone",
      `Agent "${agentData.agentName}" created successfully.`,
      undefined,
      {
        templateSlug: agentData.templateSlug,
        createdBy: userId,
      },
      userId,
    )

    // Redirect to the new agent's detail page
    redirect(`/dashboard/agents/${data.id}`)
  } catch (error) {
    console.error("Unexpected error during agent deployment:", error)
    return { errors: { _form: ["An unexpected error occurred during agent deployment. Please try again."] } }
  }
}
