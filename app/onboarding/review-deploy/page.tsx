import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ReviewDeployClient from "@/components/review-deploy-client"
import { getDefaultUserId } from "@/lib/default-user"

export default async function ReviewDeployPage() {
  const supabase = getSupabaseFromServer()

  // Get the user ID
  let userId: string
  try {
    userId = await getDefaultUserId()
  } catch (error) {
    redirect("/login")
  }

  // Get the agent configuration from session storage
  const { data: sessionData } = await supabase.auth.getSession()
  const agentConfig = sessionData.session?.user?.user_metadata?.onboarding_agent_config

  // If no agent config is found, redirect to the agent config page
  if (!agentConfig) {
    redirect("/onboarding/agent-config")
  }

  // Ensure the user ID is included in the agent data
  const agentData = {
    ...agentConfig,
    userId,
  }

  return <ReviewDeployClient agentData={agentData} />
}
