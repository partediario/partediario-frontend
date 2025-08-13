import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { loteId: string } }) {
  try {
    const loteId = params.loteId

    if (!loteId) {
      return NextResponse.json({ error: "lote_id es requerido" }, { status: 400 })
    }

    const { data, error } = await supabaseServer.from("pd_lote_stock_view").select("*").eq("lote_id", loteId)

    if (error) {
      console.error("Error fetching lote stock:", error)
      return NextResponse.json({ error: "Error al obtener stock del lote" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      // Return empty structure for lote with no animals
      return NextResponse.json({
        lote_id: Number.parseInt(loteId),
        lote_nombre: null,
        pd_detalles: [],
      })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in lote-stock API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
