import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parteId = params.id

    console.log("📋 Obteniendo detalles de actividad para parte ID:", parteId)

    // Obtener la actividad principal usando el ID del parte diario
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .select(`
        *,
        pd_tipo_actividades:tipo_actividad_id (
          id,
          nombre,
          ubicacion,
          animales
        )
      `)
      .eq("id", parteId)
      .single()

    if (actividadError) {
      console.error("❌ Error obteniendo actividad:", actividadError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Obtener los detalles de animales usando actividad_id
    const { data: detalles, error: detallesError } = await supabase
      .from("pd_actividad_animales")
      .select(`
        *,
        pd_categoria_animales:categoria_animal_id (
          id,
          nombre
        ),
        pd_lotes:lote_id (
          id,
          nombre
        )
      `)
      .eq("actividad_id", actividad.id)

    if (detallesError) {
      console.error("❌ Error obteniendo detalles:", detallesError)
      return NextResponse.json({ error: "Error al obtener detalles" }, { status: 500 })
    }

    console.log("✅ Actividad y detalles obtenidos:", { actividad, detalles })

    return NextResponse.json({
      actividad,
      detalles: detalles || [],
    })
  } catch (error) {
    console.error("❌ Error en API actividades-animales GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parteId = params.id
    const body = await request.json()
    console.log("📝 Actualizando actividad para parte ID:", parteId, body)

    const { tipo_actividad_id, fecha, hora, nota, user_id, detalles, tipo_movimiento_animal_id } = body

    // Validaciones
    if (!tipo_actividad_id || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Actualizar la actividad principal (sin tipo_movimiento_animal_id)
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        tipo_actividad_id,
        fecha,
        hora,
        nota: nota || null,
        user_id,
      })
      .eq("id", parteId)

    if (updateError) {
      console.error("❌ Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    // Eliminar detalles existentes
    const { error: deleteError } = await supabase.from("pd_actividad_animales").delete().eq("actividad_id", parteId)

    if (deleteError) {
      console.error("❌ Error eliminando detalles existentes:", deleteError)
      return NextResponse.json({ error: "Error al eliminar detalles existentes" }, { status: 500 })
    }

    // Insertar nuevos detalles si existen (con tipo_movimiento_animal_id en cada detalle)
    if (detalles && detalles.length > 0) {
      const detallesParaInsertar = detalles.map((detalle: any) => ({
        actividad_id: parteId,
        categoria_animal_id: detalle.categoria_animal_id,
        cantidad: detalle.cantidad,
        peso: detalle.peso,
        tipo_peso: detalle.tipo_peso,
        lote_id: detalle.lote_id,
        tipo_movimiento_animal_id: tipo_movimiento_animal_id, // Guardar en cada detalle
      }))

      console.log("🔄 Actualizando tipo_movimiento_animal_id en cada detalle:", tipo_movimiento_animal_id)

      const { error: insertError } = await supabase.from("pd_actividad_animales").insert(detallesParaInsertar)

      if (insertError) {
        console.error("❌ Error insertando nuevos detalles:", insertError)
        return NextResponse.json({ error: "Error al insertar nuevos detalles" }, { status: 500 })
      }
    }

    console.log("✅ Actividad actualizada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Actividad actualizada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en API actividades-animales PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
