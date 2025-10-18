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

    for (const detalle of detalles_animales) {
      const { data, error } = await supabase.rpc("reclasificar_lote_animales", {
        p_lote_id: detalle.lote_id,
        p_categoria_origen_id: detalle.categoria_animal_id, // La categoría ACTUAL (donde están ahora)
        p_categoria_destino_id: detalle.categoria_animal_id_anterior, // La categoría ANTERIOR (donde estaban antes)
        p_cantidad_a_mover: detalle.cantidad,
        p_peso_promedio_animal: detalle.peso,
      })

      if (error) {
        console.error(`Error revirtiendo destete para lote ${detalle.lote_id}:`, error)
        return NextResponse.json({ error: `Error al revertir destete: ${error.message}` }, { status: 500 })
      }
    }

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

    return NextResponse.json({ success: true, message: "Destete deshecho exitosamente" })
  } catch (error) {
    console.error("Error en deshacer-destete-marcacion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
