import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { p_lote_origen_id, p_movimientos, p_nombre_lote, p_potrero_id } = await request.json()

    if (!p_lote_origen_id || !p_movimientos || !p_nombre_lote || !p_potrero_id) {
      return NextResponse.json({ error: "Todos los parámetros son requeridos" }, { status: 400 })
    }

    // Llamar a la función RPC de Supabase
    const { data, error } = await supabaseServer.rpc("crear_y_mover_stock_a_lote", {
      p_lote_origen_id,
      p_movimientos,
      p_nombre_lote,
      p_potrero_id,
    })

    if (error) {
      console.error("Error calling crear_y_mover_stock_a_lote:", error)
      return NextResponse.json({ error: "Error al crear y mover stock" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in crear-y-mover-stock:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
