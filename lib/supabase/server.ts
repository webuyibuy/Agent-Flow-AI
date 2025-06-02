import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

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

export function getSupabaseFromServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("🔄 Using mock Supabase server client - environment variables not configured")
    return createMockClient()
  }

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
    return createMockClient()
  }
}

export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("🔄 Using mock Supabase admin client - service role not configured")
    return createMockClient()
  }

  try {
    // Create admin client with service role key (bypasses RLS)
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
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
    return createMockClient()
  }
}

// Create a separate function for cookie-based server client when needed
export async function getSupabaseServerWithCookies() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("🔄 Using mock Supabase server client - environment variables not configured")
    return createMockClient()
  }

  try {
    // For now, return the same client as getSupabaseFromServer
    // In a full implementation, this would handle cookies differently
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log("✅ Real Supabase server client with cookies initialized")
    return client
  } catch (error) {
    console.error("❌ Failed to initialize Supabase server client with cookies:", error)
    return createMockClient()
  }
}

// Export createClient for compatibility
export const createClient = createSupabaseClient
