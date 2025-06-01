import { getDecryptedApiKey, getPreferredModel } from "@/app/dashboard/settings/profile/api-key-actions"

export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  success: boolean
  error?: string
}

export interface LLMError {
  error: string
  success: false
}

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
    try {
      const messages: LLMMessage[] = []

      if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt })
      }

      messages.push({ role: "user", content: prompt })

      return await this.sendMessage(messages, options)
    } catch (error) {
      console.error("LLM generateText error:", error)
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }
    }
  }

  /**
   * Generate structured JSON response
   */
  static async generateJSON<T = any>(options: {
    prompt: string
    systemPrompt?: string
    provider?: string
    model?: string
    userId?: string
  }): Promise<{ success: true; data: T; tokensUsed?: number } | { success: false; error: string }> {
    const systemPrompt = `${options.systemPrompt || ""}\n\nIMPORTANT: Respond only with valid JSON. No additional text or formatting.`

    const result = await this.generateText(options.prompt, {
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
      return {
        success: true,
        data: jsonData,
        tokensUsed: result.usage?.totalTokens,
      }
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
    return await this.sendMessage(messages, options)
  }

  /**
   * Send message to LLM provider
   */
  private static async sendMessage(
    messages: LLMMessage[],
    options: {
      provider?: string
      model?: string
      temperature?: number
      maxTokens?: number
      userId?: string
    } = {},
  ): Promise<LLMResponse | LLMError> {
    try {
      // Try providers in order of preference
      const providers = options.provider ? [options.provider] : ["openai", "anthropic", "groq", "xai"]

      for (const provider of providers) {
        try {
          console.log(`🔑 Attempting to use ${provider} provider...`)

          // Get API key from user's settings
          const apiKey = await getDecryptedApiKey(provider, options.userId)
          if (!apiKey) {
            console.log(`❌ No API key found for ${provider}`)
            continue
          }

          console.log(`✅ Found API key for ${provider}`)

          // Get preferred model for this provider
          const preferredModel = await getPreferredModel(provider, options.userId)
          const model = options.model || preferredModel || this.getDefaultModel(provider)

          console.log(`🎯 Using model: ${model}`)

          // Make API call
          const response = await this.callProvider(provider, apiKey, messages, {
            model,
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 2000,
          })

          console.log(`✅ Successfully got response from ${provider}`)
          return response
        } catch (providerError) {
          console.error(`❌ ${provider} failed:`, providerError)
          continue
        }
      }

      return {
        error: "No available LLM providers. Please add API keys in Settings.",
        success: false,
      }
    } catch (error) {
      console.error("LLM service error:", error)
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }
    }
  }

  /**
   * Call specific provider
   */
  private static async callProvider(
    provider: string,
    apiKey: string,
    messages: LLMMessage[],
    options: {
      model: string
      temperature: number
      maxTokens: number
    },
  ): Promise<LLMResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      let response: Response

      switch (provider) {
        case "openai":
          response = await this.callOpenAI(apiKey, messages, options, controller.signal)
          break
        case "anthropic":
          response = await this.callAnthropic(apiKey, messages, options, controller.signal)
          break
        case "groq":
          response = await this.callGroq(apiKey, messages, options, controller.signal)
          break
        case "xai":
          response = await this.callXAI(apiKey, messages, options, controller.signal)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`${provider} API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      return this.parseProviderResponse(provider, data, options.model)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private static async callOpenAI(
    apiKey: string,
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number },
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      signal,
    })
  }

  private static async callAnthropic(
    apiKey: string,
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number },
    signal: AbortSignal,
  ): Promise<Response> {
    // Convert messages format for Anthropic
    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }))

    const systemMessage = messages.find((m) => m.role === "system")?.content

    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        messages: anthropicMessages,
        ...(systemMessage && { system: systemMessage }),
      }),
      signal,
    })
  }

  private static async callGroq(
    apiKey: string,
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number },
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      signal,
    })
  }

  private static async callXAI(
    apiKey: string,
    messages: LLMMessage[],
    options: { model: string; temperature: number; maxTokens: number },
    signal: AbortSignal,
  ): Promise<Response> {
    return fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      }),
      signal,
    })
  }

  private static parseProviderResponse(provider: string, data: any, model: string): LLMResponse {
    switch (provider) {
      case "openai":
      case "groq":
      case "xai":
        return {
          content: data.choices?.[0]?.message?.content || "",
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
              }
            : undefined,
          model: data.model || model,
          success: true,
        }

      case "anthropic":
        return {
          content: data.content?.[0]?.text || "",
          usage: data.usage
            ? {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens,
              }
            : undefined,
          model: data.model || model,
          success: true,
        }

      default:
        return {
          content: "",
          model,
          success: false,
          error: `Unknown provider response format: ${provider}`,
        }
    }
  }

  private static getDefaultModel(provider: string): string {
    const defaults = {
      openai: "gpt-4o-mini",
      anthropic: "claude-3-haiku-20240307",
      groq: "llama-3.1-8b-instant",
      xai: "grok-beta",
    }
    return defaults[provider as keyof typeof defaults] || "default"
  }

  /**
   * Test if a provider is working
   */
  static async testProvider(
    providerId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string; latency?: number }> {
    const startTime = Date.now()

    try {
      const response = await this.generateText('Say "Hello" in one word.', {
        provider: providerId,
        maxTokens: 10,
        userId,
      })

      const latency = Date.now() - startTime

      if ("error" in response) {
        return { success: false, error: response.error, latency }
      }

      return { success: true, latency }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        latency: Date.now() - startTime,
      }
    }
  }

  /**
   * Get available providers for the current user
   */
  static async getAvailableProviders(userId?: string): Promise<string[]> {
    const providers = ["openai", "anthropic", "groq", "xai"]
    const available: string[] = []

    for (const provider of providers) {
      try {
        const apiKey = await getDecryptedApiKey(provider, userId)
        if (apiKey) {
          available.push(provider)
        }
      } catch (error) {
        console.error(`Error checking ${provider}:`, error)
      }
    }

    return available
  }
}
