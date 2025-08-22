import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, potrero_id, detalles = [] } = body

    console.log("[v0] Iniciando guardado de reparación de alambrados:", {
      establecimiento_id,
      tipo_actividad_id,
      potrero_id,
      detalles_count: detalles.length,
    })

    // Validaciones básicas
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!potrero_id) {
      return NextResponse.json({ error: "Debe seleccionar un potrero" }, { status: 400 })
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
      })
      .select("id")
      .single()

    if (actividadError) {
      console.error("[v0] Error al crear actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad principal" }, { status: 500 })
    }

    console.log("[v0] Actividad creada con ID:", actividad.id)

    const { error: potreroError } = await supabase.from("pd_actividad_potreros").insert({
      actividad_id: actividad.id,
      potrero_id: Number.parseInt(potrero_id),
    })

    if (potreroError) {
      console.error("[v0] Error al guardar potrero:", potreroError)
      return NextResponse.json({ error: "Error al guardar potrero asociado" }, { status: 500 })
    }

    console.log("[v0] Potrero guardado exitosamente")

    if (detalles && detalles.length > 0) {
      const insumosData = detalles.map((detalle: any) => ({
        actividad_id: actividad.id,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: insumosError } = await supabase.from("pd_actividad_insumos").insert(insumosData)

      if (insumosError) {
        console.error("[v0] Error al guardar insumos:", insumosError)
        return NextResponse.json({ error: "Error al guardar detalles de insumos" }, { status: 500 })
      }

      console.log("[v0] Insumos guardados exitosamente:", detalles.length)
    }

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: "Reparación de alambrados guardada exitosamente",
    })
  } catch (error) {
    console.error("[v0] Error en reparación de alambrados:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
