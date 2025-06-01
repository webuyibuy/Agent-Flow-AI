"use client"

import type React from "react"

import { useState, useActionState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { createAgentWithWorkflow } from "@/app/dashboard/agents/new/actions"
import {
  Bot,
  Target,
  Settings,
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Lightbulb,
  Users,
  Briefcase,
  Code,
  MessageSquare,
  AlertTriangle,
} from "lucide-react"

interface AgentCreationWizardProps {
  userId: string
}

interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  defaultGoal: string
  defaultBehavior: string
  suggestedTasks: string[]
}

const agentTemplates: AgentTemplate[] = [
  {
    id: "sales",
    name: "Sales Assistant",
    description: "Generate leads, follow up with prospects, and manage sales pipeline",
    icon: <Users className="h-6 w-6" />,
    category: "Business",
    defaultGoal: "Generate 20 qualified leads per week and maintain a 15% conversion rate",
    defaultBehavior:
      "Proactively research prospects, send personalized outreach messages, follow up consistently, and schedule demos for qualified leads. Focus on understanding customer pain points and presenting solutions.",
    suggestedTasks: [
      "Research potential customers in target market",
      "Send personalized LinkedIn connection requests",
      "Follow up with email sequences",
      "Schedule and prepare for demo calls",
      "Update CRM with prospect information",
    ],
  },
  {
    id: "marketing",
    name: "Marketing Manager",
    description: "Create content, manage social media, and run marketing campaigns",
    icon: <MessageSquare className="h-6 w-6" />,
    category: "Business",
    defaultGoal: "Increase brand awareness by 25% and generate 100 marketing qualified leads monthly",
    defaultBehavior:
      "Create engaging content for social media, blog posts, and email campaigns. Monitor brand mentions, engage with audience, and analyze campaign performance. Focus on data-driven marketing strategies.",
    suggestedTasks: [
      "Create weekly social media content calendar",
      "Write and publish blog posts",
      "Monitor brand mentions and respond",
      "Analyze campaign performance metrics",
      "Research trending topics in industry",
    ],
  },
  {
    id: "developer",
    name: "Development Assistant",
    description: "Code review, documentation, testing, and development workflow automation",
    icon: <Code className="h-6 w-6" />,
    category: "Technical",
    defaultGoal: "Improve code quality by 30% and reduce deployment time by 50%",
    defaultBehavior:
      "Review code for best practices, maintain documentation, automate testing workflows, and monitor deployment pipelines. Focus on code quality, security, and performance optimization.",
    suggestedTasks: [
      "Review pull requests for code quality",
      "Update technical documentation",
      "Run automated test suites",
      "Monitor deployment status",
      "Identify and fix security vulnerabilities",
    ],
  },
  {
    id: "support",
    name: "Customer Support",
    description: "Handle customer inquiries, resolve issues, and improve satisfaction",
    icon: <Briefcase className="h-6 w-6" />,
    category: "Business",
    defaultGoal: "Maintain 95% customer satisfaction and resolve 80% of tickets within 24 hours",
    defaultBehavior:
      "Respond to customer inquiries promptly, escalate complex issues appropriately, maintain knowledge base, and track customer satisfaction metrics. Focus on providing helpful and empathetic support.",
    suggestedTasks: [
      "Respond to customer support tickets",
      "Update knowledge base articles",
      "Escalate complex technical issues",
      "Follow up on resolved tickets",
      "Analyze support metrics and trends",
    ],
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Create a completely custom agent tailored to your specific needs",
    icon: <Bot className="h-6 w-6" />,
    category: "Custom",
    defaultGoal: "Define your specific goals and objectives",
    defaultBehavior: "Customize the agent's behavior to match your requirements",
    suggestedTasks: ["Define your custom tasks and workflows"],
  },
]

export default function AgentCreationWizard({ userId }: AgentCreationWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [agentData, setAgentData] = useState({
    name: "",
    goal: "",
    behavior: "",
    priority: "medium" as "low" | "medium" | "high",
  })

  const [createState, createAction, isCreating] = useActionState(createAgentWithWorkflow, undefined)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template)
    setAgentData({
      name: template.name,
      goal: template.defaultGoal,
      behavior: template.defaultBehavior,
      priority: "medium",
    })
    setCurrentStep(2)
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreate = () => {
    if (!selectedTemplate || !agentData.name || !agentData.goal) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before creating the agent.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("templateId", selectedTemplate.id)
    formData.append("name", agentData.name)
    formData.append("goal", agentData.goal)
    formData.append("behavior", agentData.behavior)
    formData.append("priority", agentData.priority)
    formData.append("suggestedTasks", JSON.stringify(selectedTemplate.suggestedTasks))

    createAction(formData)
  }

  // Handle successful creation
  if (createState?.success && createState?.agentId) {
    toast({
      title: "Agent Created Successfully!",
      description: "Your agent is now active and ready to start working.",
    })
    router.push(`/dashboard/agents/${createState.agentId}?created=true`)
    return null
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Bot className="mx-auto h-12 w-12 text-[#007AFF] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Choose Agent Type</h2>
              <p className="text-gray-600 mt-2">Select a template that best matches your needs</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {agentTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-[#007AFF] bg-blue-50" : ""
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#007AFF]/10 rounded-lg">{template.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-[#007AFF] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Configure Your Agent</h2>
              <p className="text-gray-600 mt-2">Customize the agent's name and primary objective</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="agentName" className="text-base font-medium">
                  Agent Name *
                </Label>
                <Input
                  id="agentName"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                  placeholder="e.g., My Sales Assistant"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="agentGoal" className="text-base font-medium">
                  Primary Goal *
                </Label>
                <Textarea
                  id="agentGoal"
                  value={agentData.goal}
                  onChange={(e) => setAgentData({ ...agentData, goal: e.target.value })}
                  placeholder="What should this agent accomplish?"
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-sm text-gray-500 mt-1">Be specific about what you want the agent to achieve</p>
              </div>

              <div>
                <Label htmlFor="priority" className="text-base font-medium">
                  Priority Level
                </Label>
                <select
                  id="priority"
                  value={agentData.priority}
                  onChange={(e) => setAgentData({ ...agentData, priority: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-[#007AFF] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Define Behavior</h2>
              <p className="text-gray-600 mt-2">Specify how your agent should operate and make decisions</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="agentBehavior" className="text-base font-medium">
                  Agent Behavior & Instructions
                </Label>
                <Textarea
                  id="agentBehavior"
                  value={agentData.behavior}
                  onChange={(e) => setAgentData({ ...agentData, behavior: e.target.value })}
                  placeholder="Describe how the agent should behave, its personality, and specific instructions..."
                  className="mt-1 min-h-[150px]"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include personality traits, communication style, and specific guidelines
                </p>
              </div>

              {selectedTemplate && selectedTemplate.suggestedTasks.length > 0 && (
                <div>
                  <Label className="text-base font-medium">Suggested Initial Tasks</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTemplate.suggestedTasks.map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{task}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    These tasks will be automatically created when your agent starts working
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="mx-auto h-12 w-12 text-[#007AFF] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Review & Launch</h2>
              <p className="text-gray-600 mt-2">Review your agent configuration and launch it</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedTemplate?.icon}
                  {agentData.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Template</Label>
                  <p className="text-sm">{selectedTemplate?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Primary Goal</Label>
                  <p className="text-sm">{agentData.goal}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Priority</Label>
                  <Badge variant="outline" className="capitalize">
                    {agentData.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Behavior</Label>
                  <p className="text-sm line-clamp-3">{agentData.behavior}</p>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription>
                Your agent will be created and automatically start working on initial tasks. You'll be able to monitor
                its progress and handle any dependencies that require your input.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Step {currentStep} of {totalSteps}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Error Display */}
      {createState?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Creation Failed</AlertTitle>
          <AlertDescription>{createState.error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedTemplate}
              className="bg-[#007AFF] hover:bg-[#0056b3]"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !agentData.name || !agentData.goal}
              className="bg-[#007AFF] hover:bg-[#0056b3]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Create & Launch Agent
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
