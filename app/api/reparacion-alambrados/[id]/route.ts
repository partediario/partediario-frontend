import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parteId = params.id
    const body = await request.json()
    const { tipo_actividad_id, potrero_id, fecha, hora, nota, user_id, detalles } = body

    console.log("[v0] Iniciando actualización de reparación de alambrados:", { parteId, body })

    // 1. Buscar la actividad asociada al parte diario
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .select("id")
      .eq("id", parteId)
      .single()

    if (actividadError || !actividad) {
      console.error("[v0] Error buscando actividad:", actividadError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    const actividadId = actividad.id
    console.log("[v0] Actividad encontrada:", actividadId)

    // 2. Actualizar la actividad principal
    const { error: updateActividadError } = await supabase
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

    if (updateActividadError) {
      console.error("[v0] Error actualizando actividad:", updateActividadError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    console.log("[v0] Actividad actualizada exitosamente")

    // 3. Actualizar el potrero en pd_actividad_potreros
    // Primero eliminar el potrero existente
    const { error: deletePotrerosError } = await supabase
      .from("pd_actividad_potreros")
      .delete()
      .eq("actividad_id", actividadId)

    if (deletePotrerosError) {
      console.error("[v0] Error eliminando potreros existentes:", deletePotrerosError)
      return NextResponse.json({ error: "Error al actualizar potreros" }, { status: 500 })
    }

    // Insertar el nuevo potrero
    const { error: insertPotreroError } = await supabase.from("pd_actividad_potreros").insert({
      actividad_id: actividadId,
      potrero_id,
    })

    if (insertPotreroError) {
      console.error("[v0] Error insertando potrero:", insertPotreroError)
      return NextResponse.json({ error: "Error al guardar el potrero" }, { status: 500 })
    }

    console.log("[v0] Potrero actualizado exitosamente")

    // 4. Actualizar insumos si los hay
    if (detalles && detalles.length > 0) {
      // Eliminar insumos existentes
      const { error: deleteInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .delete()
        .eq("actividad_id", actividadId)

      if (deleteInsumosError) {
        console.error("[v0] Error eliminando insumos existentes:", deleteInsumosError)
        return NextResponse.json({ error: "Error al actualizar insumos" }, { status: 500 })
      }

      // Insertar nuevos insumos
      const insumosData = detalles.map((detalle: any) => ({
        actividad_id: actividadId,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: insertInsumosError } = await supabase.from("pd_actividad_insumos").insert(insumosData)

      if (insertInsumosError) {
        console.error("[v0] Error insertando insumos:", insertInsumosError)
        return NextResponse.json({ error: "Error al guardar los insumos" }, { status: 500 })
      }

      console.log("[v0] Insumos actualizados exitosamente:", insumosData.length)
    } else {
      // Si no hay detalles, eliminar insumos existentes
      const { error: deleteInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .delete()
        .eq("actividad_id", actividadId)

      if (deleteInsumosError) {
        console.error("[v0] Error eliminando insumos:", deleteInsumosError)
      } else {
        console.log("[v0] Insumos eliminados (sin detalles)")
      }
    }

    console.log("[v0] Reparación de alambrados actualizada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Reparación de alambrados actualizada exitosamente",
      actividad_id: actividadId,
    })
  } catch (error) {
    console.error("[v0] Error en PUT reparacion-alambrados:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
