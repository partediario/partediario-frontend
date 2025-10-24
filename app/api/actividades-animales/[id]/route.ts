import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parteId = params.id

    console.log("📋 Obteniendo detalles de actividad para parte ID:", parteId)

    const { data: parteData, error: parteError } = await supabase
      .from("pd_partes_diarios")
      .select("pd_actividad_id")
      .eq("pd_id", parteId)
      .eq("pd_tipo", "ACTIVIDAD")
      .single()

    if (parteError || !parteData?.pd_actividad_id) {
      console.error("❌ Error obteniendo parte diario:", parteError)
      return NextResponse.json({ error: "Parte diario no encontrado" }, { status: 404 })
    }

    const actividadId = parteData.pd_actividad_id

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
      .eq("id", actividadId)
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
      .eq("actividad_id", actividadId)

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
    console.log("📝 [v0] Actualizando actividad para parte ID:", parteId)
    console.log("📝 [v0] Body recibido:", JSON.stringify(body, null, 2))

    const { tipo_actividad_id, fecha, hora, nota, user_id, detalles, tipo_movimiento_animal_id, establecimiento_id } =
      body

    if (!tipo_actividad_id || !fecha || !hora || !establecimiento_id) {
      console.error("❌ [v0] Campos faltantes:", { tipo_actividad_id, fecha, hora, establecimiento_id })
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data: parteData, error: parteError } = await supabase
      .from("pd_partes_diarios")
      .select("pd_actividad_id")
      .eq("pd_id", parteId)
      .eq("pd_tipo", "ACTIVIDAD")
      .single()

    console.log("📋 [v0] Parte data obtenida:", parteData)

    if (parteError || !parteData?.pd_actividad_id) {
      console.error("❌ [v0] Error obteniendo parte diario:", parteError)
      return NextResponse.json({ error: "Parte diario no encontrado" }, { status: 404 })
    }

    const actividadId = parteData.pd_actividad_id
    console.log("🎯 [v0] Actividad ID a actualizar:", actividadId)

    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        tipo_actividad_id,
        fecha,
        hora,
        nota: nota || null,
        user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    console.log("📝 [v0] Resultado actualización actividad:", updateError ? "ERROR" : "SUCCESS")
    if (updateError) {
      console.error("❌ [v0] Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    const { error: deleteError } = await supabase.from("pd_actividad_animales").delete().eq("actividad_id", actividadId)

    console.log("🗑️ [v0] Resultado eliminación detalles:", deleteError ? "ERROR" : "SUCCESS")
    if (deleteError) {
      console.error("❌ [v0] Error eliminando detalles existentes:", deleteError)
      return NextResponse.json({ error: "Error al eliminar detalles existentes" }, { status: 500 })
    }

    if (detalles && detalles.length > 0) {
      const detallesParaInsertar = detalles.map((detalle: any) => ({
        actividad_id: actividadId,
        categoria_animal_id: detalle.categoria_animal_id,
        cantidad: detalle.cantidad,
        peso: detalle.peso || 0,
        tipo_peso: detalle.tipo_peso || "TOTAL", // Cambiado de "Total" a "TOTAL"
        lote_id: detalle.lote_id,
        ...(tipo_movimiento_animal_id && { tipo_movimiento_animal_id }),
      }))

      console.log("🔄 [v0] Detalles a insertar:", JSON.stringify(detallesParaInsertar, null, 2))

      const { error: insertError } = await supabase.from("pd_actividad_animales").insert(detallesParaInsertar)

      console.log("➕ [v0] Resultado inserción detalles:", insertError ? "ERROR" : "SUCCESS")
      if (insertError) {
        console.error("❌ [v0] Error insertando nuevos detalles:", insertError)
        return NextResponse.json({ error: "Error al insertar nuevos detalles" }, { status: 500 })
      }
    }

    console.log("✅ [v0] Actividad actualizada exitosamente con ID:", actividadId)

    return NextResponse.json({
      success: true,
      message: "Actividad actualizada correctamente",
      actividad_id: actividadId,
    })
  } catch (error) {
    console.error("❌ [v0] Error en API actividades-animales PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { deleted, deleted_at, deleted_user_id } = body

    console.log("🗑️ Soft delete para faena ID:", id)
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

    console.log("✅ Faena eliminada exitosamente")

    return NextResponse.json({
      message: "Actividad eliminada exitosamente",
      data,
    })
  } catch (error) {
    console.error("❌ Error en PATCH actividades-animales:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
