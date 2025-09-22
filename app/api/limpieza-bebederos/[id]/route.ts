import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parteId = Number.parseInt(params.id)
    const body = await request.json()
    const { tipo_actividad_id, fecha, hora, nota, user_id, detalles } = body

    console.log("🔄 Actualizando limpieza de bebederos:")
    console.log("📋 Parte ID recibido:", parteId)
    console.log("📋 Body recibido:", JSON.stringify(body, null, 2))

    // Validaciones básicas
    if (!parteId || isNaN(parteId)) {
      console.log("❌ ID de parte inválido:", parteId)
      return NextResponse.json({ error: "ID de parte inválido" }, { status: 400 })
    }

    if (!tipo_actividad_id || !fecha || !hora || !user_id) {
      console.log("❌ Faltan campos requeridos:", { tipo_actividad_id, fecha, hora, user_id })
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!Array.isArray(detalles)) {
      console.log("❌ Los detalles no son un array:", detalles)
      return NextResponse.json({ error: "Los detalles deben ser un array" }, { status: 400 })
    }

    console.log("🔍 Buscando actividad asociada al parte diario...")
    const { data: actividadData, error: actividadError } = await supabase
      .from("pd_actividades")
      .select("id")
      .eq("id", parteId)
      .single()

    if (actividadError || !actividadData) {
      console.log("❌ Error buscando actividad:", actividadError)
      return NextResponse.json({ error: "No se encontró la actividad asociada" }, { status: 404 })
    }

    const actividadId = actividadData.id
    console.log("✅ ID de actividad encontrado:", actividadId)

    console.log("🔄 Actualizando actividad principal...")
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        tipo_actividad_id,
        fecha,
        hora,
        nota,
        user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (updateError) {
      console.log("❌ Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error actualizando actividad" }, { status: 500 })
    }

    console.log("✅ Actividad actualizada")

    console.log("🔄 Eliminando detalles existentes...")
    const { error: deleteError } = await supabase.from("pd_actividad_potreros").delete().eq("actividad_id", actividadId)

    if (deleteError) {
      console.log("❌ Error eliminando detalles:", deleteError)
      return NextResponse.json({ error: "Error eliminando detalles existentes" }, { status: 500 })
    }

    console.log("✅ Detalles eliminados")

    if (detalles.length > 0) {
      console.log("🔄 Insertando nuevos detalles:", detalles.length)

      const potrerosToInsert = detalles.map((detalle) => ({
        actividad_id: actividadId,
        potrero_id: detalle.potrero_id,
      }))

      const { error: insertError } = await supabase.from("pd_actividad_potreros").insert(potrerosToInsert)

      if (insertError) {
        console.log("❌ Error insertando detalles:", insertError)
        return NextResponse.json({ error: "Error insertando nuevos detalles" }, { status: 500 })
      }

      console.log("✅ Detalles insertados")
    }

    console.log("✅ Limpieza de bebederos actualizada exitosamente")

    return NextResponse.json({
      message: "Limpieza de bebederos actualizada exitosamente",
      parte_id: parteId,
      actividad_id: actividadId,
      detalles_count: detalles.length,
    })
  } catch (error) {
    console.error("❌ Error al actualizar limpieza de bebederos:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Error interno del servidor al actualizar limpieza de bebederos",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { deleted, deleted_at, deleted_user_id } = body

    console.log("🗑️ Soft delete para limpieza bebederos ID:", id)
    console.log("📝 Datos recibidos:", { deleted, deleted_at, deleted_user_id })

    // Validar datos requeridos
    if (typeof deleted !== "boolean" || !deleted_at || !deleted_user_id) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: deleted, deleted_at y deleted_user_id son obligatorios" },
        { status: 400 },
      )
    }

    // Verificar que la actividad existe
    const { data: actividadExistente, error: verificarError } = await supabase
      .from("pd_actividades")
      .select("id")
      .eq("id", id)
      .single()

    if (verificarError || !actividadExistente) {
      console.error("❌ Actividad no encontrada:", verificarError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Actualizar con soft delete
    const { data, error } = await supabase
      .from("pd_actividades")
      .update({
        deleted,
        deleted_at,
        deleted_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ Error en soft delete:", error)
      return NextResponse.json({ error: "Error al eliminar", details: error.message }, { status: 500 })
    }

    console.log("✅ Limpieza bebederos eliminada exitosamente")

    return NextResponse.json({
      message: "Actividad eliminada exitosamente",
      data,
    })
  } catch (error) {
    console.error("❌ Error en PATCH limpieza-bebederos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
