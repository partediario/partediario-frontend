// Environment variables with fallbacks for development
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
}

// Only validate in production or when variables are expected
const isProduction = process.env.NODE_ENV === "production"
const shouldValidate = isProduction || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

if (shouldValidate) {
  if (!env.SUPABASE_URL) {
    console.warn("⚠️ SUPABASE_URL is not configured. Some features may not work.")
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not configured. Some features may not work.")
  }
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
