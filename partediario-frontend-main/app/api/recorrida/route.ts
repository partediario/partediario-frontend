import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles } = body

    console.log("📝 Creando actividad de recorrida:", {
      establecimiento_id,
      tipo_actividad_id,
      fecha,
      hora,
      detalles_count: detalles?.length || 0,
    })

    // Validaciones básicas
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Debe agregar al menos un potrero" }, { status: 400 })
    }

    // Crear la actividad principal
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
      console.error("❌ Error al crear actividad de recorrida:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad: " + actividadError.message }, { status: 500 })
    }

    console.log("✅ Actividad de recorrida creada:", actividad.id)

    // Preparar detalles para insertar en pd_actividad_potreros
    const detallesParaInsertar = detalles.map((detalle: any) => ({
      actividad_id: actividad.id,
      potrero_id: detalle.potrero_id,
      incidente: detalle.incidente || false,
      incidente_detalle: detalle.incidente_detalle || null,
    }))

    const { error: detallesError } = await supabase.from("pd_actividad_potreros").insert(detallesParaInsertar)

    if (detallesError) {
      // Si falla, eliminar la actividad creada
      await supabase.from("pd_actividades").delete().eq("id", actividad.id)

      console.error("❌ Error al crear detalles de potreros:", detallesError)
      return NextResponse.json(
        { error: "Error al crear detalles de potreros: " + detallesError.message },
        { status: 500 },
      )
    }

    console.log("✅ Detalles de recorrida guardados:", detalles.length)

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: `Recorrida de ${detalles.length} potrero${detalles.length > 1 ? "s" : ""} registrada exitosamente`,
    })
  } catch (error) {
    console.error("❌ Error en API recorrida:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
