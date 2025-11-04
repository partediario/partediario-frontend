import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Fetching all empresas")

    const { data: empresas, error } = await supabaseServer
      .from("pd_empresas")
      .select("id, nombre")
      .order("nombre", { ascending: true })

    if (error) {
      console.error("❌ Error fetching empresas:", error)
      return NextResponse.json({ success: false, error: "Error al obtener empresas" }, { status: 500 })
    }

    console.log("✅ Empresas found:", empresas?.length || 0)

    return NextResponse.json({
      success: true,
      empresas: empresas || [],
    })
  } catch (error) {
    console.error("❌ Error fetching empresas:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
