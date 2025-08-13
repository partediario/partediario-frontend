import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, reloteos } = body

    // Validaciones
    if (
      !establecimiento_id ||
      !tipo_actividad_id ||
      !fecha ||
      !hora ||
      !user_id ||
      !reloteos ||
      reloteos.length === 0
    ) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Crear la actividad principal
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id,
        fecha,
        hora,
        nota,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("Error creating actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 })
    }

    // Crear los registros de actividad_animales para cada reloteo
    const actividadAnimales = reloteos.map((reloteo: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: reloteo.categoria_animal_id,
      cantidad: reloteo.cantidad,
      peso: reloteo.peso_promedio,
      tipo_peso: "PROMEDIO",
      lote_origen_id: reloteo.lote_origen_id,
      lote_destino_id: reloteo.lote_destino_id,
      // No incluir potrero_origen_id ni potrero_destino_id para reloteos
    }))

    const { error: animalesError } = await supabase.from("pd_actividad_animales").insert(actividadAnimales)

    if (animalesError) {
      console.error("Error creating actividad_animales:", animalesError)
      return NextResponse.json({ error: "Error al crear registros de animales" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: "Reloteo guardado exitosamente",
    })
  } catch (error) {
    console.error("Error in guardar-reloteo-actividad API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
