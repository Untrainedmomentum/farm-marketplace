import { createClient, SupabaseClient } from '@supabase/supabase-js'

let adminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminInstance) {
    adminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return adminInstance
}
