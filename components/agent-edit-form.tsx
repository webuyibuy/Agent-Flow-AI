"use client"

import { useActionState, useState } from "react"
import { updateAgent, type AgentEditState } from "@/app/dashboard/agents/[id]/edit-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Loader2, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AgentEditFormProps {
  agentId: string
  currentName: string
  currentGoal: string
  currentBehavior?: string | null
  currentParentAgentId?: string | null
  userAgents: { id: string; name: string | null }[] // New prop for parent agent options
  onSuccess?: () => void
  onCancel?: () => void
}

export default function AgentEditForm({
  agentId,
  currentName,
  currentGoal,
  currentBehavior,
  currentParentAgentId,
  userAgents,
  onSuccess,
  onCancel,
}: AgentEditFormProps) {
  const [name, setName] = useState(currentName)
  const [goal, setGoal] = useState(currentGoal)
  const [behavior, setBehavior] = useState(currentBehavior || "")
  const [parentAgentId, setParentAgentId] = useState<string | null>(currentParentAgentId || null)

  const initialState: AgentEditState = {}
  const [state, formAction, isPending] = useActionState(
    (prevState: AgentEditState | undefined, formData: FormData) => updateAgent(agentId, prevState, formData),
    initialState,
  )

  // Call onSuccess when update is successful
  if (state?.success && onSuccess) {
    onSuccess()
  }

  return (
    <div className="space-y-6">
      {state?.success && (
        <Alert className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300">
          <CheckCircle className="h-4 w-4 !text-green-700 dark:!text-green-300" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state?.errors?._form && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Update Failed</AlertTitle>
          <AlertDescription>{state.errors._form.join(", ")}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name" className="font-medium text-gray-700 dark:text-gray-300">
            Agent Name
          </Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Sales Assistant"
            required
            minLength={3}
            maxLength={50}
            className="mt-1"
            aria-describedby="name-error"
          />
          {state?.errors?.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600">
              {state.errors.name.join(", ")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="goal" className="font-medium text-gray-700 dark:text-gray-300">
            Primary Goal
          </Label>
          <Textarea
            id="goal"
            name="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What is the main objective for this agent?"
            required
            minLength={10}
            maxLength={500}
            className="mt-1 min-h-[100px]"
            aria-describedby="goal-error"
          />
          {state?.errors?.goal && (
            <p id="goal-error" className="mt-1 text-sm text-red-600">
              {state.errors.goal.join(", ")}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="behavior" className="font-medium text-gray-700 dark:text-gray-300">
            Behavior / Instructions (Optional)
          </Label>
          <Textarea
            id="behavior"
            name="behavior"
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            placeholder="Describe how the agent should operate, its personality, specific tasks, or constraints."
            maxLength={1000}
            className="mt-1 min-h-[120px]"
            aria-describedby="behavior-error"
          />
          {state?.errors?.behavior && (
            <p id="behavior-error" className="mt-1 text-sm text-red-600">
              {state.errors.behavior.join(", ")}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Additional instructions to customize your agent's behavior.
          </p>
        </div>

        <div>
          <Label htmlFor="parent_agent_id" className="font-medium text-gray-700 dark:text-gray-300">
            Parent Agent (Optional)
          </Label>
          <Select
            name="parent_agent_id"
            value={parentAgentId || "none"} // Use "none" for null/no selection
            onValueChange={(value) => setParentAgentId(value === "none" ? null : value)}
            disabled={isPending}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select a parent agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parent</SelectItem> {/* Option to clear parent */}
              {userAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.parent_agent_id && (
            <p id="parent-agent-error" className="mt-1 text-sm text-red-600">
              {state.errors.parent_agent_id.join(", ")}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Link this agent to a parent for hierarchical organization.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isPending} className="bg-[#007AFF] hover:bg-[#0056b3] text-white">
            {isPending ? (
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
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
