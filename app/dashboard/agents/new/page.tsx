import { Suspense } from "react"
import type { Metadata } from "next"
import { getDefaultUserId } from "@/lib/default-user"
import { redirect } from "next/navigation"
import SimpleAgentCreator from "@/components/simple-agent-creator"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Create Agent - AgentFlow",
}

export default async function NewAgentPage() {
  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Create Your AI Agent</h1>
        <p className="mt-2 text-gray-600">
          Tell your agent what you want to achieve, and it will start working immediately
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p>Loading agent creator...</p>
            </CardContent>
          </Card>
        }
      >
        <SimpleAgentCreator userId={userId} />
      </Suspense>
    </div>
  )
}
