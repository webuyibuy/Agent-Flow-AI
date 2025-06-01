import { getDecryptedApiKey } from "@/app/dashboard/settings/profile/api-key-actions"
import { getSupabaseFromServer } from "@/lib/supabase/server"

export interface ConversationMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface TaskSuggestion {
  title: string
  description: string
  priority: "low" | "medium" | "high"
  isDependency: boolean
  blockedReason?: string
  estimatedHours?: number
  category: string
}

export interface ConversationAnalysis {
  goals: string[]
  taskSuggestions: TaskSuggestion[]
  nextQuestions: string[]
  conversationSummary: string
}

export class GeneralAgentAI {
  private apiKey: string | null = null
  private conversationHistory: ConversationMessage[] = []
  private conversationId: string | null = null
  private userId: string | null = null

  constructor(userId: string | null = null, conversationId: string | null = null) {
    this.userId = userId
    this.conversationId = conversationId
  }

  async initialize(): Promise<boolean> {
    try {
      this.apiKey = await getDecryptedApiKey("openai")

      // If we have a conversation ID, load the conversation history
      if (this.conversationId) {
        await this.loadConversationHistory()
      }

      return !!this.apiKey
    } catch (error) {
      console.error("Failed to initialize General Agent AI:", error)
      return false
    }
  }

  async loadConversationHistory(): Promise<void> {
    if (!this.conversationId) return

    try {
      const supabase = getSupabaseFromServer()
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", this.conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error loading conversation history:", error)
        return
      }

      this.conversationHistory = messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata,
      }))
    } catch (error) {
      console.error("Error in loadConversationHistory:", error)
    }
  }

  async createConversation(): Promise<string | null> {
    if (!this.userId) return null

    try {
      const supabase = getSupabaseFromServer()
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: this.userId,
          agent_type: "general",
          status: "active",
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        console.error("Error creating conversation:", error)
        return null
      }

      this.conversationId = data.id
      return data.id
    } catch (error) {
      console.error("Error in createConversation:", error)
      return null
    }
  }

  async saveMessage(message: ConversationMessage): Promise<void> {
    if (!this.conversationId) return

    try {
      const supabase = getSupabaseFromServer()
      await supabase.from("messages").insert({
        conversation_id: this.conversationId,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        created_at: message.timestamp.toISOString(),
      })
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  async sendMessage(
    userMessage: string,
    userName: string,
  ): Promise<{
    response: string
    analysis?: ConversationAnalysis
    error?: string
  }> {
    if (!this.apiKey) {
      return {
        response: "I need an OpenAI API key to function properly. Please configure it in your settings.",
        error: "API key not configured",
      }
    }

    try {
      // Create conversation if it doesn't exist
      if (!this.conversationId && this.userId) {
        this.conversationId = await this.createConversation()
      }

      // Add user message to history
      const userMsg: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      }

      this.conversationHistory.push(userMsg)
      await this.saveMessage(userMsg)

      // Generate AI response
      const aiResponse = await this.generateResponse(userMessage, userName)

      // Add AI response to history
      const assistantMsg: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      this.conversationHistory.push(assistantMsg)
      await this.saveMessage(assistantMsg)

      // Analyze conversation for tasks and goals
      const analysis = await this.analyzeConversation(userName)

      return {
        response: aiResponse,
        analysis,
      }
    } catch (error) {
      console.error("Error in General Agent AI:", error)
      return {
        response: "I'm having trouble processing your request right now. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async generateResponse(userMessage: string, userName: string): Promise<string> {
    const systemPrompt = `You are a helpful General Agent AI assistant named "General Agent" working with ${userName}. 

Your role is to:
1. Have natural, engaging conversations
2. Help users identify their goals and objectives
3. Break down complex goals into actionable tasks
4. Suggest tasks that might need human approval (dependencies)
5. Be proactive in understanding what the user wants to achieve

Conversation style:
- Friendly and professional
- Ask clarifying questions to better understand goals
- Suggest specific, actionable next steps
- Be concise but thorough
- Show enthusiasm for helping achieve their objectives

Current conversation context: This is an ongoing conversation where you're helping ${userName} define their goals and create a plan to achieve them.`

    const messages = [
      { role: "system", content: systemPrompt },
      ...this.conversationHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "I'm not sure how to respond to that."
  }

  private async analyzeConversation(userName: string): Promise<ConversationAnalysis> {
    if (this.conversationHistory.length < 2) {
      return {
        goals: [],
        taskSuggestions: [],
        nextQuestions: [],
        conversationSummary: "Conversation just started",
      }
    }

    const analysisPrompt = `Analyze this conversation with ${userName} and extract:

1. GOALS: What are the main objectives or goals mentioned?
2. TASKS: What specific tasks can be created to achieve these goals?
3. DEPENDENCIES: Which tasks might need human approval or review?
4. NEXT QUESTIONS: What questions should be asked to get more clarity?

Conversation:
${this.conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

Return a JSON object with this structure:
{
  "goals": ["goal1", "goal2"],
  "taskSuggestions": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "isDependency": true|false,
      "blockedReason": "Why it needs approval (if dependency)",
      "estimatedHours": 2,
      "category": "strategy|research|implementation|review"
    }
  ],
  "nextQuestions": ["question1", "question2"],
  "conversationSummary": "Brief summary of the conversation"
}`

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert conversation analyzer. Return only valid JSON." },
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    try {
      return JSON.parse(content)
    } catch (error) {
      console.error("Failed to parse analysis JSON:", error)
      return {
        goals: [],
        taskSuggestions: [],
        nextQuestions: [],
        conversationSummary: "Analysis failed",
      }
    }
  }

  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory]
  }

  getConversationId(): string | null {
    return this.conversationId
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
}
