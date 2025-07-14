import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const anho = searchParams.get("anho") || new Date().getFullYear().toString()

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_lluvias_anho_total_view?establecimiento_id=eq.${establecimientoId}&anho=eq.${anho}&select=total_lluvia_anho`

    console.log(`🔍 Consultando lluvia total: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    })

    if (!response.ok) {
      console.error(`❌ Error en respuesta de Supabase: ${response.status}`)
      return NextResponse.json({ error: "Error consultando lluvia total" }, { status: response.status })
    }

    const data = await response.json()
    console.log("📊 Datos de lluvia total:", data)

    // Obtener el total de lluvia del primer registro
    const total = data.length > 0 ? data[0].total_lluvia_anho || 0 : 0

    return NextResponse.json({ total, anho })
  } catch (error) {
    console.error("❌ Error obteniendo lluvia total:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
