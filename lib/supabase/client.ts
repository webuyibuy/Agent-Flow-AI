import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { ConnectionManager } from "./connection-manager"

// Define a global variable to store the client instance
declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined
}

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient should only be called on the client side.")
  }

  const connectionManager = ConnectionManager.getInstance()

  // Check if we should use real Supabase or mock
  if (!connectionManager.isConfigured()) {
    console.log("🔄 Using mock Supabase client - environment not configured")
    return connectionManager.getMockClient()
  }

  // Try to create real client if not already created
  if (!globalThis.supabaseClient) {
    try {
      const config = connectionManager.getConfig()
      globalThis.supabaseClient = createBrowserClient(config.url, config.anonKey)

      // Test the connection
      connectionManager.testConnection(globalThis.supabaseClient)

      console.log("✅ Real Supabase client initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Supabase client:", error)
      return connectionManager.getMockClient()
    }
  }

  return globalThis.supabaseClient
}

// Export connection manager for status monitoring
export { ConnectionManager }
