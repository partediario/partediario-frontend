import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles } = body

    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Debe agregar al menos un potrero" }, { status: 400 })
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
      .select()
      .single()

    if (actividadError) {
      console.error("Error al crear actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad: " + actividadError.message }, { status: 500 })
    }

    const detallesParaInsertar = detalles.map((detalle: any) => ({
      actividad_id: actividad.id,
      potrero_id: detalle.potrero_id, // Usar potrero_id directamente
    }))

    const { error: detallesError } = await supabase.from("pd_actividad_potreros").insert(detallesParaInsertar)

    if (detallesError) {
      await supabase.from("pd_actividades").delete().eq("id", actividad.id)

      console.error("Error al crear detalles de potreros:", detallesError)
      return NextResponse.json(
        { error: "Error al crear detalles de potreros: " + detallesError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: `Limpieza de ${detalles.length} potrero${detalles.length > 1 ? "s" : ""} registrada exitosamente`,
    })
  } catch (error) {
    console.error("Error en API limpieza-bebederos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
