// Mock connection manager (no external dependencies)
export class ConnectionManager {
  private static instance: ConnectionManager | null = null

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  isConfigured(): boolean {
    return false // Always return false to use mock client
  }

  isAdminConfigured(): boolean {
    return false // Always return false to use mock client
  }

  getConfig() {
    return {
      url: "",
      anonKey: "",
      serviceRoleKey: "",
    }
  }

  getMockClient() {
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
        select: () => ({
          limit: () => ({
            single: async () => ({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          single: async () => ({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        insert: () => ({ then: (resolve: any) => resolve({ data: [], error: null }) }),
        update: () => ({ then: (resolve: any) => resolve({ data: [], error: null }) }),
        delete: () => ({ then: (resolve: any) => resolve({ data: [], error: null }) }),
      }),
    }
  }
}
