import type { SupabaseClient } from "@supabase/supabase-js"

export class ConnectionManager {
  private static instance: ConnectionManager
  private mockClient: SupabaseClient | null = null

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  public isConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }

  public isAdminConfigured(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  }

  public getConfig() {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
    }
  }

  public getMockClient(): SupabaseClient {
    if (this.mockClient) {
      return this.mockClient
    }

    // Create a mock client for development/testing
    this.mockClient = {
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

    return this.mockClient
  }
}
