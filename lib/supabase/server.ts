// Complete mock Supabase server implementation (no external dependencies)

export interface SupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    getUser: () => Promise<{ data: { user: null }; error: null }>
    signInWithPassword: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signUp: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: (callback: any) => { data: { subscription: { unsubscribe: () => void } } }
  }
  from: (table: string) => QueryBuilder
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder
  insert: (data: any) => QueryBuilder
  update: (data: any) => QueryBuilder
  delete: () => QueryBuilder
  eq: (column: string, value: any) => QueryBuilder
  neq: (column: string, value: any) => QueryBuilder
  gt: (column: string, value: any) => QueryBuilder
  gte: (column: string, value: any) => QueryBuilder
  lt: (column: string, value: any) => QueryBuilder
  lte: (column: string, value: any) => QueryBuilder
  like: (column: string, pattern: string) => QueryBuilder
  ilike: (column: string, pattern: string) => QueryBuilder
  in: (column: string, values: any[]) => QueryBuilder
  is: (column: string, value: any) => QueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder
  limit: (count: number) => QueryBuilder
  range: (from: number, to: number) => QueryBuilder
  single: () => Promise<{ data: any | null; error: null }>
  maybeSingle: () => Promise<{ data: any | null; error: null }>
  then: (resolve: (value: { data: any[]; error: null }) => void) => void
}

function createQueryBuilder(): QueryBuilder {
  const mockData = [
    { id: "1", display_name: "Demo User", email: "user@example.com", created_at: new Date().toISOString() },
    { id: "2", display_name: "Test Agent", email: "agent@example.com", created_at: new Date().toISOString() },
  ]

  const builder: QueryBuilder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    in: () => builder,
    is: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: async () => ({ data: mockData[0] || null, error: null }),
    maybeSingle: async () => ({ data: mockData[0] || null, error: null }),
    then: (resolve) => resolve({ data: mockData, error: null }),
  }

  return builder
}

function createMockSupabaseClient(): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => createQueryBuilder(),
  }
}

let serverInstance: SupabaseClient | null = null

export function getSupabaseFromServer(): SupabaseClient {
  if (!serverInstance) {
    serverInstance = createMockSupabaseClient()
    console.log("🔄 Using mock Supabase server client")
  }
  return serverInstance
}

export function getSupabaseAdmin(): SupabaseClient {
  console.log("🔄 Using mock Supabase admin client")
  return createMockSupabaseClient()
}

export async function getSupabaseServerWithCookies(): Promise<SupabaseClient> {
  console.log("🔄 Using mock Supabase server client with cookies")
  return createMockSupabaseClient()
}

// Named export for createClient (required by other parts of the codebase)
export const createClient = getSupabaseFromServer

// Default export
export default getSupabaseFromServer
