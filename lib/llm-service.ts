import { multiLLMProvider, type LLMMessage } from "@/lib/multi-llm-provider"
import { getDefaultUserId } from "@/lib/default-user"

export interface LLMServiceOptions {
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  userId?: string
  systemPrompt?: string
}

export interface LLMServiceResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  provider?: string
  model?: string
}

export class LLMService {
  /**
   * Generate text completion using user's configured LLM provider
   */
  static async generateText(prompt: string, options: LLMServiceOptions = {}): Promise<LLMServiceResponse> {
    try {
      console.log("🎯 LLMService.generateText called with prompt:", prompt.substring(0, 100) + "...")

      // Get user ID if not provided
      const userId = options.userId || (await getDefaultUserId())

      // Prepare messages
      const messages: LLMMessage[] = []

      if (options.systemPrompt) {
        messages.push({
          role: "system",
          content: options.systemPrompt,
        })
      }

      messages.push({
        role: "user",
        content: prompt,
      })

      // Call LLM provider
      const result = await multiLLMProvider.sendMessage(messages, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 2000,
        userId,
      })

      // Handle response
      if ("error" in result) {
        console.error("❌ LLM request failed:", result.error)
        return {
          success: false,
          error: result.error,
          provider: result.provider,
        }
      }

      console.log("✅ LLM request successful")
      return {
        success: true,
        content: result.content,
        usage: result.usage,
        provider: result.provider || "unknown",
        model: result.model,
      }
    } catch (error) {
      console.error("❌ LLMService error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Generate JSON response using LLM
   */
  static async generateJSON<T = any>(
    prompt: string,
    options: LLMServiceOptions = {},
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const systemPrompt = `${options.systemPrompt || ""}\n\nIMPORTANT: Respond only with valid JSON. Do not include any explanatory text before or after the JSON.`

      const result = await this.generateText(prompt, {
        ...options,
        systemPrompt,
        temperature: options.temperature || 0.3, // Lower temperature for structured output
      })

      if (!result.success || !result.content) {
        return {
          success: false,
          error: result.error || "No content generated",
        }
      }

      try {
        // Try to parse JSON from the response
        const jsonMatch = result.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : result.content
        const data = JSON.parse(jsonString)

        return {
          success: true,
          data,
        }
      } catch (parseError) {
        console.error("❌ JSON parsing failed:", parseError)
        return {
          success: false,
          error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Generate conversational response
   */
  static async generateConversation(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    options: LLMServiceOptions = {},
  ): Promise<LLMServiceResponse> {
    try {
      const userId = options.userId || (await getDefaultUserId())

      // Prepare conversation messages
      const messages: LLMMessage[] = []

      if (options.systemPrompt) {
        messages.push({
          role: "system",
          content: options.systemPrompt,
        })
      }

      // Add conversation history (limit to last 10 messages)
      const recentHistory = conversationHistory.slice(-10)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }

      // Add current user message
      messages.push({
        role: "user",
        content: userMessage,
      })

      const result = await multiLLMProvider.sendMessage(messages, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        userId,
      })

      if ("error" in result) {
        return {
          success: false,
          error: result.error,
          provider: result.provider,
        }
      }

      return {
        success: true,
        content: result.content,
        usage: result.usage,
        provider: result.provider || "unknown",
        model: result.model,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  /**
   * Test LLM provider connection
   */
  static async testProvider(
    provider: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string; latency?: number; model?: string }> {
    const startTime = Date.now()

    try {
      const actualUserId = userId || (await getDefaultUserId())

      const result = await this.generateText("Say 'Hello' in one word.", {
        provider,
        maxTokens: 10,
        temperature: 0,
        userId: actualUserId,
      })

      const latency = Date.now() - startTime

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          latency,
        }
      }

      return {
        success: true,
        latency,
        model: result.model,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * Get available providers for user
   */
  static async getAvailableProviders(userId?: string): Promise<string[]> {
    try {
      const actualUserId = userId || (await getDefaultUserId())
      await multiLLMProvider.detectAvailableProviders()
      return multiLLMProvider.getAvailableProviders()
    } catch (error) {
      console.error("❌ Error getting available providers:", error)
      return []
    }
  }
}
