import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Datos recibidos para actividad:", body)

    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles } = body

    // Validaciones
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Debe agregar al menos un detalle" }, { status: 400 })
    }

    // Insertar cabecera de actividad
    console.log("💾 Insertando cabecera de actividad...")
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id,
        fecha,
        hora,
        nota: nota || null,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("❌ Error insertando actividad:", actividadError)
      return NextResponse.json({ error: "Error al guardar la actividad" }, { status: 500 })
    }

    console.log("✅ Actividad creada:", actividad)

    // Insertar detalles de animales
    console.log("💾 Insertando detalles de animales...")
    const detallesParaInsertar = detalles.map((detalle: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: detalle.categoria_animal_id,
      cantidad: detalle.cantidad,
      peso: detalle.peso,
      tipo_peso: detalle.tipo_peso,
      lote_id: detalle.lote_id,
    }))

    const { data: detallesInsertados, error: detallesError } = await supabase
      .from("pd_actividad_animales")
      .insert(detallesParaInsertar)
      .select()

    if (detallesError) {
      console.error("❌ Error insertando detalles:", detallesError)
      // Si falla, eliminar la actividad creada
      await supabase.from("pd_actividades").delete().eq("id", actividad.id)
      return NextResponse.json({ error: "Error al guardar los detalles de la actividad" }, { status: 500 })
    }

    console.log("✅ Detalles insertados:", detallesInsertados)

    return NextResponse.json({
      success: true,
      actividad,
      detalles: detallesInsertados,
    })
  } catch (error) {
    console.error("❌ Error en API actividades-animales:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
