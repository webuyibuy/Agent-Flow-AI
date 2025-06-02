"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getDecryptedApiKey } from "@/app/dashboard/settings/profile/api-key-actions"
import { DEFAULT_USER_DISPLAY_NAME } from "@/lib/default-user"

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
  debugInfo?: any
}

export async function generateChatResponse(request: ChatRequest): Promise<ChatResponse> {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    userId: request.userId,
    templateName: request.templateName,
    isInitial: request.isInitial,
    userMessage: request.userMessage,
  }

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

    console.log(`🚀 [DEBUG] Starting generateChatResponse`)
    console.log(`📋 [DEBUG] Request:`, { templateName, userId, isInitial, userMessage })

    // Count conversation exchanges
    const conversationCount = messageHistory.filter((msg) => msg.role === "user").length
    debugInfo.conversationCount = conversationCount

    // Step 1: Get API key
    console.log(`🔑 [DEBUG] Getting API key for user: ${userId}`)
    const openaiKey = await getDecryptedApiKey("openai", userId)

    if (!openaiKey) {
      console.log(`❌ [DEBUG] No API key found`)
      debugInfo.apiKeyFound = false
      return {
        success: false,
        error: "No OpenAI API key found. Please add your API key in Settings → Profile.",
        apiCallMade: false,
        debugInfo,
      }
    }

    console.log(`✅ [DEBUG] API key found: ${openaiKey.substring(0, 5)}...`)
    debugInfo.apiKeyFound = true
    debugInfo.apiKeyPrefix = openaiKey.substring(0, 5)
    debugInfo.apiKeyLength = openaiKey.length

    // Step 2: Validate API key format - REMOVED STRICT VALIDATION
    // OpenAI keys can have different formats, so we'll be more flexible
    // We'll just check if it's a reasonable length
    if (openaiKey.length < 10) {
      console.log(`⚠️ [DEBUG] API key seems too short (${openaiKey.length} chars)`)
      debugInfo.apiKeyValid = false
      debugInfo.apiKeyTooShort = true
      return {
        success: false,
        error: "API key seems too short. Please check your API key in Settings.",
        apiCallMade: false,
        debugInfo,
      }
    }

    debugInfo.apiKeyValid = true

    // Step 3: Build messages for OpenAI
    const messages = []

    const systemPrompt = `You are a professional ${templateName} AI assistant. You are helping someone configure an AI agent like yourself.

Be intelligent, helpful, and professional. Respond naturally to whatever they say and help them understand how to set up their agent effectively.

Ask relevant questions to understand their needs and provide specific, actionable advice.`

    messages.push({ role: "system", content: systemPrompt })

    // Add conversation history
    messageHistory.forEach((msg) => {
      messages.push({ role: msg.role as "user" | "assistant", content: msg.content })
    })

    // Add current message
    if (!isInitial && userMessage) {
      messages.push({ role: "user", content: userMessage })
    }

    if (isInitial) {
      messages.push({
        role: "user",
        content: `Hello! I want to set up a ${templateName} AI agent. Please introduce yourself and ask me what I need help with.`,
      })
    }

    console.log(`📡 [DEBUG] Making OpenAI API call with ${messages.length} messages`)
    debugInfo.messagesCount = messages.length
    debugInfo.apiCallAttempted = true

    // Step 4: Make REAL OpenAI API call
    const apiStartTime = Date.now()

    // Try different API endpoints if needed
    const apiEndpoint = "https://api.openai.com/v1/chat/completions"
    const model = "gpt-3.5-turbo" // Fallback to a more widely available model

    // Try to determine if this is an Azure OpenAI key
    const isAzureKey = openaiKey.includes("azure") || openaiKey.toLowerCase().startsWith("azure")
    debugInfo.isAzureKey = isAzureKey

    if (isAzureKey) {
      console.log(`🔷 [DEBUG] Detected possible Azure OpenAI key`)
      // We would need Azure endpoint info, but for now just note it
      debugInfo.needsAzureEndpoint = true
      return {
        success: false,
        error: "Azure OpenAI keys require additional configuration. Please use a direct OpenAI key.",
        apiCallMade: false,
        debugInfo,
      }
    }

    console.log(`🔑 [DEBUG] Using API endpoint: ${apiEndpoint}`)
    console.log(`🤖 [DEBUG] Using model: ${model}`)

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    const apiEndTime = Date.now()
    debugInfo.apiCallDuration = apiEndTime - apiStartTime

    console.log(`📡 [DEBUG] OpenAI API Response Status: ${response.status}`)
    console.log(`⏱️ [DEBUG] API call took: ${debugInfo.apiCallDuration}ms`)

    debugInfo.apiResponseStatus = response.status

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [DEBUG] OpenAI API Error:`, errorText)
      debugInfo.apiError = errorText

      // Check for common error types
      if (response.status === 401) {
        return {
          success: false,
          error: "Authentication error: Invalid API key. Please check your OpenAI API key.",
          apiCallMade: true,
          debugInfo,
        }
      } else if (response.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded: Your OpenAI account has reached its quota or rate limit.",
          apiCallMade: true,
          debugInfo,
        }
      } else {
        return {
          success: false,
          error: `OpenAI API Error (${response.status}): ${errorText}`,
          apiCallMade: true,
          debugInfo,
        }
      }
    }

    // Step 5: Parse response
    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || ""

    console.log(`✅ [DEBUG] OpenAI Success! Message length: ${aiMessage.length}`)
    console.log(`💰 [DEBUG] Tokens used: ${data.usage?.total_tokens || "unknown"}`)
    console.log(`🤖 [DEBUG] AI Response: "${aiMessage.substring(0, 100)}..."`)

    debugInfo.aiMessageLength = aiMessage.length
    debugInfo.tokensUsed = data.usage?.total_tokens
    debugInfo.apiCallSuccessful = true

    // Step 6: Extract agent info if enough conversation
    let extractedData = {}
    if (conversationCount >= 2) {
      console.log(`🧠 [DEBUG] Extracting agent info...`)
      extractedData = await extractAgentInfo(messages, openaiKey, debugInfo)
    }

    // Step 7: Generate suggestions based on conversation
    let suggestions: string[] = []
    if (conversationCount >= 2) {
      console.log(`💡 [DEBUG] Generating suggestions...`)
      suggestions = await generateSuggestions(messages, templateName, userId, openaiKey, debugInfo)
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
      debugInfo,
    }
  } catch (error) {
    console.error(`💥 [DEBUG] Error in generateChatResponse:`, error)
    debugInfo.error = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      error: `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`,
      apiCallMade: false,
      debugInfo,
    }
  }
}

async function extractAgentInfo(
  messages: Array<{ role: string; content: string }>,
  openaiKey: string,
  debugInfo: any,
): Promise<Record<string, any>> {
  try {
    console.log(`🔍 [DEBUG] Making extraction API call...`)

    const extractPrompt = `Based on this conversation, extract key information about what the user wants their AI agent to help with.

Conversation:
${messages
  .slice(-6)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Return ONLY a JSON object:
{
  "name": "suggested agent name",
  "goal": "what they want to accomplish", 
  "behavior": "how they want the agent to behave",
  "focus_area": "main area of focus"
}

Return valid JSON only.`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Extract information and return only valid JSON." },
          { role: "user", content: extractPrompt },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const jsonString = data.choices?.[0]?.message?.content || "{}"

      try {
        const extracted = JSON.parse(jsonString)
        console.log(`✅ [DEBUG] Extracted:`, extracted)
        debugInfo.extractionSuccessful = true
        return extracted
      } catch (parseError) {
        console.log(`⚠️ [DEBUG] JSON parse failed: ${jsonString}`)
        debugInfo.extractionParseError = jsonString
      }
    } else {
      console.log(`❌ [DEBUG] Extraction API failed: ${response.status}`)
      debugInfo.extractionApiFailed = response.status
    }
  } catch (error) {
    console.error(`❌ [DEBUG] Extraction error:`, error)
    debugInfo.extractionError = error instanceof Error ? error.message : String(error)
  }

  return {}
}

async function generateSuggestions(
  messages: Array<{ role: string; content: string }>,
  templateName: string,
  userId: string,
  openaiKey: string,
  debugInfo: any,
): Promise<string[]> {
  try {
    console.log(`💡 [DEBUG] Making suggestion API call...`)

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
        model: "gpt-3.5-turbo",
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
        console.log(`✅ [DEBUG] Suggestions:`, suggestions)
        debugInfo.suggestionsSuccessful = true
        return Array.isArray(suggestions) ? suggestions : []
      } catch (parseError) {
        console.log(`⚠️ [DEBUG] Suggestions JSON parse failed: ${jsonString}`)
        debugInfo.suggestionsParseError = jsonString
      }
    } else {
      console.log(`❌ [DEBUG] Suggestions API failed: ${response.status}`)
      debugInfo.suggestionsApiFailed = response.status
    }
  } catch (error) {
    console.error(`❌ [DEBUG] Suggestions error:`, error)
    debugInfo.suggestionsError = error instanceof Error ? error.message : String(error)
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
        model: "gpt-3.5-turbo",
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

async function ensureUserProfileExists(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    console.log(`👤 [DEBUG] Ensuring user profile exists for: ${userId}`)

    // First, check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      console.log(`✅ [DEBUG] Profile already exists: ${existingProfile.display_name}`)
      return { success: true }
    }

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error(`❌ [DEBUG] Error checking profile:`, checkError)
      return { success: false, error: `Error checking profile: ${checkError.message}` }
    }

    // Profile doesn't exist, create it
    console.log(`🔨 [DEBUG] Creating new profile for user: ${userId}`)

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        display_name: DEFAULT_USER_DISPLAY_NAME,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, display_name")
      .single()

    if (createError) {
      console.error(`❌ [DEBUG] Error creating profile:`, createError)
      return { success: false, error: `Error creating profile: ${createError.message}` }
    }

    console.log(`✅ [DEBUG] Created new profile: ${newProfile.display_name}`)
    return { success: true }
  } catch (error) {
    console.error(`💥 [DEBUG] Unexpected error in ensureUserProfileExists:`, error)
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    console.log(`🎯 [DEBUG] Creating agent with data:`, agentData)
    console.log(`👤 [DEBUG] User ID: ${userId}`)

    // Step 1: Ensure user profile exists
    const profileResult = await ensureUserProfileExists(userId)
    if (!profileResult.success) {
      console.error(`❌ [DEBUG] Failed to ensure profile exists:`, profileResult.error)
      return {
        success: false,
        error: `Profile setup failed: ${profileResult.error}`,
      }
    }

    // Step 2: Validate user exists (double-check)
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error(`❌ [DEBUG] User validation failed:`, userError)
      return {
        success: false,
        error: "User profile not found after creation attempt.",
      }
    }

    console.log(`✅ [DEBUG] User validated: ${user.display_name} (${user.id})`)

    // Step 3: Create agent with validated user
    const agentName = agentData.name || `My ${agentData.templateName}`
    const agentGoal = agentData.goal || `Help with ${agentData.templateName.toLowerCase()} tasks`
    const agentBehavior = agentData.behavior || `Professional ${agentData.templateName} assistant`

    console.log(`🤖 [DEBUG] Creating agent:`, {
      name: agentName,
      goal: agentGoal,
      behavior: agentBehavior,
      owner_id: userId,
      template_slug: agentData.templateSlug || "custom",
    })

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
        updated_at: new Date().toISOString(),
      })
      .select("id, name")
      .single()

    if (agentError) {
      console.error(`❌ [DEBUG] Error creating agent:`, agentError)

      // Check if it's a foreign key constraint error
      if (agentError.code === "23503") {
        return {
          success: false,
          error: "User profile validation failed. Please try logging out and back in.",
        }
      }

      return {
        success: false,
        error: `Failed to create agent: ${agentError.message}`,
      }
    }

    if (!agent) {
      console.error(`❌ [DEBUG] No agent returned from insert`)
      return {
        success: false,
        error: "Agent creation failed - no data returned.",
      }
    }

    console.log(`✅ [DEBUG] Agent created successfully: ${agent.name} (${agent.id})`)

    // Step 4: Store conversation data (optional, non-critical)
    try {
      const { error: customDataError } = await supabase.from("agent_custom_data").insert({
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

      if (customDataError) {
        console.warn(`⚠️ [DEBUG] Warning: Could not store conversation data:`, customDataError)
        // Don't fail the whole operation for this
      } else {
        console.log(`✅ [DEBUG] Conversation data stored successfully`)
      }
    } catch (customDataError) {
      console.warn(`⚠️ [DEBUG] Warning: Error storing conversation data:`, customDataError)
      // Don't fail the whole operation for this
    }

    // Step 5: Revalidate paths
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/agents")

    console.log(`🎉 [DEBUG] Agent setup completed successfully!`)

    return {
      success: true,
      redirectUrl: `/dashboard/agents/${agent.id}`,
    }
  } catch (error) {
    console.error(`💥 [DEBUG] Unexpected error in completeAgentSetup:`, error)
    return {
      success: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
