"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Lightbulb, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ThinkingStep {
  id: string
  text: string
  status: "thinking" | "complete" | "error"
  duration?: number
}

interface AgentThinkingDisplayProps {
  agentId: string
  isActive: boolean
  currentTaskId?: string
}

export function AgentThinkingDisplay({ agentId, isActive, currentTaskId }: AgentThinkingDisplayProps) {
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isThinking, setIsThinking] = useState(false)

  // Generate thinking steps based on the current task
  useEffect(() => {
    if (!isActive || !currentTaskId) {
      setThinkingSteps([])
      setIsThinking(false)
      return
    }

    // Generate thinking steps for this task
    const steps: ThinkingStep[] = [
      {
        id: "analyze",
        text: "Analyzing task requirements and context...",
        status: "thinking",
        duration: 3000,
      },
      {
        id: "research",
        text: "Researching relevant information and best practices...",
        status: "thinking",
        duration: 4000,
      },
      {
        id: "plan",
        text: "Developing approach and execution strategy...",
        status: "thinking",
        duration: 3500,
      },
      {
        id: "execute",
        text: "Executing task and processing results...",
        status: "thinking",
        duration: 5000,
      },
      {
        id: "review",
        text: "Reviewing output quality and making improvements...",
        status: "thinking",
        duration: 3000,
      },
      {
        id: "finalize",
        text: "Finalizing results and preparing next steps...",
        status: "thinking",
        duration: 2500,
      },
    ]

    setThinkingSteps(steps)
    setCurrentStepIndex(0)
    setIsThinking(true)
  }, [isActive, currentTaskId])

  // Animate through thinking steps
  useEffect(() => {
    if (!isThinking || thinkingSteps.length === 0) return

    const currentStep = thinkingSteps[currentStepIndex]
    if (!currentStep) return

    const timer = setTimeout(() => {
      // Update current step to complete
      setThinkingSteps((prev) =>
        prev.map((step, idx) => (idx === currentStepIndex ? { ...step, status: "complete" } : step)),
      )

      // Move to next step or finish
      if (currentStepIndex < thinkingSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1)
      } else {
        setIsThinking(false)
      }
    }, currentStep.duration || 3000)

    return () => clearTimeout(timer)
  }, [thinkingSteps, currentStepIndex, isThinking])

  if (!isActive || thinkingSteps.length === 0) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <Brain className="h-5 w-5 mr-2 text-amber-600" />
            Agent Thinking Process
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
          >
            {isThinking ? "Thinking..." : "Complete"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {thinkingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-2 rounded-md ${
                index === currentStepIndex && step.status === "thinking" ? "bg-amber-100/50 dark:bg-amber-900/20" : ""
              }`}
            >
              <div className="mt-0.5">
                {step.status === "thinking" && index === currentStepIndex ? (
                  <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                ) : step.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : step.status === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm ${
                    index === currentStepIndex && step.status === "thinking"
                      ? "text-amber-800 dark:text-amber-300 font-medium"
                      : step.status === "complete"
                        ? "text-gray-800 dark:text-gray-300"
                        : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.text}
                </p>
                {index === currentStepIndex && step.status === "thinking" && (
                  <div className="mt-1 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                    <p className="text-xs italic text-amber-700 dark:text-amber-400">{getThinkingInsight(step.id)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get random insights for each thinking step
function getThinkingInsight(stepId: string): string {
  const insights: Record<string, string[]> = {
    analyze: [
      "Identifying key requirements and constraints...",
      "Evaluating context and background information...",
      "Breaking down complex requirements into manageable parts...",
    ],
    research: [
      "Searching for relevant information and precedents...",
      "Evaluating multiple approaches and methodologies...",
      "Identifying best practices and industry standards...",
    ],
    plan: [
      "Developing a structured approach to the problem...",
      "Prioritizing subtasks for optimal execution...",
      "Creating contingency plans for potential challenges...",
    ],
    execute: [
      "Implementing the solution with precision...",
      "Processing data and generating insights...",
      "Applying specialized techniques to solve the problem...",
    ],
    review: [
      "Evaluating output against quality standards...",
      "Identifying areas for improvement and refinement...",
      "Validating results against requirements...",
    ],
    finalize: [
      "Preparing comprehensive documentation...",
      "Organizing findings for clear presentation...",
      "Identifying follow-up actions and next steps...",
    ],
  }

  const stepInsights = insights[stepId] || ["Processing information..."]
  return stepInsights[Math.floor(Math.random() * stepInsights.length)]
}
