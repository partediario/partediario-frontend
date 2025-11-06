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
      console.error("❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_movimientos_animales_agg1_view?establecimiento_id=eq.${establecimientoId}&tipo_movimiento=eq.ENTRADA&movimiento=eq.Compra&select=cantidad_animales`

    console.log(`🔍 Consultando compras: ${url}`)

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
      return NextResponse.json({ error: "Error consultando compras" }, { status: response.status })
    }

    const data = await response.json()
    console.log("📊 Datos de compras:", data)

    // Sumar todas las cantidades si hay múltiples registros
    const total = data.reduce((sum: number, item: any) => sum + (item.cantidad_animales || 0), 0)

    return NextResponse.json({ total })
  } catch (error) {
    console.error("❌ Error obteniendo compras:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
