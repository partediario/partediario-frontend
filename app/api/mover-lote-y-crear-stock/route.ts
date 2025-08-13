import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { p_lote_origen_id, p_movimientos, p_nombre_lote_nuevo, p_potrero_destino_id } = await request.json()

    if (!p_lote_origen_id || !p_movimientos || !p_nombre_lote_nuevo || !p_potrero_destino_id) {
      return NextResponse.json({ error: "Todos los parámetros son requeridos" }, { status: 400 })
    }

    // Llamar a la función RPC de Supabase
    const { data, error } = await supabaseServer.rpc("mover_lote_a_potrero_y_crear_lote_con_stock", {
      p_lote_origen_id,
      p_potrero_destino_id,
      p_nombre_lote_nuevo,
      p_movimientos,
    })

    if (error) {
      console.error("Error calling mover_lote_a_potrero_y_crear_lote_con_stock:", error)
      return NextResponse.json({ error: "Error al mover lote y crear stock" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in mover-lote-y-crear-stock:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
