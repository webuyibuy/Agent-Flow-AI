"use server"

import { getSupabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AIOperations } from "@/lib/ai-operations"
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

    // Generate initial greeting using LLM
    if (isInitial) {
      try {
        const initialPrompt = `
You are a friendly ${templateName} assistant helping a user set up their agent.

Start with a warm, brief greeting (1-2 sentences) introducing yourself as their ${templateName}.
Then ask ONE simple question about what they want to accomplish with this agent.

Keep your response very concise and conversational. Just one question at a time.
Make sure your greeting reflects your role as a ${templateName}.
`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt: `You are a helpful ${templateName} assistant. Be friendly, concise, and professional.`,
          userId,
          temperature: 0.7,
        })

        if ("error" in response) {
          console.log(`[ChatActions] LLM error, using fallback greeting: ${response.error}`)
          return {
            success: true,
            message: getDefaultGreeting(templateName),
            agentData: { templateSlug, templateName },
          }
        }

        console.log(`[ChatActions] Generated greeting using LLM`)
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

    // Handle ongoing conversation
    if (userMessage && messageHistory.length > 0) {
      // Determine what information we still need
      const neededInfo = determineNeededInfo(messageHistory, currentAgentData)

      // Check if we have all required information
      const setupComplete = isSetupComplete(currentAgentData, neededInfo)

      try {
        // Extract information from the user's message using LLM
        const extractedData = await extractInfoFromMessageAI(
          userMessage,
          messageHistory[messageHistory.length - 2]?.content || "",
          currentAgentData,
          userId,
        )

        const updatedAgentData = { ...currentAgentData, ...extractedData }

        // Generate next response using LLM
        const nextPrompt = createNextPrompt(templateName, userMessage, neededInfo, setupComplete, updatedAgentData)

        const conversationHistory = messageHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

        // Use AIOperations for a more contextual response
        const aiResponse = await AIOperations.generateConversationResponse(
          nextPrompt,
          conversationHistory,
          {
            userName: "User",
            agentRole: templateName,
            templateSlug: templateSlug,
          },
          userId,
        )

        console.log(`[ChatActions] Generated response using LLM, setupComplete: ${setupComplete}`)

        return {
          success: true,
          message: aiResponse || getNextQuestion(neededInfo[0], templateName),
          agentData: updatedAgentData,
          setupComplete,
        }
      } catch (error) {
        console.error("[ChatActions] Error in AI conversation:", error)

        // Fallback to simple response
        const nextMessage = setupComplete
          ? "Perfect! I have all the information I need. Ready to create your agent?"
          : getNextQuestion(neededInfo[0], templateName)

        return {
          success: true,
          message: nextMessage,
          agentData: currentAgentData,
          setupComplete,
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

    // Create initial tasks using AI
    await createInitialTasksWithAI(agent.id, agentData, userId)

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

// AI-powered information extraction
async function extractInfoFromMessageAI(
  userMessage: string,
  previousQuestion: string,
  currentData: Record<string, any>,
  userId: string,
): Promise<Record<string, any>> {
  try {
    const extractionPrompt = `
Extract key information from this user message. The previous assistant question was: "${previousQuestion}"

User message: "${userMessage}"

Based on the context, extract the most likely piece of information this is providing.
Return a JSON object with ONLY ONE of these fields (the most relevant one):
{
  "name": "extracted agent name",
  "goal": "extracted agent goal",
  "behavior": "extracted agent behavior"
}

Only include the field that is most relevant to what was asked. Return ONLY valid JSON.
`

    const systemPrompt = `You are a data extraction assistant. Extract only the most relevant information from the user message based on the previous question context. Return only valid JSON with a single field.`

    const result = await LLMService.generateJSON({
      prompt: extractionPrompt,
      systemPrompt,
      userId,
    })

    if (!result.success || !result.data) {
      console.log("[ExtractInfo] LLM extraction failed, falling back to simple extraction")
      return simpleExtractInfo(userMessage, previousQuestion, currentData)
    }

    console.log("[ExtractInfo] LLM extraction result:", result.data)
    return result.data
  } catch (error) {
    console.error("[ExtractInfo] Error extracting with AI:", error)
    return simpleExtractInfo(userMessage, previousQuestion, currentData)
  }
}

// Simple fallback extraction
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

// Create prompt for next question
function createNextPrompt(
  templateName: string,
  userMessage: string,
  neededInfo: string[],
  setupComplete: boolean,
  agentData: Record<string, any>,
): string {
  if (setupComplete) {
    return `
Thank the user for providing all the information you need. Let them know you're ready to create their ${templateName} agent.
Keep your response very brief and friendly.
`
  }

  const nextNeeded = neededInfo[0] || "additional_details"
  const contextInfo = `
Current information:
${agentData.goal ? `- Goal: ${agentData.goal}` : ""}
${agentData.name ? `- Name: ${agentData.name}` : ""}
${agentData.behavior ? `- Behavior: ${agentData.behavior}` : ""}
`

  const prompts: Record<string, string> = {
    name: `
Based on our conversation so far, ask the user what they would like to name their ${templateName} agent.
Keep your question very brief and conversational. Just one question.
${contextInfo}
`,
    goal: `
Based on our conversation so far, ask the user what their main goal or objective is for this ${templateName} agent.
Keep your question very brief and conversational. Just one question.
${contextInfo}
`,
    behavior: `
Based on our conversation so far, ask the user how they would like their ${templateName} agent to behave or operate.
Keep your question very brief and conversational. Just one question.
${contextInfo}
`,
    additional_details: `
Based on our conversation so far, ask the user if there's anything else they'd like to add about their ${templateName} agent.
Keep your question very brief and conversational. Just one question.
${contextInfo}
`,
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

// Create initial tasks using AI
async function createInitialTasksWithAI(agentId: string, agentData: any, userId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    try {
      // Generate tasks using AI
      const taskPrompt = `
Create 3-5 initial tasks for a ${agentData.templateName} agent with the goal: "${agentData.goal}"

Return a JSON array of task objects with this structure:
[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "priority": "high|medium|low",
    "status": "todo",
    "category": "setup|research|implementation|review"
  }
]

Tasks should be practical, specific, and help achieve the agent's goal.
`

      const systemPrompt = `You are a task planning assistant for a ${agentData.templateName}. Create practical, actionable tasks that will help achieve the agent's goal. Return only valid JSON.`

      const result = await LLMService.generateJSON({
        prompt: taskPrompt,
        systemPrompt,
        userId,
      })

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`[CreateInitialTasks] Generated ${result.data.length} tasks with AI`)

        // Insert the generated tasks
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
      console.error("[CreateInitialTasks] Error generating tasks with AI:", error)
    }

    // Fallback: Create a simple initial task
    console.log("[CreateInitialTasks] Using fallback task creation")
    const taskTitle = `Initial setup for ${agentData.name}`
    const taskDescription = `Configure and prepare the agent to achieve: ${agentData.goal}`

    await supabase.from("tasks").insert({
      agent_id: agentId,
      title: taskTitle,
      description: taskDescription,
      priority: "high",
      status: "todo",
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating initial tasks:", error)
  }
}
