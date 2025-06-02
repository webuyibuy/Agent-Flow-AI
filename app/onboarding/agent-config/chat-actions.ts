"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface ChatRequest {
  templateSlug: string
  templateName: string
  userId: string
  messageHistory?: Array<{ role: string; content: string }>
  userMessage?: string
  isInitial?: boolean
  currentAgentData?: Record<string, any>
}

interface ChatResponse {
  success: boolean
  message?: string
  agentData?: Record<string, any>
  setupComplete?: boolean
  error?: string
}

export async function generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
  try {
    const {
      templateSlug,
      templateName,
      userId,
      messageHistory = [],
      userMessage,
      isInitial = false,
      currentAgentData = {},
    } = request

    // Generate initial greeting
    if (isInitial) {
      const greeting = getDefaultGreeting(templateName)
      return {
        success: true,
        message: greeting,
        agentData: { templateSlug, templateName },
      }
    }

    // Handle ongoing conversation
    if (userMessage && messageHistory.length > 0) {
      // Determine what information we still need
      const neededInfo = determineNeededInfo(messageHistory, currentAgentData)

      // Check if we have all required information
      const setupComplete = isSetupComplete(currentAgentData, neededInfo)

      // Extract information from the user's message
      const extractedData = extractInfoFromMessage(
        userMessage,
        messageHistory[messageHistory.length - 2]?.content || "",
        currentAgentData,
      )

      const updatedAgentData = { ...currentAgentData, ...extractedData }

      // Generate next question or completion message
      let nextMessage = ""
      if (setupComplete) {
        nextMessage = "Perfect! I have all the information I need. Ready to create your agent?"
      } else {
        nextMessage = getNextQuestion(neededInfo[0], templateName)
      }

      return {
        success: true,
        message: nextMessage,
        agentData: updatedAgentData,
        setupComplete,
      }
    }

    return {
      success: false,
      error: "Invalid request parameters",
    }
  } catch (error) {
    console.error("Error in generateChatResponse:", error)
    return {
      success: false,
      error: "Failed to generate response",
    }
  }
}

export async function completeAgentSetup(request: { agentData: any; userId: string }): Promise<{
  success: boolean
  redirectUrl?: string
  error?: string
}> {
  try {
    const { agentData, userId } = request
    const supabase = getSupabaseAdmin()

    // Validate required fields
    if (!agentData.name) {
      agentData.name = `${agentData.templateName} Agent`
    }

    if (!agentData.goal) {
      return {
        success: false,
        error: "Missing agent goal",
      }
    }

    console.log(`[CompleteAgentSetup] Creating agent for user ${userId}:`, agentData)

    // Create the agent in the database using existing schema
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name: agentData.name,
        goal: agentData.goal,
        behavior: agentData.behavior || "",
        owner_id: userId,
        template_slug: agentData.templateSlug,
        template_name: agentData.templateName,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating agent:", error)
      return {
        success: false,
        error: "Failed to create agent",
      }
    }

    if (!agent) {
      return {
        success: false,
        error: "Failed to create agent",
      }
    }

    // Store additional data in custom data table
    const { error: customDataError } = await supabase.from("agent_custom_data").insert({
      agent_id: agent.id,
      owner_id: userId,
      custom_data: agentData,
      configuration_method: "chat_setup",
      created_at: new Date().toISOString(),
    })

    if (customDataError) {
      console.error("Error storing custom data:", customDataError)
      // Continue anyway, not critical
    }

    // Create initial tasks
    await createInitialTasks(agent.id, agentData, userId)

    // Log creation
    await supabase.from("agent_logs").insert({
      agent_id: agent.id,
      log_type: "milestone",
      message: `🎉 Agent "${agentData.name}" created via chat setup!`,
      metadata: {
        template: agentData.templateSlug,
        created_via: "chat_setup",
        goal: agentData.goal,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")

    return {
      success: true,
      redirectUrl: `/dashboard/agents/${agent.id}`,
    }
  } catch (error) {
    console.error("Error in completeAgentSetup:", error)
    return {
      success: false,
      error: "Failed to complete setup",
    }
  }
}

// Helper functions
function determineNeededInfo(
  messageHistory: Array<{ role: string; content: string }>,
  currentData: Record<string, any>,
): string[] {
  const neededInfo = []

  if (!currentData.goal) neededInfo.push("goal")
  if (!currentData.name) neededInfo.push("name")
  if (!currentData.behavior && messageHistory.length >= 4) neededInfo.push("behavior")

  return neededInfo
}

function isSetupComplete(currentData: Record<string, any>, neededInfo: string[]): boolean {
  return currentData.goal && currentData.name && neededInfo.length <= 1
}

function extractInfoFromMessage(
  userMessage: string,
  previousQuestion: string,
  currentData: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}

  // Simple keyword-based extraction
  const lowerMessage = userMessage.toLowerCase()
  const lowerPrevious = previousQuestion.toLowerCase()

  // Extract goal
  if (
    !currentData.goal &&
    (lowerPrevious.includes("goal") || lowerPrevious.includes("accomplish") || lowerPrevious.includes("achieve"))
  ) {
    result.goal = userMessage
  }

  // Extract name
  if (!currentData.name && (lowerPrevious.includes("name") || lowerPrevious.includes("call"))) {
    result.name = userMessage
  }

  // Extract behavior
  if (
    !currentData.behavior &&
    (lowerPrevious.includes("behave") || lowerPrevious.includes("operate") || lowerPrevious.includes("work"))
  ) {
    result.behavior = userMessage
  }

  // If this is the first message and no specific field is being asked for, assume it's the goal
  if (!currentData.goal && Object.keys(result).length === 0) {
    result.goal = userMessage
  }

  return result
}

function getNextQuestion(neededInfo: string, templateName: string): string {
  const questions: Record<string, string> = {
    goal: `What would you like to accomplish with your ${templateName}?`,
    name: `What would you like to name your ${templateName}?`,
    behavior: `How would you like your ${templateName} to behave or operate?`,
  }

  return questions[neededInfo] || `What else would you like to tell me about your ${templateName}?`
}

function getDefaultGreeting(templateName: string): string {
  const greetings: Record<string, string> = {
    "Mental Peace & Mindfulness Coach":
      "Hi! I'm your mindfulness coach. What would you like to achieve with meditation and inner peace?",
    "Personal Fitness Trainer": "Hey there! I'm your fitness trainer. What are your fitness goals?",
    "Sales Lead Generator": "Hello! I'm your sales assistant. What kind of leads are you looking to generate?",
    "Customer Support Agent":
      "Hi! I'm here to help with customer support. What kind of support do you want to provide?",
    "Productivity Optimizer":
      "Hi! I'm your productivity coach. What areas of your productivity would you like to improve?",
    "Research Analyst": "Hello! I'm your research assistant. What topics would you like me to help you research?",
    "Creative Content Creator": "Hi there! I'm your creative assistant. What kind of content would you like to create?",
    "Personal Financial Advisor": "Hello! I'm your financial advisor. What are your financial goals?",
  }

  return (
    greetings[templateName] ||
    `Hi! I'm your ${templateName} assistant. What would you like to accomplish with this agent?`
  )
}

async function createInitialTasks(agentId: string, agentData: any, userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    // Create a simple initial task based on the agent's goal
    const taskTitle = `Initial setup for ${agentData.name}`
    const taskDescription = `Configure and prepare the agent to achieve: ${agentData.goal}`

    await supabase.from("tasks").insert({
      agent_id: agentId,
      title: taskTitle,
      description: taskDescription,
      priority: "high",
      status: "pending",
      created_at: new Date().toISOString(),
    })

    console.log(`[CreateInitialTasks] Created initial task for agent ${agentId}`)
  } catch (error) {
    console.error("Error creating initial tasks:", error)
  }
}
