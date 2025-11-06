import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles } = body

    console.log("📝 Creando actividad de insumos:", {
      establecimiento_id,
      tipo_actividad_id,
      fecha,
      hora,
      detalles_count: detalles?.length || 0,
    })

    // Validaciones
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
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
      .select("id")
      .single()

    if (actividadError) {
      console.error("❌ Error al crear actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 })
    }

    console.log("✅ Actividad creada con ID:", actividad.id)

    // Crear los detalles de insumos
    const detallesInsumos = detalles.map((detalle: any) => ({
      actividad_id: actividad.id,
      insumo_id: detalle.insumo_id,
      cantidad: detalle.cantidad,
    }))

    const { error: detallesError } = await supabase.from("pd_actividad_insumos").insert(detallesInsumos)

    if (detallesError) {
      console.error("❌ Error al crear detalles de insumos:", detallesError)
      return NextResponse.json({ error: "Error al crear detalles de insumos" }, { status: 500 })
    }

    console.log("✅ Detalles de insumos creados:", detallesInsumos.length)

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: "Actividad de insumos creada exitosamente",
    })
  } catch (error) {
    console.error("❌ Error en API actividades-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
