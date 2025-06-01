"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Agent } from "@/lib/types"
import { AgentEditButton } from "@/components/agent-edit-button" // Import the AgentEditButton component

interface AgentDetailPageClientProps {
  initialAgent: Agent
}

const AgentDetailPageClient: React.FC<AgentDetailPageClientProps> = ({ initialAgent }) => {
  const [agent, setAgent] = useState<Agent>(initialAgent)
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch agent: ${res.status}`)
      }
      const data = await res.json()
      setAgent(data)
    } catch (error: any) {
      console.error("Error refreshing agent data:", error)
      // Optionally, display an error message to the user
    }
  }, [agentId])

  useEffect(() => {
    setAgent(initialAgent)
  }, [initialAgent])

  if (!agent) {
    return <div>Loading agent...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <div className="flex items-center gap-2">
          <AgentEditButton agent={agent} onAgentUpdated={refreshData} />
          {/* Existing buttons can be added here if needed */}
        </div>
      </div>
      <p>ID: {agent.id}</p>
      <p>Description: {agent.description}</p>
      <p>Model: {agent.model}</p>
      <p>Created At: {new Date(agent.createdAt).toLocaleDateString()}</p>
    </div>
  )
}

export default AgentDetailPageClient
