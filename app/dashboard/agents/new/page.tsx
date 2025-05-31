import { Suspense } from "react"
import type { Metadata } from "next"
import AgentTemplateSelector from "@/components/agent-template-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Create New Agent - AgentFlow",
}

export default function NewAgentPage() {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Create New Agent</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Choose from our pre-built templates or create a custom agent from scratch.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading...
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#007AFF]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <AgentTemplateSelector />
        </Suspense>
      </div>
    </div>
  )
}
