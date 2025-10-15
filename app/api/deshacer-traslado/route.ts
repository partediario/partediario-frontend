import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const body = await request.json()
    const { actividad_id, user_id, detalles_animales, lote_origen_id, lote_destino_id } = body

    if (!actividad_id || !user_id || !detalles_animales || !lote_origen_id || !lote_destino_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Preparar movimientos para revertir (intercambiar origen y destino)
    const movimientos = detalles_animales.map((detalle: any) => ({
      categoria_animal_id: detalle.categoria_animal_id,
      cantidad_a_mover: detalle.cantidad,
      peso_promedio_a_mover: detalle.peso || 0,
    }))

    // Llamar a la función RPC para mover el stock de vuelta (destino → origen)
    const { error: rpcError } = await supabase.rpc("mover_stock_entre_lotes", {
      p_lote_origen_id: lote_destino_id, // Invertido: ahora el destino es el origen
      p_lote_destino_id: lote_origen_id, // Invertido: ahora el origen es el destino
      p_movimientos: movimientos,
    })

    if (rpcError) {
      console.error("Error en RPC mover_stock_entre_lotes:", rpcError)
      return NextResponse.json({ error: `Error al revertir el traslado: ${rpcError.message}` }, { status: 500 })
    }

    // Actualizar la actividad como deshecha
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        deshecho: true,
        deshecho_at: new Date().toISOString(),
        deshecho_user_id: user_id,
      })
      .eq("id", actividad_id)

    if (updateError) {
      console.error("Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar el estado de la actividad" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Traslado deshecho correctamente",
    })
  } catch (error) {
    console.error("Error en deshacer-traslado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
