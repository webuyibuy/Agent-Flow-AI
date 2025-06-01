"use server"

import { LLMService, type LLMServiceOptions } from "@/lib/llm-service"

export async function testLLMProvider(provider: string) {
  console.log("🧪 Testing LLM provider:", provider)

  try {
    const result = await LLMService.testProvider(provider)
    console.log("🧪 Test result:", result)
    return result
  } catch (error) {
    console.error("❌ Test error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function generateTextWithLLM(prompt: string, options: LLMServiceOptions = {}) {
  console.log("🎯 Generating text with LLM...")
  console.log("📝 Prompt:", prompt.substring(0, 100) + "...")
  console.log("⚙️ Options:", options)

  try {
    const result = await LLMService.generateText(prompt, options)
    console.log("✅ Generation result:", { success: result.success, contentLength: result.content?.length })
    return result
  } catch (error) {
    console.error("❌ Generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getAvailableProviders() {
  console.log("📋 Getting available providers...")

  try {
    const providers = await LLMService.getAvailableProviders()
    console.log("✅ Available providers:", providers)
    return { success: true, providers }
  } catch (error) {
    console.error("❌ Error getting providers:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      providers: [],
    }
  }
}
