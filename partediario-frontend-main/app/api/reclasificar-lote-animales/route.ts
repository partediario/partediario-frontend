import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { p_lote_id, p_categoria_origen_id, p_categoria_destino_id, p_cantidad_a_mover, p_peso_promedio_animal } =
      body

    console.log("=== API RECLASIFICAR LOTE ANIMALES ===")
    console.log("📋 Parámetros recibidos:")
    console.log("  - p_lote_id:", p_lote_id)
    console.log("  - p_categoria_origen_id:", p_categoria_origen_id)
    console.log("  - p_categoria_destino_id:", p_categoria_destino_id)
    console.log("  - p_cantidad_a_mover:", p_cantidad_a_mover)
    console.log("  - p_peso_promedio_animal:", p_peso_promedio_animal)

    if (
      !p_lote_id ||
      !p_categoria_origen_id ||
      !p_categoria_destino_id ||
      !p_cantidad_a_mover ||
      !p_peso_promedio_animal
    ) {
      return NextResponse.json({ error: "Todos los parámetros son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/reclasificar_lote_animales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        p_lote_id: Number.parseInt(p_lote_id),
        p_categoria_origen_id: Number.parseInt(p_categoria_origen_id),
        p_categoria_destino_id: Number.parseInt(p_categoria_destino_id),
        p_cantidad_a_mover: Number.parseInt(p_cantidad_a_mover),
        p_peso_promedio_animal: Number.parseFloat(p_peso_promedio_animal),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en respuesta de Supabase: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ Reclasificación exitosa:", result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("💥 Error en reclasificación:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
