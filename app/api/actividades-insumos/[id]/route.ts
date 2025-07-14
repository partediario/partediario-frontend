import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Obteniendo actividad de insumos con ID:", params.id)

    // Usar la vista pd_partes_diarios_view que ya tiene toda la lógica
    const { data: parteDiario, error: parteError } = await supabase
      .from("pd_partes_diarios_view")
      .select("*")
      .eq("pd_detalles->detalle_id", params.id)
      .eq("pd_tipo", "ACTIVIDAD")
      .single()

    if (parteError) {
      console.error("Error al obtener parte diario:", parteError)
      return NextResponse.json({ error: "Error al obtener el parte diario" }, { status: 500 })
    }

    if (!parteDiario) {
      return NextResponse.json({ error: "Parte diario no encontrado" }, { status: 404 })
    }

    // Obtener el tipo de actividad
    const tipoActividadId = parteDiario.pd_detalles?.detalle_tipo_id
    if (!tipoActividadId) {
      return NextResponse.json({ error: "Tipo de actividad no encontrado" }, { status: 404 })
    }

    const { data: tipoActividad, error: tipoError } = await supabase
      .from("pd_tipo_actividades")
      .select("id, nombre, descripcion, ubicacion, animales, insumos")
      .eq("id", tipoActividadId)
      .single()

    if (tipoError) {
      console.error("Error al obtener tipo de actividad:", tipoError)
      return NextResponse.json({ error: "Error al obtener el tipo de actividad" }, { status: 500 })
    }

    // Construir la respuesta con la estructura esperada por los drawers
    const respuesta = {
      id: Number.parseInt(params.id),
      fecha: parteDiario.pd_fecha,
      hora: parteDiario.pd_hora,
      nota: parteDiario.pd_nota,
      pd_tipo_actividades: tipoActividad,
      pd_usuarios: {
        nombres: parteDiario.pd_usuario_nombres || "",
        apellidos: parteDiario.pd_usuario_apellidos || "",
      },
      // Mapear detalles_insumos a la estructura esperada por los drawers
      pd_actividades_insumos_detalle: (parteDiario.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
        id: insumo.id,
        insumo_id: insumo.insumo_id, // Usar insumo_id correcto, no el id del detalle
        cantidad: insumo.cantidad,
        pd_insumos: {
          id: insumo.insumo_id, // Usar insumo_id correcto
          nombre: insumo.insumo,
          pd_unidad_medida_insumos: {
            nombre: insumo.unidad_medida,
          },
        },
      })),
    }

    console.log("Actividad de insumos obtenida:", respuesta)
    return NextResponse.json(respuesta)
  } catch (error) {
    console.error("Error en GET /api/actividades-insumos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    console.log("Actualizando actividad de insumos:", params.id, body)

    const { fecha, hora, nota, detalles } = body

    // Primero obtener la actividad actual de la tabla pd_actividades
    const { data: actividadActual, error: actividadError } = await supabase
      .from("pd_actividades")
      .select("*")
      .eq("id", params.id)
      .single()

    if (actividadError || !actividadActual) {
      console.error("Error al obtener actividad:", actividadError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Actualizar la actividad principal
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        fecha,
        hora,
        nota,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) {
      console.error("Error al actualizar actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    // Eliminar detalles de insumos existentes
    const { error: deleteError } = await supabase.from("pd_actividad_insumos").delete().eq("actividad_id", params.id)

    if (deleteError) {
      console.error("Error al eliminar detalles existentes:", deleteError)
      return NextResponse.json({ error: "Error al actualizar los detalles" }, { status: 500 })
    }

    // Insertar nuevos detalles de insumos
    if (detalles && detalles.length > 0) {
      // Validar que todos los insumo_id existen
      const insumoIds = detalles.map((detalle: any) => detalle.insumo_id)
      const { data: insumosExistentes, error: validationError } = await supabase
        .from("pd_insumos")
        .select("id")
        .in("id", insumoIds)

      if (validationError) {
        console.error("Error al validar insumos:", validationError)
        return NextResponse.json({ error: "Error al validar los insumos" }, { status: 500 })
      }

      const insumosExistentesIds = insumosExistentes?.map((i) => i.id) || []
      const insumosInvalidos = insumoIds.filter((id) => !insumosExistentesIds.includes(id))

      if (insumosInvalidos.length > 0) {
        console.error("Insumos no encontrados:", insumosInvalidos)
        return NextResponse.json(
          {
            error: `Los siguientes insumos no existen: ${insumosInvalidos.join(", ")}`,
          },
          { status: 400 },
        )
      }

      const nuevosDetalles = detalles.map((detalle: any) => ({
        actividad_id: params.id,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: insertError } = await supabase.from("pd_actividad_insumos").insert(nuevosDetalles)

      if (insertError) {
        console.error("Error al insertar nuevos detalles:", insertError)
        return NextResponse.json({ error: "Error al actualizar los detalles" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en PUT /api/actividades-insumos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
