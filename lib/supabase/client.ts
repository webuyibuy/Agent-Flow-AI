// Mock Supabase client implementation (no external dependencies)
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const supabase = supabaseClient

// Named export for compatibility
export const SupabaseClient = () => supabase

export interface MockSupabaseClient {
  auth: {
    getSession: () => Promise<{ data: { session: null }; error: null }>
    getUser: () => Promise<{ data: { user: null }; error: null }>
    signInWithPassword: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signUp: (credentials: any) => Promise<{ data: { user: null; session: null }; error: null }>
    signOut: () => Promise<{ error: null }>
    onAuthStateChange: (callback: any) => { data: { subscription: { unsubscribe: () => void } } }
  }
  from: (table: string) => MockQueryBuilder
}

interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder
  insert: (data: any) => MockQueryBuilder
  update: (data: any) => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: (column: string, value: any) => MockQueryBuilder
  neq: (column: string, value: any) => MockQueryBuilder
  gt: (column: string, value: any) => MockQueryBuilder
  gte: (column: string, value: any) => MockQueryBuilder
  lt: (column: string, value: any) => MockQueryBuilder
  lte: (column: string, value: any) => MockQueryBuilder
  like: (column: string, pattern: string) => MockQueryBuilder
  ilike: (column: string, pattern: string) => MockQueryBuilder
  in: (column: string, values: any[]) => MockQueryBuilder
  is: (column: string, value: any) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder
  limit: (count: number) => MockQueryBuilder
  range: (from: number, to: number) => MockQueryBuilder
  single: () => Promise<{ data: any | null; error: null }>
  maybeSingle: () => Promise<{ data: any | null; error: null }>
  then: (resolve: (value: { data: any[]; error: null }) => void) => void
}

function createMockQueryBuilder(): MockQueryBuilder {
  const mockData = [{ id: "1", display_name: "Demo User", email: "user@example.com" }]

  const builder: MockQueryBuilder = {
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
    from: () => createMockQueryBuilder(),
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
