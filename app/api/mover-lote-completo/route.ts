import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { lote_id, potrero_destino_id } = await request.json()

    if (!lote_id || !potrero_destino_id) {
      return NextResponse.json({ error: "lote_id y potrero_destino_id son requeridos" }, { status: 400 })
    }

    // Actualizar el potrero_id del lote
    const { data, error } = await supabaseServer
      .from("pd_lotes")
      .update({ potrero_id: potrero_destino_id })
      .eq("id", lote_id)
      .select()

    if (error) {
      console.error("Error moving lote:", error)
      return NextResponse.json({ error: "Error al mover el lote" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in mover-lote-completo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
