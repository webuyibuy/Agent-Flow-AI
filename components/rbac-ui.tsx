import { createClient } from "supabase-js"
import { sendSlackNotification } from "./slack-notification" // Assuming this is where sendSlackNotification is declared

export async function updateDependencySLA(dependencyId: string, slaHours: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("dependencies")
    .update({
      sla_hours: slaHours,
      sla_deadline: new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", dependencyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getOverdueDependencies() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("dependencies")
    .select("*, agents(*), tasks(*)")
    .eq("status", "pending")
    .lt("sla_deadline", new Date().toISOString())

  if (error) throw error
  return data
}

export async function bulkApproveDependencies(dependencyIds: string[], userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("dependencies")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .in("id", dependencyIds)
    .select()

  if (error) throw error

  // Send notifications for bulk approval
  await sendSlackNotification(`Bulk approved ${dependencyIds.length} dependencies`)

  return data
}
