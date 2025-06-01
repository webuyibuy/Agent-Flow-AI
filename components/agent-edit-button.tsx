"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { AgentEditModal, type Agent } from "@/components/agent-edit-modal"

interface AgentEditButtonProps {
  agent: Agent
  onAgentUpdated?: () => void
}

export function AgentEditButton({ agent, onAgentUpdated }: AgentEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Agent
      </Button>

      <AgentEditModal agent={agent} open={isModalOpen} onOpenChange={setIsModalOpen} onAgentUpdated={onAgentUpdated} />
    </>
  )
}
