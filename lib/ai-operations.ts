import { UserLLMProvider } from "@/lib/user-llm-provider"

/**
 * Centralized AI operations that use user-configured LLM providers
 * This replaces all direct OpenAI API calls throughout the project
 */
export class AIOperations {
  /**
   * Generate agent configuration questions
   */
  static async generateAgentQuestions(
    agentType: string,
    agentGoal: string,
    templateSlug: string,
    userId: string,
  ): Promise<{
    success: boolean
    questions?: any[]
    error?: string
    usedFallback?: boolean
  }> {
    const hasProviders = await UserLLMProvider.hasConfiguredProviders(userId)

    if (!hasProviders) {
      return {
        success: false,
        error: "No LLM providers configured. Please add an API key in Settings → Profile → API Keys.",
        usedFallback: true,
      }
    }

    const prompt = `
Generate 4-6 strategic configuration questions for a ${agentType} agent with the goal: "${agentGoal}"

Return a JSON array of question objects with this exact structure:
[
  {
    "id": "unique_id",
    "question": "Strategic question text",
    "type": "text|textarea|select|multiselect",
    "options": ["option1", "option2"] (only for select/multiselect),
    "required": true|false,
    "category": "strategy|configuration|integration|metrics",
    "placeholder": "helpful placeholder text"
  }
]

Make questions strategic, actionable, and specific to the agent type and goal.
`

    const systemPrompt = `You are an expert AI agent configuration assistant. Generate relevant, strategic questions to help users configure their AI agents effectively. Return only valid JSON array of question objects.`

    try {
      const questions = await UserLLMProvider.generateJSON(prompt, userId, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1500,
      })

      if (!questions || !Array.isArray(questions)) {
        throw new Error("Invalid response format")
      }

      return {
        success: true,
        questions,
        usedFallback: false,
      }
    } catch (error) {
      console.error("Error generating questions:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate questions",
        usedFallback: false,
      }
    }
  }

  /**
   * Analyze user input and generate tasks
   */
  static async analyzeAndGenerateTasks(
    userInput: string,
    agentGoal: string,
    agentType: string,
    userId: string,
    existingTasks?: any[],
  ): Promise<{
    success: boolean
    tasks?: any[]
    dependencies?: any[]
    userNeedAnalysis?: string
    recommendedFlow?: string[]
    error?: string
  }> {
    const hasProviders = await UserLLMProvider.hasConfiguredProviders(userId)

    if (!hasProviders) {
      return {
        success: false,
        error: "No LLM providers configured. Please add an API key in Settings → Profile → API Keys.",
      }
    }

    const existingTasksContext = existingTasks?.length
      ? `\nExisting tasks: ${existingTasks.map((t) => `- ${t.title} (${t.status})`).join("\n")}`
      : ""

    const prompt = `
Analyze the following user input and create a comprehensive task breakdown for their ${agentType} agent:

User Input: "${userInput}"
Agent Goal: "${agentGoal}"
Agent Type: "${agentType}"${existingTasksContext}

Please provide a JSON response with this exact structure:
{
  "userNeedAnalysis": "Detailed analysis of what the user is trying to achieve",
  "recommendedFlow": ["Step 1", "Step 2", "Step 3"],
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "low|medium|high|urgent",
      "status": "todo|blocked",
      "isDependency": true/false,
      "blockedReason": "Why this task is blocked (if applicable)",
      "dependsOnTaskId": "reference to another task (if applicable)",
      "estimatedHours": 2,
      "category": "strategy|research|implementation|review|communication",
      "metadata": {
        "aiGenerated": true,
        "userInput": "original user input",
        "complexity": "low|medium|high"
      }
    }
  ],
  "dependencies": [
    {
      "title": "Dependency task title",
      "description": "What needs human approval or external input",
      "priority": "high|urgent",
      "status": "blocked",
      "isDependency": true,
      "blockedReason": "Requires human approval/input",
      "category": "review|communication",
      "metadata": {
        "requiresHumanApproval": true,
        "dependencyType": "approval|input|decision"
      }
    }
  ]
}
`

    const systemPrompt = `You are an expert AI task management assistant. Analyze user needs and create comprehensive task breakdowns with proper dependencies. Always return valid JSON.`

    try {
      const analysis = await UserLLMProvider.generateJSON(prompt, userId, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 3000,
      })

      if (!analysis) {
        throw new Error("No response from LLM provider")
      }

      return {
        success: true,
        tasks: analysis.tasks || [],
        dependencies: analysis.dependencies || [],
        userNeedAnalysis: analysis.userNeedAnalysis || "Analysis not available",
        recommendedFlow: Array.isArray(analysis.recommendedFlow) ? analysis.recommendedFlow : [],
      }
    } catch (error) {
      console.error("Error analyzing tasks:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze tasks",
      }
    }
  }

  /**
   * Generate conversational AI response
   */
  static async generateConversationResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    context: {
      userName: string
      userRole?: string
      userIndustry?: string
      userGoals?: string[]
    },
    userId: string,
  ): Promise<string | null> {
    const hasProviders = await UserLLMProvider.hasConfiguredProviders(userId)

    if (!hasProviders) {
      // Return a helpful fallback message
      return "I'd love to help you, but I need you to configure an AI provider first. Please go to Settings → Profile → API Keys to add your preferred AI service."
    }

    const systemPrompt = `You are a General Agent assistant helping ${context.userName}${
      context.userRole ? ` (${context.userRole})` : ""
    }${context.userIndustry ? ` in ${context.userIndustry}` : ""}.

Your role is to:
1. Help users define and achieve their goals
2. Break down complex objectives into actionable tasks
3. Suggest practical strategies and solutions
4. Be encouraging and supportive
5. Ask clarifying questions when needed

User's goals: ${context.userGoals?.length ? context.userGoals.join(", ") : "Not specified yet"}

Keep responses conversational, helpful, and focused on actionable advice. When appropriate, suggest specific tasks that could be created to help achieve their goals.`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: userMessage },
    ]

    try {
      const result = await UserLLMProvider.sendMessage(messages, userId, {
        maxTokens: 500,
        temperature: 0.7,
      })

      if ("error" in result) {
        console.error("Conversation generation error:", result.error)
        return "I'm having trouble connecting to the AI service right now. Please try again in a moment."
      }

      return result.content || null
    } catch (error) {
      console.error("Error generating conversation response:", error)
      return "I encountered an error while processing your message. Please try again."
    }
  }
}
