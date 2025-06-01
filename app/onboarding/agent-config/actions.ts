"use server"
import { z } from "zod"
import { cookies } from "next/headers"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"

// Simplified schema for immediate functionality
const AgentConfigInputSchema = z.object({
  agentName: z
    .string()
    .min(3, "Agent name must be at least 3 characters.")
    .max(50, "Agent name must be 50 characters or less."),
  agentGoal: z
    .string()
    .min(10, "Goal must be at least 10 characters.")
    .max(500, "Goal must be 500 characters or less."),
  agentBehavior: z.string().max(1000, "Behavior description must be 1000 characters or less.").optional().nullable(),
  templateSlug: z.string().min(1, "Template slug is required."),
  customAnswers: z.record(z.any()).optional().nullable(),
  configurationMethod: z.enum(["manual", "template", "brain_dump"]).default("manual"),
})

export type StoredAgentConfig = z.infer<typeof AgentConfigInputSchema> & {
  timestamp: string
}

export interface AgentConfigState {
  message?: string
  errors?: {
    agentName?: string[]
    agentGoal?: string[]
    agentBehavior?: string[]
    templateSlug?: string[]
    configurationMethod?: string[]
    _form?: string[]
  }
  success?: boolean
  redirectTo?: string
  debug?: any
}

export async function storeAgentConfiguration(
  prevState: AgentConfigState | undefined,
  formData: FormData,
): Promise<AgentConfigState> {
  console.log("🚀 Starting agent configuration storage...")

  // Parse custom answers
  const rawCustomAnswers = formData.get("customAnswers") as string
  let customAnswersData: Record<string, any> | null = {}
  try {
    if (rawCustomAnswers) {
      customAnswersData = JSON.parse(rawCustomAnswers)
    }
  } catch (e) {
    console.error("Invalid custom answers JSON:", e)
    customAnswersData = {}
  }

  // Extract form data
  const formValues = {
    agentName: formData.get("agentName"),
    agentGoal: formData.get("agentGoal"),
    agentBehavior: formData.get("agentBehavior") || null,
    templateSlug: formData.get("templateSlug"),
    customAnswers: customAnswersData,
    configurationMethod: formData.get("configurationMethod") || "manual",
  }

  console.log("📝 Form values:", formValues)

  // Validate form data
  const validatedFields = AgentConfigInputSchema.safeParse(formValues)

  if (!validatedFields.success) {
    console.error("❌ Validation failed:", validatedFields.error.flatten())
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the fields.",
      debug: { formValues, error: validatedFields.error.flatten() },
    }
  }

  try {
    // Store in cookie for now (simpler approach)
    const configToStore = {
      ...validatedFields.data,
      timestamp: new Date().toISOString(),
    }

    console.log("📦 Storing config in cookie:", configToStore)

    // Set cookie with a longer maxAge to prevent expiration issues
    cookies().set({
      name: "agent_config_pending",
      value: JSON.stringify(configToStore),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
      sameSite: "lax",
    })

    console.log("✅ Configuration stored successfully")

    // Return success with redirect instruction
    return {
      success: true,
      message: "Configuration saved successfully!",
      redirectTo: "/onboarding/review-deploy",
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      errors: { _form: ["Unexpected error occurred. Please try again."] },
      debug: { error: String(error) },
    }
  }
}

export async function getStoredAgentConfiguration(): Promise<StoredAgentConfig | null> {
  try {
    const cookieStore = cookies()
    const configCookie = cookieStore.get("agent_config_pending")

    if (!configCookie?.value) {
      console.log("No pending configuration found in cookies")
      return null
    }

    const parsedConfig = JSON.parse(configCookie.value)
    console.log("✅ Retrieved configuration from cookies")
    return parsedConfig
  } catch (error) {
    console.error("❌ Error retrieving configuration:", error)
    return null
  }
}

export async function clearStoredAgentConfiguration(): Promise<{ success: boolean; message?: string }> {
  try {
    cookies().delete("agent_config_pending")
    console.log("✅ Configuration cleared from cookies")
    return { success: true, message: "Configuration cleared." }
  } catch (error) {
    console.error("❌ Error clearing configuration:", error)
    return { success: false, message: "Failed to clear configuration." }
  }
}

// Alternative action for saving agent config (keeping both for compatibility)
interface SaveAgentConfigResult {
  success: boolean
  message?: string
  error?: string
  redirectUrl?: string
}

export async function saveAgentConfig(formData: FormData): Promise<SaveAgentConfigResult> {
  try {
    console.log("Starting saveAgentConfig with form data")

    // Get the user ID
    let userId: string
    try {
      userId = await getDefaultUserId()
    } catch (error) {
      console.error("Error getting default user ID:", error)
      return {
        success: false,
        error: "Authentication required. Please log in and try again.",
      }
    }

    // Extract form data
    const name = formData.get("name") as string
    const goal = formData.get("goal") as string
    const templateSlug = formData.get("templateSlug") as string
    const templateName = formData.get("templateName") as string
    const behavior = formData.get("behavior") as string

    // Validate required fields
    if (!name || !goal) {
      return {
        success: false,
        error: "Agent name and goal are required.",
      }
    }

    // Extract custom answers if present
    const customAnswers: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("custom_") && typeof value === "string") {
        customAnswers[key.replace("custom_", "")] = value
      }
    }

    console.log("Form data extracted:", {
      name,
      goal,
      templateSlug,
      templateName,
      behavior,
      customAnswersCount: Object.keys(customAnswers).length,
    })

    // Store the configuration in cookies for the next step
    const configToStore = {
      agentName: name,
      agentGoal: goal,
      agentBehavior: behavior,
      templateSlug: templateSlug || "custom-agent",
      customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : {},
      configurationMethod: "manual" as const,
      timestamp: new Date().toISOString(),
    }

    cookies().set({
      name: "agent_config_pending",
      value: JSON.stringify(configToStore),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
      sameSite: "lax",
    })

    // Update user's onboarding progress if possible
    try {
      const supabase = getSupabaseFromServer()
      await supabase
        .from("profiles")
        .update({
          onboarding_step: 3, // Assuming this is step 3 (agent config)
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (error) {
      console.error("Error updating onboarding progress:", error)
      // Non-critical error, continue with redirect
    }

    console.log("Agent configuration saved successfully")

    // Return success with redirect information
    return {
      success: true,
      message: "Agent configuration saved successfully!",
      redirectUrl: "/onboarding/review-deploy",
    }
  } catch (error) {
    console.error("Unexpected error in saveAgentConfig:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred.",
    }
  }
}
