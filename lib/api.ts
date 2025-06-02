import { getSupabaseFromServer } from "@/lib/supabase/server"
import { getDefaultUserId } from "@/lib/default-user"

export interface Agent {
  id: string
  name: string
  goal: string
  behavior: string
  status: string
  template_slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  agent_id: string
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Get a specific agent by ID
 */
export async function getAgent(agentId: string): Promise<ApiResponse<Agent>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase.from("agents").select("*").eq("id", agentId).eq("owner_id", userId).single()

    if (error) {
      console.error("Error fetching agent:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data,
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error fetching agent:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch agent",
      success: false,
    }
  }
}

/**
 * Get all agents for the current user
 */
export async function getAgents(): Promise<ApiResponse<Agent[]>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching agents:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data || [],
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error fetching agents:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch agents",
      success: false,
    }
  }
}

/**
 * Get tasks for a specific agent
 */
export async function getAgentTasks(agentId: string): Promise<ApiResponse<Task[]>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("agent_id", agentId)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching agent tasks:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data || [],
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error fetching agent tasks:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch agent tasks",
      success: false,
    }
  }
}

/**
 * Get all tasks for the current user
 */
export async function getTasks(): Promise<ApiResponse<Task[]>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tasks:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: data || [],
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error fetching tasks:", error)
    return {
      data: null,
      error: error.message || "Failed to fetch tasks",
      success: false,
    }
  }
}

/**
 * Create a new task
 */
export async function createTask(taskData: {
  title: string
  description: string
  priority: string
  agent_id: string
  due_date?: string
}): Promise<ApiResponse<Task>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        ...taskData,
        created_by: userId,
        status: "todo",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating task:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data,
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error creating task:", error)
    return {
      data: null,
      error: error.message || "Failed to create task",
      success: false,
    }
  }
}

/**
 * Update a task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { data, error } = await supabase
      .from("tasks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("created_by", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating task:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data,
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error updating task:", error)
    return {
      data: null,
      error: error.message || "Failed to update task",
      success: false,
    }
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = getSupabaseFromServer()
    const userId = await getDefaultUserId()

    const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("created_by", userId)

    if (error) {
      console.error("Error deleting task:", error)
      return {
        data: null,
        error: error.message,
        success: false,
      }
    }

    return {
      data: true,
      error: null,
      success: true,
    }
  } catch (error: any) {
    console.error("API error deleting task:", error)
    return {
      data: null,
      error: error.message || "Failed to delete task",
      success: false,
    }
  }
}
