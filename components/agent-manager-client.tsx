"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusCircle, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AgentSelectionCard, { type Agent } from "./agent-selection-card"
import { clearSelectedAgentCookie } from "@/app/dashboard/agents/manage/actions"
import { toast } from "@/hooks/use-toast"

interface AgentManagerClientProps {
  agents: Agent[]
  selectedAgentId: string | null
}

export default function AgentManagerClient({
  agents,
  selectedAgentId: initialSelectedAgentId,
}: AgentManagerClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isClearing, setIsClearing] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState(initialSelectedAgentId)

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.goal?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleClearSelection = async () => {
    setIsClearing(true)
    try {
      await clearSelectedAgentCookie()
      setSelectedAgentId(null) // Update local state immediately
      toast({
        title: "Selection Cleared",
        description: "Your active agent selection has been cleared.",
      })
    } catch (error) {
      console.error("Failed to clear selected agent:", error)
      toast({
        title: "Error",
        description: "Failed to clear agent selection.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Manage Your Agents</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Create new agents or select an active agent for your session.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {selectedAgentId && (
              <Button
                variant="outline"
                onClick={handleClearSelection}
                disabled={isClearing}
                className="w-full sm:w-auto"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Clearing...
                  </>
                ) : (
                  "Clear Active Selection"
                )}
              </Button>
            )}
            <Button asChild className="bg-[#007AFF] hover:bg-[#0056b3] text-white w-full sm:w-auto">
              <Link href="/dashboard/agents/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Agent
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Label htmlFor="agent-search" className="sr-only">
            Search Agents
          </Label>
          <Input
            id="agent-search"
            type="text"
            placeholder="Search agents by name or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAgents.map((agent) => (
              <AgentSelectionCard key={agent.id} agent={agent} isSelected={agent.id === selectedAgentId} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Zap className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery ? "No Agents Match Your Search" : "No Agents Created Yet"}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 px-4">
              {searchQuery ? "Try adjusting your search criteria." : "Create your first agent to get started!"}
            </p>
            <Button asChild size="lg" className="bg-[#007AFF] hover:bg-[#0056b3] text-white">
              <Link href="/dashboard/agents/new">
                <PlusCircle className="mr-2 h-4 w-4 sm:h-5 w-5" />
                Create New Agent
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
