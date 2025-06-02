// Mock connection manager (no external dependencies)
export class ConnectionManager {
  private static instance: ConnectionManager

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  public isConfigured(): boolean {
    return false // Always return false for mock implementation
  }

  public isAdminConfigured(): boolean {
    return false // Always return false for mock implementation
  }

  public getConfig() {
    return {
      url: "",
      anonKey: "",
      serviceRoleKey: null,
    }
  }

  public getMockClient() {
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
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: [], error: null }),
        update: async () => ({ data: [], error: null }),
        delete: async () => ({ data: [], error: null }),
      }),
    }
  }
}
