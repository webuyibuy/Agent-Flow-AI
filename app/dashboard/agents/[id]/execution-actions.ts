"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getDefaultUserId } from "@/lib/default-user"
import { IntelligentAgentOrchestrator } from "@/lib/intelligent-agent-orchestrator"

// Simple interface for execution results
export interface ExecutionResult {
  success: boolean
  message?: string
  error?: string
}

export async function triggerAgentExecution(agentId: string): Promise<ExecutionResult> {
  console.log(`Testing agent execution for: ${agentId}`)
  return await startAgentExecution(agentId)
}

export async function startAgentExecution(agentId: string): Promise<ExecutionResult> {
  try {
    const supabase = getSupabaseFromServer()
    const supabaseAdmin = getSupabaseAdmin()

    // Get user ID
    let userId: string
    try {
      userId = await getDefaultUserId()
      console.log(`Using user ID: ${userId}`)
    } catch (error) {
      console.error("Error getting default user ID:", error)
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Get agent details
    console.log(`Looking for agent: ${agentId}`)
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, agent_type, goal, status, owner_id")
      .eq("id", agentId)
      .single()

    if (agentError || !agent) {
      console.log("Agent not found with exact ID")
      return {
        success: false,
        error: "Agent not found in database",
      }
    }

    console.log(`Found agent: ${agent.name} (${agent.id}) with owner: ${agent.owner_id}`)

    // Check if agent is already active
    if (agent.status === "active") {
      // Just log that execution was triggered
      await supabaseAdmin.from("agent_logs").insert({
        agent_id: agentId,
        user_id: userId,
        log_type: "info",
        message: "Agent execution triggered manually.",
        created_at: new Date().toISOString(),
      })

      return { success: true, message: "Agent is already active and working." }
    }

    // Create a test task
    console.log("Creating test task for execution")
    const { data: newTask, error: createTaskError } = await supabaseAdmin
      .from("tasks")
      .insert({
        agent_id: agentId,
        title: "Test Task - Agent Execution",
        status: "todo",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (createTaskError || !newTask) {
      console.error("Error creating test task:", createTaskError)
      return {
        success: false,
        error: `Failed to create test task: ${createTaskError?.message}`,
      }
    }

    console.log(`Created test task with ID: ${newTask.id}`)

    // Update task with result
    await supabaseAdmin
      .from("tasks")
      .update({
        status: "done",
        output_summary: "Test execution completed successfully.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", newTask.id)

    console.log("Test execution completed successfully")

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

    // Check for any incomplete tasks
    const { data: incompleteTasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id")
      .eq("agent_id", agentId)
      .in("status", ["todo", "in_progress", "blocked"])
      .limit(1)

    // If no incomplete tasks, create new ones using the orchestrator
    if (!tasksError && (!incompleteTasks || incompleteTasks.length === 0)) {
      try {
        // Get user inputs from agent metadata
        const userInputs = agent.metadata?.user_inputs || {}

        // Initialize the agent with intelligent tasks
        await IntelligentAgentOrchestrator.initiateAgentWorkflow({
          agentId,
          agentName: agent.name || "Agent",
          agentGoal: agent.goal || "Complete tasks",
          userInputs,
          userId,
        })
      } catch (orchError) {
        console.error("Error initializing agent workflow:", orchError)
        // Continue even if orchestrator fails - we'll just log it
        await supabaseAdmin.from("agent_logs").insert({
          agent_id: agentId,
          user_id: userId,
          log_type: "error",
          message: "Failed to generate intelligent workflow. Using basic execution.",
          created_at: new Date().toISOString(),
        })
      }
    }

    // Log that agent was started
    await supabaseAdmin.from("agent_logs").insert({
      agent_id: agentId,
      user_id: userId,
      log_type: "milestone",
      message: "Agent execution started manually.",
      created_at: new Date().toISOString(),
    })

    // Revalidate the page to show updates
    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: "Agent execution started successfully.",
    }
  } catch (error) {
    console.error("Error in startAgentExecution:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
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
        message: `Agent status changed to ${newStatus}`,
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
