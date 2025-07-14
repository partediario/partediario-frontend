// Configuración de variables de entorno para desarrollo
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || "https://supabase.partediario.com",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
}

// Función para verificar si las variables de entorno están configuradas
export const checkEnvVars = () => {
  const missing = []

  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL")
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")

  return {
    isValid: missing.length === 0,
    missing,
    current: {
      SUPABASE_URL: !!env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY,
    },
  }
}
