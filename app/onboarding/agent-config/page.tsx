import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import AgentChatSetup from "@/components/agent-chat-setup"

interface PageProps {
  searchParams: {
    template?: string
    name?: string
  }
}

export default async function AgentConfigPage({ searchParams }: PageProps) {
  // Get template from query params
  const templateSlug = searchParams.template || "custom-agent"
  const templateName = searchParams.name || "Custom Agent"

  // Get user session
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?callbackUrl=/onboarding/agent-config")
  }

  return (
    <div className="container max-w-5xl py-8 md:py-12">
      <AgentChatSetup templateSlug={templateSlug} templateName={templateName} userId={session.user.id} />
    </div>
  )
}
