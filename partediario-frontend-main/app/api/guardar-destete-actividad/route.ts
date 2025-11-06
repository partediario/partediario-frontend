import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, destetes } = body

    console.log("=== API GUARDAR DESTETE ACTIVIDAD ===")
    console.log("📋 Parámetros recibidos:")
    console.log("  - establecimiento_id:", establecimiento_id)
    console.log("  - tipo_actividad_id:", tipo_actividad_id)
    console.log("  - fecha:", fecha)
    console.log("  - hora:", hora)
    console.log("  - nota:", nota)
    console.log("  - user_id:", user_id)
    console.log("  - destetes:", destetes)

    if (
      !establecimiento_id ||
      !tipo_actividad_id ||
      !fecha ||
      !hora ||
      !user_id ||
      !destetes ||
      destetes.length === 0
    ) {
      return NextResponse.json({ error: "Parámetros requeridos faltantes" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Crear la actividad principal
    const actividadResponse = await fetch(`${supabaseUrl}/rest/v1/pd_actividades`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        establecimiento_id: Number.parseInt(establecimiento_id),
        tipo_actividad_id: Number.parseInt(tipo_actividad_id),
        fecha,
        hora,
        nota,
        user_id,
      }),
    })

    if (!actividadResponse.ok) {
      const errorText = await actividadResponse.text()
      console.error(`Error creando actividad: ${actividadResponse.status} - ${errorText}`)
      throw new Error(`Error creando actividad: ${errorText}`)
    }

    const [actividad] = await actividadResponse.json()
    console.log("✅ Actividad creada:", actividad)

    // Crear los detalles de animales
    const detallesAnimales = destetes.map((destete: any) => ({
      actividad_id: actividad.id,
      categoria_animal_id: destete.categoria_animal_id,
      cantidad: destete.cantidad,
      peso: destete.peso,
      tipo_peso: destete.tipo_peso,
      lote_id: destete.lote_id,
      categoria_animal_id_anterior: destete.categoria_animal_id_anterior,
      meses_destete: destete.meses_destete,
    }))

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/pd_actividad_animales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(detallesAnimales),
    })

    if (!detallesResponse.ok) {
      const errorText = await detallesResponse.text()
      console.error(`Error creando detalles: ${detallesResponse.status} - ${errorText}`)
      throw new Error(`Error creando detalles: ${errorText}`)
    }

    const detalles = await detallesResponse.json()
    console.log("✅ Detalles creados:", detalles)

    return NextResponse.json({
      success: true,
      actividad,
      detalles,
      message: "Actividad de destete guardada exitosamente",
    })
  } catch (error) {
    console.error("💥 Error guardando actividad de destete:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
