import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AgentConfigForm from "@/components/agent-config-form"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configure Agent - AgentFlow",
}

interface PageProps {
  searchParams: {
    template?: string
  }
}

const templateDisplayNames: Record<string, string> = {
  sales: "Sales Agent",
  marketing: "Marketing Agent",
  dev: "Developer Agent",
  hr: "HR Agent",
  custom: "Custom Agent",
}

async function AuthAndProfileCheck() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile for agent config:", profileError)
    redirect("/login?message=Error fetching profile")
  }

  if (!profile?.display_name) {
    redirect("/onboarding/name")
  }
  // Could add a check for goal primer step completion if state was persisted
  return null // Return null or user data if needed by the form, but form is client
}

export default async function OnboardingAgentConfigPage({ searchParams }: PageProps) {
  const templateSlug = searchParams.template || "custom" // Default to custom if no template specified
  const templateName = templateDisplayNames[templateSlug] || "Agent"

  await AuthAndProfileCheck() // Ensure user is authenticated and basic profile is set up

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <Suspense
        fallback={
          <div className="text-center">
            <p>Loading configuration...</p>
          </div>
        }
      >
        <AgentConfigForm templateSlug={templateSlug} templateName={templateName} />
      </Suspense>
    </div>
  )
}
