import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ConnectionManager } from "./connection-manager"

export function getSupabaseFromServer() {
  const connectionManager = ConnectionManager.getInstance()

  if (!connectionManager.isConfigured()) {
    console.log("🔄 Using mock Supabase server client - environment not configured")
    return connectionManager.getMockClient()
  }

  try {
    const config = connectionManager.getConfig()

    // For server-side usage, we'll use the admin client approach
    // This avoids the cookies dependency that causes build issues
    const client = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log("✅ Real Supabase server client initialized")
    return client
  } catch (error) {
    console.error("❌ Failed to initialize Supabase server client:", error)
    return connectionManager.getMockClient()
  }
}

// Create a separate function for cookie-based server client when needed
export async function getSupabaseServerWithCookies() {
  const connectionManager = ConnectionManager.getInstance()

  if (!connectionManager.isConfigured()) {
    console.log("🔄 Using mock Supabase server client - environment not configured")
    return connectionManager.getMockClient()
  }

  try {
    // Use createServerComponentClient instead
    const client = createServerComponentClient({ cookies })

    console.log("✅ Real Supabase server client with cookies initialized")
    return client
  } catch (error) {
    console.error("❌ Failed to initialize Supabase server client with cookies:", error)
    return connectionManager.getMockClient()
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  const connectionManager = ConnectionManager.getInstance()

  if (!connectionManager.isAdminConfigured()) {
    console.log("🔄 Using mock Supabase admin client - service role not configured")
    return connectionManager.getMockClient()
  }

  try {
    const config = connectionManager.getConfig()

    // Create admin client with service role key (bypasses RLS)
    const adminClient = createClient(config.url, config.serviceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log("✅ Real Supabase admin client initialized with service role")
    return adminClient
  } catch (error) {
    console.error("❌ Failed to initialize Supabase admin client:", error)
    return connectionManager.getMockClient()
  }
}

// Export createClient for compatibility
export { createClient } from "@supabase/supabase-js"
