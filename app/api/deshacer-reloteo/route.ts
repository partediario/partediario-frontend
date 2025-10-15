import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { actividad_id, user_id, detalles_animales } = await request.json()

    if (!actividad_id || !user_id || !detalles_animales || !Array.isArray(detalles_animales)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    // Agrupar movimientos por lote origen y destino para revertirlos
    const movimientosAgrupados = new Map<
      string,
      {
        lote_origen_id: number
        lote_destino_id: number
        movimientos: Array<{
          categoria_animal_id: number
          cantidad_a_mover: number
          peso_promedio_a_mover: number
        }>
      }
    >()

    // Invertir los movimientos: lo que era destino ahora es origen y viceversa
    detalles_animales.forEach((detalle: any) => {
      const key = `${detalle.lote_destino_id}-${detalle.lote_origen_id}` // Invertido

      if (!movimientosAgrupados.has(key)) {
        movimientosAgrupados.set(key, {
          lote_origen_id: detalle.lote_destino_id, // Invertido: ahora el destino es el origen
          lote_destino_id: detalle.lote_origen_id, // Invertido: ahora el origen es el destino
          movimientos: [],
        })
      }

      movimientosAgrupados.get(key)!.movimientos.push({
        categoria_animal_id: detalle.categoria_animal_id,
        cantidad_a_mover: detalle.cantidad,
        peso_promedio_a_mover: detalle.peso,
      })
    })

    // Ejecutar cada movimiento invertido
    for (const [key, grupo] of movimientosAgrupados) {
      const { data, error } = await supabase.rpc("mover_stock_entre_lotes", {
        p_lote_origen_id: grupo.lote_origen_id,
        p_lote_destino_id: grupo.lote_destino_id,
        p_movimientos: grupo.movimientos,
      })

      if (error) {
        console.error(`Error revirtiendo movimiento ${key}:`, error)
        return NextResponse.json({ error: `Error al revertir movimiento: ${error.message}` }, { status: 500 })
      }
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
      return NextResponse.json({ error: "Error al marcar actividad como deshecha" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Reloteo deshecho exitosamente" })
  } catch (error) {
    console.error("Error en deshacer-reloteo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
