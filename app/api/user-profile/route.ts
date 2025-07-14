import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    console.log("🔍 [API] user-profile - Iniciando request para usuario:", userId)

    if (!userId) {
      console.log("❌ user_id es requerido")
      return NextResponse.json({ error: "user_id es requerido" }, { status: 400 })
    }

    console.log("📡 [API] Consultando vista pd_user_profile_view...")

    // Usar la vista personalizada que ya tienes creada
    const { data, error } = await supabase.from("pd_user_profile_view").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ [API] Error de Supabase:", error)
      return NextResponse.json(
        {
          error: "Error obteniendo perfil de usuario",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!data) {
      console.log("❌ [API] Usuario no encontrado para ID:", userId)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Construir el nombre completo concatenando nombres y apellidos
    const nombreCompleto = `${data.nombres || ""} ${data.apellidos || ""}`.trim()

    console.log("✅ [API] Perfil de usuario obtenido:", {
      id: data.id,
      nombreCompleto,
      email: data.email,
      empresas: data.empresas?.length || 0,
    })

    return NextResponse.json({
      success: true,
      usuario: {
        id: data.id,
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        nombreCompleto,
        email: data.email,
        phone: data.phone,
        roles: data.roles || [],
        empresas: data.empresas || [],
      },
    })
  } catch (error) {
    console.error("💥 [API] Error crítico en user-profile:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
