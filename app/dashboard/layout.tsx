import DashboardLayoutClient from "@/components/dashboard-layout"
import type React from "react"
import { getDefaultUserId } from "@/lib/default-user"
import type { Badge as UserBadgeType } from "@/lib/gamification"

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Get the default user ID (no Supabase call)
  const defaultUserId = await getDefaultUserId()

  // Use default/mock data instead of fetching from Supabase
  const profile = { display_name: "Default User" }

  // Set default XP and badge values (no Supabase call)
  const totalXp = 0
  const currentBadge: UserBadgeType | null = null

  // Updated to use the new agent creation route
  const newAgentHref = "/dashboard/agents/new"

  return (
    <DashboardLayoutClient
      user={{ id: defaultUserId, email: "user@example.dev" }}
      profile={profile}
      totalXp={totalXp}
      currentBadge={currentBadge}
      newAgentHref={newAgentHref}
    >
      {children}
    </DashboardLayoutClient>
  )
}
