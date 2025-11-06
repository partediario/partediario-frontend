import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, traslados } = body

    console.log("📋 Datos recibidos para traslado:", JSON.stringify(body, null, 2))

    // Validaciones
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id || !traslados) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!Array.isArray(traslados) || traslados.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos un traslado" }, { status: 400 })
    }

    // Crear actividad en pd_actividades
    const datosActividad = {
      establecimiento_id: Number(establecimiento_id),
      tipo_actividad_id: Number(tipo_actividad_id),
      user_id: user_id, // UUID string
      fecha: fecha, // formato YYYY-MM-DD
      hora: hora, // formato HH:MM
      nota: nota || null,
    }

    console.log("📝 Creando actividad:", datosActividad)

    const { data: actividad, error: errorActividad } = await supabase
      .from("pd_actividades")
      .insert(datosActividad)
      .select("id")
      .single()

    if (errorActividad) {
      console.error("❌ Error creando actividad:", errorActividad)
      return NextResponse.json(
        {
          error: "Error al crear la actividad",
          message: errorActividad.message,
          details: errorActividad.details,
        },
        { status: 500 },
      )
    }

    if (!actividad || !actividad.id) {
      return NextResponse.json({ error: "No se pudo obtener el ID de la actividad creada" }, { status: 500 })
    }

    console.log("✅ Actividad creada con ID:", actividad.id)

    // Crear registros en pd_actividad_animales para cada traslado
    const detallesActividad = traslados.map((traslado: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: traslado.categoria_animal_id,
      cantidad: traslado.cantidad,
      peso: traslado.peso_promedio,
      tipo_peso: "PROMEDIO" as const,
      potrero_origen_id: traslado.potrero_origen_id,
      potrero_destino_id: traslado.potrero_destino_id,
      lote_origen_id: traslado.lote_origen_id,
      lote_destino_id: traslado.lote_destino_id,
    }))

    console.log("📝 Creando detalles de actividad:", detallesActividad)

    const { error: errorDetalles } = await supabase.from("pd_actividad_animales").insert(detallesActividad)

    if (errorDetalles) {
      console.error("❌ Error creando detalles:", errorDetalles)
      return NextResponse.json(
        {
          error: "Error al crear los detalles de la actividad",
          message: errorDetalles.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ Traslado de potrero guardado exitosamente")

    return NextResponse.json({
      success: true,
      message: "Traslado de potrero guardado exitosamente",
      actividad_id: actividad.id,
      traslados_procesados: traslados.length,
    })
  } catch (error) {
    console.error("❌ Error general en API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
