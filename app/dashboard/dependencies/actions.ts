"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendSlackNotification } from "@/lib/slack-notifications"

export interface MarkCompleteState {
  success?: boolean
  message?: string
  error?: string
  taskId?: string
}

// Move dependency to tasks (change status to in_progress and remove from dependencies view)
export async function moveToTasks(
  prevState: MarkCompleteState | undefined,
  formData: FormData,
): Promise<MarkCompleteState> {
  try {
    const taskId = formData.get("taskId") as string

    if (!taskId) {
      return { success: false, error: "Task ID is required" }
    }

    const supabase = getSupabaseFromServer()
    const adminSupabase = getSupabaseAdmin()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get the task with agent information
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        agent_id,
        status,
        is_dependency,
        blocked_reason,
        metadata,
        agents (
          owner_id,
          name
        )
      `)
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      console.error("Error fetching task:", fetchError)
      return { success: false, error: "Task not found", taskId }
    }

    // Verify ownership
    if (task.agents?.owner_id !== user.id) {
      return { success: false, error: "Unauthorized to modify this task", taskId }
    }

    console.log(`🔄 Moving dependency "${task.title}" to active tasks`)

    // Update task to move it to active tasks - KEY CHANGE: Remove from dependencies view
    const { error: updateError } = await adminSupabase
      .from("tasks")
      .update({
        status: "in_progress", // Shows in home dashboard
        is_dependency: false, // CRITICAL: Remove from dependencies view
        blocked_reason: null, // Clear blocked reason
        metadata: {
          ...task.metadata,
          moved_to_tasks: true,
          moved_at: new Date().toISOString(),
          moved_by: user.id,
          workflow_status: "user_working",
          original_dependency: true, // Track that this was originally a dependency
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("Error updating task:", updateError)
      return { success: false, error: "Failed to move task to your tasks", taskId }
    }

    // Log the action
    await adminSupabase.from("agent_logs").insert({
      agent_id: task.agent_id,
      log_type: "action",
      message: `📋 User took ownership of dependency: "${task.title}"`,
      metadata: {
        task_id: taskId,
        action: "move_to_tasks",
        user_id: user.id,
      },
      created_at: new Date().toISOString(),
    })

    // Send notification
    await sendSlackNotification(`📋 User took ownership of dependency "${task.title}" for ${task.agents?.name}`)

    // Revalidate all relevant pages
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/dependencies")
    revalidatePath(`/dashboard/agents/${task.agent_id}`)

    console.log(`✅ Successfully moved dependency "${task.title}" to active tasks`)

    return {
      success: true,
      message: `"${task.title}" moved to your active tasks. Complete it when you're ready.`,
      taskId,
    }
  } catch (error) {
    console.error("Error moving task to tasks:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Complete task and move to completed dependencies history
export async function completeTaskAndMoveToHistory(
  prevState: MarkCompleteState | undefined,
  formData: FormData,
): Promise<MarkCompleteState> {
  try {
    const taskId = formData.get("taskId") as string
    const completionNotes = (formData.get("completionNotes") as string) || ""

    if (!taskId) {
      return { success: false, error: "Task ID is required" }
    }

    console.log("🎯 Completing task and moving to history:", taskId)

    const supabase = getSupabaseFromServer()
    const adminSupabase = getSupabaseAdmin()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get the task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        agent_id,
        metadata,
        agents (
          owner_id,
          name
        )
      `)
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return { success: false, error: "Task not found", taskId }
    }

    // Verify ownership
    if (task.agents?.owner_id !== user.id) {
      return { success: false, error: "Unauthorized to modify this task", taskId }
    }

    // Update task to completed and move back to dependencies history
    const updatedMetadata = {
      ...task.metadata,
      completion_notes: completionNotes || "Task completed by user",
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      workflow_status: "completed",
    }

    const { error: updateError } = await adminSupabase
      .from("tasks")
      .update({
        status: "done", // Mark as completed
        is_dependency: true, // Move back to dependencies (for history)
        blocked_reason: null,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (updateError) {
      console.error("Error updating task:", updateError)
      return { success: false, error: "Failed to complete task", taskId }
    }

    // Log completion
    await adminSupabase.from("agent_logs").insert({
      agent_id: task.agent_id,
      log_type: "success",
      message: `✅ User completed dependency: "${task.title}"`,
      metadata: {
        task_id: taskId,
        action: "complete_dependency",
        user_id: user.id,
        completion_notes: completionNotes,
      },
      created_at: new Date().toISOString(),
    })

    // Send notification
    const agentName = task.agents?.name || "Agent"
    await sendSlackNotification(`✅ Dependency "${task.title}" completed by user! ${agentName} can now continue.`)

    // Trigger agent restart if needed
    try {
      await triggerAgentRestart(task.agent_id)
    } catch (restartError) {
      console.warn("⚠️ Failed to restart agent (non-critical):", restartError)
    }

    // Revalidate all pages
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/dependencies")
    revalidatePath(`/dashboard/agents/${task.agent_id}`)

    return {
      success: true,
      message: `"${task.title}" completed! Check the completed tab in dependencies to see your work.`,
      taskId,
    }
  } catch (error) {
    console.error("Error completing task:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Update task metadata with dependency settings
export async function updateTaskMetadata(
  prevState: MarkCompleteState | undefined,
  formData: FormData,
): Promise<MarkCompleteState> {
  try {
    const taskId = formData.get("taskId") as string
    if (!taskId) {
      return { success: false, error: "Task ID is required" }
    }

    const supabase = getSupabaseFromServer()
    const adminSupabase = getSupabaseAdmin()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select(`id, metadata, agents (owner_id)`)
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return { success: false, error: "Task not found" }
    }

    // Verify ownership
    if (task.agents?.owner_id !== user.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Update metadata (preserving existing values)
    const currentMetadata = task.metadata || {}
    const updates: Record<string, any> = {}

    // Process form data
    const priority = formData.get("priority")
    const deadline = formData.get("deadline")
    const estimatedHours = formData.get("estimated_hours")
    const userNotes = formData.get("user_notes")

    if (priority) updates.priority = priority
    if (deadline) updates.deadline = deadline
    if (estimatedHours) updates.estimated_hours = Number(estimatedHours)
    if (userNotes) updates.user_notes = userNotes

    const newMetadata = { ...currentMetadata, ...updates }

    // Save updated metadata
    const { error: updateError } = await adminSupabase
      .from("tasks")
      .update({
        metadata: newMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)

    if (updateError) {
      return { success: false, error: "Failed to update task" }
    }

    revalidatePath("/dashboard/dependencies")
    return { success: true, message: "Task settings updated successfully", taskId }
  } catch (error) {
    console.error("Error updating task metadata:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Legacy function for backward compatibility
export async function markTaskComplete(
  prevState: MarkCompleteState | undefined,
  formData: FormData,
): Promise<MarkCompleteState> {
  return completeTaskAndMoveToHistory(prevState, formData)
}

// Helper function to restart agent after dependency completion
async function triggerAgentRestart(agentId: string): Promise<void> {
  const supabase = getSupabaseAdmin()

  try {
    // Check if agent has any remaining pending dependencies
    const { data: remainingDeps } = await supabase
      .from("tasks")
      .select("id")
      .eq("agent_id", agentId)
      .eq("is_dependency", true)
      .in("status", ["blocked", "todo", "in_progress"])

    if (!remainingDeps || remainingDeps.length === 0) {
      // No more pending dependencies, restart the agent
      await supabase
        .from("agents")
        .update({
          status: "active",
          metadata: {
            auto_restarted: true,
            restart_reason: "All dependencies completed by user",
            restarted_at: new Date().toISOString(),
          },
        })
        .eq("id", agentId)

      // Log the restart
      await supabase.from("agent_logs").insert({
        agent_id: agentId,
        log_type: "info",
        message: "🚀 Agent automatically restarted - all dependencies completed by user!",
        metadata: {
          auto_restart: true,
          trigger: "user_dependency_completion",
        },
        created_at: new Date().toISOString(),
      })

      console.log(`✅ Agent ${agentId} restarted automatically`)
    } else {
      console.log(`⏳ Agent ${agentId} still has ${remainingDeps.length} pending dependencies`)
    }
  } catch (error) {
    console.error("Error restarting agent:", error)
  }
}
