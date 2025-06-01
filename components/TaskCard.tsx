"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle, CheckCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  blocked_reason?: string
  is_dependency?: boolean
  requires_approval?: boolean
  auto_generated?: boolean
  estimated_hours?: number
  metadata?: any
  created_at: string
  agents?: {
    name: string
  }
}

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "blocked":
        return "bg-red-50 border-red-200 text-red-700"
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-700"
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-700"
      case "done":
        return "bg-green-50 border-green-200 text-green-700"
      default:
        return "bg-gray-50 border-gray-200 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", getStatusColor(task.status))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">{task.title}</CardTitle>
            {task.agents?.name && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {task.agents.name}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2 ml-3">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {task.priority || "Medium"}
            </Badge>
            {task.is_dependency && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                Dependency
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Description from metadata */}
          {task.metadata?.description && (
            <p className="text-sm text-gray-600 line-clamp-3">{task.metadata.description}</p>
          )}

          {/* Blocked reason */}
          {task.blocked_reason && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{task.blocked_reason}</p>
            </div>
          )}

          {/* Task details */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {task.estimated_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimated_hours}h</span>
                </div>
              )}
              <span>Created {formatDate(task.created_at)}</span>
            </div>

            {task.auto_generated && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                AI Generated
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {task.requires_approval && (
              <Button size="sm" variant="outline" className="flex-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            <Button size="sm" variant="ghost" className="flex-1">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
