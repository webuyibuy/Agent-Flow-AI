"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Zap, ZapOff, Play, Pause, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AgentControlPanelProps {
  agentId: string
  agentName: string
  initialStatus: "active" | "paused" | string
  onToggleStatus: (newStatus: "active" | "paused") => Promise<void>
  onRestartExecution: () => Promise<void>
}

export function AgentControlPanel({
  agentId,
  agentName,
  initialStatus,
  onToggleStatus,
  onRestartExecution,
}: AgentControlPanelProps) {
  const [status, setStatus] = useState<"active" | "paused">(initialStatus === "active" ? "active" : "paused")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const { toast } = useToast()

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      const newStatus = status === "active" ? "paused" : "active"
      await onToggleStatus(newStatus)
      setStatus(newStatus)

      toast({
        title: `Agent ${newStatus === "active" ? "Activated" : "Paused"}`,
        description: `${agentName} is now ${newStatus === "active" ? "running" : "paused"}.`,
        variant: newStatus === "active" ? "default" : "secondary",
      })
    } catch (error) {
      console.error("Error toggling agent status:", error)
      toast({
        title: "Status Update Failed",
        description: "Could not update agent status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRestart = async () => {
    setIsRestarting(true)
    try {
      await onRestartExecution()
      toast({
        title: "Agent Restarted",
        description: `${agentName} has been restarted and is now working on tasks.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error restarting agent:", error)
      toast({
        title: "Restart Failed",
        description: "Could not restart agent execution. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Agent Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status === "active" ? (
                <Zap className="h-4 w-4 text-green-500" />
              ) : (
                <ZapOff className="h-4 w-4 text-gray-500" />
              )}
              <Label htmlFor="agent-status" className="font-medium">
                Agent Status
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{status === "active" ? "Active" : "Paused"}</span>
              <Switch
                id="agent-status"
                checked={status === "active"}
                onCheckedChange={handleToggle}
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={status === "active" ? "outline" : "default"}
              size="sm"
              className="w-full"
              onClick={handleToggle}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : status === "active" ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {status === "active" ? "Pause Agent" : "Start Agent"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleRestart}
              disabled={isRestarting || status !== "active"}
            >
              {isRestarting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Restart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
