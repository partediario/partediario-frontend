import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Variables de entorno faltantes:", { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("Fetching lotes para establecimiento_id:", establecimientoId)

    const response = await fetch(
      `${supabaseUrl}/rest/v1/pd_lotes?establecimiento_id=eq.${establecimientoId}&select=id,nombre&order=id.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error("Error en respuesta de Supabase:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Detalle del error:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const lotes = await response.json()
    console.log("Lotes obtenidos (ordenados por ID asc):", lotes)

    return NextResponse.json({ lotes })
  } catch (error) {
    console.error("Error fetching lotes:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
