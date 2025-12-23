import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Export a singleton client for use in components
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}

export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey)
}
