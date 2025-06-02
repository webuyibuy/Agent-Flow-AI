import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null

// Mock client for development/testing
function createMockClient(): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
    }),
  } as any
}

export function getSupabaseBrowserClient(): SupabaseClient {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("🔄 Using mock Supabase client - environment variables not configured")
    supabaseClient = createMockClient()
    return supabaseClient
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })

    console.log("✅ Real Supabase browser client initialized")
    return supabaseClient
  } catch (error) {
    console.error("❌ Failed to initialize Supabase browser client:", error)
    supabaseClient = createMockClient()
    return supabaseClient
  }
}

// Reset client function for testing or when switching environments
export function resetSupabaseClient() {
  supabaseClient = null
}

// Named export for createClient (required by other parts of the codebase)
export { getSupabaseBrowserClient as createClient }
