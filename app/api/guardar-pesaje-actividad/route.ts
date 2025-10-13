import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, pesajes } = body

    console.log("[v0] Guardando pesaje actividad:", {
      establecimiento_id,
      tipo_actividad_id,
      fecha,
      hora,
      user_id,
      pesajes_count: pesajes?.length,
    })

    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id || !pesajes || pesajes.length === 0) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id,
        fecha,
        hora,
        nota,
        user_id,
        deleteable: true,
        deleted: false,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("[v0] Error al insertar actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad", details: actividadError.message }, { status: 500 })
    }

    console.log("[v0] Actividad creada con ID:", actividad.id)

    const detallesPesaje = pesajes.map((pesaje: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: pesaje.categoria_animal_id,
      cantidad: pesaje.cantidad,
      peso: pesaje.peso,
      tipo_peso: pesaje.tipo_peso,
      peso_anterior: pesaje.peso_anterior,
      tipo_peso_anterior: pesaje.tipo_peso_anterior,
      lote_id: pesaje.lote_id,
    }))

    const { error: detallesError } = await supabase.from("pd_actividad_animales").insert(detallesPesaje)

    if (detallesError) {
      console.error("[v0] Error al insertar detalles de pesaje:", detallesError)
      // Intentar eliminar la actividad si falla la inserción de detalles
      await supabase.from("pd_actividades").delete().eq("id", actividad.id)
      return NextResponse.json(
        { error: "Error al guardar detalles del pesaje", details: detallesError.message },
        { status: 500 },
      )
    }

    console.log("[v0] Pesaje guardado exitosamente")

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: "Pesaje guardado exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error en guardar-pesaje-actividad:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
