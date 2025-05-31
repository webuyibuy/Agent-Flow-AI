import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ReviewDeployClient from "@/components/review-deploy-client"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Review & Deploy Agent - AgentFlow",
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
    .select("display_name") // We just need to know if they've been through basic onboarding
    .eq("id", user.id)
    .single()

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile for review page:", profileError)
    redirect("/login?message=Error fetching profile")
  }

  if (!profile?.display_name) {
    // Should have been caught earlier, but as a safeguard
    redirect("/onboarding/name")
  }
  return null
}

export default async function OnboardingReviewDeployPage() {
  await AuthAndProfileCheck()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <Suspense
        fallback={
          <div className="text-center">
            <p>Loading review details...</p>
          </div>
        }
      >
        <ReviewDeployClient />
      </Suspense>
    </div>
  )
}
