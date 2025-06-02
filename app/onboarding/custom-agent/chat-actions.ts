"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { LLMService } from "@/lib/llm-service"

interface CustomChatRequest {
  userId: string
  messageHistory?: Array<{ role: string; content: string }>
  userMessage?: string
  isInitial?: boolean
  currentAgentData?: Record<string, any>
}

interface CustomChatResponse {
  success: boolean
  message?: string
  agentData?: Record<string, any>
  setupComplete?: boolean
  error?: string
}

export async function generateCustomChatResponse(request: CustomChatRequest): Promise<CustomChatResponse> {
  try {
    const { userId, messageHistory = [], userMessage, isInitial = false, currentAgentData = {} } = request

    console.log(`[CustomChatActions] Processing custom agent request, isInitial: ${isInitial}`)

    // Generate initial greeting for custom agent
    if (isInitial) {
      console.log(`[CustomChatActions] Generating initial greeting for custom agent`)

      // Check if user has any valid API keys
      const availableProviders = await LLMService.getAvailableProviders(userId)
      console.log(`[CustomChatActions] Available providers: ${availableProviders.join(", ")}`)

      if (availableProviders.length === 0) {
        console.log(`[CustomChatActions] No API keys available, using fallback greeting`)
        return {
          success: true,
          message: getCustomAgentGreeting(),
          agentData: { isCustom: true },
        }
      }

      try {
        const initialPrompt = `You are an AI assistant helping a user create a completely custom AI agent from scratch.

Start with a warm, enthusiastic greeting about creating a custom agent.
Then ask ONE specific question about what kind of tasks or problems they want their custom agent to solve.

Keep your response conversational and encouraging. Show excitement about building something unique.
Ask about their specific use case, industry, or problem they want to solve.`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt: `You are a helpful AI agent creation assistant. Be enthusiastic about custom agent creation and ask thoughtful questions to understand the user's unique needs.`,
          userId,
          temperature: 0.8,
        })

        if ("error" in response) {
          console.log(`[CustomChatActions] LLM error, using fallback greeting: ${response.error}`)
          return {
            success: true,
            message: getCustomAgentGreeting(),
            agentData: { isCustom: true },
          }
        }

        console.log(`[CustomChatActions] Generated custom greeting using LLM`)
        return {
          success: true,
          message: response.content,
          agentData: { isCustom: true },
        }
      } catch (error) {
        console.error("[CustomChatActions] Error generating initial greeting:", error)
        return {
          success: true,
          message: getCustomAgentGreeting(),
          agentData: { isCustom: true },
        }
      }
    }

    // Handle ongoing conversation for custom agent
    if (userMessage && messageHistory.length > 0) {
      console.log(`[CustomChatActions] Processing user message: ${userMessage.substring(0, 50)}...`)

      // Determine what information we still need for custom agent
      const neededInfo = determineCustomNeededInfo(messageHistory, currentAgentData)
      console.log(`[CustomChatActions] Needed info: ${neededInfo.join(", ")}`)

      // Check if we have all required information
      const setupComplete = isCustomSetupComplete(currentAgentData, neededInfo)
      console.log(`[CustomChatActions] Setup complete: ${setupComplete}`)

      // Extract information from the user's message
      const extractedData = extractCustomInfoFromMessage(
        userMessage,
        messageHistory[messageHistory.length - 2]?.content || "",
        currentAgentData,
      )

      const updatedAgentData = { ...currentAgentData, ...extractedData }
      console.log(`[CustomChatActions] Updated agent data:`, updatedAgentData)

      // Generate next response
      let nextMessage = ""
      if (setupComplete) {
        nextMessage = "Excellent! I have all the details I need to create your custom agent. Ready to bring it to life?"
      } else {
        // Check if user has API keys for AI response
        const availableProviders = await LLMService.getAvailableProviders(userId)

        if (availableProviders.length > 0) {
          try {
            // Try to generate AI response
            const nextPrompt = createCustomNextPrompt(userMessage, neededInfo, setupComplete, updatedAgentData)

            const response = await LLMService.generateText(nextPrompt, {
              systemPrompt: `You are helping create a custom AI agent. Ask thoughtful, specific questions to understand the user's unique requirements. Be encouraging and show genuine interest in their custom use case.`,
              userId,
              temperature: 0.8,
              maxTokens: 200,
            })

            if ("error" in response) {
              console.log(`[CustomChatActions] AI response failed, using fallback: ${response.error}`)
              nextMessage = getCustomNextQuestion(neededInfo[0])
            } else {
              nextMessage = response.content
            }
          } catch (error) {
            console.error("[CustomChatActions] Error generating AI response:", error)
            nextMessage = getCustomNextQuestion(neededInfo[0])
          }
        } else {
          // Use fallback question
          nextMessage = getCustomNextQuestion(neededInfo[0])
        }
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
    console.error("Error in generateCustomChatResponse:", error)
    return {
      success: false,
      error: "Failed to generate response",
    }
  }
}

export async function completeCustomAgentSetup(request: { agentData: any; userId: string }): Promise<{
  success: boolean
  redirectUrl?: string
  error?: string
}> {
  try {
    const { agentData, userId } = request
    const supabase = getSupabaseAdmin()

    // Validate required fields for custom agent
    if (!agentData.name) {
      agentData.name = "Custom AI Agent"
    }

    if (!agentData.purpose) {
      return {
        success: false,
        error: "Missing agent purpose",
      }
    }

    console.log(`[CompleteCustomAgentSetup] Creating custom agent for user ${userId}:`, agentData)

    // Create the custom agent in the database
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name: agentData.name,
        goal: agentData.purpose,
        behavior: agentData.behavior || agentData.personality || "",
        owner_id: userId,
        template_slug: "custom-agent",
        template_name: "Custom Agent",
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error creating custom agent:", error)
      return {
        success: false,
        error: "Failed to create custom agent",
      }
    }

    if (!agent) {
      return {
        success: false,
        error: "Failed to create custom agent",
      }
    }

    // Store additional custom data
    const { error: customDataError } = await supabase.from("agent_custom_data").insert({
      agent_id: agent.id,
      owner_id: userId,
      custom_data: {
        ...agentData,
        isCustom: true,
        createdVia: "custom_chat_setup",
      },
      configuration_method: "custom_chat_setup",
      created_at: new Date().toISOString(),
    })

    if (customDataError) {
      console.error("Error storing custom data:", customDataError)
    }

    // Create initial custom tasks based on the agent's purpose
    await createCustomInitialTasks(agent.id, agentData, userId)

    // Log creation
    await supabase.from("agent_logs").insert({
      agent_id: agent.id,
      log_type: "milestone",
      message: `🚀 Custom agent "${agentData.name}" created and ready for action!`,
      metadata: {
        isCustom: true,
        created_via: "custom_chat_setup",
        purpose: agentData.purpose,
        industry: agentData.industry,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")

    return {
      success: true,
      redirectUrl: `/dashboard/agents/${agent.id}?custom=true`,
    }
  } catch (error) {
    console.error("Error in completeCustomAgentSetup:", error)
    return {
      success: false,
      error: "Failed to complete custom setup",
    }
  }
}

// Helper functions for custom agent creation
function determineCustomNeededInfo(
  messageHistory: Array<{ role: string; content: string }>,
  currentData: Record<string, any>,
): string[] {
  const neededInfo = []

  if (!currentData.purpose) neededInfo.push("purpose")
  if (!currentData.industry) neededInfo.push("industry")
  if (!currentData.name) neededInfo.push("name")
  if (!currentData.personality && messageHistory.length >= 6) neededInfo.push("personality")
  if (!currentData.tools && messageHistory.length >= 8) neededInfo.push("tools")

  return neededInfo
}

function isCustomSetupComplete(currentData: Record<string, any>, neededInfo: string[]): boolean {
  return currentData.purpose && currentData.industry && currentData.name && neededInfo.length <= 1
}

function extractCustomInfoFromMessage(
  userMessage: string,
  previousQuestion: string,
  currentData: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}
  const lowerMessage = userMessage.toLowerCase()
  const lowerPrevious = previousQuestion.toLowerCase()

  // Extract purpose/use case
  if (
    !currentData.purpose &&
    (lowerPrevious.includes("solve") ||
      lowerPrevious.includes("purpose") ||
      lowerPrevious.includes("tasks") ||
      lowerPrevious.includes("help") ||
      lowerPrevious.includes("do"))
  ) {
    result.purpose = userMessage
  }

  // Extract industry/domain
  if (
    !currentData.industry &&
    (lowerPrevious.includes("industry") ||
      lowerPrevious.includes("field") ||
      lowerPrevious.includes("domain") ||
      lowerPrevious.includes("business"))
  ) {
    result.industry = userMessage
  }

  // Extract name
  if (!currentData.name && (lowerPrevious.includes("name") || lowerPrevious.includes("call"))) {
    result.name = userMessage
  }

  // Extract personality/behavior
  if (
    !currentData.personality &&
    (lowerPrevious.includes("personality") ||
      lowerPrevious.includes("behave") ||
      lowerPrevious.includes("style") ||
      lowerPrevious.includes("approach"))
  ) {
    result.personality = userMessage
  }

  // Extract tools/capabilities
  if (
    !currentData.tools &&
    (lowerPrevious.includes("tools") ||
      lowerPrevious.includes("capabilities") ||
      lowerPrevious.includes("features") ||
      lowerPrevious.includes("integrate"))
  ) {
    result.tools = userMessage
  }

  // If this is the first message, assume it's the purpose
  if (!currentData.purpose && Object.keys(result).length === 0) {
    result.purpose = userMessage
  }

  return result
}

function createCustomNextPrompt(
  userMessage: string,
  neededInfo: string[],
  setupComplete: boolean,
  agentData: Record<string, any>,
): string {
  if (setupComplete) {
    return `The user has provided all the information needed for their custom agent. Thank them enthusiastically and let them know you're ready to create their unique agent. Mention something specific about what makes their agent special based on their requirements.`
  }

  const nextNeeded = neededInfo[0] || "additional_details"

  const contextInfo = `
Current information about their custom agent:
${agentData.purpose ? `- Purpose: ${agentData.purpose}` : ""}
${agentData.industry ? `- Industry: ${agentData.industry}` : ""}
${agentData.name ? `- Name: ${agentData.name}` : ""}
${agentData.personality ? `- Personality: ${agentData.personality}` : ""}
${agentData.tools ? `- Tools: ${agentData.tools}` : ""}
`

  const prompts: Record<string, string> = {
    purpose: `Based on their initial response, ask a follow-up question to better understand their specific use case or the problems they want their custom agent to solve. Be curious and encouraging. ${contextInfo}`,
    industry: `Ask about their industry, field, or domain to better understand the context where their agent will work. This will help tailor the agent's knowledge and approach. ${contextInfo}`,
    name: `Ask what they'd like to name their custom agent. Suggest that a good name can reflect the agent's purpose or personality. ${contextInfo}`,
    personality: `Ask about the personality or communication style they want their agent to have. Should it be formal, casual, friendly, professional, etc? ${contextInfo}`,
    tools: `Ask about any specific tools, integrations, or capabilities they want their agent to have. This could include APIs, databases, or specific software. ${contextInfo}`,
    additional_details: `Ask if there are any other specific requirements, constraints, or features they want for their custom agent. ${contextInfo}`,
  }

  return prompts[nextNeeded]
}

function getCustomNextQuestion(neededInfo: string): string {
  const questions: Record<string, string> = {
    purpose: "What specific tasks or problems would you like your custom agent to help you solve?",
    industry: "What industry or field will your agent be working in?",
    name: "What would you like to name your custom agent?",
    personality: "What personality or communication style should your agent have?",
    tools: "Are there any specific tools or integrations you'd like your agent to use?",
  }

  return questions[neededInfo] || "Is there anything else specific you'd like your custom agent to do?"
}

function getCustomAgentGreeting(): string {
  return "Hi there! I'm excited to help you create a completely custom AI agent tailored to your unique needs. What specific tasks or challenges would you like your custom agent to help you with?"
}

// Create initial tasks for custom agent
async function createCustomInitialTasks(agentId: string, agentData: any, userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    // Try to generate custom tasks using AI if available
    const availableProviders = await LLMService.getAvailableProviders(userId)

    if (availableProviders.length > 0) {
      try {
        const taskPrompt = `Create 3-4 initial setup tasks for a custom AI agent with these specifications:

Purpose: ${agentData.purpose}
Industry: ${agentData.industry || "General"}
Name: ${agentData.name}
Personality: ${agentData.personality || "Professional"}
Tools: ${agentData.tools || "Standard tools"}

Return a JSON array of task objects:
[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "priority": "high|medium|low",
    "status": "todo",
    "category": "setup|research|implementation|testing"
  }
]

Focus on setup, configuration, and initial implementation tasks specific to this custom agent's purpose.`

        const systemPrompt = `You are a task planning assistant for custom AI agents. Create practical, specific tasks that will help set up and configure the agent for its intended purpose. Return only valid JSON.`

        const result = await LLMService.generateJSON({
          prompt: taskPrompt,
          systemPrompt,
          userId,
        })

        if (result.success && result.data && Array.isArray(result.data)) {
          console.log(`[CreateCustomInitialTasks] Generated ${result.data.length} custom tasks with AI`)

          for (const task of result.data) {
            await supabase.from("tasks").insert({
              agent_id: agentId,
              title: task.title,
              description: task.description,
              priority: task.priority || "medium",
              status: task.status || "todo",
              category: task.category || "setup",
              created_at: new Date().toISOString(),
            })
          }

          return
        }
      } catch (error) {
        console.error("[CreateCustomInitialTasks] Error generating tasks with AI:", error)
      }
    }

    // Fallback: Create basic custom agent tasks
    console.log("[CreateCustomInitialTasks] Using fallback custom task creation")

    const fallbackTasks = [
      {
        title: `Configure ${agentData.name} for ${agentData.industry || "your domain"}`,
        description: `Set up the agent's knowledge base and configure it for ${agentData.purpose}`,
        priority: "high",
        category: "setup",
      },
      {
        title: "Define custom workflows and processes",
        description: `Create specific workflows tailored to ${agentData.purpose}`,
        priority: "medium",
        category: "implementation",
      },
      {
        title: "Test agent capabilities and responses",
        description: "Validate that the agent performs as expected for your use case",
        priority: "medium",
        category: "testing",
      },
    ]

    for (const task of fallbackTasks) {
      await supabase.from("tasks").insert({
        agent_id: agentId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: "todo",
        category: task.category,
        created_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error creating custom initial tasks:", error)
  }
}
