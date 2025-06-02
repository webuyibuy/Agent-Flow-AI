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

    // Generate initial greeting using AI
    if (isInitial) {
      console.log(`[ChatActions] Generating initial greeting for ${templateName}`)

      // Check if user has any valid API keys
      const availableProviders = await LLMService.getAvailableProviders(userId)
      console.log(`[ChatActions] Available providers: ${availableProviders.join(", ")}`)

      if (availableProviders.length === 0) {
        console.log(`[ChatActions] No API keys available, using fallback greeting`)
        return {
          success: true,
          message: getDefaultGreeting(templateName),
          agentData: { templateSlug, templateName },
        }
      }

      try {
        const roleContext = getRoleContext(templateName)
        const initialPrompt = `You are a professional ${templateName} consultant helping a user set up their AI agent.

${roleContext}

Start with a warm, professional greeting that shows your expertise in this field.
Then ask ONE specific, insightful question that demonstrates your knowledge and helps you understand their needs.

Keep your response conversational but professional. Show genuine interest in helping them succeed.
Make it clear you're here to help them configure an agent that will truly serve their goals.`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt: `You are an expert ${templateName} consultant. Be professional, knowledgeable, and genuinely helpful. Ask strategic questions that show your expertise.`,
          userId,
          temperature: 0.8,
          maxTokens: 200,
        })

        if ("error" in response) {
          console.log(`[ChatActions] LLM error, using fallback greeting: ${response.error}`)
          return {
            success: true,
            message: getDefaultGreeting(templateName),
            agentData: { templateSlug, templateName },
          }
        }

        console.log(`[ChatActions] Generated intelligent greeting using LLM`)
        return {
          success: true,
          message: response.content,
          agentData: { templateSlug, templateName },
        }
      } catch (error) {
        console.error("[ChatActions] Error generating initial greeting:", error)
        return {
          success: true,
          message: getDefaultGreeting(templateName),
          agentData: { templateSlug, templateName },
        }
      }
    }

    // Handle ongoing conversation with AI
    if (userMessage && messageHistory.length > 0) {
      console.log(`[ChatActions] Processing user message: ${userMessage.substring(0, 50)}...`)

      // Check if user has API keys for AI conversation
      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length > 0) {
        try {
          // Use AI for intelligent conversation
          const conversationHistory = messageHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

          const roleContext = getRoleContext(templateName)
          const systemPrompt = `You are a professional ${templateName} consultant helping configure an AI agent.

${roleContext}

Your goal is to gather the following information through natural conversation:
- Agent name (what they want to call it)
- Primary goal/purpose (what they want it to accomplish)
- Specific behavior preferences (how it should operate)
- Any special requirements or constraints

Current information gathered:
${
  Object.entries(currentAgentData)
    .filter(([key, value]) => value && key !== "templateSlug" && key !== "templateName")
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n") || "None yet"
}

Guidelines:
1. Ask ONE thoughtful question at a time
2. Show expertise in your field
3. Build on their previous answers
4. Be encouraging and supportive
5. When you have enough information (name, goal, behavior), let them know you're ready to create their agent

Respond as the expert consultant, not as an AI describing what to do.`

          const response = await LLMService.generateConversation(
            [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: userMessage }],
            {
              userId,
              temperature: 0.8,
              maxTokens: 250,
            },
          )

          if ("error" in response) {
            console.log(`[ChatActions] AI conversation failed: ${response.error}`)
            // Fall back to simple extraction and response
            return handleFallbackConversation(userMessage, messageHistory, currentAgentData, templateName)
          }

          // Extract information from the conversation using AI
          const extractedData = await extractInfoWithAI(userMessage, messageHistory, currentAgentData, userId)
          const updatedAgentData = { ...currentAgentData, ...extractedData }

          // Check if setup is complete
          const setupComplete = isSetupComplete(updatedAgentData, [])

          console.log(`[ChatActions] AI conversation successful, setupComplete: ${setupComplete}`)

          return {
            success: true,
            message: response.content,
            agentData: updatedAgentData,
            setupComplete,
          }
        } catch (error) {
          console.error("[ChatActions] Error in AI conversation:", error)
          return handleFallbackConversation(userMessage, messageHistory, currentAgentData, templateName)
        }
      } else {
        // No API keys available, use fallback
        return handleFallbackConversation(userMessage, messageHistory, currentAgentData, templateName)
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

    // Create the agent in the database
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

    // Store additional data
    const { error: customDataError } = await supabase.from("agent_custom_data").insert({
      agent_id: agent.id,
      owner_id: userId,
      custom_data: agentData,
      configuration_method: "chat_setup",
      created_at: new Date().toISOString(),
    })

    if (customDataError) {
      console.error("Error storing custom data:", customDataError)
    }

    // Create initial task
    await supabase.from("tasks").insert({
      agent_id: agent.id,
      title: `Initial setup for ${agentData.name}`,
      description: `Configure and prepare the agent to achieve: ${agentData.goal}`,
      priority: "high",
      status: "todo",
      created_at: new Date().toISOString(),
    })

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

function createNextPrompt(
  templateName: string,
  userMessage: string,
  neededInfo: string[],
  setupComplete: boolean,
  agentData: Record<string, any>,
): string {
  if (setupComplete) {
    return `Thank the user for providing all the information you need. Let them know you're ready to create their ${templateName} agent. Keep your response very brief and friendly.`
  }

  const nextNeeded = neededInfo[0] || "additional_details"

  const prompts: Record<string, string> = {
    name: `Ask the user what they would like to name their ${templateName} agent. Keep your question very brief and conversational.`,
    goal: `Ask the user what their main goal or objective is for this ${templateName} agent. Keep your question very brief and conversational.`,
    behavior: `Ask the user how they would like their ${templateName} agent to behave or operate. Keep your question very brief and conversational.`,
    additional_details: `Ask the user if there's anything else they'd like to add about their ${templateName} agent. Keep your question very brief and conversational.`,
  }

  return prompts[nextNeeded]
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

function getRoleContext(templateName: string): string {
  const roleContexts: Record<string, string> = {
    "Mental Peace & Mindfulness Coach": `As a mindfulness and mental wellness expert, you understand stress management, meditation techniques, and creating sustainable peace practices. You know how to assess stress levels, recommend appropriate techniques, and create personalized mindfulness programs.`,

    "Personal Fitness Trainer": `As a certified fitness professional, you understand exercise science, nutrition basics, and how to create safe, effective workout programs. You know how to assess fitness levels, set realistic goals, and design programs that fit different lifestyles and equipment availability.`,

    "Sales Lead Generator": `As a sales and lead generation expert, you understand prospecting strategies, CRM systems, outreach techniques, and conversion optimization. You know how to identify ideal customers, craft compelling messages, and build efficient sales processes.`,

    "Customer Support Agent": `As a customer service expert, you understand support workflows, escalation procedures, knowledge management, and customer satisfaction metrics. You know how to design support processes that resolve issues quickly while maintaining high satisfaction.`,

    "Productivity Optimizer": `As a productivity and efficiency expert, you understand workflow optimization, time management, automation tools, and performance metrics. You know how to identify bottlenecks, streamline processes, and implement systems that boost productivity.`,

    "Research Analyst": `As a research and analysis expert, you understand research methodologies, data sources, analysis frameworks, and reporting standards. You know how to design research projects, gather reliable data, and present actionable insights.`,
  }

  return (
    roleContexts[templateName] ||
    `As an expert in your field, you understand the challenges and opportunities in this domain. You know how to assess needs, recommend solutions, and create effective strategies.`
  )
}

async function extractInfoWithAI(
  userMessage: string,
  messageHistory: Array<{ role: string; content: string }>,
  currentData: Record<string, any>,
  userId: string,
): Promise<Record<string, any>> {
  try {
    const extractionPrompt = `Analyze this conversation and extract any new information about the agent being configured.

Previous conversation context:
${messageHistory
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Latest user message: "${userMessage}"

Current agent data:
${JSON.stringify(currentData, null, 2)}

Extract and return ONLY new information in this JSON format:
{
  "name": "agent name if mentioned",
  "goal": "primary goal or purpose if mentioned", 
  "behavior": "behavior preferences if mentioned",
  "requirements": "special requirements if mentioned"
}

Only include fields where new information was provided. Return empty object {} if no new information.`

    const result = await LLMService.generateJSON({
      prompt: extractionPrompt,
      systemPrompt:
        "You are a data extraction assistant. Extract only new, relevant information about the agent configuration. Return valid JSON.",
      userId,
    })

    if (result.success && result.data) {
      console.log("[ExtractInfo] AI extraction successful:", result.data)
      return result.data
    }
  } catch (error) {
    console.error("[ExtractInfo] AI extraction failed:", error)
  }

  // Fallback to simple extraction
  return simpleExtractInfo(userMessage, messageHistory[messageHistory.length - 2]?.content || "", currentData)
}

function handleFallbackConversation(
  userMessage: string,
  messageHistory: Array<{ role: string; content: string }>,
  currentAgentData: Record<string, any>,
  templateName: string,
): ChatResponse {
  // Determine what information we still need
  const neededInfo = determineNeededInfo(messageHistory, currentAgentData)

  // Extract information from the user's message
  const extractedData = simpleExtractInfo(
    userMessage,
    messageHistory[messageHistory.length - 2]?.content || "",
    currentAgentData,
  )

  const updatedAgentData = { ...currentAgentData, ...extractedData }

  // Check if setup is complete
  const setupComplete = isSetupComplete(updatedAgentData, neededInfo)

  // Generate next message
  const nextMessage = setupComplete
    ? "Perfect! I have all the information I need. Ready to create your agent?"
    : getNextQuestion(neededInfo[0], templateName)

  return {
    success: true,
    message: nextMessage,
    agentData: updatedAgentData,
    setupComplete,
  }
}

function simpleExtractInfo(
  userMessage: string,
  previousQuestion: string,
  currentData: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {}
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
