"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Clock, Target, Zap } from "lucide-react"

interface AgentWorkingIndicatorProps {
  agentId: string
  agentName: string
  workingStatus?: {
    currentFocus: string
    nextMilestone: string
    progressIndicator: string
  }
}

export function AgentWorkingIndicator({ agentId, agentName, workingStatus }: AgentWorkingIndicatorProps) {
  const [progress, setProgress] = useState(0)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5
        return newProgress > 100 ? 20 : newProgress // Reset to 20% when reaching 100%
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (!workingStatus) {
    return null
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Activity className={`h-5 w-5 text-blue-600 dark:text-blue-400 ${isActive ? "animate-pulse" : ""}`} />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{agentName} is Working</h4>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
              >
                <Zap className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Target className="h-4 w-4" />
                <span className="font-medium">Current Focus:</span>
                <span>{workingStatus.currentFocus}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Next Milestone:</span>
                <span>{workingStatus.nextMilestone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{workingStatus.progressIndicator}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
