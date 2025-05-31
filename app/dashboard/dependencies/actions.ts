"use server"

import { getSupabaseFromServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { POINTS_PER_TASK_COMPLETION } from "@/lib/gamification"
import { sendSlackNotification } from "@/lib/slack-notifications"
import { notifyTaskCompleted } from "@/lib/notifications"

export interface MarkCompleteState {
  message?: string
  error?: string
  success?: boolean
  taskId?: string
  newTaskId?: string // To potentially highlight the new task
}

// This title should match the one created in the onboarding review-deploy action
const KEY_DEMO_DEPENDENCY_TASK_TITLE_FRAGMENT = "Human approval needed: Review"

export async function markTaskComplete(
  prevState: MarkCompleteState | undefined,
  formData: FormData,
): Promise<MarkCompleteState> {
  const supabase = getSupabaseFromServer()
  const adminSupabase = getSupabaseAdmin()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Authentication required." }
  }

  const taskId = formData.get("taskId") as string
  if (!taskId) {
    return { error: "Task ID is missing." }
  }

  const { data: task, error: taskFetchError } = await adminSupabase
    .from("tasks")
    .select(
      `
      id, 
      agent_id, 
      status, 
      is_dependency, 
      title,
      agents (owner_id, name) // Fetching agent details
    `,
    )
    .eq("id", taskId)
    .single()

  if (taskFetchError || !task) {
    return { error: "Task not found or you don't have permission to access it.", taskId }
  }

  // @ts-ignore - Supabase JS SDK typing for related tables can be tricky
  const agentOwnerId = task.agents?.owner_id
  // @ts-ignore
  const agentName = task.agents?.name || "the agent"

  if (!agentOwnerId || agentOwnerId !== user.id) {
    return { error: "You do not have permission to modify this task.", taskId }
  }

  if (task.status === "done") {
    return { message: "Task is already completed.", success: true, taskId }
  }

  // Update task status to 'done'
  const { error: updateError } = await adminSupabase
    .from("tasks")
    .update({ status: "done", updated_at: new Date().toISOString(), blocked_reason: null })
    .eq("id", taskId)

  if (updateError) {
    console.error("Error updating task status:", updateError)
    return { error: `Failed to update task: ${updateError.message}`, taskId }
  }

  // Add XP to xp_log table
  const { error: xpError } = await adminSupabase.from("xp_log").insert({
    owner_id: user.id,
    points: POINTS_PER_TASK_COMPLETION,
    task_id: taskId,
  })

  if (xpError) {
    console.error("Error adding XP:", xpError)
    // Non-critical for task completion, log and continue
  }

  // Create notification for task completion
  await notifyTaskCompleted(task.title || "Unnamed Task", agentName, user.id)

  let nextStepMessage = ""
  let newDemoTaskId: string | undefined = undefined

  if (task.is_dependency) {
    // This was a dependency task that has now been cleared.
    if (task.title?.includes(KEY_DEMO_DEPENDENCY_TASK_TITLE_FRAGMENT)) {
      // Specific demo flow: create the next task in the hardcoded sequence.
      const nextTaskTitle = `Process feedback and continue work for ${agentName}`
      const { data: newDemoTask, error: nextTaskError } = await adminSupabase
        .from("tasks")
        .insert({
          agent_id: task.agent_id,
          title: nextTaskTitle,
          is_dependency: false, // The next task in this demo sequence is not a user dependency
          status: "todo",
        })
        .select("id")
        .single()

      if (nextTaskError || !newDemoTask) {
        console.error("Error creating next demo task:", nextTaskError)
        nextStepMessage = ` Agent "${agentName}" is unblocked by this action but the next demo task could not be created automatically.`
        // Send a generic unblocked notification if next task creation failed
        await sendSlackNotification(
          `👍 Dependency "${task.title}" for agent "${agentName}" has been cleared. The agent can now proceed with other tasks.`,
        )
      } else {
        nextStepMessage = ` ${agentName} will now proceed with its next task: "${nextTaskTitle}".`
        newDemoTaskId = newDemoTask.id
        await sendSlackNotification(
          `✅ Agent "${agentName}" has resumed work after you completed a dependency. New task: "${nextTaskTitle}".`,
        )
      }
    } else {
      // A generic dependency (not the specific demo one) was cleared.
      // The agent is now unblocked from this specific dependency.
      // No automatic next task creation here, agent would pick up its own next 'todo' task.
      nextStepMessage = ` Agent "${agentName}" is no longer blocked by task "${task.title}" and can proceed with its other objectives.`
      await sendSlackNotification(
        `👍 Dependency "${task.title}" for agent "${agentName}" has been cleared. The agent can now proceed with other tasks.`,
      )
    }
  }

  revalidatePath("/dashboard/dependencies")
  revalidatePath(`/dashboard/agents/${task.agent_id}`) // Revalidate agent detail page for task list
  revalidatePath("/dashboard") // Revalidate dashboard for XP and task counts

  return {
    success: true,
    message: `Task marked complete! +${POINTS_PER_TASK_COMPLETION} XP awarded.${nextStepMessage}`,
    taskId,
    newTaskId: newDemoTaskId,
  }
}

export async function updateDependencySLA(dependencyId: string, slaHours: number) {
  const supabase = getSupabaseFromServer()

  const { data, error } = await supabase
    .from("tasks")
    .update({
      sla_hours: slaHours,
      sla_deadline: new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", dependencyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getOverdueDependencies() {
  const supabase = getSupabaseFromServer()

  const { data, error } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      blocked_reason,
      created_at,
      agent_id,
      status,
      sla_deadline,
      agents (
        name,
        owner_id
      )
    `)
    .eq("is_dependency", true)
    .neq("status", "done")
    .lt("sla_deadline", new Date().toISOString())

  if (error) throw error
  return data
}

export async function bulkApproveDependencies(dependencyIds: string[], userId: string) {
  const adminSupabase = getSupabaseAdmin()

  const { data, error } = await adminSupabase
    .from("tasks")
    .update({
      status: "done",
      updated_at: new Date().toISOString(),
      blocked_reason: null,
    })
    .in("id", dependencyIds)
    .select()

  if (error) throw error

  // Send notifications for bulk approval
  await sendSlackNotification(`Bulk approved ${dependencyIds.length} dependencies`)

  return data
}
