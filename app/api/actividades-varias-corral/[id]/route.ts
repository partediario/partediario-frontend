import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actividadId = params.id
    const body = await request.json()
    console.log("📝 Actualizando actividad varias de corral ID:", actividadId)
    console.log("📝 Datos recibidos:", JSON.stringify(body, null, 2))

    const { fecha, hora, nota, lotes_seleccionados, detalles } = body

    // Validaciones básicas
    if (!fecha || !hora) {
      return NextResponse.json({ error: "Fecha y hora son requeridos" }, { status: 400 })
    }

    // Verificar que la actividad existe
    const { data: actividadExistente, error: verificarError } = await supabase
      .from("pd_actividades")
      .select("id")
      .eq("id", actividadId)
      .single()

    if (verificarError || !actividadExistente) {
      console.error("❌ Actividad no encontrada:", verificarError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Actualizar la actividad principal
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        fecha,
        hora,
        nota: nota || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (updateError) {
      console.error("❌ Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    // Eliminar detalles existentes de animales (lotes)
    const { error: deleteAnimalesError } = await supabase
      .from("pd_actividad_animales")
      .delete()
      .eq("actividad_id", actividadId)

    if (deleteAnimalesError) {
      console.error("❌ Error eliminando detalles de animales:", deleteAnimalesError)
      return NextResponse.json({ error: "Error al eliminar detalles de lotes" }, { status: 500 })
    }

    // Eliminar detalles existentes de insumos
    const { error: deleteInsumosError } = await supabase
      .from("pd_actividad_insumos")
      .delete()
      .eq("actividad_id", actividadId)

    if (deleteInsumosError) {
      console.error("❌ Error eliminando detalles de insumos:", deleteInsumosError)
      return NextResponse.json({ error: "Error al eliminar detalles de insumos" }, { status: 500 })
    }

    // Insertar nuevos lotes seleccionados si existen
    if (lotes_seleccionados && lotes_seleccionados.length > 0) {
      console.log("🐄 Insertando lotes seleccionados:", lotes_seleccionados)

      // Validar que todos los lotes existen
      const { data: lotesExistentes, error: lotesError } = await supabase
        .from("pd_lotes")
        .select("id")
        .in("id", lotes_seleccionados)

      if (lotesError) {
        console.error("❌ Error verificando lotes:", lotesError)
        return NextResponse.json({ error: "Error al verificar lotes" }, { status: 500 })
      }

      const lotesExistentesIds = lotesExistentes?.map((l) => l.id) || []
      const lotesInvalidos = lotes_seleccionados.filter((id: number) => !lotesExistentesIds.includes(id))

      if (lotesInvalidos.length > 0) {
        console.error("❌ Lotes no válidos:", lotesInvalidos)
        return NextResponse.json(
          {
            error: `Lotes no válidos: ${lotesInvalidos.join(", ")}`,
          },
          { status: 400 },
        )
      }

      const detallesLotesParaInsertar = lotes_seleccionados.map((loteId: number) => ({
        actividad_id: Number.parseInt(actividadId),
        lote_id: loteId,
        cantidad: 0, // No hay cantidad específica de animales para actividades varias
        categoria_animal_id: null, // No hay categoría específica
        peso: null,
        tipo_peso: null,
      }))

      const { error: insertLotesError } = await supabase.from("pd_actividad_animales").insert(detallesLotesParaInsertar)

      if (insertLotesError) {
        console.error("❌ Error insertando nuevos lotes:", insertLotesError)
        return NextResponse.json({ error: "Error al insertar nuevos lotes" }, { status: 500 })
      }
    }

    // Insertar nuevos detalles de insumos si existen
    if (detalles && detalles.length > 0) {
      console.log("📦 Insertando detalles de insumos:", detalles)

      // Validar que todos los detalles de insumos tengan los campos requeridos
      for (let i = 0; i < detalles.length; i++) {
        const detalle = detalles[i]
        if (!detalle.insumo_id || detalle.insumo_id === 0) {
          return NextResponse.json({ error: `Detalle de insumo ${i + 1}: insumo_id es requerido` }, { status: 400 })
        }
      }

      // Validar que todos los insumos existen
      const insumosIds = detalles.map((d: any) => Number.parseInt(d.insumo_id)).filter(Boolean)
      if (insumosIds.length > 0) {
        const { data: insumosExistentes, error: insumosError } = await supabase
          .from("pd_insumos")
          .select("id")
          .in("id", insumosIds)

        if (insumosError) {
          console.error("❌ Error verificando insumos:", insumosError)
          return NextResponse.json({ error: "Error al verificar insumos" }, { status: 500 })
        }

        const insumosExistentesIds = insumosExistentes?.map((i) => i.id) || []
        const insumosInvalidos = insumosIds.filter((id) => !insumosExistentesIds.includes(id))

        if (insumosInvalidos.length > 0) {
          console.error("❌ Insumos no válidos:", insumosInvalidos)
          return NextResponse.json(
            {
              error: `Insumos no válidos: ${insumosInvalidos.join(", ")}`,
            },
            { status: 400 },
          )
        }
      }

      const detallesInsumosParaInsertar = detalles.map((detalle: any) => ({
        actividad_id: Number.parseInt(actividadId),
        insumo_id: Number.parseInt(detalle.insumo_id),
        cantidad: Number.parseInt(detalle.cantidad),
      }))

      const { error: insertInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .insert(detallesInsumosParaInsertar)

      if (insertInsumosError) {
        console.error("❌ Error insertando nuevos detalles de insumos:", insertInsumosError)
        return NextResponse.json({ error: "Error al insertar nuevos detalles de insumos" }, { status: 500 })
      }
    }

    console.log("✅ Actividad varias de corral actualizada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Actividad varias de corral actualizada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en API actividades-varias-corral PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { deleted, deleted_at, deleted_user_id } = body

    console.log("🗑️ Soft delete para actividad varias corral ID:", id)
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

    console.log("✅ Actividad varias corral eliminada exitosamente")

    return NextResponse.json({
      message: "Actividad eliminada exitosamente",
      data,
    })
  } catch (error) {
    console.error("❌ Error en PATCH actividades-varias-corral:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
