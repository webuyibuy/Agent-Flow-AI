"use server"

import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"
import { revalidatePath } from "next/cache"

export async function startAgentExecution(agentId: string) {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_id", userId)
      .single()

    if (agentError || !agent) {
      console.error("Agent access error:", agentError)
      return {
        success: false,
        error: "You don't have access to this agent or it doesn't exist",
      }
    }

    // Update agent status to executing
    const { error: updateError } = await supabase.from("agents").update({ status: "executing" }).eq("id", agentId)

    if (updateError) {
      console.error("Agent status update error:", updateError)
      return { success: false, error: "Failed to update agent status" }
    }

    // Get agent's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("agent_id", agentId)
      .order("priority", { ascending: false })

    if (tasksError) {
      console.error("Tasks fetch error:", tasksError)
      return { success: false, error: "Failed to fetch agent tasks" }
    }

    // Simulate execution with logs
    const logs = [
      `Agent "${agent.name}" execution started`,
      `Found ${tasks?.length || 0} tasks to process`,
      "Analyzing tasks and dependencies...",
      "Prioritizing work items...",
      "Beginning task execution sequence...",
    ]

    // Process each task (simulated)
    if (tasks && tasks.length > 0) {
      for (const task of tasks.slice(0, 3)) {
        // Process up to 3 tasks for demo
        logs.push(`Processing task: ${task.title}`)

        // Update task status
        await supabase
          .from("tasks")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id)

        // Simulate thinking
        logs.push(`Analyzing task requirements for "${task.title}"`)
        logs.push(`Generating solution approach...`)

        // Simulate completion for demo
        if (Math.random() > 0.3) {
          await supabase
            .from("tasks")
            .update({
              status: "completed",
              completion_percentage: 100,
              updated_at: new Date().toISOString(),
            })
            .eq("id", task.id)

          logs.push(`✅ Completed task: ${task.title}`)
        } else {
          logs.push(`⚠️ Task "${task.title}" requires human input`)

          // Create a dependency
          const { error: depError } = await supabase.from("dependencies").insert({
            task_id: task.id,
            agent_id: agentId,
            description: `Human input needed for task: ${task.title}`,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (!depError) {
            logs.push(`Created dependency for human input`)
          }
        }
      }
    } else {
      logs.push("No tasks found to execute")
    }

    // Update agent status back to active
    await supabase
      .from("agents")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    logs.push("Agent execution completed")

    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      logs,
    }
  } catch (error) {
    console.error("Agent execution error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown execution error",
      logs: ["Execution failed due to an error"],
    }
  }
}

export async function stopAgentExecution(agentId: string) {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    // Verify agent ownership
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .eq("owner_id", userId)
      .single()

    if (agentError || !agent) {
      return { success: false, message: "You don't have access to this agent or it doesn't exist" }
    }

    // Update agent status to paused
    const { error: updateError } = await supabase
      .from("agents")
      .update({
        status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId)

    if (updateError) {
      return { success: false, message: "Failed to update agent status" }
    }

    revalidatePath(`/dashboard/agents/${agentId}`)

    return {
      success: true,
      message: "Agent execution stopped successfully",
    }
  } catch (error) {
    console.error("Stop execution error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error stopping execution",
    }
  }
}
