"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight, Sparkles } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
  optional?: boolean
}

interface EnhancedOnboardingFlowProps {
  currentStep?: number
  onStepComplete?: (stepId: string) => void
  onComplete?: () => void
}

export default function EnhancedOnboardingFlow({
  currentStep = 0,
  onStepComplete,
  onComplete,
}: EnhancedOnboardingFlowProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "welcome",
      title: "Welcome to AgentFlow",
      description: "Get started with your AI-powered workflow automation",
      completed: false,
      current: true,
    },
    {
      id: "profile",
      title: "Set Up Your Profile",
      description: "Tell us about yourself and your goals",
      completed: false,
      current: false,
    },
    {
      id: "first-agent",
      title: "Create Your First Agent",
      description: "Build an AI agent to help with your tasks",
      completed: false,
      current: false,
    },
    {
      id: "configure",
      title: "Configure Agent Settings",
      description: "Customize your agent's behavior and capabilities",
      completed: false,
      current: false,
    },
    {
      id: "test",
      title: "Test Your Agent",
      description: "Run a test to see your agent in action",
      completed: false,
      current: false,
      optional: true,
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "Start using AgentFlow to automate your workflows",
      completed: false,
      current: false,
    },
  ])

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const completedSteps = steps.filter((step) => step.completed).length
    const totalSteps = steps.length
    setProgress((completedSteps / totalSteps) * 100)
  }, [steps])

  const handleStepClick = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        current: step.id === stepId,
      })),
    )

    if (onStepComplete) {
      onStepComplete(stepId)
    }
  }

  const handleStepComplete = (stepId: string) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))

    // Move to next step
    const currentIndex = steps.findIndex((step) => step.id === stepId)
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1]
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          current: step.id === nextStep.id,
        })),
      )
    } else {
      // All steps completed
      if (onComplete) {
        onComplete()
      }
    }
  }

  const currentStepData = steps.find((step) => step.current)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Welcome to AgentFlow</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let's get you set up with your first AI agent. This should only take a few minutes.
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Steps List */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
            <CardDescription>Follow these steps to get started with AgentFlow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  step.current
                    ? "bg-blue-50 border border-blue-200"
                    : step.completed
                      ? "bg-green-50 border border-green-200"
                      : "hover:bg-gray-50"
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                <div className="flex-shrink-0">
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className={`h-5 w-5 ${step.current ? "text-blue-600" : "text-gray-400"}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${step.current ? "text-blue-900" : "text-gray-900"}`}>{step.title}</p>
                    {step.optional && (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {step.current && <ArrowRight className="h-4 w-4 text-blue-600" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStepData?.title}
              {currentStepData?.current && <Badge variant="default">Current</Badge>}
            </CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStepData?.id === "welcome" && (
              <div className="space-y-4">
                <p>Welcome to AgentFlow! We're excited to help you automate your workflows with AI agents.</p>
                <p>In the next few steps, we'll help you:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Set up your profile and preferences</li>
                  <li>Create your first AI agent</li>
                  <li>Configure the agent for your specific needs</li>
                  <li>Test everything to make sure it works perfectly</li>
                </ul>
                <Button onClick={() => handleStepComplete("welcome")} className="w-full">
                  Get Started
                </Button>
              </div>
            )}

            {currentStepData?.id === "profile" && (
              <div className="space-y-4">
                <p>Let's set up your profile so we can personalize your experience.</p>
                <Button onClick={() => handleStepComplete("profile")} className="w-full">
                  Set Up Profile
                </Button>
              </div>
            )}

            {currentStepData?.id === "first-agent" && (
              <div className="space-y-4">
                <p>Now let's create your first AI agent. This agent will help automate tasks and workflows.</p>
                <Button onClick={() => handleStepComplete("first-agent")} className="w-full">
                  Create Agent
                </Button>
              </div>
            )}

            {currentStepData?.id === "configure" && (
              <div className="space-y-4">
                <p>Configure your agent's behavior, goals, and capabilities to match your needs.</p>
                <Button onClick={() => handleStepComplete("configure")} className="w-full">
                  Configure Agent
                </Button>
              </div>
            )}

            {currentStepData?.id === "test" && (
              <div className="space-y-4">
                <p>Test your agent to make sure everything is working correctly.</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleStepComplete("test")} className="flex-1">
                    Run Test
                  </Button>
                  <Button variant="outline" onClick={() => handleStepComplete("test")} className="flex-1">
                    Skip Test
                  </Button>
                </div>
              </div>
            )}

            {currentStepData?.id === "complete" && (
              <div className="space-y-4 text-center">
                <div className="text-6xl">🎉</div>
                <p className="text-lg font-medium">Congratulations!</p>
                <p>Your AgentFlow setup is complete. You're ready to start automating your workflows.</p>
                <Button onClick={() => onComplete?.()} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
