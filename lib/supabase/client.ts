import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Define a global variable to store the client instance
declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined
}

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    // This function should only be called on the client
    throw new Error("getSupabaseBrowserClient should only be called on the client side.")
  }

  if (!globalThis.supabaseClient) {
    globalThis.supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return globalThis.supabaseClient
}
