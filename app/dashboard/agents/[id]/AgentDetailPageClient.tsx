"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentControlPanel } from "@/components/agent-control-panel"
import { useToast } from "@/hooks/use-toast"

// Import existing components and types
import TaskCard from "@/components/TaskCard"
import { toggleAgentStatus, triggerAgentExecution } from "./execution-actions"

interface AgentDetailPageClientProps {
  agent: {
    id: string
    name: string | null
    goal: string | null
    status: string | null
    metadata?: any
  }
  tasksData: Array<{
    id: string
    title: string | null
    status: string | null
    is_dependency: boolean | null
    blocked_reason: string | null
  }>
  agentId: string
}

export default function AgentDetailPageClient({ agent, tasksData, agentId }: AgentDetailPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("tasks")
  const [isAgentActive, setIsAgentActive] = useState(agent.status === "active")

  // Handle agent status toggle
  const handleToggleStatus = async (newStatus: "active" | "paused") => {
    try {
      const result = await toggleAgentStatus(agentId, agent.status || "paused")
      if (result.success) {
        setIsAgentActive(newStatus === "active")
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error toggling agent status:", error)
      toast({
        title: "Status Update Failed",
        description: "Could not update agent status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle agent restart
  const handleRestartExecution = async () => {
    try {
      const result = await triggerAgentExecution(agentId)
      if (result.success) {
        toast({
          title: "Agent Execution Started",
          description: "The agent has started working on tasks.",
          variant: "default",
        })
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error restarting agent:", error)
      toast({
        title: "Execution Failed",
        description: "Could not restart agent execution. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Group tasks by status
  const todoTasks = tasksData.filter((task) => task.status === "todo")
  const inProgressTasks = tasksData.filter((task) => task.status === "in_progress")
  const doneTasks = tasksData.filter((task) => task.status === "done")
  const blockedTasks = tasksData.filter((task) => task.status === "blocked")
  const dependencyTasks = tasksData.filter((task) => task.is_dependency === true)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{agent.name || "Unnamed Agent"}</CardTitle>
              <p className="text-sm text-gray-500">{agent.goal || "No goal specified"}</p>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="tasks">Tasks ({tasksData.length})</TabsTrigger>
                  <TabsTrigger value="dependencies">Dependencies ({dependencyTasks.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({doneTasks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                  <div className="space-y-4">
                    {inProgressTasks.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">In Progress</h3>
                        {inProgressTasks.map((task) => (
                          <TaskCard key={task.id} task={task} agentId={agentId} />
                        ))}
                      </div>
                    )}

                    {todoTasks.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">To Do</h3>
                        {todoTasks.map((task) => (
                          <TaskCard key={task.id} task={task} agentId={agentId} />
                        ))}
                      </div>
                    )}

                    {blockedTasks.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Blocked</h3>
                        {blockedTasks.map((task) => (
                          <TaskCard key={task.id} task={task} agentId={agentId} />
                        ))}
                      </div>
                    )}

                    {todoTasks.length === 0 && inProgressTasks.length === 0 && blockedTasks.length === 0 && (
                      <p className="text-sm text-gray-500">No active tasks found.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="dependencies">
                  <div className="space-y-4">
                    {dependencyTasks.length > 0 ? (
                      dependencyTasks.map((task) => <TaskCard key={task.id} task={task} agentId={agentId} />)
                    ) : (
                      <p className="text-sm text-gray-500">No dependencies found.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="completed">
                  <div className="space-y-4">
                    {doneTasks.length > 0 ? (
                      doneTasks.map((task) => <TaskCard key={task.id} task={task} agentId={agentId} />)
                    ) : (
                      <p className="text-sm text-gray-500">No completed tasks found.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AgentControlPanel
            agentId={agentId}
            agentName={agent.name || "Agent"}
            initialStatus={agent.status || "paused"}
            onToggleStatus={handleToggleStatus}
            onRestartExecution={handleRestartExecution}
          />

          {/* Other sidebar components like agent details, etc. */}
        </div>
      </div>
    </div>
  )
}
