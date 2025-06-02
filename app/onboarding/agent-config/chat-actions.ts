"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { AIOperations } from "@/lib/ai-operations"
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
      const initialPrompt = `
You are a friendly ${templateName} assistant helping a user set up their agent.

Start with a warm, brief greeting (1-2 sentences) and ask ONE simple question to begin the setup process.

For example, ask what they want to accomplish with this agent or what their main goal is.

Keep your response very concise and conversational. Just one question at a time.
`

      try {
        const response = await AIOperations.generateConversationalResponse(
          initialPrompt,
          [],
          {
            userName: "User",
            agentRole: templateName,
            templateSlug: templateSlug,
          },
          userId,
        )

        return {
          success: true,
          message: response || getDefaultGreeting(templateName),
          agentData: { templateSlug, templateName },
        }
      } catch (error) {
        console.error("Error generating initial greeting:", error)
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

      // Create a prompt based on what information we still need
      const prompt = createNextQuestionPrompt(templateName, userMessage, neededInfo, setupComplete)

      try {
        // Generate the conversational response
        const conversationHistory = messageHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))

        const response = await AIOperations.generateConversationalResponse(
          userMessage,
          conversationHistory,
          {
            userName: "User",
            agentRole: templateName,
            templateSlug: templateSlug,
          },
          userId,
        )

        // Extract information from the user's message
        const extractedData = await extractInfoFromMessage(
          userMessage,
          messageHistory[messageHistory.length - 2]?.content || "",
          currentAgentData,
          userId,
        )

        return {
          success: true,
          message: response || getDefaultResponse(neededInfo),
          agentData: { ...currentAgentData, ...extractedData },
          setupComplete,
        }
      } catch (error) {
        console.error("Error in conversation:", error)
        return {
          success: true,
          message: getDefaultResponse(neededInfo),
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

    // Validate required fields
    if (!agentData.name) {
      agentData.name = agentData.templateName + " Agent"
    }

    if (!agentData.goal) {
      return {
        success: false,
        error: "Missing agent goal",
      }
    }

    // Create the agent in the database
    const supabase = createServerActionClient({ cookies })

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
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating agent:", error)
      return {
        success: false,
        error: "Failed to create agent",
      }
    }

    // Store additional data in custom data table
    if (agent) {
      const { error: customDataError } = await supabase.from("agent_custom_data").insert({
        agent_id: agent.id,
        custom_data: agentData,
      })

      if (customDataError) {
        console.error("Error storing custom data:", customDataError)
      }

      // Create initial tasks based on the agent data
      await createInitialTasks(agent.id, agentData, userId)

      revalidatePath("/dashboard/agents")

      return {
        success: true,
        redirectUrl: `/dashboard/agents/${agent.id}`,
      }
    }

    return {
      success: false,
      error: "Failed to create agent",
    }
  } catch (error) {
    console.error("Error in completeAgentSetup:", error)
    return {
      success: false,
      error: "Failed to complete setup",
    }
  }
}

// Helper function to determine what information we still need
function determineNeededInfo(
  messageHistory: Array<{ role: string; content: string }>,
  currentData: Record<string, any>,
): string[] {
  const neededInfo = []

  // Check for required fields
  if (!currentData.name) neededInfo.push("name")
  if (!currentData.goal) neededInfo.push("goal")

  // Check for additional helpful information
  if (!currentData.behavior && messageHistory.length >= 4) neededInfo.push("behavior")
  if (!currentData.schedule && messageHistory.length >= 6) neededInfo.push("schedule")
  if (!currentData.success_criteria && messageHistory.length >= 8) neededInfo.push("success_criteria")

  return neededInfo
}

// Check if we have all the information we need
function isSetupComplete(currentData: Record<string, any>, neededInfo: string[]): boolean {
  // We need at least name and goal, and have asked at least 3 questions
  return currentData.name && currentData.goal && neededInfo.length <= 1
}

// Create a prompt for the next question based on what information we need
function createNextQuestionPrompt(
  templateName: string,
  userMessage: string,
  neededInfo: string[],
  setupComplete: boolean,
): string {
  if (setupComplete) {
    return `
Thank the user for providing all the information you need. Let them know you're ready to create their ${templateName} agent.
Keep your response very brief and friendly.
`
  }

  const nextInfoNeeded = neededInfo[0] || "additional_details"

  const prompts: Record<string, string> = {
    name: `
Ask the user what they would like to name their ${templateName} agent.
Keep your question very brief and conversational.
`,
    goal: `
Ask the user what their main goal or objective is for this ${templateName} agent.
Keep your question very brief and conversational.
`,
    behavior: `
Ask the user how they would like their ${templateName} agent to behave or operate.
Keep your question very brief and conversational.
`,
    schedule: `
Ask the user if they have any specific schedule or timing requirements for this ${templateName} agent.
Keep your question very brief and conversational.
`,
    success_criteria: `
Ask the user how they will measure success for this ${templateName} agent.
Keep your question very brief and conversational.
`,
    additional_details: `
Ask the user if there's anything else they'd like to add about their ${templateName} agent.
Keep your question very brief and conversational.
`,
  }

  return prompts[nextInfoNeeded]
}

// Extract information from the user's message
async function extractInfoFromMessage(
  userMessage: string,
  previousQuestion: string,
  currentData: Record<string, any>,
  userId: string,
): Promise<Record<string, any>> {
  try {
    // Determine what information this message might contain based on the previous question
    const extractionPrompt = `
Extract key information from this user message. The previous assistant question was: "${previousQuestion}"

User message: "${userMessage}"

Based on the context, extract the most likely piece of information this is providing.
Return a JSON object with ONLY ONE of these fields (the most relevant one):
{
  "name": "extracted agent name",
  "goal": "extracted agent goal",
  "behavior": "extracted agent behavior",
  "schedule": "extracted schedule information",
  "success_criteria": "extracted success criteria"
}

Only include the field that is most relevant to what was asked. Return ONLY valid JSON.
`

    const systemPrompt = `You are a data extraction assistant. Extract only the most relevant information from the user message based on the previous question context. Return only valid JSON with a single field.`

    // Use the LLM provider to generate JSON
    const { UserLLMProvider } = await import("@/lib/user-llm-provider")

    const extractionResult = await UserLLMProvider.generateJSON(extractionPrompt, userId, {
      systemPrompt,
      temperature: 0.1, // Very low temperature for consistent extraction
      maxTokens: 500,
    })

    if (!extractionResult) {
      return {}
    }

    // Only return fields that aren't already set, unless the new value is significantly different
    const result: Record<string, any> = {}

    // Check each field in the extraction result
    for (const [key, value] of Object.entries(extractionResult)) {
      // If we don't have this data yet, or the new value is significantly different/longer
      if (
        !currentData[key] ||
        (typeof value === "string" &&
          typeof currentData[key] === "string" &&
          value.length > currentData[key].length * 1.5)
      ) {
        result[key] = value
      }
    }

    return result
  } catch (error) {
    console.error("Error extracting data from message:", error)
    return {}
  }
}

// Create initial tasks for the agent
async function createInitialTasks(agentId: string, agentData: any, userId: string): Promise<void> {
  try {
    const supabase = createServerActionClient({ cookies })

    // Generate tasks based on agent data
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

    const systemPrompt = `You are a task planning assistant. Create practical, actionable tasks that will help achieve the agent's goal. Return only valid JSON.`

    // Use the LLM provider to generate JSON
    const { UserLLMProvider } = await import("@/lib/user-llm-provider")

    const tasksResult = await UserLLMProvider.generateJSON(taskPrompt, userId, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    if (!tasksResult || !Array.isArray(tasksResult)) {
      // Create a default task if generation fails
      await supabase.from("tasks").insert({
        agent_id: agentId,
        title: `Initial setup for ${agentData.name || agentData.templateName}`,
        description: `Configure and prepare the agent to achieve: ${agentData.goal}`,
        priority: "high",
        status: "todo",
        category: "setup",
        created_by: userId,
      })

      return
    }

    // Insert the generated tasks
    for (const task of tasksResult) {
      await supabase.from("tasks").insert({
        agent_id: agentId,
        title: task.title,
        description: task.description,
        priority: task.priority || "medium",
        status: task.status || "todo",
        category: task.category || "setup",
        created_by: userId,
      })
    }
  } catch (error) {
    console.error("Error creating initial tasks:", error)
  }
}

// Default greeting by template type
function getDefaultGreeting(templateName: string): string {
  return `Hi there! I'm your ${templateName} assistant. What would you like to accomplish with this agent?`
}

// Default response based on needed information
function getDefaultResponse(neededInfo: string[]): string {
  if (neededInfo.length === 0) {
    return "Great! I have all the information I need. Ready to create your agent?"
  }

  const nextNeeded = neededInfo[0]

  const responses: Record<string, string> = {
    name: "What would you like to name this agent?",
    goal: "What's the main goal or objective for this agent?",
    behavior: "How would you like this agent to behave or operate?",
    schedule: "Do you have any specific schedule or timing requirements for this agent?",
    success_criteria: "How will you measure success for this agent?",
  }

  return responses[nextNeeded] || "What else would you like to tell me about this agent?"
}
