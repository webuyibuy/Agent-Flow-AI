import { multiLLMProvider, type LLMMessage, type LLMResponse, type LLMError } from "./multi-llm-provider"

export class LLMService {
  /**
   * Generate text using the user's configured LLM provider
   */
  static async generateText(
    prompt: string,
    options: {
      systemPrompt?: string
      provider?: string
      model?: string
      temperature?: number
      maxTokens?: number
      userId?: string
    } = {},
  ): Promise<LLMResponse | LLMError> {
    const messages: LLMMessage[] = []

    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt })
    }

    messages.push({ role: "user", content: prompt })

    return await multiLLMProvider.sendMessage(messages, {
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      userId: options.userId,
    })
  }

  /**
   * Generate structured JSON response
   */
  static async generateJSON<T = any>(
    prompt: string,
    options: {
      systemPrompt?: string
      provider?: string
      model?: string
      userId?: string
    } = {},
  ): Promise<{ success: true; data: T } | { success: false; error: string }> {
    const systemPrompt = `${options.systemPrompt || ""}\n\nIMPORTANT: Respond only with valid JSON. No additional text or formatting.`

    const result = await this.generateText(prompt, {
      ...options,
      systemPrompt,
      temperature: 0.1, // Lower temperature for more consistent JSON
      maxTokens: 2000,
    })

    if ("error" in result) {
      return { success: false, error: result.error }
    }

    try {
      const jsonData = JSON.parse(result.content)
      return { success: true, data: jsonData }
    } catch (parseError) {
      return {
        success: false,
        error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      }
    }
  }

  /**
   * Generate a conversation response
   */
  static async generateConversation(
    messages: LLMMessage[],
    options: {
      provider?: string
      model?: string
      temperature?: number
      userId?: string
    } = {},
  ): Promise<LLMResponse | LLMError> {
    return await multiLLMProvider.sendMessage(messages, options)
  }

  /**
   * Test if a provider is working
   */
  static async testProvider(providerId: string): Promise<{ success: boolean; error?: string; latency?: number }> {
    return await multiLLMProvider.testProvider(providerId)
  }

  /**
   * Get available providers for the current user
   */
  static async getAvailableProviders(): Promise<string[]> {
    await multiLLMProvider.detectAvailableProviders()
    return multiLLMProvider.getAvailableProviders()
  }
}
