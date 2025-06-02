// Mock Supabase client implementation (no external dependencies)
export interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    getUser: () => Promise<{ data: { user: null }; error: null }>
    signInWithPassword: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signUp: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: (callback: any) => { data: { subscription: { unsubscribe: () => void } } }
  }
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: any[]; error: null }>
    insert: (data: any) => Promise<{ data: any[]; error: null }>
    update: (data: any) => Promise<{ data: any[]; error: null }>
    delete: () => Promise<{ data: any[]; error: null }>
  }
}

function createMockClient(): MockSupabaseClient {
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

let mockClient: MockSupabaseClient | null = null

export function getSupabaseBrowserClient(): MockSupabaseClient {
  if (!mockClient) {
    mockClient = createMockClient()
    console.log("🔄 Using mock Supabase browser client")
  }
  return mockClient
}

export function resetSupabaseClient() {
  mockClient = null
}

// Named export for createClient (required by other parts of the codebase)
export const createClient = getSupabaseBrowserClient
