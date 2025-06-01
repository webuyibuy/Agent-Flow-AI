"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { deployAgent } from "@/app/onboarding/review-deploy/actions"
import { CheckCircle, AlertTriangle, Loader2, Brain, Rocket, CheckCheck, ListChecks, Lightbulb } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReviewDeployClientProps {
  agentData: {
    name: string
    goal: string
    templateSlug?: string
    templateName?: string
    behavior?: string
    customAnswers?: Record<string, string>
    userId: string
  }
}

export default function ReviewDeployClient({ agentData }: ReviewDeployClientProps) {
  const [activeTab, setActiveTab] = useState("review")
  const [isPending, startTransition] = useTransition()
  const [deploymentStatus, setDeploymentStatus] = useState<"idle" | "success" | "error">("idle")
  const [deploymentMessage, setDeploymentMessage] = useState("")
  const [deployedAgentId, setDeployedAgentId] = useState<string | null>(null)
  const [plan, setPlan] = useState<any>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Generate a plan based on the agent configuration
  useEffect(() => {
    if (activeTab === "strategize" && !plan) {
      generatePlan()
    }
  }, [activeTab, plan])

  const generatePlan = async () => {
    setIsPlanLoading(true)
    try {
      // Generate a plan based on the agent configuration
      // This would normally call an API, but we'll generate it client-side for now
      const generatedPlan = await generateAgentPlan(agentData)
      setPlan(generatedPlan)
    } catch (error) {
      console.error("Error generating plan:", error)
      toast({
        title: "Error generating plan",
        description: "We couldn't generate a plan for your agent. Using a default plan instead.",
        variant: "destructive",
      })
      // Fallback to a default plan
      setPlan(getDefaultPlan(agentData))
    } finally {
      setIsPlanLoading(false)
    }
  }

  const handleDeploy = () => {
    startTransition(async () => {
      try {
        const result = await deployAgent({
          ...agentData,
          plan: plan,
        })

        if (result.success) {
          setDeploymentStatus("success")
          setDeploymentMessage(result.message || "Agent deployed successfully!")
          setDeployedAgentId(result.agentId || null)
          toast({
            title: "Agent deployed!",
            description: "Your agent has been created successfully.",
          })
        } else {
          setDeploymentStatus("error")
          setDeploymentMessage(result.error || "Failed to deploy agent.")
          toast({
            title: "Deployment failed",
            description: result.error || "There was an error deploying your agent.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error deploying agent:", error)
        setDeploymentStatus("error")
        setDeploymentMessage("An unexpected error occurred.")
        toast({
          title: "Deployment failed",
          description: "There was an unexpected error deploying your agent.",
          variant: "destructive",
        })
      }
    })
  }

  const goToDashboard = () => {
    if (deployedAgentId) {
      router.push(`/dashboard/agents/${deployedAgentId}`)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Review & Deploy Your Agent</h1>
        <p className="text-muted-foreground">
          Review your agent configuration, strategize its implementation, and deploy it to your workspace.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="review" disabled={isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Review
          </TabsTrigger>
          <TabsTrigger value="strategize" disabled={isPending}>
            <Brain className="mr-2 h-4 w-4" />
            Strategize & Plan
          </TabsTrigger>
          <TabsTrigger value="deploy" disabled={isPending}>
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                Agent Configuration Review
              </CardTitle>
              <CardDescription>Review the details of your agent before proceeding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Agent Name</h3>
                <p className="text-lg font-medium">{agentData.name}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Primary Goal</h3>
                <p>{agentData.goal}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Agent Type</h3>
                <div className="flex items-center">
                  <p>{agentData.templateName || "Custom Agent"}</p>
                  {agentData.templateSlug && (
                    <Badge variant="outline" className="ml-2">
                      {agentData.templateSlug}
                    </Badge>
                  )}
                </div>
              </div>

              {agentData.behavior && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-muted-foreground">Behavior Guidelines</h3>
                    <p>{agentData.behavior}</p>
                  </div>
                </>
              )}

              {agentData.customAnswers && Object.keys(agentData.customAnswers).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-muted-foreground">Custom Configuration</h3>
                    <div className="grid gap-2">
                      {Object.entries(agentData.customAnswers).map(([key, value]) => (
                        <div key={key} className="bg-muted p-2 rounded-md">
                          <p className="text-xs font-medium">{key.replace(/_/g, " ")}</p>
                          <p className="text-sm">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab("strategize")} className="ml-auto">
                <Brain className="mr-2 h-4 w-4" />
                Continue to Strategy
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="strategize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-blue-500" />
                Strategize & Plan
              </CardTitle>
              <CardDescription>
                Review the AI-generated strategy and implementation plan for your agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isPlanLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-muted-foreground">Generating your agent strategy...</p>
                </div>
              ) : plan ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                      Strategic Approach
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p>{plan.strategy}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <ListChecks className="mr-2 h-5 w-5 text-green-500" />
                      Implementation Plan
                    </h3>
                    <div className="space-y-2">
                      {plan.tasks.map((task: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded-md">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
                          </div>
                          <p className="text-sm mt-1">{task.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center">
                      <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                      Dependencies & Requirements
                    </h3>
                    <div className="space-y-2">
                      {plan.dependencies.map((dep: any, index: number) => (
                        <div
                          key={index}
                          className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium">{dep.title}</h4>
                            <Badge
                              variant="outline"
                              className="bg-amber-100 dark:bg-amber-900 border-amber-200 dark:border-amber-800"
                            >
                              {dep.type}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1">{dep.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>Failed to generate a plan for your agent.</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setActiveTab("review")} disabled={isPending}>
                Back to Review
              </Button>
              <Button onClick={() => setActiveTab("deploy")} className="ml-auto" disabled={isPending || isPlanLoading}>
                <Rocket className="mr-2 h-4 w-4" />
                Continue to Deploy
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Rocket className="mr-2 h-5 w-5 text-purple-500" />
                Deploy Your Agent
              </CardTitle>
              <CardDescription>Deploy your agent to your workspace and start working with it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deploymentStatus === "idle" ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCheck className="h-4 w-4" />
                    <AlertTitle>Ready to Deploy</AlertTitle>
                    <AlertDescription>
                      Your agent is ready to be deployed. Click the button below to create your agent and set up its
                      initial tasks.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <h3 className="font-medium">What happens next?</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your agent will be created in your workspace</li>
                      <li>Initial tasks will be set up based on your configuration</li>
                      <li>You'll be redirected to your agent's dashboard</li>
                      <li>You can start working with your agent immediately</li>
                    </ul>
                  </div>
                </div>
              ) : deploymentStatus === "success" ? (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Deployment Successful!</AlertTitle>
                  <AlertDescription>{deploymentMessage}</AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Deployment Failed</AlertTitle>
                  <AlertDescription>{deploymentMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              {deploymentStatus === "idle" ? (
                <>
                  <Button variant="outline" onClick={() => setActiveTab("strategize")} disabled={isPending}>
                    Back to Strategy
                  </Button>
                  <Button onClick={handleDeploy} className="ml-auto" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy Agent
                      </>
                    )}
                  </Button>
                </>
              ) : deploymentStatus === "success" ? (
                <Button onClick={goToDashboard} className="ml-auto">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Go to Agent Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setDeploymentStatus("idle")} className="ml-auto">
                    Try Again
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get badge variant based on priority
function getPriorityVariant(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "destructive"
    case "medium":
      return "default"
    case "low":
      return "outline"
    default:
      return "secondary"
  }
}

// Function to generate a plan based on agent configuration
// This would normally call an API, but we'll generate it client-side for now
async function generateAgentPlan(agentData: any) {
  // In a real implementation, this would call an API endpoint that uses the user's LLM API key
  // For now, we'll return a mock plan based on the agent type
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getDefaultPlan(agentData))
    }, 1500)
  })
}

// Function to get a default plan based on agent type
function getDefaultPlan(agentData: any) {
  const templateSlug = agentData.templateSlug || "custom-agent"
  const agentName = agentData.name
  const agentGoal = agentData.goal

  // Base plan structure
  const basePlan = {
    strategy: `${agentName} will focus on ${agentGoal} by implementing a systematic approach to task management and execution. The agent will prioritize tasks based on impact and urgency, while maintaining clear communication with stakeholders.`,
    tasks: [
      {
        title: "Initial Setup & Configuration",
        description: "Set up the agent's workspace and configure initial parameters based on the provided goals.",
        priority: "high",
      },
      {
        title: "Develop Implementation Roadmap",
        description: "Create a detailed roadmap for achieving the agent's primary goal with clear milestones.",
        priority: "high",
      },
      {
        title: "Establish Monitoring & Reporting",
        description: "Set up systems to track progress and report on key metrics related to the agent's goals.",
        priority: "medium",
      },
    ],
    dependencies: [
      {
        title: "API Access Requirements",
        description: "Ensure all necessary API keys and permissions are configured for optimal agent operation.",
        type: "technical",
      },
      {
        title: "Stakeholder Approval",
        description: "Obtain necessary approvals for the agent's operation and access to required resources.",
        type: "organizational",
      },
    ],
  }

  // Template-specific plans
  const templatePlans: Record<string, any> = {
    "sales-lead-generator": {
      strategy: `${agentName} will focus on generating and qualifying sales leads by implementing a multi-channel approach to prospect identification, qualification, and engagement. The agent will prioritize leads based on fit and intent signals, while maintaining a consistent follow-up cadence.`,
      tasks: [
        {
          title: "Define Ideal Customer Profile",
          description: "Create a detailed profile of ideal customers based on the provided goals and target market.",
          priority: "high",
        },
        {
          title: "Set Up Lead Scoring System",
          description: "Implement a scoring system to prioritize leads based on fit and engagement metrics.",
          priority: "high",
        },
        {
          title: "Develop Outreach Templates",
          description: "Create customizable templates for different outreach channels and customer segments.",
          priority: "medium",
        },
        {
          title: "Configure CRM Integration",
          description: "Set up integration with your CRM system to track leads and activities.",
          priority: "medium",
        },
      ],
      dependencies: [
        {
          title: "CRM API Access",
          description: "Ensure the agent has proper access to your CRM system API for lead management.",
          type: "technical",
        },
        {
          title: "Sales Team Alignment",
          description: "Align with the sales team on lead qualification criteria and handoff process.",
          type: "organizational",
        },
      ],
    },
    "marketing-content-manager": {
      strategy: `${agentName} will focus on creating and managing marketing content by implementing a content calendar approach with audience-focused topics. The agent will prioritize content based on marketing goals and audience needs, while maintaining brand voice consistency.`,
      tasks: [
        {
          title: "Develop Content Strategy",
          description: "Create a comprehensive content strategy aligned with marketing goals and audience needs.",
          priority: "high",
        },
        {
          title: "Set Up Content Calendar",
          description: "Implement a content calendar with planned topics, formats, and publication dates.",
          priority: "high",
        },
        {
          title: "Create Brand Voice Guidelines",
          description: "Document brand voice and style guidelines to ensure content consistency.",
          priority: "medium",
        },
        {
          title: "Configure Analytics Tracking",
          description: "Set up systems to track content performance across different channels.",
          priority: "medium",
        },
      ],
      dependencies: [
        {
          title: "Content Management System Access",
          description: "Ensure the agent has proper access to your CMS for content publishing.",
          type: "technical",
        },
        {
          title: "Brand Assets Access",
          description: "Provide access to brand assets, logos, and design elements for content creation.",
          type: "resource",
        },
      ],
    },
    "customer-support-agent": {
      strategy: `${agentName} will focus on providing exceptional customer support by implementing a knowledge-based approach to query resolution. The agent will prioritize issues based on severity and customer impact, while maintaining high satisfaction levels.`,
      tasks: [
        {
          title: "Build Knowledge Base",
          description: "Compile a comprehensive knowledge base of common issues and their resolutions.",
          priority: "high",
        },
        {
          title: "Set Up Response Templates",
          description: "Create customizable templates for different types of customer queries.",
          priority: "high",
        },
        {
          title: "Implement Escalation Workflow",
          description: "Define clear escalation paths for complex issues that require human intervention.",
          priority: "medium",
        },
        {
          title: "Configure Satisfaction Tracking",
          description: "Set up systems to track customer satisfaction with support interactions.",
          priority: "medium",
        },
      ],
      dependencies: [
        {
          title: "Support Ticket System Access",
          description: "Ensure the agent has proper access to your support ticket system.",
          type: "technical",
        },
        {
          title: "Support Team Alignment",
          description: "Align with the support team on escalation criteria and handoff process.",
          type: "organizational",
        },
      ],
    },
  }

  // Return template-specific plan or default plan
  return templatePlans[templateSlug] || basePlan
}
