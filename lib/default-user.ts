import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

// Ensure these are set in your environment. For local dev, they can be the same as your public ones
// but ideally, for admin tasks, you'd use the service_role key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a dedicated admin client for this utility
const adminSupabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000" // A fixed, known UUID
export const DEFAULT_USER_DISPLAY_NAME = "Default User"

export async function getDefaultUserId(): Promise<string> {
  // Simply return the default user ID without any Supabase calls
  return DEFAULT_USER_ID
}

// Keep this for compatibility but it won't be used
export function getAdminSupabaseClient() {
  throw new Error("Supabase client disabled to prevent connection errors")
}
