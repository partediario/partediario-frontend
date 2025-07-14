import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ROLES] Obteniendo roles...")

    const { data: roles, error } = await supabaseServer
      .from("pd_roles")
      .select("id, nombre")
      .order("id", { ascending: true })

    if (error) {
      console.error("❌ [ROLES] Error al obtener roles:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener roles",
        },
        { status: 500 },
      )
    }

    console.log("✅ [ROLES] Roles obtenidos:", roles?.length || 0)

    return NextResponse.json({
      success: true,
      roles: roles || [],
    })
  } catch (error) {
    console.error("❌ [ROLES] Error general:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
