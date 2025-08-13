import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Variables de entorno de Supabase no configuradas completamente")
}

// Cliente singleton para evitar múltiples instancias
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient && supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    })
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()

// Export a flag to check if client is available
export const isClientConfigured = !!(supabaseUrl && supabaseKey)
