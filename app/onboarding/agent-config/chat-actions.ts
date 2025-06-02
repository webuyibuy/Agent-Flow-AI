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

    // Generate initial greeting
    if (isInitial) {
      console.log(`[ChatActions] Generating initial greeting for ${templateName}`)

      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length === 0) {
        return {
          success: true,
          message: getSimpleGreeting(templateName),
          agentData: { templateSlug, templateName },
          conversationCount: 0,
        }
      }

      try {
        const systemPrompt = getSystemPrompt(templateName)
        const initialPrompt = `Introduce yourself as a ${templateName} and ask one friendly question to understand how you can help them today.`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt,
          userId,
          temperature: 0.8,
          maxTokens: 150,
        })

        if ("error" in response) {
          return {
            success: true,
            message: getSimpleGreeting(templateName),
            agentData: { templateSlug, templateName },
            conversationCount: 0,
          }
        }

        return {
          success: true,
          message: response.content,
          agentData: { templateSlug, templateName },
          conversationCount: 0,
        }
      } catch (error) {
        console.error("[ChatActions] Error generating greeting:", error)
        return {
          success: true,
          message: getSimpleGreeting(templateName),
          agentData: { templateSlug, templateName },
          conversationCount: 0,
        }
      }
    }

    // Handle ongoing conversation
    if (userMessage && messageHistory.length > 0) {
      console.log(`[ChatActions] Processing conversation #${conversationCount + 1}: ${userMessage.substring(0, 50)}...`)

      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length > 0) {
        try {
          const systemPrompt = getSystemPrompt(templateName)

          // Build conversation history for context
          const conversationHistory = messageHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

          const response = await LLMService.generateConversation(
            [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: userMessage }],
            {
              userId,
              temperature: 0.8,
              maxTokens: 200,
            },
          )

          if ("error" in response) {
            return handleFallbackResponse(userMessage, templateName, conversationCount + 1, currentAgentData)
          }

          // Extract agent information from the conversation
          const extractedData = await extractAgentInfo(conversationHistory, userMessage, templateName, userId)
          const updatedAgentData = { ...currentAgentData, ...extractedData }

          // Check if we should show the Create Agent button (after 5 exchanges)
          const shouldShowButton = conversationCount >= 4

          return {
            success: true,
            message: response.content,
            agentData: updatedAgentData,
            setupComplete: shouldShowButton,
            conversationCount: conversationCount + 1,
          }
        } catch (error) {
          console.error("[ChatActions] Error in conversation:", error)
          return handleFallbackResponse(userMessage, templateName, conversationCount + 1, currentAgentData)
        }
      } else {
        return handleFallbackResponse(userMessage, templateName, conversationCount + 1, currentAgentData)
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

    console.log(`[CompleteAgentSetup] Creating agent for user ${userId}`)

    // Validate user exists and get their data
    const { data: user, error: userError } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (userError || !user) {
      console.error("User validation error:", userError)
      return {
        success: false,
        error: "User not found. Please try logging in again.",
      }
    }

    // Create agent with proper data - only using columns that exist in the schema
    const agentName = agentData.name || `My ${agentData.templateName}`
    const agentGoal = agentData.goal || `Help with ${agentData.templateName.toLowerCase()} tasks`
    const agentBehavior = agentData.behavior || `Professional ${agentData.templateName} assistant`

    console.log(`[CompleteAgentSetup] Creating agent: ${agentName}`)

    // Only include fields that exist in the agents table
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

    if (agentError) {
      console.error("Error creating agent:", agentError)
      return {
        success: false,
        error: "Failed to create agent. Please try again.",
      }
    }

    if (!agent) {
      return {
        success: false,
        error: "Failed to create agent. Please try again.",
      }
    }

    console.log(`[CompleteAgentSetup] Agent created with ID: ${agent.id}`)

    // Store all data including template_name in the custom data table
    try {
      await supabase.from("agent_custom_data").insert({
        agent_id: agent.id,
        owner_id: userId,
        custom_data: {
          ...agentData,
          template_name: agentData.templateName, // Store template_name here instead
        },
        configuration_method: "chat_setup",
        created_at: new Date().toISOString(),
      })
    } catch (customDataError) {
      console.error("Error storing custom data:", customDataError)
      // Continue anyway, this is not critical
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
      // Continue anyway
    }

    // Log the creation
    try {
      await supabase.from("agent_logs").insert({
        agent_id: agent.id,
        log_type: "milestone",
        message: `🎉 Agent "${agentName}" created successfully!`,
        metadata: {
          template: agentData.templateSlug,
          created_via: "chat_setup",
          template_name: agentData.templateName,
        },
      })
    } catch (logError) {
      console.error("Error creating log:", logError)
      // Continue anyway
    }

    // Revalidate relevant pages
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

// Helper functions
function getSystemPrompt(templateName: string): string {
  const prompts: Record<string, string> = {
    "Mental Peace & Mindfulness Coach": `You are a warm, empathetic Mental Peace & Mindfulness Coach. You help people find inner peace, manage stress, and develop mindfulness practices. 

Stay in character as a mindfulness coach. Be supportive, understanding, and offer practical mindfulness advice. Ask thoughtful questions about their stress levels, meditation experience, and wellness goals. Keep responses friendly and under 2 sentences.`,

    "Personal Fitness Trainer": `You are an enthusiastic, motivating Personal Fitness Trainer. You help people achieve their fitness goals through exercise, nutrition guidance, and lifestyle changes.

Stay in character as a fitness trainer. Be encouraging, knowledgeable about fitness, and ask about their fitness goals, current activity level, and any limitations. Keep responses energetic and under 2 sentences.`,

    "Sales Lead Generator": `You are a professional, results-driven Sales Lead Generator. You help businesses find and convert potential customers through strategic outreach and lead qualification.

Stay in character as a sales expert. Be business-focused, ask about their target market, current sales challenges, and lead generation goals. Keep responses professional and under 2 sentences.`,

    "Customer Support Agent": `You are a helpful, patient Customer Support Agent. You excel at solving problems, improving customer experiences, and creating efficient support processes.

Stay in character as a support specialist. Be solution-oriented, ask about their support challenges, customer pain points, and service goals. Keep responses helpful and under 2 sentences.`,

    "Marketing Content Manager": `You are a creative, strategic Marketing Content Manager. You help create engaging content, develop content strategies, and manage brand messaging across platforms.

Stay in character as a content marketing expert. Be creative, ask about their brand, target audience, and content goals. Keep responses inspiring and under 2 sentences.`,
  }

  return (
    prompts[templateName] ||
    `You are a professional ${templateName}. Stay in character, be helpful, and ask relevant questions about how you can assist them. Keep responses friendly and under 2 sentences.`
  )
}

function getSimpleGreeting(templateName: string): string {
  const greetings: Record<string, string> = {
    "Mental Peace & Mindfulness Coach":
      "Hi! I'm your Mental Peace & Mindfulness Coach. What's been causing you stress lately, and how can I help you find more peace in your daily life?",
    "Personal Fitness Trainer":
      "Hey there! I'm your Personal Fitness Trainer, excited to help you reach your goals! What fitness challenge are you working on right now?",
    "Sales Lead Generator":
      "Hello! I'm your Sales Lead Generator, ready to help grow your business. What's your biggest challenge in finding and converting new customers?",
    "Customer Support Agent":
      "Hi! I'm your Customer Support Agent, here to help you deliver amazing customer experiences. What support challenges are you facing with your customers?",
    "Marketing Content Manager":
      "Hi! I'm your Marketing Content Manager, ready to help you create amazing content. What's your biggest content challenge right now?",
  }

  return greetings[templateName] || `Hi! I'm your ${templateName}. How can I help you today?`
}

async function extractAgentInfo(
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string,
  templateName: string,
  userId: string,
): Promise<Record<string, any>> {
  try {
    const extractPrompt = `Based on this conversation with a ${templateName}, extract key information about what the user wants their agent to help with.

Conversation:
${conversationHistory
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}
Latest: user: ${userMessage}

Extract and return JSON with any relevant information:
{
  "name": "suggested agent name if mentioned",
  "goal": "what they want to accomplish",
  "behavior": "how they want the agent to behave",
  "notes": "key preferences or requirements"
}

Only include fields where information was clearly provided. Return empty object {} if no clear information.`

    const result = await LLMService.generateJSON({
      prompt: extractPrompt,
      systemPrompt: "Extract agent configuration information from conversation. Return valid JSON only.",
      userId,
    })

    if (result.success && result.data) {
      return result.data
    }
  } catch (error) {
    console.error("Error extracting agent info:", error)
  }

  return {}
}

function handleFallbackResponse(
  userMessage: string,
  templateName: string,
  conversationCount: number,
  currentAgentData: any,
): ChatResponse {
  const fallbackResponses: Record<string, string[]> = {
    "Mental Peace & Mindfulness Coach": [
      "I understand you're looking for peace and mindfulness support. What specific stress or anxiety would you like help managing?",
      "That's a great point about your wellness journey. How would you like to incorporate mindfulness into your daily routine?",
      "I hear you, and I'm here to support your mental wellness. What time of day do you find most challenging for maintaining peace?",
      "Thank you for sharing that with me. What mindfulness techniques have you tried before, if any?",
      "I appreciate you opening up about this. What would success look like for you in terms of mental peace and mindfulness?",
    ],
    "Personal Fitness Trainer": [
      "I love your enthusiasm for fitness! What's your main fitness goal right now - strength, endurance, or weight management?",
      "That's awesome! How many days per week are you currently able to dedicate to working out?",
      "Great to hear! Do you have access to a gym, or would you prefer home workouts?",
      "Perfect! What's been your biggest challenge in staying consistent with fitness?",
      "Excellent! What would you consider your biggest fitness achievement so far?",
    ],
  }

  const responses = fallbackResponses[templateName] || [
    `I understand what you're saying about that. How can I help you as your ${templateName}?`,
    `That's interesting! What specific goals do you have that I can help you achieve?`,
    `I see what you mean. What would you like to focus on first?`,
    `Thanks for sharing that. What's the most important thing you'd like my help with?`,
    `I appreciate you telling me that. What would success look like for you?`,
  ]

  const responseIndex = Math.min(conversationCount - 1, responses.length - 1)
  const shouldShowButton = conversationCount >= 5

  return {
    success: true,
    message: responses[responseIndex],
    agentData: currentAgentData,
    setupComplete: shouldShowButton,
    conversationCount,
  }
}
