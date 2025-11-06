import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [SERVER] Iniciando cambio de contraseña...")

    const body = await request.json()
    console.log("📧 [SERVER] Email recibido:", body.p_email)
    console.log("🔑 [SERVER] Nueva contraseña recibida:", body.p_nueva_contrasena ? "***" : "vacía")

    const { p_email, p_nueva_contrasena } = body

    if (!p_email || !p_nueva_contrasena) {
      console.error("❌ [SERVER] Faltan parámetros requeridos")
      return NextResponse.json({ success: false, error: "Email y nueva contraseña son requeridos" }, { status: 400 })
    }

    if (p_nueva_contrasena.length < 6) {
      console.error("❌ [SERVER] Contraseña muy corta")
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    // Crear cliente de Supabase con service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("🔗 [SERVER] Conectando a Supabase...")
    console.log("🌐 [SERVER] URL:", supabaseUrl)
    console.log("🔑 [SERVER] Service Key presente:", !!supabaseServiceKey)

    // Llamar a la función RPC usando exactamente la misma estructura del curl
    console.log("📡 [SERVER] Llamando a pd_cambiar_contrasena_por_email...")

    const { data, error } = await supabase.rpc("pd_cambiar_contrasena_por_email", {
      p_email: p_email,
      p_nueva_contrasena: p_nueva_contrasena,
    })

    console.log("📡 [SERVER] Respuesta de Supabase:")
    console.log("📡 [SERVER] Data:", data)
    console.log("📡 [SERVER] Error:", error)

    if (error) {
      console.error("❌ [SERVER] Error de Supabase:", error.message)
      console.error("❌ [SERVER] Error completo:", JSON.stringify(error))
      return NextResponse.json(
        {
          success: false,
          error: `Error de Supabase: ${error.message}`,
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("✅ [SERVER] Contraseña cambiada exitosamente")
    return NextResponse.json({
      success: true,
      message: "Contraseña cambiada exitosamente",
      data: data,
    })
  } catch (error) {
    console.error("❌ [SERVER] Error general:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        details: error,
      },
      { status: 500 },
    )
  }
}
