import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

    console.log('DEBUG: Configuration Supabase:')
    console.log('- URL:', supabaseUrl)
    console.log('- Service Key (premiers 20 chars):', supabaseServiceKey?.substring(0, 20) + '...')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('DEBUG: Client Supabase créé avec succès')
  }

  return supabaseClient
}