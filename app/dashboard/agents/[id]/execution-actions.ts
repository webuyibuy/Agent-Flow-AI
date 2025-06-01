"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getDefaultUserId } from "@/lib/default-user"
import { agentExecutionEngine } from "@/lib/agent-execution-engine"
import { LLMService } from "@/lib/llm-service"

export interface ExecutionResult {
  success: boolean
  message?: string
  error?: string
  logs?: string[]
}

export async function startAgentExecution(agentId: string): Promise<ExecutionResult> {
  try {
    const supabase = getSupabaseFromServer()
    const supabaseAdmin = getSupabaseAdmin()

    // Get user ID
    let userId: string
    try {
      userId = await getDefaultUserId()
      console.log(`🔐 Using user ID: ${userId}`)
    } catch (error) {
      console.error("Error getting default user ID:", error)
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Check if user has LLM providers configured
    const availableProviders = await LLMService.getAvailableProviders(userId)

    if (availableProviders.length === 0) {
      return {
        success: false,
        error: "No LLM providers configured. Please add API keys in Settings → Profile to enable AI execution.",
        logs: [
          "❌ No LLM providers found",
          "🔑 Please add API keys in Settings",
          "💡 Supported: OpenAI, Anthropic, Groq, xAI",
        ],
      }
    }

    console.log(`🔑 User has configured providers: ${availableProviders.join(", ")}`)

    // Get agent details
    console.log(`🔍 Looking for agent: ${agentId}`)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, goal, agent_type, status, owner_id, metadata")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.log("❌ Agent not found")
      return {
        success: false,
        error: "Agent not found in database",
      }
    }

    console.log(`✅ Found agent: ${agent.name} (${agent.id})`)

    // Update agent status to active
    const { error: updateError } = await supabaseAdmin
      .from("agents")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      console.error("Error updating agent status:", updateError)
      return { success: false, error: "Failed to activate agent." }
    }

    // Check for existing tasks
    const { data: existingTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, status")
      .eq("agent_id", agentId)
      .in("status", ["todo", "in_progress"])

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError)
      return { success: false, error: "Failed to fetch agent tasks" }
    }

    // If no tasks exist, create some initial tasks
    if (!existingTasks || existingTasks.length === 0) {
      console.log("📝 Creating initial tasks for agent")

      const initialTasks = [
        {
          agent_id: agentId,
          title: "Analyze current objectives",
          description: `Review and understand the goal: ${agent.goal}`,
          status: "todo",
          priority: "high",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          agent_id: agentId,
          title: "Create action plan",
          description: "Develop a step-by-step plan to achieve the objectives",
          status: "todo",
          priority: "medium",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          agent_id: agentId,
          title: "Begin implementation",
          description: "Start executing the planned actions",
          status: "todo",
          priority: "medium",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      const { error: createTasksError } = await supabaseAdmin.from("tasks").insert(initialTasks)

      if (createTasksError) {
        console.error("Error creating initial tasks:", createTasksError)
        return { success: false, error: "Failed to create initial tasks" }
      }

      console.log("✅ Created initial tasks")
    }

    // Start the real AI execution using user's LLM providers
    console.log("🚀 Starting AI execution engine with user's LLM providers")
    const executionResult = await agentExecutionEngine.startAgentExecution(agentId)

    if (!executionResult.success) {
      return {
        success: false,
        error: executionResult.error || "Failed to start AI execution",
      }
    }

    // Log that agent was started
    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agentId,
      user_id: userId,
      log_type: "milestone",
      message: `🚀 Agent execution started using your ${availableProviders.join(", ")} provider(s)`,
      metadata: {
        execution_type: "ai_powered",
        available_providers: availableProviders,
        providers_count: availableProviders.length,
      },
      created_at: new Date().toISOString(),
    })

    // Revalidate the page to show updates
    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: `Agent execution started successfully using your ${availableProviders.join(", ")} provider(s)`,
      logs: [
        "🚀 Agent execution started",
        `🔑 Using your ${availableProviders.join(", ")} provider(s)`,
        "🧠 AI engine initialized",
        "📋 Processing tasks with your LLM",
        "⚡ Real-time execution in progress",
      ],
    }
  } catch (error) {
    console.error("Error in startAgentExecution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function stopAgentExecution(agentId: string): Promise<ExecutionResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const userId = await getDefaultUserId()

    // Update agent status to paused
    const { error } = await supabaseAdmin
      .from("agents")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (error) {
      console.error("Error updating agent status:", error)
      return {
        success: false,
        error: `Failed to update agent status: ${error.message}`,
      }
    }

    // Log the stop action
    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agentId,
      user_id: userId,
      log_type: "info",
      message: "⏸️ Agent execution stopped by user",
      created_at: new Date().toISOString(),
    })

    // Refresh the page to show changes
    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: "Agent execution stopped successfully",
    }
  } catch (error) {
    console.error("Error stopping agent execution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Legacy function for backward compatibility
export async function triggerAgentExecution(agentId: string): Promise<ExecutionResult> {
  console.log(`🔄 Triggering agent execution for: ${agentId}`)
  return await startAgentExecution(agentId)
}

// Add function to toggle agent status
export async function toggleAgentStatus(agentId: string, currentStatus: string): Promise<ExecutionResult> {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Toggle the status
    const newStatus = currentStatus === "active" ? "paused" : "active"

    const { error } = await supabaseAdmin
      .from("agents")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (error) {
      console.error("Error updating agent status:", error)
      return {
        success: false,
        error: `Failed to update agent status: ${error.message}`,
      }
    }

    // Create a log entry
    try {
      await supabaseAdmin.from("agent_logs").insert({
        agent_id: agentId,
        log_type: "info",
        message: `🔄 Agent status changed to ${newStatus}`,
        created_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Error creating log entry:", logError)
      // Continue even if logging fails
    }

    // Refresh the page to show changes
    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: `Agent status updated to ${newStatus}`,
    }
  } catch (error) {
    console.error("Error toggling agent status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
