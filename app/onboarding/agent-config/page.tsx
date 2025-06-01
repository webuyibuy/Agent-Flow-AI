import { redirect } from "next/navigation"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import ModernAgentConfig from "@/components/modern-agent-config"

export default async function AgentConfigPage() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get the user's goal primer from the previous step
  const { data: goalData } = await supabase
    .from("agent_custom_data")
    .select("agent_goal")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  const goalPrimer = goalData?.agent_goal || "Create an AI agent to help with business tasks"

  return <ModernAgentConfig goalPrimer={goalPrimer} />
}
