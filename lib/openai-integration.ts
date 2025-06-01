export interface CustomQuestion {
  id: string
  question: string
  type: "text" | "textarea" | "select" | "multiselect"
  options?: string[]
  required: boolean
  category: string
  placeholder?: string
}

export interface QuestionGenerationRequest {
  agentType: string
  agentGoal: string
  templateSlug: string
  userId?: string
}

export interface QuestionGenerationResult {
  success: boolean
  questions?: CustomQuestion[]
  error?: string
}

/**
 * Generate custom questions using OpenAI based on agent template and goal
 */
export async function generateCustomQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
  try {
    // Use the multi-LLM provider with user's configured keys
    const { multiLLMProvider } = await import("@/lib/multi-llm-provider")

    const prompt = buildQuestionGenerationPrompt(request)

    const messages = [
      {
        role: "system" as const,
        content:
          "You are an expert AI agent configuration assistant. Generate relevant, strategic questions to help users configure their AI agents effectively. Return only valid JSON array of question objects.",
      },
      {
        role: "user" as const,
        content: prompt,
      },
    ]

    const result = await multiLLMProvider.sendMessage(messages, {
      temperature: 0.7,
      maxTokens: 1500, // Reduced token limit to save costs
      userId: request.userId,
    })

    if ("error" in result) {
      console.error("LLM Provider error:", result.error)
      return {
        success: false,
        error: result.error,
      }
    }

    const content = result.content
    if (!content) {
      throw new Error("No content received from LLM provider")
    }

    // Parse the JSON response
    let questions: CustomQuestion[]
    try {
      questions = JSON.parse(content) as CustomQuestion[]
    } catch (parseError) {
      console.error("Failed to parse LLM response:", content)
      throw new Error("Invalid response format from LLM provider")
    }

    // Validate and sanitize questions
    const validatedQuestions = validateQuestions(questions)

    console.log("Successfully generated questions:", validatedQuestions.length)
    return {
      success: true,
      questions: validatedQuestions,
    }
  } catch (error) {
    console.error("Error generating custom questions:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate custom questions",
    }
  }
}

/**
 * Build the prompt for question generation based on agent template
 */
function buildQuestionGenerationPrompt(request: QuestionGenerationRequest): string {
  const { agentType, agentGoal, templateSlug } = request

  const templateSpecificPrompts = {
    "sales-lead-generator": `
      Focus on sales strategy, lead qualification, outreach methods, and conversion optimization.
      Consider: target market, lead sources, qualification criteria, outreach channels, follow-up sequences, CRM integration.
    `,
    "marketing-content-manager": `
      Focus on content strategy, brand voice, audience targeting, and content distribution.
      Consider: content types, posting frequency, brand guidelines, audience personas, content calendar, performance metrics.
    `,
    "developer-assistant": `
      Focus on development workflows, code quality, deployment processes, and team collaboration.
      Consider: tech stack, testing requirements, deployment environments, code review processes, documentation standards.
    `,
    "hr-recruitment-specialist": `
      Focus on recruitment strategy, candidate sourcing, screening processes, and hiring criteria.
      Consider: job requirements, sourcing channels, screening questions, interview process, onboarding workflow.
    `,
    "customer-support-agent": `
      Focus on support processes, response protocols, escalation procedures, and customer satisfaction.
      Consider: support channels, response times, knowledge base, escalation criteria, customer feedback.
    `,
    "research-analyst": `
      Focus on research methodology, data sources, analysis frameworks, and reporting requirements.
      Consider: research scope, data sources, analysis tools, reporting frequency, stakeholder requirements.
    `,
    "productivity-optimizer": `
      Focus on workflow optimization, task prioritization, automation opportunities, and productivity metrics.
      Consider: current workflows, bottlenecks, automation tools, productivity goals, team collaboration.
    `,
    "custom-agent": `
      Focus on specific requirements, custom workflows, integration needs, and unique business processes.
      Consider: business context, specific requirements, integration needs, success metrics, constraints.
    `,
  }

  const templatePrompt =
    templateSpecificPrompts[templateSlug as keyof typeof templateSpecificPrompts] ||
    templateSpecificPrompts["custom-agent"]

  return `
Generate 4-6 strategic configuration questions for a ${agentType} agent with the goal: "${agentGoal}"

${templatePrompt}

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

Make questions:
- Strategic and actionable
- Specific to the agent type and goal
- Help configure the agent's behavior effectively
- Include a mix of question types (text, textarea, select)
- Focus on practical implementation details

Example categories:
- strategy: High-level approach and methodology
- configuration: Specific settings and parameters
- integration: Tool and system connections
- metrics: Success measurement and KPIs
`
}

/**
 * Validate and sanitize generated questions
 */
function validateQuestions(questions: any[]): CustomQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error("Generated questions must be an array")
  }

  return questions.map((q, index) => {
    if (!q.question || typeof q.question !== "string") {
      throw new Error(`Question ${index + 1} must have a valid question text`)
    }

    const validTypes = ["text", "textarea", "select", "multiselect"]
    if (!validTypes.includes(q.type)) {
      q.type = "text" // Default fallback
    }

    return {
      id: q.id || `question_${Date.now()}_${index}`,
      question: q.question.trim(),
      type: q.type,
      options: Array.isArray(q.options) ? q.options : undefined,
      required: Boolean(q.required),
      category: q.category || "configuration",
      placeholder: q.placeholder || "",
    }
  })
}

/**
 * Get fallback questions if OpenAI generation fails
 */
export function getFallbackQuestions(templateSlug: string): CustomQuestion[] {
  const fallbackQuestions: Record<string, CustomQuestion[]> = {
    "sales-lead-generator": [
      {
        id: "target_market",
        question: "What is your primary target market or ideal customer profile?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., B2B SaaS companies with 50-200 employees in North America",
      },
      {
        id: "lead_sources",
        question: "Which lead sources should the agent prioritize?",
        type: "multiselect",
        options: ["LinkedIn", "Email campaigns", "Cold calling", "Referrals", "Content marketing", "Trade shows"],
        required: true,
        category: "configuration",
      },
      {
        id: "qualification_criteria",
        question: "What criteria should be used to qualify leads?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "e.g., Budget > $10k, Decision maker identified, Timeline < 6 months",
      },
    ],
    "marketing-content-manager": [
      {
        id: "brand_voice",
        question: "How would you describe your brand voice and tone?",
        type: "select",
        options: ["Professional", "Casual", "Friendly", "Authoritative", "Playful", "Technical"],
        required: true,
        category: "strategy",
      },
      {
        id: "content_types",
        question: "What types of content should the agent create?",
        type: "multiselect",
        options: [
          "Blog posts",
          "Social media posts",
          "Email newsletters",
          "Video scripts",
          "Infographics",
          "Case studies",
        ],
        required: true,
        category: "configuration",
      },
    ],
  }

  return (
    fallbackQuestions[templateSlug] || [
      {
        id: "primary_objective",
        question: "What is the primary objective you want this agent to achieve?",
        type: "textarea",
        required: true,
        category: "strategy",
        placeholder: "Describe the main goal and expected outcomes",
      },
      {
        id: "success_metrics",
        question: "How will you measure the success of this agent?",
        type: "textarea",
        required: false,
        category: "metrics",
        placeholder: "e.g., Number of leads generated, response time, customer satisfaction",
      },
    ]
  )
}
