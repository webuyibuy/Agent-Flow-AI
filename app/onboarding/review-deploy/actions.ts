"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import { revalidatePath } from "next/cache"
import { AgentOrchestrator } from "@/lib/agent-orchestrator"
import { getTemplateById } from "@/lib/agent-templates"

export interface DeployAgentState {
  success?: boolean
  error?: string
  agentId?: string
}

export async function deployAgent(prevState: DeployAgentState, formData: FormData): Promise<DeployAgentState> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    let userId: string

    try {
      userId = await getDefaultUserId()
    } catch (error) {
      return { error: "Please log in to deploy an agent." }
    }

    const templateSlug = formData.get("templateSlug") as string
    const agentName = formData.get("agentName") as string

    // Get template info
    const template = getTemplateById(templateSlug)

    if (!template && templateSlug !== "custom-agent") {
      return { error: "Invalid template selected." }
    }

    // Simple validation
    if (!agentName?.trim() || agentName.trim().length < 3) {
      return { error: "Agent name must be at least 3 characters long." }
    }

    console.log(`[DeployAgent] Deploying agent "${agentName}" from template "${templateSlug}" for user ${userId}`)

    // In a real implementation, you'd retrieve the full configuration from the session
    // For this demo, we'll use simplified data
    const agentGoal = template?.defaultGoal || "Custom agent goal"
    const agentBehavior = template?.defaultBehavior || ""

    // Create the agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert({
        owner_id: userId,
        name: agentName.trim(),
        goal: agentGoal,
        status: "active",
        metadata: {
          created_via: "template_wizard",
          template_id: templateSlug,
          template_name: template?.name || "Custom Agent",
          behavior: agentBehavior,
          priority: "medium",
          auto_start: true,
        },
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (agentError || !agent) {
      console.error("[DeployAgent] Error creating agent:", agentError)
      return { error: "Failed to create agent. Please try again." }
    }

    // Create initial tasks if template has suggested tasks
    if (template?.sampleTasks && template.sampleTasks.length > 0) {
      const tasksToInsert = template.sampleTasks.map((task, index) => ({
        agent_id: agent.id,
        title: task,
        description: `Auto-generated task from template: ${task}`,
        status: "pending",
        priority: "medium",
        created_at: new Date().toISOString(),
        position: index,
      }))

      const { error: tasksError } = await supabaseAdmin.from("tasks").insert(tasksToInsert)

      if (tasksError) {
        console.error("[DeployAgent] Error creating initial tasks:", tasksError)
        // Continue anyway, not critical
      } else {
        console.log(`[DeployAgent] Created ${tasksToInsert.length} initial tasks for agent ${agent.id}`)
      }
    }

    // Start the agent working immediately
    await AgentOrchestrator.startAgent({
      agentId: agent.id,
      agentName: agentName,
      agentGoal: agentGoal,
      agentBehavior: agentBehavior,
      userId,
    })

    // Log creation
    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agent.id,
      log_type: "milestone",
      message: `🎉 Agent "${agentName}" created from template "${template?.name || "Custom"}" and starting work immediately!`,
      metadata: { goal: agentGoal, template: templateSlug, created_via: "template_wizard" },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")
    revalidatePath("/dashboard/dependencies")

    return {
      success: true,
      agentId: agent.id,
    }
  } catch (error: any) {
    console.error("[DeployAgent] Unexpected error:", error)
    return { error: "Something went wrong. Please try again." }
  }
}
