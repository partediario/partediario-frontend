export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
}

// Validar que las variables de entorno estén presentes
if (!env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required")
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required")
}
