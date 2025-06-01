"use server"

import { getFallbackQuestions } from "@/lib/openai-integration"
import { getDefaultUserId } from "@/lib/default-user"

export interface GenerateQuestionsResult {
  success: boolean
  questions?: any[]
  error?: string
  usedFallback?: boolean
}

export async function generateAgentQuestions(
  templateSlug: string,
  agentGoal: string,
  templateName: string,
): Promise<GenerateQuestionsResult> {
  try {
    // Always start with fallback questions as a safety net
    const fallbackQuestions = getFallbackQuestions(templateSlug)

    // If goal is too short, use fallback immediately
    if (!agentGoal.trim() || agentGoal.length < 15) {
      console.log("⚠️ Agent goal too short, using fallback questions")
      return {
        success: true,
        questions: fallbackQuestions,
        usedFallback: true,
        error: "Agent goal too short - using standard questions",
      }
    }

    let userId: string
    try {
      userId = await getDefaultUserId()
      console.log("✅ User authenticated for question generation:", userId)
    } catch (error) {
      console.warn("⚠️ No user authentication for question generation, using fallback")
      return {
        success: true,
        questions: fallbackQuestions,
        usedFallback: true,
        error: "User not authenticated - using standard questions",
      }
    }

    console.log("🤖 Attempting to generate questions with user's LLM provider")

    // Use the new AIOperations instead of direct OpenAI calls
    const { AIOperations } = await import("@/lib/ai-operations")

    try {
      const result = await AIOperations.generateAgentQuestions(templateName, agentGoal, templateSlug, userId)

      if (result.success && result.questions && result.questions.length > 0) {
        console.log("✅ LLM question generation successful:", result.questions.length, "questions")
        return {
          success: true,
          questions: result.questions,
          usedFallback: false,
        }
      }

      // If LLM generation fails, use fallback questions
      console.warn("⚠️ LLM question generation failed, using fallback:", result.error)

      return {
        success: true,
        questions: fallbackQuestions,
        usedFallback: true,
        error: result.error || "AI generation failed",
      }
    } catch (timeoutError) {
      console.warn("⚠️ LLM request timed out, using fallback questions")
      return {
        success: true,
        questions: fallbackQuestions,
        usedFallback: true,
        error: "Request timed out - using standard questions",
      }
    }
  } catch (error) {
    console.error("❌ Error in generateAgentQuestions:", error)

    // Always provide fallback questions as last resort
    const fallbackQuestions = getFallbackQuestions(templateSlug)

    return {
      success: true,
      questions: fallbackQuestions,
      usedFallback: true,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
