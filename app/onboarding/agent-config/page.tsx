import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import BusinessFocusedAgentFlow from "@/components/business-focused-agent-flow"

export default function AgentConfigPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const goalPrimer = typeof searchParams.goal === "string" ? searchParams.goal : ""
  const industry = typeof searchParams.industry === "string" ? searchParams.industry : undefined
  const companySize = typeof searchParams.companySize === "string" ? searchParams.companySize : undefined
  const timeline = typeof searchParams.timeline === "string" ? searchParams.timeline : undefined

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading business configuration...</span>
        </div>
      }
    >
      <BusinessFocusedAgentFlow
        initialGoal={goalPrimer}
        businessContext={{
          industry,
          companySize,
          timeline,
        }}
      />
    </Suspense>
  )
}
