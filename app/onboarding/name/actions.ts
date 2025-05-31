"use server"

import { getSupabaseFromServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

interface ActionResult {
  error?: string
  success?: boolean
  message?: string
}

export async function updateDisplayName(
  prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = getSupabaseFromServer()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "You must be logged in to update your name." }
  }

  const displayName = formData.get("displayName") as string

  if (!displayName || displayName.trim().length < 2) {
    return { error: "Display name must be at least 2 characters long." }
  }

  if (displayName.trim().length > 50) {
    return { error: "Display name cannot exceed 50 characters." }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (updateError) {
    console.error("Error updating display name:", updateError)
    return { error: `Failed to update display name: ${updateError.message}` }
  }

  revalidatePath("/dashboard") // Revalidate dashboard to show new name
  revalidatePath("/onboarding/name") // Revalidate this page

  // Check for an 'onboarding_next' query parameter to redirect after this step
  // For now, we'll redirect to the next onboarding step: goal primer.
  // If 'onboarding_next' was set (e.g. user tried to access /dependencies directly),
  // we might want to respect that after the full onboarding flow.
  // For now, let's assume a linear onboarding.
  redirect("/onboarding/goal-primer") // Next step in onboarding as per content.md

  // This return is for type consistency, redirect will prevent it from being reached
  return { success: true, message: "Display name updated successfully!" }
}
