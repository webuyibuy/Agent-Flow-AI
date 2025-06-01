"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Brain,
  Rocket,
  AlertTriangle,
  Loader2,
  Zap,
  Target,
  BarChart3,
  Users,
  DollarSign,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import ProfessionalAIConsultant from "./professional-ai-consultant"
import EnhancedDeploymentResults from "./enhanced-deployment-results"
import BusinessRequirementsForm from "./business-requirements-form"
import type {
  ConfigurationStage,
  SmartQuestion,
  UserAnswer,
  GeneratedPlan,
  AIConsultationMessage,
  AgentTask,
} from "@/lib/systematic-flow-types"
import {
  generateSmartQuestions,
  submitAnswersAndGeneratePlan,
  consultWithAI,
  finalizeAndDeployAgent,
} from "@/app/onboarding/agent-config/systematic-actions"

const businessStages: ConfigurationStage[] = [
  {
    id: "business_requirements",
    name: "Business Requirements",
    description: "Define business goals and success metrics",
    status: "active",
  },
  {
    id: "strategy_planning",
    name: "Strategy Planning",
    description: "AI generates business-focused plan",
    status: "pending",
    dependencies: ["business_requirements"],
  },
  {
    id: "consultation",
    name: "Strategic Consultation",
    description: "Refine plan with AI business consultant",
    status: "pending",
    dependencies: ["strategy_planning"],
  },
  {
    id: "deployment",
    name: "Deployment & Activation",
    description: "Deploy agent and generate action items",
    status: "pending",
    dependencies: ["consultation"],
  },
]

interface BusinessFocusedAgentFlowProps {
  initialGoal?: string
  businessContext?: {
    industry?: string
    companySize?: string
    timeline?: string
  }
}

export default function BusinessFocusedAgentFlow({ initialGoal, businessContext }: BusinessFocusedAgentFlowProps) {
  const router = useRouter()
  const [currentStage, setCurrentStage] = useState<string>("business_requirements")
  const [stageStatuses, setStageStatuses] = useState<Record<string, "pending" | "active" | "completed">>({
    business_requirements: "active",
    strategy_planning: "pending",
    consultation: "pending",
    deployment: "pending",
  })

  // Business requirements stage
  const [questions, setQuestions] = useState<SmartQuestion[]>([])
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [businessGoal, setBusinessGoal] = useState(initialGoal || "")
  const [businessMetrics, setBusinessMetrics] = useState<string[]>([])
  const [businessStakeholders, setBusinessStakeholders] = useState<string[]>([])
  const [businessConstraints, setBusinessConstraints] = useState<string[]>([])

  // Planning stage
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)

  // Consultation stage
  const [consultationMessages, setConsultationMessages] = useState<AIConsultationMessage[]>([])
  const [loadingConsultation, setLoadingConsultation] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<AgentTask[]>([])

  // Deploy stage
  const [deploying, setDeploying] = useState(false)
  const [deployedAgentId, setDeployedAgentId] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null)
  const [agentName, setAgentName] = useState<string>("")

  const [error, setError] = useState<string | null>(null)

  // Load initial questions
  useEffect(() => {
    if (currentStage === "business_requirements" && questions.length === 0) {
      loadBusinessQuestions()
    }
  }, [currentStage])

  // Initialize welcome message when entering consultation stage
  useEffect(() => {
    if (currentStage === "consultation" && consultationMessages.length === 0 && plan) {
      // Add welcome message to consultation
      const welcomeMessage: AIConsultationMessage = {
        id: `msg_welcome_${Date.now()}`,
        role: "assistant",
        content: `Welcome to your strategic consultation! I've analyzed your business requirements and created a plan to address: "${businessGoal}".

Let's refine this plan to ensure it delivers maximum business value. I can help you:
• Optimize your implementation strategy
• Identify potential risks and mitigation approaches
• Define clear success metrics and ROI tracking
• Create a stakeholder management approach

What aspect of the plan would you like to discuss first?`,
        timestamp: new Date(),
        relatedQuestions: [
          "How can we optimize the timeline for faster ROI?",
          "What are the key risks we should address?",
          "How should we measure success and track progress?",
          "Which stakeholders will be most impacted?",
        ],
      }
      setConsultationMessages([welcomeMessage])
    }
  }, [currentStage, plan, consultationMessages.length, businessGoal])

  const loadBusinessQuestions = async () => {
    setLoadingQuestions(true)
    setError(null)

    try {
      const result = await generateSmartQuestions(businessGoal || "Implement AI agent", answers)
      if (result.success && result.questions) {
        setQuestions(result.questions)
      } else {
        setError(result.error || "Failed to generate business questions")
      }
    } catch (err) {
      setError("Failed to load business questions")
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string | string[] | boolean) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId)
      if (existing) {
        return prev.map((a) => (a.questionId === questionId ? { ...a, answer, timestamp: new Date() } : a))
      } else {
        return [...prev, { questionId, answer, timestamp: new Date() }]
      }
    })
  }

  const completeBusinessRequirements = () => {
    // Convert business requirements to answers format
    const businessAnswers: UserAnswer[] = [
      {
        questionId: "business_goal",
        answer: businessGoal,
        timestamp: new Date(),
      },
      {
        questionId: "business_metrics",
        answer: businessMetrics,
        timestamp: new Date(),
      },
      {
        questionId: "business_stakeholders",
        answer: businessStakeholders,
        timestamp: new Date(),
      },
      {
        questionId: "business_constraints",
        answer: businessConstraints,
        timestamp: new Date(),
      },
      ...answers,
    ]

    setAnswers(businessAnswers)
    generateBusinessPlan(businessAnswers)
  }

  const generateBusinessPlan = async (businessAnswers: UserAnswer[]) => {
    setLoadingPlan(true)
    setError(null)

    try {
      const result = await submitAnswersAndGeneratePlan(businessAnswers)
      if (result.success && result.plan) {
        setPlan(result.plan)
        setStageStatuses((prev) => ({
          ...prev,
          business_requirements: "completed",
          strategy_planning: "completed",
          consultation: "active",
        }))
        setCurrentStage("consultation")

        // Generate agent name based on business goal
        const goalWords = businessGoal.split(" ")
        let namePrefix = ""
        if (goalWords.length >= 2) {
          namePrefix = goalWords
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join("")
        } else {
          namePrefix = businessGoal.charAt(0).toUpperCase() + businessGoal.slice(1).toLowerCase()
        }
        setAgentName(`${namePrefix} Business Agent`)
      } else {
        setError(result.error || "Failed to generate business plan")
      }
    } catch (err) {
      setError("Failed to create business plan")
    } finally {
      setLoadingPlan(false)
    }
  }

  const sendConsultationMessage = async (message: string) => {
    if (!message.trim() || !plan) return

    setLoadingConsultation(true)
    setError(null)

    const userMessage: AIConsultationMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    }

    setConsultationMessages((prev) => [...prev, userMessage])

    try {
      const result = await consultWithAI(message, plan.id, [...consultationMessages])
      if (result.success && result.response) {
        setConsultationMessages((prev) => [...prev, result.response!])

        // Add generated tasks to the list
        if (result.generatedTasks && result.generatedTasks.length > 0) {
          setGeneratedTasks((prev) => [...prev, ...result.generatedTasks!])
        }

        // Update plan if needed
        if (result.planUpdates) {
          setPlan((prev) => (prev ? { ...prev, ...result.planUpdates } : null))
        }
      } else {
        setError(result.error || "Failed to consult with AI")
      }
    } catch (err) {
      setError("Failed to send message")
    } finally {
      setLoadingConsultation(false)
    }
  }

  const proceedToDeployment = () => {
    setStageStatuses((prev) => ({
      ...prev,
      consultation: "completed",
      deployment: "active",
    }))
    setCurrentStage("deployment")
  }

  const deployBusinessAgent = async () => {
    if (!plan) return

    setDeploying(true)
    setError(null)

    try {
      const result = await finalizeAndDeployAgent(plan.id)
      if (result.success && result.agentId) {
        setDeployedAgentId(result.agentId)
        setDeploymentStatus(result.deploymentStatus || null)
        setStageStatuses((prev) => ({
          ...prev,
          deployment: "completed",
        }))
      } else {
        setError(result.error || "Failed to deploy agent")
      }
    } catch (err) {
      setError("Failed to deploy agent")
    } finally {
      setDeploying(false)
    }
  }

  const getOverallProgress = () => {
    const completed = Object.values(stageStatuses).filter((status) => status === "completed").length
    return (completed / businessStages.length) * 100
  }

  const renderStages = () => (
    <div className="flex items-center justify-between">
      {businessStages.map((stage, index) => (
        <div key={stage.id} className="flex items-center">
          <div className="flex items-center gap-2">
            {stageStatuses[stage.id] === "completed" ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : stageStatuses[stage.id] === "active" ? (
              <Circle className="h-6 w-6 text-blue-500 fill-current" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300" />
            )}
            <div>
              <div className="font-medium text-xs">{stage.name}</div>
              <div className="text-xs text-gray-500">{stage.description}</div>
            </div>
          </div>
          {index < businessStages.length - 1 && <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />}
        </div>
      ))}
    </div>
  )

  const goToDependencyBasket = () => {
    router.push("/dashboard/dependencies")
  }

  const goToAgentDashboard = (agentId: string) => {
    router.push(`/dashboard/agents/${agentId}`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Business-Focused Agent Configuration
          </CardTitle>
          <CardDescription>
            Creating an AI agent optimized for your specific business needs and success metrics
          </CardDescription>
          <Progress value={getOverallProgress()} className="w-full mt-2" />
        </CardHeader>
      </Card>

      {/* Stage Navigation */}
      <div className="hidden md:block">{renderStages()}</div>
      <div className="md:hidden">
        <Badge variant="outline" className="text-base font-medium">
          Stage {businessStages.findIndex((s) => s.id === currentStage) + 1} of {businessStages.length}:{" "}
          {businessStages.find((s) => s.id === currentStage)?.name}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Business Requirements Stage */}
      {currentStage === "business_requirements" && (
        <BusinessRequirementsForm
          initialGoal={businessGoal}
          onGoalChange={setBusinessGoal}
          metrics={businessMetrics}
          onMetricsChange={setBusinessMetrics}
          stakeholders={businessStakeholders}
          onStakeholdersChange={setBusinessStakeholders}
          constraints={businessConstraints}
          onConstraintsChange={setBusinessConstraints}
          questions={questions}
          onAnswerChange={handleAnswerChange}
          onSubmit={completeBusinessRequirements}
          isLoading={loadingPlan}
          loadingQuestions={loadingQuestions}
          onLoadMoreQuestions={loadBusinessQuestions}
          businessContext={businessContext}
        />
      )}

      {/* Strategy Planning Stage - This is handled automatically and transitions to Consultation */}

      {/* Consultation Stage */}
      {currentStage === "consultation" && plan && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-500" />
                Business Strategy Overview
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" /> Business Objectives
                  </h4>
                  <ul className="space-y-1 list-disc list-inside text-sm text-gray-600">
                    {plan.objectives.map((obj, index) => (
                      <li key={index}>{obj}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Implementation Timeline
                  </h4>
                  <div className="space-y-2">
                    {plan.timeline.map((phase, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{phase.phase}</div>
                        <div className="text-gray-600 text-xs">{phase.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold mb-2 text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Success Metrics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {plan.successMetrics.map((metric, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Tasks Display */}
          {generatedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Strategic Tasks from Consultation
                </CardTitle>
                <CardDescription>Business-focused tasks generated from our conversation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedTasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800">{task.title}</h5>
                          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                task.priority === "high"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : task.priority === "medium"
                                    ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                                    : "border-green-300 text-green-700 bg-green-50"
                              }`}
                            >
                              {task.priority} priority
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {task.category}
                            </Badge>
                            {task.estimatedHours && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {task.estimatedHours}h
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ProfessionalAIConsultant
            plan={plan}
            onMessageSent={sendConsultationMessage}
            messages={consultationMessages}
            isLoading={loadingConsultation}
            generatedTasks={generatedTasks}
            onQuickQuestion={(question) => sendConsultationMessage(question)}
          />

          <div className="flex justify-end">
            <Button onClick={proceedToDeployment} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Rocket className="mr-2 h-4 w-4" />
              Finalize & Deploy Business Agent
            </Button>
          </div>
        </div>
      )}

      {/* Deployment Stage */}
      {currentStage === "deployment" && plan && (
        <div className="space-y-6">
          {!deployedAgentId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-purple-500" />
                  Ready to Deploy Business Agent
                </CardTitle>
                <CardDescription>
                  Your business-focused agent configuration is complete and ready for deployment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-blue-50 shadow-xs">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    <span className="text-blue-700">{agentName || "Business Agent"}</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{businessGoal}</p>

                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" /> Key Stakeholders
                      </h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {businessStakeholders.length > 0 ? (
                          businessStakeholders.map((stakeholder, index) => <div key={index}>{stakeholder}</div>)
                        ) : (
                          <div>No specific stakeholders defined</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-500" /> Success Metrics
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                        {businessMetrics.length > 0 ? (
                          businessMetrics.map((metric, index) => <li key={index}>{metric}</li>)
                        ) : (
                          <li>Default business performance metrics</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Show consultation-generated tasks */}
                {generatedTasks.length > 0 && (
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-semibold mb-2 text-gray-800 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      Strategic Tasks ({generatedTasks.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {generatedTasks.map((task) => (
                        <div key={task.id} className="text-xs">
                          <strong>{task.title}</strong> - {task.priority} priority
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={deployBusinessAgent}
                    disabled={deploying}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {deploying ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="mr-2 h-4 w-4" />
                    )}
                    Deploy Business Agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Deployment Success with Enhanced Results
            <EnhancedDeploymentResults
              agentId={deployedAgentId}
              agentName={agentName || "Business Agent"}
              agentType="systematic"
              deploymentStatus={deploymentStatus}
              businessContext={{
                industry: businessContext?.industry || "General",
                primaryGoal: businessGoal,
                expectedROI: "Positive within 3-6 months",
                timeline: businessContext?.timeline || "Medium-term",
              }}
              onGoToDependencies={goToDependencyBasket}
              onGoToAgent={() => goToAgentDashboard(deployedAgentId)}
            />
          )}
        </div>
      )}
    </div>
  )
}
