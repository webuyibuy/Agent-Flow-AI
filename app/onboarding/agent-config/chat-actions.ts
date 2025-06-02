"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { LLMService } from "@/lib/llm-service"

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
  conversationCount?: number
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

    console.log(`[ChatActions] Processing request for ${templateName}, isInitial: ${isInitial}`)

    // Count conversation exchanges (user messages only)
    const conversationCount = messageHistory.filter((msg) => msg.role === "user").length

    // Check if user has OpenAI API key
    const availableProviders = await LLMService.getAvailableProviders(userId)
    console.log(`[ChatActions] Available providers: ${availableProviders.join(", ")}`)

    if (availableProviders.length === 0) {
      return {
        success: false,
        error: "Please add an OpenAI API key in your settings to enable intelligent conversations.",
      }
    }

    // Generate initial greeting using pure OpenAI
    if (isInitial) {
      console.log(`[ChatActions] Generating OpenAI initial greeting for ${templateName}`)

      try {
        const systemPrompt = `You are a professional ${templateName}. You are having a real conversation with someone who wants to set up an AI agent like you.

Be natural, friendly, and genuinely helpful. Introduce yourself and ask one thoughtful question to understand how you can help them.

Do NOT use scripted responses. Be conversational and authentic.`

        const response = await LLMService.generateText(
          `Introduce yourself as a ${templateName} and start a natural conversation to understand how you can help them.`,
          {
            systemPrompt,
            userId,
            temperature: 0.9,
            maxTokens: 150,
          },
        )

        if ("error" in response) {
          console.error(`[ChatActions] OpenAI error: ${response.error}`)
          return {
            success: false,
            error: "Unable to connect to OpenAI. Please check your API key.",
          }
        }

        console.log(`[ChatActions] OpenAI greeting generated successfully`)
        return {
          success: true,
          message: response.content,
          agentData: { templateSlug, templateName },
          conversationCount: 0,
        }
      } catch (error) {
        console.error("[ChatActions] Error generating OpenAI greeting:", error)
        return {
          success: false,
          error: "Failed to generate response. Please check your OpenAI API key.",
        }
      }
    }

    // Handle ongoing conversation with pure OpenAI
    if (userMessage && messageHistory.length > 0) {
      console.log(`[ChatActions] Processing OpenAI conversation #${conversationCount + 1}: "${userMessage}"`)

      try {
        const systemPrompt = `You are a professional ${templateName} having a real conversation with someone who wants to set up an AI agent like you.

Be genuinely helpful and respond naturally to what they're saying. If they ask you to decide something for them, actually help them decide based on your expertise. If they ask what you can do, explain and then offer to do something specific.

This is a REAL conversation - respond authentically to their actual words and questions. Be proactive and helpful.

Context: You're helping them configure an AI agent, but focus on having a natural conversation first.`

        // Build conversation history for OpenAI
        const conversationHistory = messageHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

        console.log(`[ChatActions] Sending to OpenAI with ${conversationHistory.length} previous messages`)

        // Use pure OpenAI conversation
        const response = await LLMService.generateConversation(
          [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: userMessage }],
          {
            userId,
            temperature: 0.9,
            maxTokens: 300,
          },
        )

        if ("error" in response) {
          console.error(`[ChatActions] OpenAI conversation error: ${response.error}`)
          return {
            success: false,
            error: "OpenAI API error. Please check your API key and try again.",
          }
        }

        console.log(`[ChatActions] OpenAI conversation response generated successfully`)

        // Extract agent information using OpenAI
        const extractedData = await extractAgentInfoWithOpenAI(conversationHistory, userMessage, templateName, userId)
        const updatedAgentData = { ...currentAgentData, ...extractedData }

        // Show button after 5 exchanges
        const shouldShowButton = conversationCount >= 4

        return {
          success: true,
          message: response.content,
          agentData: updatedAgentData,
          setupComplete: shouldShowButton,
          conversationCount: conversationCount + 1,
        }
      } catch (error) {
        console.error("[ChatActions] Error in OpenAI conversation:", error)
        return {
          success: false,
          error: "Failed to generate response. Please try again.",
        }
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

async function extractAgentInfoWithOpenAI(
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string,
  templateName: string,
  userId: string,
): Promise<Record<string, any>> {
  try {
    console.log(`[ExtractInfo] Using OpenAI to extract agent information`)

    const extractPrompt = `Based on this conversation with a ${templateName}, extract key information about what the user wants their AI agent to help with.

Conversation:
${conversationHistory
  .slice(-6)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}
Latest: user: ${userMessage}

Extract and return ONLY a JSON object with any relevant information:
{
  "name": "suggested agent name if mentioned",
  "goal": "what they want to accomplish or their main objective",
  "behavior": "how they want the agent to behave or work",
  "notes": "any specific preferences, requirements, or context mentioned"
}

Only include fields where information was clearly provided. Return empty object {} if no clear information was shared.`

    const result = await LLMService.generateJSON({
      prompt: extractPrompt,
      systemPrompt:
        "You are an expert at extracting structured information from conversations. Return only valid JSON.",
      userId,
    })

    if (result.success && result.data) {
      console.log(`[ExtractInfo] OpenAI extracted data:`, result.data)
      return result.data
    } else {
      console.log(`[ExtractInfo] OpenAI extraction failed or returned no data`)
    }
  } catch (error) {
    console.error("Error extracting agent info with OpenAI:", error)
  }

  return {}
}

export async function completeAgentSetup(request: { agentData: any; userId: string }): Promise<{
  success: boolean
  redirectUrl?: string
  error?: string
}> {
  try {
    const { agentData, userId } = request
    const supabase = getSupabaseAdmin()

    console.log(`[CompleteAgentSetup] Creating agent for user ${userId}`)

    // Validate user exists
    const { data: user, error: userError } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (userError || !user) {
      console.error("User validation error:", userError)
      return {
        success: false,
        error: "User not found. Please try logging in again.",
      }
    }

    // Create agent with extracted data
    const agentName = agentData.name || `My ${agentData.templateName}`
    const agentGoal = agentData.goal || `Help with ${agentData.templateName.toLowerCase()} tasks`
    const agentBehavior = agentData.behavior || `Professional ${agentData.templateName} assistant`

    console.log(`[CompleteAgentSetup] Creating agent: ${agentName}`)

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .insert({
        name: agentName,
        goal: agentGoal,
        behavior: agentBehavior,
        owner_id: userId,
        template_slug: agentData.templateSlug || "custom",
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (agentError || !agent) {
      console.error("Error creating agent:", agentError)
      return {
        success: false,
        error: "Failed to create agent. Please try again.",
      }
    }

    console.log(`[CompleteAgentSetup] Agent created with ID: ${agent.id}`)

    // Store additional data
    try {
      await supabase.from("agent_custom_data").insert({
        agent_id: agent.id,
        owner_id: userId,
        custom_data: {
          ...agentData,
          template_name: agentData.templateName,
        },
        configuration_method: "openai_chat",
        created_at: new Date().toISOString(),
      })
    } catch (customDataError) {
      console.error("Error storing custom data:", customDataError)
    }

    // Create initial task
    try {
      await supabase.from("tasks").insert({
        agent_id: agent.id,
        title: `Welcome to ${agentName}`,
        description: `Your ${agentData.templateName} is ready to help you achieve: ${agentGoal}`,
        priority: "medium",
        status: "todo",
        created_at: new Date().toISOString(),
      })
    } catch (taskError) {
      console.error("Error creating initial task:", taskError)
    }

    // Log creation
    try {
      await supabase.from("agent_logs").insert({
        agent_id: agent.id,
        log_type: "milestone",
        message: `🎉 Agent "${agentName}" created via OpenAI chat!`,
        metadata: {
          template: agentData.templateSlug,
          created_via: "openai_chat",
          template_name: agentData.templateName,
        },
      })
    } catch (logError) {
      console.error("Error creating log:", logError)
    }

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
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
