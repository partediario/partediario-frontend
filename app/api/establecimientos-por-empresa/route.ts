import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId")

    console.log("🔍 Fetching establecimientos for empresa:", empresaId)

    if (!empresaId) {
      return NextResponse.json({ success: false, error: "ID de empresa requerido" }, { status: 400 })
    }

    const { data: establecimientos, error } = await supabaseServer
      .from("pd_establecimientos")
      .select("id, nombre")
      .eq("empresa_id", empresaId)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("❌ Error fetching establecimientos:", error)
      return NextResponse.json({ success: false, error: "Error al obtener establecimientos" }, { status: 500 })
    }

    console.log("✅ Establecimientos found:", establecimientos?.length || 0)

    return NextResponse.json({
      success: true,
      establecimientos: establecimientos || [],
    })
  } catch (error) {
    console.error("❌ Error fetching establecimientos:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
