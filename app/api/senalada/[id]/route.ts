import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actividadId = params.id
    const { fecha, hora, nota, detalles } = await request.json()

    console.log("🔄 Actualizando Señalada, actividad ID:", actividadId)
    console.log("📊 Datos recibidos:", { fecha, hora, nota, detalles: detalles?.length })

    const { error: actividadError } = await supabase
      .from("pd_actividades")
      .update({
        fecha,
        hora,
        nota,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (actividadError) {
      console.error("❌ Error actualizando actividad:", actividadError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    console.log("✅ Actividad actualizada correctamente")

    const { data: detallesExistentes, error: fetchError } = await supabase
      .from("pd_actividad_animales")
      .select("*")
      .eq("actividad_id", actividadId)

    if (fetchError) {
      console.error("❌ Error obteniendo detalles existentes:", fetchError)
      return NextResponse.json({ error: "Error al obtener detalles existentes" }, { status: 500 })
    }

    console.log("📋 Detalles existentes encontrados:", detallesExistentes?.length || 0)

    if (detalles && detalles.length > 0) {
      const nuevosDetalles = detalles.map((detalle: any) => ({
        actividad_id: Number.parseInt(actividadId),
        categoria_animal_id: detalle.categoria_animal_id,
        cantidad: detalle.cantidad,
        peso: detalle.peso,
        tipo_peso: detalle.tipo_peso || "TOTAL",
        lote_id: detalle.lote_id,
        tipo_movimiento_animal_id: null, // Siempre NULL para Señalada
      }))

      const detallesParaActualizar = []
      const detallesParaInsertar = []
      const idsExistentesUsados = new Set()

      for (const nuevoDetalle of nuevosDetalles) {
        // Buscar un detalle existente que coincida por lote_id y categoria_animal_id
        const detalleExistente = detallesExistentes?.find(
          (existente) =>
            existente.lote_id === nuevoDetalle.lote_id &&
            existente.categoria_animal_id === nuevoDetalle.categoria_animal_id &&
            !idsExistentesUsados.has(existente.id),
        )

        if (detalleExistente) {
          // Actualizar registro existente
          detallesParaActualizar.push({
            id: detalleExistente.id,
            ...nuevoDetalle,
          })
          idsExistentesUsados.add(detalleExistente.id)
        } else {
          // Insertar nuevo registro
          detallesParaInsertar.push(nuevoDetalle)
        }
      }

      const idsParaEliminar =
        detallesExistentes
          ?.filter((existente) => !idsExistentesUsados.has(existente.id))
          .map((existente) => existente.id) || []

      console.log("🔄 Plan de actualización:", {
        actualizar: detallesParaActualizar.length,
        insertar: detallesParaInsertar.length,
        eliminar: idsParaEliminar.length,
      })

      for (const detalle of detallesParaActualizar) {
        const { id, ...datosActualizacion } = detalle
        const { error: updateError } = await supabase
          .from("pd_actividad_animales")
          .update(datosActualizacion)
          .eq("id", id)

        if (updateError) {
          console.error("❌ Error actualizando detalle:", updateError)
          return NextResponse.json({ error: "Error al actualizar detalle" }, { status: 500 })
        }
      }

      if (detallesParaInsertar.length > 0) {
        const { error: insertError } = await supabase.from("pd_actividad_animales").insert(detallesParaInsertar)

        if (insertError) {
          console.error("❌ Error insertando nuevos detalles:", insertError)
          return NextResponse.json({ error: "Error al insertar nuevos detalles" }, { status: 500 })
        }
      }

      if (idsParaEliminar.length > 0) {
        const { error: deleteError } = await supabase.from("pd_actividad_animales").delete().in("id", idsParaEliminar)

        if (deleteError) {
          console.error("❌ Error eliminando detalles obsoletos:", deleteError)
          return NextResponse.json({ error: "Error al eliminar detalles obsoletos" }, { status: 500 })
        }
      }

      console.log("✅ Detalles procesados correctamente")
    } else {
      if (detallesExistentes && detallesExistentes.length > 0) {
        const { error: deleteAllError } = await supabase
          .from("pd_actividad_animales")
          .delete()
          .eq("actividad_id", actividadId)

        if (deleteAllError) {
          console.error("❌ Error eliminando todos los detalles:", deleteAllError)
          return NextResponse.json({ error: "Error al eliminar detalles" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({
      message: "Señalada actualizada correctamente",
      actividad_id: actividadId,
      detalles_count: detalles?.length || 0,
    })
  } catch (error) {
    console.error("❌ Error en API de Señalada:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { deleted, deleted_at, deleted_user_id } = body

    console.log("🗑️ Soft delete para señalada ID:", id)
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

    console.log("✅ Señalada eliminada exitosamente")

    return NextResponse.json({
      message: "Actividad eliminada exitosamente",
      data,
    })
  } catch (error) {
    console.error("❌ Error en PATCH señalada:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
