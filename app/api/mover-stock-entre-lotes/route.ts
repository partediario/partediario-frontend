import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { p_lote_destino_id, p_lote_origen_id, p_movimientos } = await request.json()

    if (!p_lote_destino_id || !p_lote_origen_id || !p_movimientos) {
      return NextResponse.json({ error: "Todos los parámetros son requeridos" }, { status: 400 })
    }

    // Llamar a la función RPC de Supabase
    const { data, error } = await supabaseServer.rpc("mover_stock_entre_lotes", {
      p_lote_origen_id,
      p_lote_destino_id,
      p_movimientos,
    })

    if (error) {
      console.error("Error calling mover_stock_entre_lotes:", error)
      return NextResponse.json({ error: "Error al mover stock entre lotes" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in mover-stock-entre-lotes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
