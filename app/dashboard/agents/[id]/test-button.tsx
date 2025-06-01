"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { triggerAgentExecution } from "./execution-actions"

interface TestButtonProps {
  agentId: string
}

export function TestButton({ agentId }: TestButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTestExecution = async () => {
    setIsLoading(true)
    try {
      const result = await triggerAgentExecution(agentId)

      if (result.success) {
        toast({
          title: "Test Successful",
          description: result.message || "Agent execution test completed successfully.",
          variant: "default",
        })
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Agent execution test failed.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error testing agent execution:", error)
      toast({
        title: "Test Failed",
        description: "An unexpected error occurred while testing agent execution.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleTestExecution} disabled={isLoading} size="sm">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Test Execution
        </>
      )}
    </Button>
  )
}
