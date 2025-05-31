"use client"

import { useActionState, useEffect, useState } from "react"
import { deployAgent, type DeployAgentState } from "@/app/onboarding/review-deploy/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Rocket, Terminal, Info, Loader2 } from "lucide-react"

interface AgentData {
  agentName: string
  agentGoal: string
  agentBehavior?: string
  templateSlug: string
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return undefined
}

export default function ReviewDeployClient() {
  const [agentData, setAgentData] = useState<AgentData | null>(null)
  const [isLoadingCookie, setIsLoadingCookie] = useState(true)
  const [cookieError, setCookieError] = useState<string | null>(null)

  const initialState: DeployAgentState = {}
  const [state, formAction, isPending] = useActionState(deployAgent, initialState)

  useEffect(() => {
    const cookieValue = getCookie("onboarding_agent_data")
    if (cookieValue) {
      try {
        const parsedData = JSON.parse(cookieValue)
        setAgentData(parsedData)
      } catch (error) {
        console.error("Failed to parse agent data from cookie:", error)
        setCookieError("Could not load your agent configuration. Please try configuring again.")
      }
    } else {
      setCookieError("Agent configuration not found. You might need to start the configuration process again.")
    }
    setIsLoadingCookie(false)
  }, [])

  if (isLoadingCookie) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#007AFF] mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading your agent details...</p>
      </div>
    )
  }

  if (cookieError || !agentData) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Configuration Error</AlertTitle>
        <AlertDescription>
          {cookieError || "Something went wrong."}
          <Button
            variant="link"
            onClick={() => (window.location.href = "/onboarding/agent-config")}
            className="p-0 h-auto ml-1"
          >
            Return to Configuration
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const templateDisplayNames: Record<string, string> = {
    sales: "Sales Agent",
    marketing: "Marketing Agent",
    dev: "Developer Agent",
    hr: "HR Agent",
    custom: "Custom Agent",
  }
  const agentTypeDisplay = templateDisplayNames[agentData.templateSlug] || "Agent"

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <Rocket className="mx-auto h-12 w-12 text-[#007AFF]" />
        <CardTitle className="mt-4 text-2xl">Review & Deploy Your Agent</CardTitle>
        <CardDescription>Almost there! Please confirm the details below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Name</h3>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{agentData.agentName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Type</h3>
          <p className="text-lg text-gray-800 dark:text-gray-200">{agentTypeDisplay}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Goal</h3>
          <p className="text-lg text-gray-800 dark:text-gray-200">{agentData.agentGoal}</p>
        </div>
        {agentData.agentBehavior && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Behavior / Instructions</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{agentData.agentBehavior}</p>
          </div>
        )}

        <div className="flex items-start space-x-2 rounded-md bg-blue-50 dark:bg-blue-900/30 p-3 text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>
            Upon deployment, your agent will be activated and initial tasks will be generated based on its
            configuration. You'll be redirected to your dashboard.
          </p>
        </div>

        {state?.error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Deployment Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.message &&
          state.success && ( // Should not be visible due to redirect
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4 !text-green-700" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
      </CardContent>
      <CardFooter>
        <form action={formAction} className="w-full">
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 flex items-center justify-center gap-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Deploying Agent...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Deploy Agent
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
