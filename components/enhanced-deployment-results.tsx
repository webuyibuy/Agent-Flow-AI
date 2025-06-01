"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CheckCircle,
  Settings,
  AlertTriangle,
  ListChecks,
  Target,
  TrendingUp,
  Brain,
  Zap,
  Clock,
  Rocket,
  BarChart3,
  Cog,
} from "lucide-react"
import type { AgentTask } from "@/lib/systematic-flow-types"

interface DeploymentStatus {
  working: string[]
  needsAttention: string[]
  dependencyTasks: AgentTask[]
}

interface EnhancedDeploymentResultsProps {
  agentId: string
  agentName: string
  agentType: "systematic" | "general" | "specialized"
  deploymentStatus: DeploymentStatus
  businessContext?: {
    industry?: string
    primaryGoal?: string
    expectedROI?: string
    timeline?: string
  }
  onGoToDependencies: () => void
  onGoToAgent: () => void
}

const EnhancedDeploymentResults: React.FC<EnhancedDeploymentResultsProps> = ({
  agentId,
  agentName,
  agentType,
  deploymentStatus,
  businessContext,
  onGoToDependencies,
  onGoToAgent,
}) => {
  const getAgentTypeInfo = () => {
    switch (agentType) {
      case "systematic":
        return {
          icon: <Brain className="h-6 w-6 text-purple-600" />,
          title: "Systematic Strategy Agent",
          description: "AI-powered strategic planning and execution agent with intelligent task generation",
          capabilities: [
            "Strategic planning and analysis",
            "Intelligent task breakdown",
            "Risk assessment and mitigation",
            "Stakeholder impact analysis",
            "ROI optimization",
          ],
          color: "purple",
        }
      case "general":
        return {
          icon: <Zap className="h-6 w-6 text-blue-600" />,
          title: "General Purpose Agent",
          description: "Versatile AI agent for general business automation and assistance",
          capabilities: [
            "General task automation",
            "Business process assistance",
            "Information processing",
            "Basic decision support",
            "Workflow optimization",
          ],
          color: "blue",
        }
      case "specialized":
        return {
          icon: <Target className="h-6 w-6 text-green-600" />,
          title: "Specialized Domain Agent",
          description: "Expert AI agent focused on specific industry or functional domain",
          capabilities: [
            "Domain-specific expertise",
            "Specialized workflows",
            "Industry best practices",
            "Compliance management",
            "Expert decision making",
          ],
          color: "green",
        }
      default:
        return {
          icon: <Cog className="h-6 w-6 text-gray-600" />,
          title: "AI Agent",
          description: "Intelligent automation agent",
          capabilities: ["Task automation", "Process optimization"],
          color: "gray",
        }
    }
  }

  const agentInfo = getAgentTypeInfo()

  const getBusinessImpactMetrics = () => {
    if (!businessContext) return null

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {businessContext.industry && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Industry</div>
            <div className="text-lg font-semibold text-gray-800">{businessContext.industry}</div>
          </div>
        )}
        {businessContext.expectedROI && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Expected ROI</div>
            <div className="text-lg font-semibold text-green-600">{businessContext.expectedROI}</div>
          </div>
        )}
        {businessContext.timeline && (
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Timeline</div>
            <div className="text-lg font-semibold text-blue-600">{businessContext.timeline}</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600">Agent ID</div>
          <div className="text-sm font-mono text-gray-800">{agentId.slice(0, 8)}...</div>
        </div>
      </div>
    )
  }

  const getPriorityTaskCount = (priority: string) => {
    return deploymentStatus.dependencyTasks.filter((task) => task.priority === priority).length
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800">🎉 Agent Deployed Successfully!</AlertTitle>
        <AlertDescription className="text-green-700">
          Your {agentInfo.title.toLowerCase()} is now active and ready to deliver business value.
        </AlertDescription>
      </Alert>

      {/* Agent Overview */}
      <Card className={`border-2 border-${agentInfo.color}-200 shadow-lg`}>
        <CardHeader className={`bg-gradient-to-r from-${agentInfo.color}-50 to-${agentInfo.color}-100 border-b`}>
          <CardTitle className="flex items-center gap-3">
            <div
              className={`w-12 h-12 bg-gradient-to-br from-${agentInfo.color}-500 to-${agentInfo.color}-600 rounded-full flex items-center justify-center`}
            >
              {agentInfo.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{agentName}</div>
              <div className="text-sm text-gray-600">{agentInfo.description}</div>
            </div>
            <Badge
              variant="secondary"
              className={`bg-${agentInfo.color}-100 text-${agentInfo.color}-800 border-${agentInfo.color}-200`}
            >
              {agentType.charAt(0).toUpperCase() + agentType.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Business Context */}
          {businessContext && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Business Impact Overview
              </h4>
              {getBusinessImpactMetrics()}
            </div>
          )}

          {/* Agent Capabilities */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Agent Capabilities
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {agentInfo.capabilities.map((capability, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{capability}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Goal */}
          {businessContext?.primaryGoal && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Primary Business Objective
              </h4>
              <p className="text-sm text-blue-700">{businessContext.primaryGoal}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* What's Working */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />✅ Operational Systems
            </CardTitle>
            <CardDescription>Components that are active and functioning properly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deploymentStatus.working.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Settings className="h-5 w-5" />🔧 Optimization Opportunities
            </CardTitle>
            <CardDescription>Areas to enhance for maximum business impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deploymentStatus.needsAttention.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-orange-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dependency Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <ListChecks className="h-5 w-5" />📋 Action Items for Optimization
          </CardTitle>
          <CardDescription>
            {deploymentStatus.dependencyTasks.length} strategic tasks have been created to maximize your agent's
            effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Task Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{getPriorityTaskCount("high")}</div>
              <div className="text-xs text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{getPriorityTaskCount("medium")}</div>
              <div className="text-xs text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getPriorityTaskCount("low")}</div>
              <div className="text-xs text-gray-600">Low Priority</div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {deploymentStatus.dependencyTasks.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm text-gray-800">{task.title}</h5>
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

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Target className="h-5 w-5" />🎯 Recommended Next Steps
          </CardTitle>
          <CardDescription>Strategic actions to maximize your agent's business impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-800">Review High-Priority Tasks</h4>
                <p className="text-xs text-gray-600">
                  Start with {getPriorityTaskCount("high")} high-priority items to unlock immediate business value
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-800">Configure Optimization Areas</h4>
                <p className="text-xs text-gray-600">
                  Address the {deploymentStatus.needsAttention.length} optimization opportunities for peak performance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-800">Monitor & Measure Impact</h4>
                <p className="text-xs text-gray-600">Track business metrics and iterate based on performance data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={onGoToDependencies} className="flex-1" size="lg">
          <ListChecks className="mr-2 h-4 w-4" />
          Manage Action Items
        </Button>
        <Button onClick={onGoToAgent} variant="outline" className="flex-1" size="lg">
          <TrendingUp className="mr-2 h-4 w-4" />
          View Agent Dashboard
        </Button>
      </div>
    </div>
  )
}

export default EnhancedDeploymentResults
