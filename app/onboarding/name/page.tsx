import { getSupabaseFromServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import NameOnboardingForm from "@/components/name-onboarding-form"
import { Suspense } from "react"

async function UserProfileFetcher() {
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

  // If profile fetch fails critically (not just not found, which shouldn't happen after callback)
  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching profile for onboarding:", profileError)
    // Redirect to login or an error page might be better
    redirect("/login?message=Error fetching profile")
  }

  // If display name is already set, they might have manually navigated here.
  // Redirect them to the next step or dashboard.
  if (profile?.display_name) {
    // Assuming next step is goal primer, or dashboard if all onboarding is done.
    redirect("/onboarding/goal-primer") // Or /dashboard if this was the last step
  }

  return <NameOnboardingForm currentName={profile?.display_name} />
}

export default async function OnboardingNamePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <Suspense
        fallback={
          <div className="text-center">
            <p>Loading your space...</p>
          </div>
        }
      >
        <UserProfileFetcher />
      </Suspense>
    </div>
  )
}
