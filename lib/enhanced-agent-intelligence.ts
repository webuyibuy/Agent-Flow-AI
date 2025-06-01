import { getUserLLMProvider } from "@/lib/user-llm-provider"
import type { UserAnswer, GeneratedPlan } from "@/lib/systematic-flow-types"

export interface IntelligentQuestion {
  id: string
  question: string
  type: "text" | "select" | "multiselect" | "scale" | "boolean"
  category: "business_context" | "technical_requirements" | "success_criteria" | "constraints" | "stakeholders"
  priority: "critical" | "high" | "medium" | "low"
  followUpTriggers?: string[]
  options?: string[]
  scaleRange?: { min: number; max: number; labels: string[] }
  businessImpact: "high" | "medium" | "low"
  reasoning: string
  expectedAnswerType: string
}

export interface BusinessContext {
  industry?: string
  companySize?: string
  currentChallenges: string[]
  businessGoals: string[]
  timeline: string
  budget?: string
  stakeholders: string[]
  successMetrics: string[]
  constraints: string[]
  technicalCapabilities: string[]
}

export class EnhancedAgentIntelligence {
  private static instance: EnhancedAgentIntelligence

  static getInstance(): EnhancedAgentIntelligence {
    if (!EnhancedAgentIntelligence.instance) {
      EnhancedAgentIntelligence.instance = new EnhancedAgentIntelligence()
    }
    return EnhancedAgentIntelligence.instance
  }

  async generateIntelligentQuestions(
    goalPrimer: string,
    existingAnswers: UserAnswer[],
    userId: string,
  ): Promise<{ success: boolean; questions?: IntelligentQuestion[]; context?: BusinessContext; error?: string }> {
    try {
      console.log("🧠 Generating intelligent business-focused questions...")

      const llmProvider = await getUserLLMProvider(userId)

      if (!llmProvider) {
        return this.getFallbackBusinessQuestions(goalPrimer, existingAnswers)
      }

      // Analyze existing answers to understand context
      const context = this.analyzeBusinessContext(existingAnswers)

      // Generate contextual questions based on what we know and what we need to know
      const prompt = this.buildIntelligentQuestionPrompt(goalPrimer, existingAnswers, context)

      const response = await llmProvider.generateText({
        prompt,
        maxTokens: 3000,
        temperature: 0.7,
      })

      const result = this.parseIntelligentResponse(response)

      return {
        success: true,
        questions: result.questions,
        context: result.context,
      }
    } catch (error) {
      console.error("❌ Error generating intelligent questions:", error)
      return this.getFallbackBusinessQuestions(goalPrimer, existingAnswers)
    }
  }

  private buildIntelligentQuestionPrompt(
    goalPrimer: string,
    existingAnswers: UserAnswer[],
    context: BusinessContext,
  ): string {
    const answeredCategories = existingAnswers.map((a) => a.questionId).join(", ")

    return `You are a senior business consultant helping a client implement an AI agent solution.

GOAL: "${goalPrimer}"
EXISTING CONTEXT: ${JSON.stringify(context)}
ALREADY ANSWERED: ${answeredCategories}

Generate 3-4 strategic questions that will help you understand:
1. Business context and industry specifics
2. Success criteria and measurement
3. Implementation constraints and resources
4. Stakeholder needs and expectations

Focus on questions that will directly impact the agent's design and implementation strategy.

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "biz_context_1",
      "question": "What specific business problem is this agent solving?",
      "type": "text",
      "category": "business_context",
      "priority": "critical",
      "businessImpact": "high",
      "reasoning": "Understanding the core problem ensures the agent addresses real business needs",
      "expectedAnswerType": "Specific business challenge or opportunity"
    }
  ],
  "context": {
    "industry": "detected_industry",
    "businessGoals": ["goal1", "goal2"],
    "currentChallenges": ["challenge1"],
    "recommendedApproach": "strategic_recommendation"
  }
}

Make questions business-focused, specific, and actionable. Avoid generic technical questions.`
  }

  private analyzeBusinessContext(existingAnswers: UserAnswer[]): BusinessContext {
    const context: BusinessContext = {
      currentChallenges: [],
      businessGoals: [],
      timeline: "not_specified",
      stakeholders: [],
      successMetrics: [],
      constraints: [],
      technicalCapabilities: [],
    }

    // Analyze existing answers to build context
    existingAnswers.forEach((answer) => {
      const answerText = String(answer.answer).toLowerCase()

      // Detect industry
      if (answerText.includes("healthcare") || answerText.includes("medical")) {
        context.industry = "healthcare"
      } else if (answerText.includes("finance") || answerText.includes("banking")) {
        context.industry = "finance"
      } else if (answerText.includes("retail") || answerText.includes("ecommerce")) {
        context.industry = "retail"
      }

      // Detect timeline urgency
      if (answerText.includes("urgent") || answerText.includes("asap") || answerText.includes("immediately")) {
        context.timeline = "urgent"
      } else if (answerText.includes("month") || answerText.includes("weeks")) {
        context.timeline = "short_term"
      }

      // Detect business goals
      if (answerText.includes("efficiency") || answerText.includes("automate")) {
        context.businessGoals.push("operational_efficiency")
      }
      if (answerText.includes("revenue") || answerText.includes("sales")) {
        context.businessGoals.push("revenue_growth")
      }
      if (answerText.includes("customer") || answerText.includes("service")) {
        context.businessGoals.push("customer_experience")
      }
    })

    return context
  }

  private parseIntelligentResponse(response: string): { questions: IntelligentQuestion[]; context: BusinessContext } {
    try {
      // Clean and parse JSON response
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanResponse)

      return {
        questions: parsed.questions || [],
        context: parsed.context || {},
      }
    } catch (error) {
      console.error("Failed to parse intelligent response:", error)
      return { questions: [], context: {} }
    }
  }

  private getFallbackBusinessQuestions(
    goalPrimer: string,
    existingAnswers: UserAnswer[],
  ): { success: boolean; questions: IntelligentQuestion[]; context: BusinessContext } {
    const questions: IntelligentQuestion[] = [
      {
        id: "business_problem",
        question: "What specific business problem or opportunity is driving this AI agent implementation?",
        type: "text",
        category: "business_context",
        priority: "critical",
        businessImpact: "high",
        reasoning: "Understanding the core business driver ensures the agent delivers real value",
        expectedAnswerType: "Specific business challenge, inefficiency, or growth opportunity",
      },
      {
        id: "success_measurement",
        question: "How will you measure the success of this AI agent in your business?",
        type: "multiselect",
        category: "success_criteria",
        priority: "critical",
        options: [
          "Cost reduction (specify %)",
          "Time savings (specify hours/week)",
          "Revenue increase (specify target)",
          "Customer satisfaction improvement",
          "Process efficiency gains",
          "Error reduction",
          "Employee productivity boost",
          "Other (please specify)",
        ],
        businessImpact: "high",
        reasoning: "Clear success metrics ensure the agent delivers measurable business value",
        expectedAnswerType: "Quantifiable business metrics",
      },
      {
        id: "stakeholder_impact",
        question: "Who are the key stakeholders that will be affected by this AI agent?",
        type: "multiselect",
        category: "stakeholders",
        priority: "high",
        options: [
          "End customers",
          "Internal employees",
          "Management team",
          "IT department",
          "Sales team",
          "Customer service team",
          "Operations team",
          "External partners",
          "Regulatory bodies",
        ],
        businessImpact: "high",
        reasoning: "Understanding stakeholder impact helps design appropriate change management",
        expectedAnswerType: "List of affected parties and their concerns",
      },
      {
        id: "implementation_constraints",
        question: "What are your main constraints for implementing this AI agent?",
        type: "multiselect",
        category: "constraints",
        priority: "high",
        options: [
          "Limited budget",
          "Tight timeline",
          "Technical expertise gap",
          "Data privacy/security requirements",
          "Regulatory compliance needs",
          "Integration with existing systems",
          "Change management challenges",
          "Scalability requirements",
        ],
        businessImpact: "medium",
        reasoning: "Identifying constraints early helps create a realistic implementation plan",
        expectedAnswerType: "Specific limitations and requirements",
      },
    ]

    return {
      success: true,
      questions,
      context: this.analyzeBusinessContext(existingAnswers),
    }
  }

  async generateBusinessFocusedPlan(
    answers: UserAnswer[],
    context: BusinessContext,
    userId: string,
  ): Promise<{ success: boolean; plan?: GeneratedPlan; error?: string }> {
    try {
      const llmProvider = await getUserLLMProvider(userId)

      if (!llmProvider) {
        return this.getFallbackBusinessPlan(answers, context)
      }

      const prompt = this.buildBusinessPlanPrompt(answers, context)

      const response = await llmProvider.generateText({
        prompt,
        maxTokens: 4000,
        temperature: 0.6,
      })

      const plan = this.parseBusinessPlan(response, context)

      return { success: true, plan }
    } catch (error) {
      console.error("❌ Error generating business plan:", error)
      return this.getFallbackBusinessPlan(answers, context)
    }
  }

  private buildBusinessPlanPrompt(answers: UserAnswer[], context: BusinessContext): string {
    return `You are a senior business consultant creating an AI agent implementation plan.

BUSINESS CONTEXT: ${JSON.stringify(context)}
USER ANSWERS: ${JSON.stringify(answers)}

Create a comprehensive business-focused implementation plan that addresses:
1. Clear business objectives and ROI
2. Stakeholder-specific benefits
3. Risk mitigation strategies
4. Implementation phases with business milestones
5. Success measurement framework

Return ONLY valid JSON in this exact format:
{
  "id": "plan_id",
  "title": "Business-Focused AI Agent Implementation",
  "description": "Strategic plan focused on business value delivery",
  "businessObjectives": ["objective1", "objective2"],
  "stakeholderBenefits": [{"stakeholder": "group", "benefits": ["benefit1"]}],
  "roiProjection": {"timeframe": "6 months", "expectedReturn": "description"},
  "riskMitigation": [{"risk": "risk_name", "mitigation": "strategy"}],
  "timeline": [{"phase": "name", "duration": "timeframe", "businessMilestones": ["milestone1"], "deliverables": ["deliverable1"]}],
  "successMetrics": ["metric1", "metric2"],
  "resources": [{"type": "resource_type", "name": "resource_name", "businessJustification": "why_needed"}]
}`
  }

  private parseBusinessPlan(response: string, context: BusinessContext): GeneratedPlan {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, "").trim()
      const parsed = JSON.parse(cleanResponse)

      // Convert to GeneratedPlan format
      return {
        id: parsed.id || `plan_${Date.now()}`,
        title: parsed.title || "Business-Focused AI Agent Implementation",
        description: parsed.description || "Strategic implementation plan focused on business value",
        objectives: parsed.businessObjectives || ["Deliver measurable business value"],
        dependencies: [],
        resources: parsed.resources || [],
        timeline: parsed.timeline || [],
        risks: parsed.riskMitigation?.map((r: any) => r.risk) || [],
        successMetrics: parsed.successMetrics || [],
        complexity: this.assessComplexity(context),
        estimatedTimeToValue: this.estimateTimeToValue(context),
      }
    } catch (error) {
      console.error("Failed to parse business plan:", error)
      return this.getFallbackBusinessPlan([], context).plan!
    }
  }

  private getFallbackBusinessPlan(
    answers: UserAnswer[],
    context: BusinessContext,
  ): { success: boolean; plan: GeneratedPlan } {
    const plan: GeneratedPlan = {
      id: `business_plan_${Date.now()}`,
      title: "Strategic AI Agent Implementation Plan",
      description: "A business-focused implementation plan designed to deliver measurable value and ROI",
      objectives: [
        "Solve the identified business problem with measurable impact",
        "Deliver positive ROI within the specified timeframe",
        "Ensure smooth stakeholder adoption and change management",
        "Establish scalable foundation for future AI initiatives",
      ],
      dependencies: [],
      resources: [
        {
          type: "business_sponsor",
          name: "Executive Sponsor",
          provider: "Internal",
          required: true,
          configured: false,
          description: "Senior leader to champion the initiative and remove obstacles",
        },
        {
          type: "change_management",
          name: "Change Management Plan",
          provider: "Internal",
          required: true,
          configured: false,
          description: "Strategy for stakeholder communication and adoption",
        },
      ],
      timeline: [
        {
          phase: "Business Foundation",
          duration: "1-2 weeks",
          tasks: ["Stakeholder alignment", "Success criteria definition", "Resource allocation"],
          dependencies: [],
          deliverables: ["Business case", "Success metrics", "Stakeholder buy-in"],
          riskLevel: "low",
        },
        {
          phase: "MVP Development",
          duration: "2-4 weeks",
          tasks: ["Core functionality development", "Initial testing", "Stakeholder feedback"],
          dependencies: ["Business Foundation"],
          deliverables: ["Working MVP", "Test results", "Feedback incorporation"],
          riskLevel: "medium",
        },
        {
          phase: "Business Deployment",
          duration: "1-2 weeks",
          tasks: ["Production deployment", "User training", "Performance monitoring"],
          dependencies: ["MVP Development"],
          deliverables: ["Live system", "Trained users", "Performance baseline"],
          riskLevel: "medium",
        },
      ],
      risks: ["Stakeholder resistance", "Technical integration challenges", "ROI timeline pressure"],
      successMetrics: ["Business KPI improvement", "User adoption rate", "ROI achievement", "Stakeholder satisfaction"],
      complexity: "medium",
      estimatedTimeToValue: "4-8 weeks",
    }

    return { success: true, plan }
  }

  private assessComplexity(context: BusinessContext): "low" | "medium" | "high" {
    let complexityScore = 0

    if (context.stakeholders.length > 3) complexityScore += 1
    if (context.constraints.length > 2) complexityScore += 1
    if (context.timeline === "urgent") complexityScore += 1
    if (context.industry === "healthcare" || context.industry === "finance") complexityScore += 1

    if (complexityScore >= 3) return "high"
    if (complexityScore >= 2) return "medium"
    return "low"
  }

  private estimateTimeToValue(context: BusinessContext): string {
    if (context.timeline === "urgent") return "2-4 weeks"
    if (context.businessGoals.includes("operational_efficiency")) return "4-6 weeks"
    return "6-8 weeks"
  }
}
