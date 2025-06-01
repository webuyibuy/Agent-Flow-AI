import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import ApiKeyManager from "@/components/api-key-manager"
import ProfileSettingsForm from "@/components/profile-settings-form"
import { Suspense } from "react"
import BadgeShowcase from "@/components/badge-showcase"
import { badges as allBadgesConfig, type Badge as UserBadgeType } from "@/lib/gamification"

export const metadata: Metadata = {
  title: "Settings - AgentFlow",
}

async function ProfileDataFetcher() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()

  return <ProfileSettingsForm email={user.email || ""} currentDisplayName={profile?.display_name || null} />
}

async function BadgeDataFetcher() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <p>User not found.</p>
  }

  try {
    // Check if xp_logs table exists, if not use xp_log
    const { data: xpData, error: xpError } = await supabase
      .from("xp_logs")
      .select("points_awarded")
      .eq("user_id", user.id)

    let totalXp = 0
    if (xpError) {
      // Try alternative table name
      const { data: altXpData, error: altXpError } = await supabase
        .from("xp_log")
        .select("points")
        .eq("owner_id", user.id)

      if (altXpError) {
        console.error("Error fetching XP for badge showcase:", altXpError.message)
        totalXp = 0
      } else {
        totalXp = altXpData?.reduce((sum, entry) => sum + (entry.points || 0), 0) || 0
      }
    } else {
      totalXp = xpData?.reduce((sum, entry) => sum + (entry.points_awarded || 0), 0) || 0
    }

    const earnedBadges: UserBadgeType[] = []
    if (allBadgesConfig && Array.isArray(allBadgesConfig)) {
      for (const badge of allBadgesConfig) {
        if (totalXp >= badge.threshold) {
          earnedBadges.push(badge)
        }
      }
    }

    return <BadgeShowcase currentXp={totalXp} earnedBadges={earnedBadges} />
  } catch (error) {
    console.error("Error in BadgeDataFetcher:", error)
    return <BadgeShowcase currentXp={0} earnedBadges={[]} />
  }
}

export default async function ProfileSettingsPage() {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your account settings, profile information, and integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your display name. Your email address cannot be changed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="max-w-md space-y-4">
                <div>Loading profile form...</div>
              </div>
            }
          >
            <ProfileDataFetcher />
          </Suspense>
        </CardContent>
      </Card>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>API Keys & Model Preferences</CardTitle>
              <CardDescription>Loading API key management...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-20 flex items-center justify-center">
                <p>Loading...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <ApiKeyManager />
      </Suspense>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Your Badges & Achievements</CardTitle>
              <CardDescription>Loading your badge progress...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-20 flex items-center justify-center">
                <p>Loading...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        <BadgeDataFetcher />
      </Suspense>
    </div>
  )
}
