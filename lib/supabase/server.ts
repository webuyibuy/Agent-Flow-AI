import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

export function getSupabaseFromServer() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Using anon key for server components, service_role for admin tasks if needed
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

// Use this for Route Handlers and Server Actions where you need to perform admin tasks
export function getSupabaseAdmin(): SupabaseClient {
  const cookieStore = cookies()
  // Note: For admin tasks, you'd typically use the service_role key.
  // Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.
  // For simplicity in this example, we're still using anon key context,
  // but a real admin client would be initialized with the service role key.
  // This is a placeholder and should be adjusted based on actual needs for admin operations.
  // If you only need to act on behalf of the user, getSupabaseFromServer is sufficient.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // IMPORTANT: Use service role key for admin operations
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Server actions and route handlers can set cookies
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
      // auth: {
      //   persistSession: false // Typically true, but for admin client might differ
      // }
    },
  )
}
