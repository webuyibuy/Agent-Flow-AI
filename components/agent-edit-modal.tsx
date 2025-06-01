"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { updateAgent } from "@/app/dashboard/agents/[id]/edit-actions"
import { useToast } from "@/hooks/use-toast"

export interface Agent {
  id: string
  name: string
  description: string
  goal: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  template_id?: string | null
  template_name?: string | null
  config?: any
}

interface AgentEditModalProps {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentUpdated?: () => void
}

export function AgentEditModal({ agent, open, onOpenChange, onAgentUpdated }: AgentEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Agent>>(agent || {})
  const { toast } = useToast()

  // Reset form when agent changes
  useState(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        goal: agent.goal,
      })
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent?.id) return

    setIsSubmitting(true)
    try {
      const result = await updateAgent(agent.id, {
        name: formData.name || "",
        description: formData.description || "",
        goal: formData.goal || "",
      })

      if (result.success) {
        toast({
          title: "Agent updated",
          description: "The agent has been successfully updated.",
        })
        onAgentUpdated?.()
        onOpenChange(false)
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update agent. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Update your agent's details. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Agent name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Describe what this agent does"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal">Goal</Label>
              <Textarea
                id="goal"
                name="goal"
                value={formData.goal || ""}
                onChange={handleChange}
                placeholder="What is this agent trying to achieve?"
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
