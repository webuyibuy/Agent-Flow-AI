import type { SupabaseClient } from "@supabase/supabase-js"

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export class ConnectionManager {
  private static instance: ConnectionManager
  private config: SupabaseConfig | null = null
  private mockClient: SupabaseClient | null = null

  private constructor() {
    this.initializeConfig()
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  private initializeConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (url && anonKey) {
      this.config = {
        url,
        anonKey,
        serviceRoleKey,
      }
    }
  }

  isConfigured(): boolean {
    return this.config !== null
  }

  isAdminConfigured(): boolean {
    return this.config !== null && this.config.serviceRoleKey !== undefined
  }

  getConfig(): SupabaseConfig {
    if (!this.config) {
      throw new Error("Supabase configuration not available")
    }
    return this.config
  }

  getMockClient(): SupabaseClient {
    if (!this.mockClient) {
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
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
        }),
      } as any
    }
    return this.mockClient
  }
}
