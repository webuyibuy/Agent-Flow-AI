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

    // Generate initial greeting using OpenAI
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
        const initialPrompt = `Introduce yourself as a ${templateName} and ask one friendly, specific question to understand how you can help them today. Be warm and professional.`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt,
          userId,
          temperature: 0.8,
          maxTokens: 150,
        })

        if ("error" in response) {
          console.log(`[ChatActions] OpenAI failed, using fallback greeting`)
          return {
            success: true,
            message: getSimpleGreeting(templateName),
            agentData: { templateSlug, templateName },
            conversationCount: 0,
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
        console.error("[ChatActions] Error generating greeting:", error)
        return {
          success: true,
          message: getSimpleGreeting(templateName),
          agentData: { templateSlug, templateName },
          conversationCount: 0,
        }
      }
    }

    // Handle ongoing conversation with REAL OpenAI responses
    if (userMessage && messageHistory.length > 0) {
      console.log(`[ChatActions] Processing conversation #${conversationCount + 1}: "${userMessage}"`)

      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length > 0) {
        try {
          const systemPrompt = getSystemPrompt(templateName)

          // Build conversation history for OpenAI
          const conversationHistory = messageHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

          console.log(`[ChatActions] Sending to OpenAI with ${conversationHistory.length} previous messages`)

          // Use OpenAI to generate intelligent response
          const response = await LLMService.generateConversation(
            [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: userMessage }],
            {
              userId,
              temperature: 0.8,
              maxTokens: 250,
            },
          )

          if ("error" in response) {
            console.log(`[ChatActions] OpenAI failed: ${response.error}`)
            return handleIntelligentFallback(userMessage, templateName, conversationCount + 1, currentAgentData)
          }

          console.log(`[ChatActions] OpenAI response generated successfully`)

          // Extract agent information from the conversation using AI
          const extractedData = await extractAgentInfoWithAI(conversationHistory, userMessage, templateName, userId)
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
          console.error("[ChatActions] Error in OpenAI conversation:", error)
          return handleIntelligentFallback(userMessage, templateName, conversationCount + 1, currentAgentData)
        }
      } else {
        console.log(`[ChatActions] No API keys available, using intelligent fallback`)
        return handleIntelligentFallback(userMessage, templateName, conversationCount + 1, currentAgentData)
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
        configuration_method: "chat_setup",
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
        message: `🎉 Agent "${agentName}" created successfully!`,
        metadata: {
          template: agentData.templateSlug,
          created_via: "chat_setup",
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

// Helper functions
function getSystemPrompt(templateName: string): string {
  const prompts: Record<string, string> = {
    "Mental Peace & Mindfulness Coach": `You are a warm, empathetic Mental Peace & Mindfulness Coach named Alex. You help people find inner peace, manage stress, and develop mindfulness practices.

IMPORTANT: Always respond directly to what the user just said. If they ask "what will you do" or "what can you do", explain your specific capabilities. If they say "great" or "right", acknowledge it and build on the conversation naturally.

Your capabilities include:
- Stress management techniques
- Meditation guidance
- Mindfulness exercises
- Breathing techniques
- Sleep improvement strategies
- Anxiety reduction methods

Stay in character, be supportive and understanding. Respond naturally to their actual words, not with pre-scripted questions. Keep responses under 2 sentences and always acknowledge what they just said.`,

    "Personal Fitness Trainer": `You are an enthusiastic, motivating Personal Fitness Trainer named Sam. You help people achieve their fitness goals through exercise, nutrition guidance, and lifestyle changes.

IMPORTANT: Always respond directly to what the user just said. If they ask "what will you do" or "what can you do", explain your specific capabilities. If they say "great" or "right", acknowledge it and build on the conversation naturally.

Your capabilities include:
- Custom workout plans
- Nutrition guidance
- Form correction
- Goal setting and tracking
- Injury prevention
- Motivation and accountability

Stay in character, be encouraging and knowledgeable. Respond naturally to their actual words, not with pre-scripted questions. Keep responses under 2 sentences and always acknowledge what they just said.`,

    "Sales Lead Generator": `You are a professional, results-driven Sales Lead Generator named Jordan. You help businesses find and convert potential customers through strategic outreach and lead qualification.

IMPORTANT: Always respond directly to what the user just said. If they ask "what will you do" or "what can you do", explain your specific capabilities. If they say "great" or "right", acknowledge it and build on the conversation naturally.

Your capabilities include:
- Lead research and qualification
- Outreach strategy development
- CRM optimization
- Sales funnel design
- Prospect analysis
- Conversion optimization

Stay in character, be business-focused and professional. Respond naturally to their actual words, not with pre-scripted questions. Keep responses under 2 sentences and always acknowledge what they just said.`,

    "Customer Support Agent": `You are a helpful, patient Customer Support Agent named Taylor. You excel at solving problems, improving customer experiences, and creating efficient support processes.

IMPORTANT: Always respond directly to what the user just said. If they ask "what will you do" or "what can you do", explain your specific capabilities. If they say "great" or "right", acknowledge it and build on the conversation naturally.

Your capabilities include:
- Issue resolution and troubleshooting
- Knowledge base creation
- Support workflow optimization
- Customer satisfaction improvement
- Escalation procedure design
- Support metrics analysis

Stay in character, be solution-oriented and helpful. Respond naturally to their actual words, not with pre-scripted questions. Keep responses under 2 sentences and always acknowledge what they just said.`,

    "Marketing Content Manager": `You are a creative, strategic Marketing Content Manager named Casey. You help create engaging content, develop content strategies, and manage brand messaging across platforms.

IMPORTANT: Always respond directly to what the user just said. If they ask "what will you do" or "what can you do", explain your specific capabilities. If they say "great" or "right", acknowledge it and build on the conversation naturally.

Your capabilities include:
- Content strategy development
- Blog writing and SEO
- Social media content creation
- Email marketing campaigns
- Brand voice development
- Content calendar management

Stay in character, be creative and inspiring. Respond naturally to their actual words, not with pre-scripted questions. Keep responses under 2 sentences and always acknowledge what they just said.`,
  }

  return (
    prompts[templateName] ||
    `You are a professional ${templateName}. Always respond directly to what the user just said. If they ask about your capabilities, explain them specifically. Stay in character, be helpful, and respond naturally to their actual words. Keep responses under 2 sentences.`
  )
}

function getSimpleGreeting(templateName: string): string {
  const greetings: Record<string, string> = {
    "Mental Peace & Mindfulness Coach":
      "Hi! I'm Alex, your Mental Peace & Mindfulness Coach. What's been on your mind lately that's causing you stress?",
    "Personal Fitness Trainer":
      "Hey there! I'm Sam, your Personal Fitness Trainer. What fitness goal are you most excited to work on?",
    "Sales Lead Generator":
      "Hello! I'm Jordan, your Sales Lead Generator. What's your biggest challenge in finding quality leads right now?",
    "Customer Support Agent":
      "Hi! I'm Taylor, your Customer Support Agent. What support challenge is keeping you up at night?",
    "Marketing Content Manager":
      "Hi! I'm Casey, your Marketing Content Manager. What content challenge is your biggest priority right now?",
  }

  return greetings[templateName] || `Hi! I'm your ${templateName}. How can I help you today?`
}

async function extractAgentInfoWithAI(
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
  "notes": "key preferences or requirements mentioned"
}

Only include fields where information was clearly provided. Return empty object {} if no clear information.`

    const result = await LLMService.generateJSON({
      prompt: extractPrompt,
      systemPrompt: "Extract agent configuration information from conversation. Return valid JSON only.",
      userId,
    })

    if (result.success && result.data) {
      console.log(`[ExtractInfo] AI extracted data:`, result.data)
      return result.data
    }
  } catch (error) {
    console.error("Error extracting agent info with AI:", error)
  }

  return {}
}

function handleIntelligentFallback(
  userMessage: string,
  templateName: string,
  conversationCount: number,
  currentAgentData: any,
): ChatResponse {
  // Intelligent responses based on what the user actually said
  let response = ""

  const lowerMessage = userMessage.toLowerCase()

  // Handle capability questions
  if (lowerMessage.includes("what") && (lowerMessage.includes("do") || lowerMessage.includes("can"))) {
    const capabilities: Record<string, string> = {
      "Mental Peace & Mindfulness Coach":
        "I can help you with stress management, meditation guidance, breathing techniques, and developing daily mindfulness practices. What specific area would you like to focus on?",
      "Personal Fitness Trainer":
        "I can create custom workout plans, provide nutrition guidance, help with form correction, and keep you motivated to reach your fitness goals. What's your main fitness priority?",
      "Sales Lead Generator":
        "I can help you research and qualify leads, develop outreach strategies, optimize your sales funnel, and improve conversion rates. What's your biggest sales challenge?",
      "Customer Support Agent":
        "I can help you resolve customer issues, create support documentation, optimize workflows, and improve customer satisfaction. What support area needs the most attention?",
      "Marketing Content Manager":
        "I can create content strategies, write blog posts, manage social media content, and develop email campaigns. What type of content do you need most help with?",
    }
    response =
      capabilities[templateName] ||
      `I can help you with various ${templateName.toLowerCase()} tasks. What would you like to focus on?`
  }
  // Handle positive responses
  else if (lowerMessage.includes("great") || lowerMessage.includes("good") || lowerMessage.includes("right")) {
    response =
      "Awesome! I'm excited to work with you. What specific challenge would you like me to help you tackle first?"
  }
  // Handle greetings
  else if (lowerMessage.includes("hi") || lowerMessage.includes("hello")) {
    response = `Hi there! Great to meet you. As your ${templateName}, what's the main thing you'd like my help with?`
  }
  // Default intelligent response
  else {
    response = `I understand you mentioned "${userMessage}". As your ${templateName}, how can I help you with that specifically?`
  }

  const shouldShowButton = conversationCount >= 5

  return {
    success: true,
    message: response,
    agentData: currentAgentData,
    setupComplete: shouldShowButton,
    conversationCount,
  }
}
