"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getDecryptedApiKey } from "@/app/dashboard/settings/profile/api-key-actions"

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
  suggestions?: string[]
  apiCallMade?: boolean
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

    console.log(`🚀 [REAL API] Processing ${isInitial ? "initial" : "conversation"} for ${templateName}`)
    console.log(`📝 User message: "${userMessage}"`)

    // Count conversation exchanges
    const conversationCount = messageHistory.filter((msg) => msg.role === "user").length

    // Get OpenAI API key directly
    const openaiKey = await getDecryptedApiKey("openai", userId)

    if (!openaiKey) {
      console.log("❌ No OpenAI API key found")
      return {
        success: false,
        error: "Please add your OpenAI API key in Settings to enable real-time AI conversations.",
        apiCallMade: false,
      }
    }

    console.log(`✅ OpenAI API key found, making REAL API call...`)

    // Build conversation for OpenAI
    const messages = []

    // System prompt for intelligent conversation
    const systemPrompt = `You are an expert ${templateName} having a REAL conversation with someone who wants to create an AI agent.

IMPORTANT INSTRUCTIONS:
1. Respond naturally and accurately to ANYTHING they say - silly, serious, random, or professional
2. Be genuinely helpful and build on their input
3. When you have enough context, suggest specific strategies or actions
4. Ask follow-up questions to understand their needs better
5. If they give you good information, build a strategy around it
6. Be conversational but professional

Current context: They're setting up a ${templateName} agent. Learn about their needs and help them configure it effectively.

Respond naturally to whatever they say, even if it's random or silly. Always be helpful and engaging.`

    messages.push({ role: "system", content: systemPrompt })

    // Add conversation history
    messageHistory.forEach((msg) => {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content })
    })

    // Add current message if not initial
    if (!isInitial && userMessage) {
      messages.push({ role: "user", content: userMessage })
    }

    // For initial message, ask OpenAI to introduce itself
    if (isInitial) {
      messages.push({
        role: "user",
        content: `Introduce yourself as a ${templateName} and start a natural conversation to understand how you can help me set up an AI agent like you.`,
      })
    }

    console.log(`📡 Making REAL OpenAI API call with ${messages.length} messages...`)

    // Make REAL OpenAI API call
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 300,
        temperature: 0.9,
      }),
    })

    console.log(`📡 OpenAI API Response Status: ${response.status}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("❌ OpenAI API Error:", errorData)
      return {
        success: false,
        error: `OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`,
        apiCallMade: true,
      }
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || ""

    console.log(`✅ OpenAI API Success! Response: "${aiMessage.substring(0, 100)}..."`)
    console.log(`💰 Tokens used: ${data.usage?.total_tokens || "unknown"}`)

    // Extract agent information if we have enough conversation
    let extractedData = {}
    let suggestions: string[] = []

    if (conversationCount >= 2) {
      console.log(`🧠 Extracting agent info from conversation...`)
      extractedData = await extractAgentInfoFromConversation(messages, userId, openaiKey)

      // Generate suggestions based on conversation
      suggestions = await generateSuggestions(messages, templateName, userId, openaiKey)
    }

    const updatedAgentData = { ...currentAgentData, ...extractedData }
    const shouldShowButton = conversationCount >= 4

    return {
      success: true,
      message: aiMessage,
      agentData: updatedAgentData,
      setupComplete: shouldShowButton,
      conversationCount: isInitial ? 0 : conversationCount + 1,
      suggestions: suggestions,
      apiCallMade: true,
    }
  } catch (error) {
    console.error("💥 Error in generateChatResponse:", error)
    return {
      success: false,
      error: `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`,
      apiCallMade: false,
    }
  }
}

async function extractAgentInfoFromConversation(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  openaiKey: string,
): Promise<Record<string, any>> {
  try {
    console.log(`🔍 Making REAL API call to extract agent info...`)

    const extractPrompt = `Based on this conversation, extract key information about what the user wants their AI agent to help with.

Conversation:
${messages
  .slice(-8)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Extract and return ONLY a JSON object:
{
  "name": "suggested agent name based on conversation",
  "goal": "what they want to accomplish",
  "behavior": "how they want the agent to behave",
  "focus_area": "main area they want help with",
  "notes": "key insights from conversation"
}

Return valid JSON only.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Extract structured information from conversations. Return only valid JSON." },
          { role: "user", content: extractPrompt },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const jsonString = data.choices?.[0]?.message?.content || "{}"

      try {
        const extracted = JSON.parse(jsonString)
        console.log(`✅ Extracted agent info:`, extracted)
        return extracted
      } catch (parseError) {
        console.log(`⚠️ Failed to parse extracted JSON: ${jsonString}`)
      }
    }
  } catch (error) {
    console.error("Error extracting agent info:", error)
  }

  return {}
}

async function generateSuggestions(
  messages: Array<{ role: string; content: string }>,
  templateName: string,
  userId: string,
  openaiKey: string,
): Promise<string[]> {
  try {
    console.log(`💡 Making REAL API call to generate suggestions...`)

    const suggestionPrompt = `Based on this conversation with someone setting up a ${templateName} agent, suggest 3 specific, actionable next steps they could take.

Conversation:
${messages
  .slice(-6)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Provide 3 specific suggestions as a JSON array:
["suggestion 1", "suggestion 2", "suggestion 3"]

Make suggestions practical and based on what they've discussed.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate practical suggestions based on conversation context. Return JSON array only.",
          },
          { role: "user", content: suggestionPrompt },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const jsonString = data.choices?.[0]?.message?.content || "[]"

      try {
        const suggestions = JSON.parse(jsonString)
        console.log(`✅ Generated suggestions:`, suggestions)
        return Array.isArray(suggestions) ? suggestions : []
      } catch (parseError) {
        console.log(`⚠️ Failed to parse suggestions JSON: ${jsonString}`)
      }
    }
  } catch (error) {
    console.error("Error generating suggestions:", error)
  }

  return []
}

export async function acceptSuggestion(
  suggestion: string,
  userId: string,
  currentAgentData: any,
): Promise<{ success: boolean; message?: string; agentData?: any }> {
  try {
    console.log(`✅ User accepted suggestion: "${suggestion}"`)

    const openaiKey = await getDecryptedApiKey("openai", userId)
    if (!openaiKey) {
      return { success: false, message: "OpenAI API key required" }
    }

    console.log(`🚀 Making REAL API call to process accepted suggestion...`)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "The user accepted a suggestion. Provide a helpful response and update their agent configuration.",
          },
          {
            role: "user",
            content: `I accepted this suggestion: "${suggestion}". Please provide next steps and update my agent configuration accordingly.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const message = data.choices?.[0]?.message?.content || "Great choice! Let's implement that."

      console.log(`✅ Processed suggestion acceptance`)

      return {
        success: true,
        message,
        agentData: {
          ...currentAgentData,
          accepted_suggestions: [...(currentAgentData.accepted_suggestions || []), suggestion],
          last_suggestion_accepted: suggestion,
        },
      }
    }

    return { success: false, message: "Failed to process suggestion" }
  } catch (error) {
    console.error("Error accepting suggestion:", error)
    return { success: false, message: "Error processing suggestion" }
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

    console.log(`🎯 Creating agent with REAL conversation data:`, agentData)

    // Validate user exists
    const { data: user, error: userError } = await supabase.from("profiles").select("id").eq("id", userId).single()

    if (userError || !user) {
      return { success: false, error: "User not found. Please try logging in again." }
    }

    // Create agent with extracted data from REAL conversation
    const agentName = agentData.name || `My ${agentData.templateName}`
    const agentGoal = agentData.goal || `Help with ${agentData.templateName.toLowerCase()} tasks`
    const agentBehavior = agentData.behavior || `Professional ${agentData.templateName} assistant`

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
      return { success: false, error: "Failed to create agent. Please try again." }
    }

    // Store conversation data
    try {
      await supabase.from("agent_custom_data").insert({
        agent_id: agent.id,
        owner_id: userId,
        custom_data: {
          ...agentData,
          created_via: "real_openai_conversation",
          conversation_insights: agentData.notes,
          accepted_suggestions: agentData.accepted_suggestions || [],
        },
        configuration_method: "real_ai_chat",
        created_at: new Date().toISOString(),
      })
    } catch (customDataError) {
      console.error("Error storing conversation data:", customDataError)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")

    return {
      success: true,
      redirectUrl: `/dashboard/agents/${agent.id}`,
    }
  } catch (error) {
    console.error("Error in completeAgentSetup:", error)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
