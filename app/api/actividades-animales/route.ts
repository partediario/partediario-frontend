import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Creando nueva actividad con animales:", body)

    const { tipo_actividad_id, fecha, hora, nota, user_id, detalles, tipo_movimiento_animal_id } = body

    // Validaciones
    if (!tipo_actividad_id || !fecha || !hora || !user_id) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (!detalles || detalles.length === 0) {
      return NextResponse.json({ error: "Debe agregar al menos un detalle" }, { status: 400 })
    }

    // Crear la actividad principal (sin tipo_movimiento_animal_id)
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        tipo_actividad_id,
        fecha,
        hora,
        nota: nota || null,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("❌ Error creando actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear la actividad" }, { status: 500 })
    }

    console.log("✅ Actividad creada:", actividad)

    // Crear los detalles con tipo_movimiento_animal_id en cada uno
    const detallesParaInsertar = detalles.map((detalle: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: detalle.categoria_animal_id,
      cantidad: detalle.cantidad,
      peso: detalle.peso,
      tipo_peso: detalle.tipo_peso,
      lote_id: detalle.lote_id,
      tipo_movimiento_animal_id: tipo_movimiento_animal_id, // Guardar en cada detalle
    }))

    console.log("🔄 Guardando tipo_movimiento_animal_id en cada detalle:", tipo_movimiento_animal_id)

    const { error: detallesError } = await supabase.from("pd_actividad_animales").insert(detallesParaInsertar)

    if (detallesError) {
      console.error("❌ Error creando detalles:", detallesError)
      // Rollback: eliminar la actividad creada
      await supabase.from("pd_actividades").delete().eq("id", actividad.id)
      return NextResponse.json({ error: "Error al crear los detalles" }, { status: 500 })
    }

    console.log("✅ Actividad con animales creada exitosamente")

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: "Actividad creada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en API actividades-animales POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
