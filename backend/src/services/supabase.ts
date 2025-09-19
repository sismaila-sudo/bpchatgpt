import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

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

export async function verifyAuthToken(token: string) {
  const supabase = getSupabaseClient()

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid token')
    }

    return user
  } catch (error) {
    throw new Error('Token verification failed')
  }
}

export async function getUserProjects(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      organizations (
        id,
        name,
        currency
      )
    `)
    .or(`created_by.eq.${userId},id.in.(${await getUserProjectIds(userId)})`)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return data
}

async function getUserProjectIds(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('project_collaborators')
    .select('project_id')
    .eq('user_id', userId)

  if (error) {
    return ''
  }

  return data.map(d => d.project_id).join(',') || ''
}