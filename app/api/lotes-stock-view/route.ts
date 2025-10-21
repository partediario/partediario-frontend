import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Obtener lotes con stock desde la vista pd_lote_stock_view
    const { data: lotes, error } = await supabase
      .from("pd_lote_stock_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("lote_nombre")

    if (error) {
      console.error("Error fetching lotes from pd_lote_stock_view:", error)
      return NextResponse.json({ error: "Error al obtener lotes" }, { status: 500 })
    }

    return NextResponse.json({ lotes: lotes || [] })
  } catch (error) {
    console.error("Error in GET /api/lotes-stock-view:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
