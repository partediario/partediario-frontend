import { createClient } from "@supabase/supabase-js"
import { env } from "./env"

// Cliente de Supabase para uso en el servidor
export const supabaseServer = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Función helper para crear un cliente con configuración específica
export function createServerClient(options?: {
  autoRefreshToken?: boolean
  persistSession?: boolean
}) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: options?.autoRefreshToken ?? false,
      persistSession: options?.persistSession ?? false,
    },
  })
}

// Función para verificar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabaseServer.from("pd_establecimientos").select("id, nombre").limit(1)

    if (error) {
      console.error("Error testing Supabase connection:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Unexpected error testing connection:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
