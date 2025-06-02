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
  suggestedTasks?: Array<{
    title: string
    description: string
    priority: "high" | "medium" | "low"
    category: string
  }>
  workResults?: Array<{
    type: string
    title: string
    content: string
  }>
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

    // Generate initial greeting with role-playing
    if (isInitial) {
      console.log(`[ChatActions] Generating initial roleplay greeting for ${templateName}`)

      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length === 0) {
        return {
          success: true,
          message: getRoleplayGreeting(templateName),
          agentData: { templateSlug, templateName, isRoleplay: true },
        }
      }

      try {
        const roleContext = getDetailedRoleContext(templateName)
        const initialPrompt = `You are now a professional ${templateName}. You're not just helping set up an agent - you ARE the agent, demonstrating your capabilities in real-time.

${roleContext}

Start by introducing yourself as the actual ${templateName}, not as someone helping to set up an agent. Show enthusiasm about working together and briefly mention 2-3 specific things you can help with right now.

Be conversational, professional, and ready to actually DO the work, not just talk about it.`

        const response = await LLMService.generateText(initialPrompt, {
          systemPrompt: `You are a professional ${templateName}. Roleplay as the actual expert, ready to work. Be engaging and show your capabilities.`,
          userId,
          temperature: 0.8,
          maxTokens: 200,
        })

        if ("error" in response) {
          return {
            success: true,
            message: getRoleplayGreeting(templateName),
            agentData: { templateSlug, templateName, isRoleplay: true },
          }
        }

        return {
          success: true,
          message: response.content,
          agentData: { templateSlug, templateName, isRoleplay: true },
        }
      } catch (error) {
        console.error("[ChatActions] Error generating roleplay greeting:", error)
        return {
          success: true,
          message: getRoleplayGreeting(templateName),
          agentData: { templateSlug, templateName, isRoleplay: true },
        }
      }
    }

    // Handle ongoing roleplay conversation
    if (userMessage && messageHistory.length > 0) {
      console.log(`[ChatActions] Processing roleplay message: ${userMessage.substring(0, 50)}...`)

      const availableProviders = await LLMService.getAvailableProviders(userId)

      if (availableProviders.length > 0) {
        try {
          // Check if user is asking about capabilities
          const isCapabilityQuery = isAskingAboutCapabilities(userMessage)

          if (isCapabilityQuery) {
            return await handleCapabilityDemonstration(templateName, userMessage, userId, currentAgentData)
          }

          // Check if user wants work done
          const isWorkRequest = isRequestingWork(userMessage)

          if (isWorkRequest) {
            return await handleWorkRequest(templateName, userMessage, messageHistory, userId, currentAgentData)
          }

          // Regular conversation as the role
          const conversationHistory = messageHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))

          const roleContext = getDetailedRoleContext(templateName)
          const systemPrompt = `You are a professional ${templateName}. You're not setting up an agent - you ARE the agent, working in real-time.

${roleContext}

Current conversation context:
${currentAgentData.notes ? `Previous notes: ${currentAgentData.notes}` : ""}

Guidelines:
1. Stay in character as the ${templateName}
2. Offer to actually DO work, not just discuss it
3. When appropriate, suggest specific tasks you can work on
4. Be proactive and show your expertise
5. Take notes on important information the user shares

Respond as the professional, ready to work.`

          const response = await LLMService.generateConversation(
            [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: userMessage }],
            {
              userId,
              temperature: 0.8,
              maxTokens: 300,
            },
          )

          if ("error" in response) {
            return handleFallbackRoleplay(userMessage, templateName, currentAgentData)
          }

          // Extract any notes or important information
          const updatedNotes = await extractNotesFromConversation(userMessage, messageHistory, userId)
          const updatedAgentData = {
            ...currentAgentData,
            notes: updatedNotes,
            lastInteraction: new Date().toISOString(),
          }

          return {
            success: true,
            message: response.content,
            agentData: updatedAgentData,
            setupComplete: false, // Keep conversation going
          }
        } catch (error) {
          console.error("[ChatActions] Error in roleplay conversation:", error)
          return handleFallbackRoleplay(userMessage, templateName, currentAgentData)
        }
      } else {
        return handleFallbackRoleplay(userMessage, templateName, currentAgentData)
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

async function handleCapabilityDemonstration(
  templateName: string,
  userMessage: string,
  userId: string,
  currentAgentData: any,
): Promise<ChatResponse> {
  try {
    const roleContext = getDetailedRoleContext(templateName)
    const capabilityPrompt = `You are a professional ${templateName}. The user is asking about your capabilities.

${roleContext}

Instead of just listing what you can do, demonstrate it! Show specific examples, offer to do actual work right now, and suggest concrete tasks.

For example, if you're a Marketing Content Manager, don't just say "I can create content" - offer to "create a content calendar for next month" or "write a blog post outline about [topic]".

Be specific, actionable, and ready to work immediately.`

    const response = await LLMService.generateText(capabilityPrompt, {
      systemPrompt: `You are demonstrating your capabilities as a ${templateName}. Show, don't just tell. Offer specific, actionable work.`,
      userId,
      temperature: 0.8,
      maxTokens: 400,
    })

    if ("error" in response) {
      return {
        success: true,
        message: getFallbackCapabilities(templateName),
        agentData: currentAgentData,
        suggestedTasks: getDefaultTasks(templateName),
      }
    }

    // Generate suggested tasks based on capabilities
    const suggestedTasks = await generateCapabilityTasks(templateName, userId)

    return {
      success: true,
      message: response.content,
      agentData: currentAgentData,
      suggestedTasks,
    }
  } catch (error) {
    console.error("Error in capability demonstration:", error)
    return {
      success: true,
      message: getFallbackCapabilities(templateName),
      agentData: currentAgentData,
      suggestedTasks: getDefaultTasks(templateName),
    }
  }
}

async function handleWorkRequest(
  templateName: string,
  userMessage: string,
  messageHistory: Array<{ role: string; content: string }>,
  userId: string,
  currentAgentData: any,
): Promise<ChatResponse> {
  try {
    const roleContext = getDetailedRoleContext(templateName)
    const workPrompt = `You are a professional ${templateName} and the user has asked you to do specific work.

${roleContext}

User request: "${userMessage}"

Context from conversation:
${messageHistory
  .slice(-4)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

Actually DO the work they're asking for. Create real, useful output. Then suggest follow-up tasks that build on this work.

Provide concrete deliverables, not just promises to do work.`

    const response = await LLMService.generateText(workPrompt, {
      systemPrompt: `You are a ${templateName} actually doing work. Provide real, actionable deliverables. Be thorough and professional.`,
      userId,
      temperature: 0.7,
      maxTokens: 600,
    })

    if ("error" in response) {
      return handleFallbackRoleplay(userMessage, templateName, currentAgentData)
    }

    // Generate work results and follow-up tasks
    const workResults = await generateWorkResults(templateName, userMessage, response.content, userId)
    const followUpTasks = await generateFollowUpTasks(templateName, userMessage, userId)

    return {
      success: true,
      message: response.content,
      agentData: {
        ...currentAgentData,
        lastWork: userMessage,
        workCompleted: new Date().toISOString(),
      },
      workResults,
      suggestedTasks: followUpTasks,
    }
  } catch (error) {
    console.error("Error handling work request:", error)
    return handleFallbackRoleplay(userMessage, templateName, currentAgentData)
  }
}

async function generateCapabilityTasks(
  templateName: string,
  userId: string,
): Promise<
  Array<{
    title: string
    description: string
    priority: "high" | "medium" | "low"
    category: string
  }>
> {
  try {
    const taskPrompt = `Generate 3-4 specific, actionable tasks that a ${templateName} could work on right now to demonstrate their capabilities.

Return a JSON array of tasks:
[
  {
    "title": "Specific task title",
    "description": "Detailed description of what will be delivered",
    "priority": "high|medium|low",
    "category": "content|strategy|analysis|planning"
  }
]

Make tasks specific and immediately actionable.`

    const result = await LLMService.generateJSON({
      prompt: taskPrompt,
      systemPrompt: `Generate specific, actionable tasks for a ${templateName}. Return only valid JSON.`,
      userId,
    })

    if (result.success && result.data && Array.isArray(result.data)) {
      return result.data
    }
  } catch (error) {
    console.error("Error generating capability tasks:", error)
  }

  return getDefaultTasks(templateName)
}

async function generateWorkResults(
  templateName: string,
  userRequest: string,
  aiResponse: string,
  userId: string,
): Promise<Array<{ type: string; title: string; content: string }>> {
  try {
    const resultsPrompt = `Based on the work done by a ${templateName}, extract the key deliverables from their response.

User requested: "${userRequest}"
AI response: "${aiResponse}"

Return a JSON array of work results:
[
  {
    "type": "document|strategy|analysis|plan",
    "title": "Deliverable title",
    "content": "Key content or summary"
  }
]

Extract concrete deliverables, not just descriptions.`

    const result = await LLMService.generateJSON({
      prompt: resultsPrompt,
      systemPrompt: `Extract concrete work deliverables from the AI response. Return only valid JSON.`,
      userId,
    })

    if (result.success && result.data && Array.isArray(result.data)) {
      return result.data
    }
  } catch (error) {
    console.error("Error generating work results:", error)
  }

  return [
    {
      type: "summary",
      title: "Work Completed",
      content: "Task completed successfully. Check the conversation for details.",
    },
  ]
}

async function generateFollowUpTasks(
  templateName: string,
  userRequest: string,
  userId: string,
): Promise<
  Array<{
    title: string
    description: string
    priority: "high" | "medium" | "low"
    category: string
  }>
> {
  try {
    const followUpPrompt = `Based on the work request "${userRequest}" that a ${templateName} just completed, suggest 2-3 logical follow-up tasks.

Return a JSON array of follow-up tasks:
[
  {
    "title": "Follow-up task title",
    "description": "What this task will accomplish",
    "priority": "high|medium|low",
    "category": "content|strategy|analysis|planning"
  }
]

Suggest tasks that build on the completed work.`

    const result = await LLMService.generateJSON({
      prompt: followUpPrompt,
      systemPrompt: `Generate logical follow-up tasks for a ${templateName}. Return only valid JSON.`,
      userId,
    })

    if (result.success && result.data && Array.isArray(result.data)) {
      return result.data
    }
  } catch (error) {
    console.error("Error generating follow-up tasks:", error)
  }

  return getDefaultTasks(templateName).slice(0, 2)
}

async function extractNotesFromConversation(
  userMessage: string,
  messageHistory: Array<{ role: string; content: string }>,
  userId: string,
): Promise<string> {
  try {
    const notesPrompt = `Extract key information and notes from this conversation that would be important for future reference.

Recent conversation:
${messageHistory
  .slice(-3)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}
Latest message: "${userMessage}"

Return important information, preferences, goals, or context that should be remembered.`

    const response = await LLMService.generateText(notesPrompt, {
      systemPrompt: "Extract and summarize key information from the conversation for future reference.",
      userId,
      maxTokens: 200,
    })

    if ("error" in response) {
      return `User mentioned: ${userMessage}`
    }

    return response.content
  } catch (error) {
    return `User mentioned: ${userMessage}`
  }
}

// Helper functions
function isAskingAboutCapabilities(message: string): boolean {
  const capabilityKeywords = [
    "what can you do",
    "what all you can do",
    "capabilities",
    "what are you capable of",
    "what do you do",
    "how can you help",
    "what services",
    "what can you help with",
  ]

  const lowerMessage = message.toLowerCase()
  return capabilityKeywords.some((keyword) => lowerMessage.includes(keyword))
}

function isRequestingWork(message: string): boolean {
  const workKeywords = [
    "create",
    "write",
    "develop",
    "design",
    "plan",
    "analyze",
    "research",
    "build",
    "make",
    "generate",
    "help me with",
    "can you",
    "please",
  ]

  const lowerMessage = message.toLowerCase()
  return workKeywords.some((keyword) => lowerMessage.includes(keyword)) && message.length > 10
}

function getDetailedRoleContext(templateName: string): string {
  const roleContexts: Record<string, string> = {
    "Marketing Content Manager": `You are an experienced Marketing Content Manager with expertise in:
- Content strategy and planning
- Social media content creation
- Blog writing and SEO optimization
- Email marketing campaigns
- Brand voice and messaging
- Content calendar management
- Performance analytics and optimization

You can immediately create content calendars, write blog posts, develop social media strategies, craft email campaigns, and analyze content performance.`,

    "Personal Fitness Trainer": `You are a certified Personal Fitness Trainer with expertise in:
- Custom workout program design
- Nutrition planning and guidance
- Form correction and exercise technique
- Goal setting and progress tracking
- Injury prevention and modification
- Motivation and accountability coaching

You can immediately create workout plans, design nutrition guides, assess fitness levels, and provide personalized training advice.`,

    "Sales Lead Generator": `You are a Sales Lead Generation specialist with expertise in:
- Lead qualification and scoring
- Outreach strategy development
- CRM optimization and management
- Sales funnel design
- Prospecting and research
- Conversion optimization

You can immediately create lead generation strategies, design outreach campaigns, qualify prospects, and optimize sales processes.`,

    "Customer Support Agent": `You are a Customer Support specialist with expertise in:
- Issue resolution and troubleshooting
- Knowledge base creation
- Support workflow optimization
- Customer satisfaction improvement
- Escalation procedure design
- Support metrics and analytics

You can immediately create support documentation, design resolution workflows, analyze support metrics, and improve customer experience.`,
  }

  return (
    roleContexts[templateName] ||
    `You are a professional ${templateName} with deep expertise in your field. You can immediately provide valuable work and insights.`
  )
}

function getRoleplayGreeting(templateName: string): string {
  const greetings: Record<string, string> = {
    "Marketing Content Manager":
      "Hi! I'm your Marketing Content Manager, and I'm excited to work with you! I can create content calendars, write blog posts, develop social media strategies, and analyze your content performance. What marketing challenge can I help you tackle today?",

    "Personal Fitness Trainer":
      "Hey there! I'm your Personal Fitness Trainer, ready to help you achieve your fitness goals! I can create custom workout plans, design nutrition guides, and provide personalized training advice. What fitness goal are you working towards?",

    "Sales Lead Generator":
      "Hello! I'm your Sales Lead Generation specialist, and I'm here to help you grow your business! I can create lead generation strategies, design outreach campaigns, and optimize your sales funnel. What's your biggest sales challenge right now?",

    "Customer Support Agent":
      "Hi! I'm your Customer Support specialist, ready to help you deliver amazing customer experiences! I can create support documentation, design resolution workflows, and improve your support processes. What support challenge can I help you solve?",
  }

  return (
    greetings[templateName] ||
    `Hi! I'm your ${templateName}, ready to work with you! What can I help you accomplish today?`
  )
}

function getFallbackCapabilities(templateName: string): string {
  const capabilities: Record<string, string> = {
    "Marketing Content Manager":
      "I can help you with content strategy, social media planning, blog writing, email campaigns, and performance analysis. Want me to create a content calendar for next month or write a blog post outline?",

    "Personal Fitness Trainer":
      "I can create custom workout plans, design nutrition guides, assess your fitness level, and provide training advice. Want me to design a workout routine or create a meal plan?",

    "Sales Lead Generator":
      "I can develop lead generation strategies, create outreach campaigns, qualify prospects, and optimize your sales process. Want me to create a lead generation plan or design an outreach sequence?",

    "Customer Support Agent":
      "I can create support documentation, design resolution workflows, analyze support metrics, and improve customer experience. Want me to create a knowledge base article or design a support process?",
  }

  return (
    capabilities[templateName] ||
    `I can help you with various tasks related to ${templateName}. What specific work would you like me to do?`
  )
}

function getDefaultTasks(templateName: string): Array<{
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
}> {
  const taskSets: Record<
    string,
    Array<{
      title: string
      description: string
      priority: "high" | "medium" | "low"
      category: string
    }>
  > = {
    "Marketing Content Manager": [
      {
        title: "Create 30-day content calendar",
        description: "Develop a comprehensive content calendar with topics, posting schedule, and content types",
        priority: "high",
        category: "planning",
      },
      {
        title: "Write blog post outline",
        description: "Create a detailed outline for a blog post on a topic of your choice",
        priority: "medium",
        category: "content",
      },
      {
        title: "Design social media strategy",
        description: "Develop a social media strategy with platform-specific content and posting schedule",
        priority: "high",
        category: "strategy",
      },
    ],
    "Personal Fitness Trainer": [
      {
        title: "Create custom workout plan",
        description: "Design a personalized workout routine based on your goals and fitness level",
        priority: "high",
        category: "planning",
      },
      {
        title: "Develop nutrition guide",
        description: "Create a nutrition plan with meal suggestions and macro targets",
        priority: "medium",
        category: "planning",
      },
      {
        title: "Design progress tracking system",
        description: "Set up a system to track workouts, measurements, and fitness progress",
        priority: "medium",
        category: "planning",
      },
    ],
  }

  return (
    taskSets[templateName] || [
      {
        title: `Initial ${templateName} consultation`,
        description: "Assess your needs and create a customized action plan",
        priority: "high",
        category: "planning",
      },
    ]
  )
}

function handleFallbackRoleplay(userMessage: string, templateName: string, currentAgentData: any): ChatResponse {
  return {
    success: true,
    message: `As your ${templateName}, I understand you're asking about "${userMessage}". Let me help you with that! What specific work would you like me to focus on?`,
    agentData: currentAgentData,
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

    // For roleplay agents, we create them differently
    const agentName = agentData.name || `${agentData.templateName}`
    const agentGoal = agentData.notes || `Professional ${agentData.templateName} ready to work`

    console.log(`[CompleteAgentSetup] Creating roleplay agent for user ${userId}:`, agentData)

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name: agentName,
        goal: agentGoal,
        behavior: `Professional ${agentData.templateName} with real-time capabilities`,
        owner_id: userId,
        template_slug: agentData.templateSlug,
        template_name: agentData.templateName,
        status: "active",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error || !agent) {
      console.error("Error creating agent:", error)
      return {
        success: false,
        error: "Failed to create agent",
      }
    }

    // Store roleplay data
    await supabase.from("agent_custom_data").insert({
      agent_id: agent.id,
      owner_id: userId,
      custom_data: {
        ...agentData,
        isRoleplay: true,
        createdVia: "roleplay_chat",
      },
      configuration_method: "roleplay_chat",
      created_at: new Date().toISOString(),
    })

    // Log creation
    await supabase.from("agent_logs").insert({
      agent_id: agent.id,
      log_type: "milestone",
      message: `🎭 ${agentData.templateName} "${agentName}" is ready for action!`,
      metadata: {
        template: agentData.templateSlug,
        created_via: "roleplay_chat",
        isRoleplay: true,
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
