import { createClient } from '@supabase/supabase-js'

let supabaseClientInstance: ReturnType<typeof createClient> | null = null
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

// Lazy-loaded client-side client
export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    
    supabaseClientInstance = createClient(url, key)
  }
  return supabaseClientInstance
}

// Lazy-loaded server-side admin client
export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    
    const key = serviceRoleKey || anonKey
    if (!key) {
      throw new Error('Missing Supabase authentication key')
    }
    
    supabaseAdminInstance = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminInstance
}

// Get the current user
export async function getCurrentUser() {
  const client = getSupabaseClient()
  const { data: { user } } = await client.auth.getUser()
  return user
}
