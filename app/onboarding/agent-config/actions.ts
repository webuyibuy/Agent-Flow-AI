"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

const AgentConfigSchema = z.object({
  agentName: z
    .string()
    .min(3, "Agent name must be at least 3 characters.")
    .max(50, "Agent name must be 50 characters or less."),
  agentGoal: z
    .string()
    .min(10, "Goal must be at least 10 characters.")
    .max(500, "Goal must be 500 characters or less."),
  agentBehavior: z.string().max(1000, "Behavior description must be 1000 characters or less.").optional(),
  templateSlug: z.string(),
})

export interface AgentConfigState {
  message?: string
  errors?: {
    agentName?: string[]
    agentGoal?: string[]
    agentBehavior?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function storeAgentConfiguration(
  prevState: AgentConfigState | undefined,
  formData: FormData,
): Promise<AgentConfigState> {
  const validatedFields = AgentConfigSchema.safeParse({
    agentName: formData.get("agentName"),
    agentGoal: formData.get("agentGoal"),
    agentBehavior: formData.get("agentBehavior"),
    templateSlug: formData.get("templateSlug"),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the fields.",
    }
  }

  const agentData = validatedFields.data

  try {
    cookies().set({
      name: "onboarding_agent_data",
      value: JSON.stringify(agentData),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15, // 15 minutes
      path: "/",
      sameSite: "lax",
    })
  } catch (error) {
    console.error("Failed to set cookie:", error)
    return { message: "An unexpected error occurred. Please try again.", errors: { _form: ["Cookie setting failed."] } }
  }

  redirect("/onboarding/review-deploy")
  // Redirect will prevent this from being reached, but for type consistency:
  // return { success: true, message: "Configuration stored." };
}
