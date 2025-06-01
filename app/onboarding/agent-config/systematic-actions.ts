"use server"

import { getSupabaseFromServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  SmartQuestion,
  UserAnswer,
  GeneratedPlan,
  AIConsultationMessage,
  AgentTask,
} from "@/lib/systematic-flow-types"
import { getUserLLMProvider } from "@/lib/user-llm-provider"
import { profileManager } from "@/lib/production-profile-manager"

/**
 * Clean and parse JSON response from LLM that might contain markdown code blocks
 */
function parseJSONFromLLMResponse(response: string): any {
  try {
    // First try direct parsing
    return JSON.parse(response)
  } catch (error) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch (innerError) {
        console.error("Failed to parse JSON from code block:", jsonMatch[1])
        throw new Error("Invalid JSON format in LLM response")
      }
    }

    // Try to find JSON-like content between { and }
    const jsonObjectMatch = response.match(/\{[\s\S]*\}/)
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0])
      } catch (innerError) {
        console.error("Failed to parse JSON object:", jsonObjectMatch[0])
        throw new Error("Invalid JSON object in LLM response")
      }
    }

    // Try to find JSON array between [ and ]
    const jsonArrayMatch = response.match(/\[[\s\S]*\]/)
    if (jsonArrayMatch) {
      try {
        return JSON.parse(jsonArrayMatch[0])
      } catch (innerError) {
        console.error("Failed to parse JSON array:", jsonArrayMatch[0])
        throw new Error("Invalid JSON array in LLM response")
      }
    }

    throw new Error("No valid JSON found in LLM response")
  }
}

export async function generateSmartQuestions(
  goalPrimer: string,
  existingAnswers: UserAnswer[],
): Promise<{ success: boolean; questions?: SmartQuestion[]; error?: string }> {
  try {
    console.log("🧠 Generating intelligent business-focused questions...")

    const profileResult = await profileManager.ensureUserProfile()
    const userId = profileResult.userId || "00000000-0000-0000-0000-000000000000"

    // Use enhanced intelligence system
    const { EnhancedAgentIntelligence } = await import("@/lib/enhanced-agent-intelligence")
    const intelligence = EnhancedAgentIntelligence.getInstance()

    const result = await intelligence.generateIntelligentQuestions(goalPrimer, existingAnswers, userId)

    if (result.success && result.questions) {
      // Convert IntelligentQuestion to SmartQuestion format
      const smartQuestions: SmartQuestion[] = result.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        category: q.category,
        priority: q.priority === "critical" ? "high" : q.priority,
        validation: { required: q.priority === "critical" },
        context: q.reasoning,
        options: q.options,
      }))

      return { success: true, questions: smartQuestions }
    }

    return result
  } catch (error) {
    console.error("❌ Error generating intelligent questions:", error)
    return {
      success: true,
      questions: getFallbackBusinessQuestions(),
      error: `Used fallback questions due to: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

function getFallbackBusinessQuestions(): SmartQuestion[] {
  return [
    {
      id: "business_problem_core",
      question: "What specific business problem or opportunity is driving this AI agent implementation?",
      type: "text",
      category: "business",
      priority: "high",
      validation: { required: true, minLength: 20 },
      context: "Understanding the core business driver ensures the agent delivers real value and ROI.",
    },
    {
      id: "success_measurement_kpis",
      question: "How will you measure the success of this AI agent in your business?",
      type: "multiselect",
      category: "business",
      priority: "high",
      options: [
        "Cost reduction (specify target %)",
        "Time savings (specify hours/week)",
        "Revenue increase (specify target)",
        "Customer satisfaction improvement",
        "Process efficiency gains",
        "Error reduction",
        "Employee productivity boost",
        "Compliance improvement",
        "Other (please specify)",
      ],
      context: "Clear success metrics ensure the agent delivers measurable business value.",
    },
    {
      id: "stakeholder_ecosystem",
      question: "Who are the key stakeholders that will be affected by this AI agent?",
      type: "multiselect",
      category: "business",
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
        "Investors/Board",
      ],
      context: "Understanding stakeholder impact helps design appropriate change management and adoption strategies.",
    },
    {
      id: "implementation_constraints_business",
      question: "What are your main constraints for implementing this AI agent?",
      type: "multiselect",
      category: "business",
      priority: "medium",
      options: [
        "Limited budget",
        "Tight timeline",
        "Technical expertise gap",
        "Data privacy/security requirements",
        "Regulatory compliance needs",
        "Integration with existing systems",
        "Change management challenges",
        "Scalability requirements",
        "Vendor/technology dependencies",
      ],
      context: "Identifying constraints early helps create a realistic implementation plan and avoid common pitfalls.",
    },
  ]
}

export async function submitAnswersAndGeneratePlan(
  answers: UserAnswer[],
): Promise<{ success: boolean; plan?: GeneratedPlan; error?: string }> {
  try {
    console.log("🚀 Starting business-focused plan generation...")

    const profileResult = await profileManager.ensureUserProfile()
    const userId = profileResult.userId || "00000000-0000-0000-0000-000000000000"

    // Use enhanced intelligence for business-focused planning
    const { EnhancedAgentIntelligence } = await import("@/lib/enhanced-agent-intelligence")
    const intelligence = EnhancedAgentIntelligence.getInstance()

    // Analyze business context from answers
    const context = intelligence.analyzeBusinessContext
      ? intelligence.analyzeBusinessContext(answers)
      : { businessGoals: [], currentChallenges: [], timeline: "not_specified" }

    const result = await intelligence.generateBusinessFocusedPlan(answers, context, userId)

    if (result.success && result.plan) {
      return result
    }

    // Enhanced fallback with business focus
    return getFallbackBusinessPlan(answers)
  } catch (error) {
    console.error("❌ Error generating business plan:", error)
    return getFallbackBusinessPlan(answers)
  }
}

function getFallbackBusinessPlan(answers: UserAnswer[]): { success: boolean; plan: GeneratedPlan } {
  // Extract business context from answers
  const businessProblem =
    answers.find((a) => a.questionId.includes("business_problem"))?.answer || "Business optimization"
  const successMetrics = answers.find((a) => a.questionId.includes("success_measurement"))?.answer || []
  const stakeholders = answers.find((a) => a.questionId.includes("stakeholder"))?.answer || []

  const plan: GeneratedPlan = {
    id: `business_plan_${Date.now()}`,
    title: "Strategic AI Agent Implementation Plan",
    description: `Business-focused implementation plan to address: ${businessProblem}`,
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
      {
        type: "success_tracking",
        name: "KPI Tracking System",
        provider: "Internal/External",
        required: true,
        configured: false,
        description: "System to measure and track business success metrics",
      },
    ],
    timeline: [
      {
        phase: "Business Foundation & Alignment",
        duration: "1-2 weeks",
        tasks: [
          "Stakeholder alignment sessions",
          "Success criteria definition",
          "Resource allocation and team setup",
          "Risk assessment and mitigation planning",
        ],
        dependencies: [],
        deliverables: [
          "Stakeholder buy-in documentation",
          "Clear success metrics and KPIs",
          "Project charter and resource plan",
          "Risk register and mitigation strategies",
        ],
        riskLevel: "low",
      },
      {
        phase: "MVP Development & Testing",
        duration: "2-4 weeks",
        tasks: [
          "Core functionality development",
          "Business process integration",
          "Stakeholder feedback incorporation",
          "Performance optimization",
        ],
        dependencies: ["Business Foundation & Alignment"],
        deliverables: [
          "Working MVP with core features",
          "Integration with existing systems",
          "User acceptance test results",
          "Performance benchmarks",
        ],
        riskLevel: "medium",
      },
      {
        phase: "Business Deployment & Adoption",
        duration: "1-2 weeks",
        tasks: [
          "Production deployment",
          "User training and onboarding",
          "Change management execution",
          "Performance monitoring setup",
        ],
        dependencies: ["MVP Development & Testing"],
        deliverables: [
          "Live production system",
          "Trained user base",
          "Adoption metrics tracking",
          "Ongoing support processes",
        ],
        riskLevel: "medium",
      },
    ],
    risks: [
      "Stakeholder resistance to change",
      "Technical integration complexity",
      "ROI timeline pressure",
      "Resource availability constraints",
    ],
    successMetrics: Array.isArray(successMetrics)
      ? successMetrics
      : ["Business KPI improvement", "User adoption rate", "ROI achievement", "Stakeholder satisfaction score"],
    complexity: "medium",
    estimatedTimeToValue: "4-8 weeks",
  }

  return { success: true, plan }
}

export async function consultWithAI(
  userMessage: string,
  planId: string,
  conversationHistory: AIConsultationMessage[],
): Promise<{
  success: boolean
  response?: AIConsultationMessage
  generatedTasks?: AgentTask[]
  planUpdates?: Partial<GeneratedPlan>
  error?: string
}> {
  try {
    console.log("🚀 Starting strategic AI consultation...")

    const profileResult = await profileManager.ensureUserProfile()
    const userId = profileResult.userId || "00000000-0000-0000-0000-000000000000"

    const llmProvider = await getUserLLMProvider(userId)

    if (!llmProvider) {
      // Enhanced fallback response with business focus
      const fallbackResponse: AIConsultationMessage = {
        id: `msg_fallback_${Date.now()}`,
        role: "assistant",
        content: `I understand you're asking about: "${userMessage}". While I don't have access to advanced AI capabilities right now, I can offer some strategic guidance:

**Key Considerations:**
• Focus on measurable business outcomes
• Identify potential risks and mitigation strategies  
• Consider stakeholder impact and change management
• Plan for scalability and future growth

**Recommended Actions:**
• Define clear success metrics and KPIs
• Create a stakeholder communication plan
• Establish regular progress review checkpoints
• Document lessons learned for future initiatives

Would you like me to help you break this down into specific action items?`,
        timestamp: new Date(),
        relatedQuestions: [
          "What specific business metrics should we track?",
          "How can we ensure stakeholder buy-in?",
          "What are the biggest implementation risks?",
          "How should we measure ROI?",
        ],
      }

      return { success: true, response: fallbackResponse }
    }

    const history = Array.isArray(conversationHistory) ? conversationHistory : []
    const conversationContext = history
      .slice(-5)
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")

    const prompt = `You are a senior business strategy consultant specializing in AI implementation. 
The user is discussing their AI agent implementation plan (ID: ${planId}).

**Your Role:**
- Provide strategic business guidance
- Focus on ROI and business value
- Identify risks and opportunities
- Suggest actionable next steps
- Ask probing questions to uncover insights

**Conversation Context:**
${conversationContext}

**User's Latest Message:** "${userMessage}"

**Instructions:**
Provide intelligent, strategic advice that helps them achieve better business outcomes. 
Generate specific, actionable tasks when appropriate.

Return ONLY valid JSON without markdown formatting:
{
  "content": "Your strategic response focusing on business value and actionable insights",
  "relatedQuestions": [
    "Strategic follow-up question 1",
    "Strategic follow-up question 2", 
    "Strategic follow-up question 3"
  ],
  "generatedTasks": [
    {
      "id": "task_id",
      "title": "Specific actionable task title",
      "description": "Clear description of what needs to be done and why",
      "priority": "high|medium|low",
      "category": "strategy|implementation|measurement|stakeholder_management",
      "requiresApproval": false,
      "estimatedHours": 2
    }
  ]
}`

    const response = await llmProvider.generateText({
      prompt,
      maxTokens: 2500,
      temperature: 0.7,
    })

    const aiResponse = parseJSONFromLLMResponse(response)

    const consultationMessage: AIConsultationMessage = {
      id: `msg_ai_${Date.now()}`,
      role: "assistant",
      content:
        aiResponse.content ||
        "I'm here to help with your strategic planning. What specific aspect would you like to explore?",
      timestamp: new Date(),
      relatedQuestions: Array.isArray(aiResponse.relatedQuestions)
        ? aiResponse.relatedQuestions
        : [
            "What are the key success factors?",
            "How can we mitigate implementation risks?",
            "What should be our immediate priorities?",
          ],
    }

    // Store generated tasks with business context
    let storedTasks: AgentTask[] = []
    if (aiResponse.generatedTasks && Array.isArray(aiResponse.generatedTasks) && aiResponse.generatedTasks.length > 0) {
      const taskResult = await storeBusinessFocusedTasks(aiResponse.generatedTasks, userId, planId)
      if (taskResult.success) {
        storedTasks = taskResult.tasks || []
      }
    }

    console.log("✅ Strategic AI consultation completed successfully")
    return {
      success: true,
      response: consultationMessage,
      generatedTasks: storedTasks,
    }
  } catch (error) {
    console.error("❌ Error in strategic consultation:", error)
    return {
      success: false,
      error: `Failed to consult with AI: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

async function storeBusinessFocusedTasks(
  tasks: AgentTask[],
  userId: string,
  planId: string,
): Promise<{ success: boolean; tasks?: AgentTask[]; error?: string }> {
  try {
    console.log(`🔄 Storing ${tasks.length} business-focused tasks...`)
    const supabase = getSupabaseFromServer()

    const tasksToInsert = tasks.map((task) => ({
      title: task.title || "Strategic Task",
      priority: task.priority || "medium",
      status: "todo" as const,
      is_dependency: true,
      blocked_reason: "Strategic consultation task - requires business review",
      metadata: {
        description: task.description || "Task generated from strategic consultation",
        category: task.category || "strategy",
        estimatedHours: task.estimatedHours || 2,
        requiresApproval: task.requiresApproval !== undefined ? task.requiresApproval : true,
        source: "strategic_consultation",
        consultation_id: `consultation_${Date.now()}`,
        plan_id: planId,
        business_focused: true,
        strategic_priority: task.priority,
      },
    }))

    const { data: insertedTasks, error: insertError } = await supabase.from("tasks").insert(tasksToInsert).select("*")

    if (insertError) {
      console.error("❌ Error inserting strategic tasks:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`✅ Successfully stored ${insertedTasks?.length || 0} strategic tasks`)
    return { success: true, tasks: insertedTasks || [] }
  } catch (error) {
    console.error("❌ Error storing business-focused tasks:", error)
    return { success: false, error: "Failed to store strategic tasks" }
  }
}

export async function finalizeAndDeployAgent(planId: string): Promise<{
  success: boolean
  agentId?: string
  tasks?: AgentTask[]
  deploymentStatus?: {
    working: string[]
    needsAttention: string[]
    dependencyTasks: AgentTask[]
  }
  error?: string
}> {
  try {
    console.log("🚀 Starting agent deployment...")

    // Get a valid user ID that exists in the profiles table
    const profileResult = await profileManager.ensureUserProfile()
    const userId = profileResult.userId

    if (!userId) {
      console.error("❌ Could not get valid user ID for agent creation")
      return { success: false, error: "Could not establish valid user ID for agent creation" }
    }

    console.log(`✅ Using valid user ID for agent: ${userId}`)

    const supabase = getSupabaseFromServer()

    // Get user's LLM configuration
    const llmProvider = await getUserLLMProvider(userId)
    const hasLLM = !!llmProvider

    // Check existing consultation tasks
    const { data: consultationTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("metadata->>source", "ai_consultation")
      .is("agent_id", null)

    // Generate comprehensive deployment analysis
    const deploymentAnalysis = await generateDeploymentAnalysis(hasLLM, consultationTasks || [])

    console.log("🔄 Creating agent with validated user ID...")
    // Create the agent with the validated user ID
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .insert({
        name: `Systematic Agent - ${new Date().toLocaleDateString()}`,
        goal: "Agent configured through systematic planning process with AI consultation",
        owner_id: userId, // Use the validated user ID
        template_slug: "systematic-agent",
        behavior: "Systematically configured agent with deployment analysis and dependency tracking",
        status: "active",
      })
      .select("id")
      .single()

    if (agentError || !agent) {
      console.error("❌ Error creating agent:", agentError)
      return { success: false, error: `Failed to create agent: ${agentError?.message}` }
    }

    const agentId = agent.id
    console.log(`✅ Agent created with ID: ${agentId}`)

    // Auto-start the agent with intelligent workflow
    try {
      const { autoStartAgentAfterCreation } = await import("./auto-start-actions")

      const userInputs = {
        goalPrimer: "User's goal from systematic configuration",
        answers: [], // Pass the actual answers from the configuration process
        planData: { planId }, // Pass the plan data
        consultationHistory: [], // Pass consultation history if available
      }

      const autoStartResult = await autoStartAgentAfterCreation(agentId, userInputs)

      if (autoStartResult.success) {
        console.log("✅ Agent auto-started successfully")
      } else {
        console.warn("⚠️ Agent created but auto-start failed:", autoStartResult.error)
      }
    } catch (autoStartError) {
      console.warn("⚠️ Agent created but auto-start failed:", autoStartError)
      // Don't fail the deployment if auto-start fails
    }

    // Generate and store dependency tasks
    const dependencyTasks = await generateDependencyTasks(deploymentAnalysis.needsAttention, agentId)

    // Update consultation tasks to belong to this agent
    if (consultationTasks && consultationTasks.length > 0) {
      await supabase
        .from("tasks")
        .update({ agent_id: agentId })
        .eq("metadata->>source", "ai_consultation")
        .is("agent_id", null)
    }

    // Store deployment status in agent_custom_data table
    try {
      await supabase.from("agent_custom_data").insert({
        agent_id: agentId,
        custom_data: {
          planId,
          deploymentAnalysis,
          deploymentTimestamp: new Date().toISOString(),
          configuration_method: "systematic",
          working: deploymentAnalysis.working,
          needsAttention: deploymentAnalysis.needsAttention,
          recommendations: deploymentAnalysis.recommendations,
        },
      })
    } catch (customDataError) {
      console.log("⚠️ Failed to store custom data (non-critical):", customDataError)
    }

    // Add XP for completing systematic configuration
    try {
      await supabase.from("xp_log").insert({
        owner_id: userId,
        action: "completed_systematic_configuration",
        points: 250,
        description: "Completed systematic agent configuration with deployment analysis",
      })
    } catch (xpError) {
      console.log("⚠️ Failed to add XP (non-critical):", xpError)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/dependencies")
    revalidatePath(`/dashboard/agents/${agentId}`)

    console.log("✅ Agent deployment completed successfully")
    return {
      success: true,
      agentId,
      tasks: [...(consultationTasks || []), ...dependencyTasks],
      deploymentStatus: {
        working: deploymentAnalysis.working,
        needsAttention: deploymentAnalysis.needsAttention,
        dependencyTasks,
      },
    }
  } catch (error) {
    console.error("❌ Error in deployment:", error)
    return { success: false, error: "Failed to deploy agent" }
  }
}

async function generateDeploymentAnalysis(
  hasLLM: boolean,
  consultationTasks: any[],
): Promise<{
  working: string[]
  needsAttention: string[]
  recommendations: string[]
}> {
  const working: string[] = []
  const needsAttention: string[] = []
  const recommendations: string[] = []

  // Check what's working
  working.push("✅ Database connection established")
  working.push("✅ User authentication active")
  working.push("✅ Agent framework initialized")
  working.push("✅ Systematic configuration completed")

  if (hasLLM) {
    working.push("✅ AI/LLM integration configured")
  } else {
    needsAttention.push("🔧 AI/LLM provider needs configuration")
    recommendations.push("Configure OpenAI or other LLM provider for intelligent responses")
  }

  if (consultationTasks.length > 0) {
    working.push(`✅ ${consultationTasks.length} consultation tasks generated`)
  } else {
    needsAttention.push("📝 No specific tasks identified from consultation")
    recommendations.push("Review agent objectives and create specific action items")
  }

  // Always add these common needs
  needsAttention.push("🎯 Define specific success metrics")
  needsAttention.push("📊 Set up monitoring and tracking")
  needsAttention.push("🔄 Establish feedback loops")
  needsAttention.push("📈 Plan scaling strategy")
  needsAttention.push("🔐 Configure security settings")
  needsAttention.push("⚡ Optimize performance settings")

  recommendations.push("Start with high-priority dependency tasks")
  recommendations.push("Monitor agent performance regularly")
  recommendations.push("Iterate based on results and feedback")
  recommendations.push("Review and update configurations monthly")

  return { working, needsAttention, recommendations }
}

async function generateDependencyTasks(needsAttention: string[], agentId: string): Promise<AgentTask[]> {
  const supabase = getSupabaseFromServer()

  const dependencyTasks: AgentTask[] = needsAttention.map((item, index) => ({
    id: `dep_${Date.now()}_${index}`,
    title: item.replace(/^[🔧📝🎯📊🔄📈🔐⚡]\s*/u, ""), // Remove emoji
    description: `Address: ${item}`,
    priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
    status: "todo",
    dependencies: [],
    category: "deployment",
    estimatedHours: 2,
    phase: "Post-Deployment",
    deliverables: ["Task completion", "Documentation"],
    acceptanceCriteria: ["Requirements met", "Quality verified"],
  }))

  // Store dependency tasks in database
  const tasksToInsert = dependencyTasks.map((task) => ({
    agent_id: agentId,
    title: task.title,
    priority: task.priority,
    status: task.status,
    is_dependency: true,
    blocked_reason: "Deployment dependency - needs completion for optimal performance",
    metadata: {
      description: task.description,
      category: task.category,
      estimatedHours: task.estimatedHours,
      phase: task.phase,
      source: "deployment_analysis",
      created_from: "systematic_configuration",
      deployment_priority: task.priority,
    },
    auto_generated: true,
    requires_approval: false,
    estimated_hours: task.estimatedHours,
  }))

  try {
    const { data: insertedTasks } = await supabase.from("tasks").insert(tasksToInsert).select("*")
    console.log(`✅ Created ${insertedTasks?.length || 0} dependency tasks`)
    return insertedTasks || []
  } catch (error) {
    console.error("❌ Error inserting dependency tasks:", error)
    return []
  }
}
