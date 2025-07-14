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
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("🔍 Obteniendo movimientos agregados para establecimiento:", establecimientoId)

    // Obtener datos agregados de la vista
    const response = await fetch(
      `${supabaseUrl}/rest/v1/pd_movimientos_animales_agg_view?establecimiento_id=eq.${establecimientoId}&order=fecha.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Error obteniendo movimientos agregados:", errorText)
      throw new Error(`Error obteniendo datos: ${errorText}`)
    }

    const movimientos = await response.json()
    console.log("📊 Movimientos obtenidos:", movimientos.length)

    // Calcular KPIs - Corregir el formato de los nombres de movimientos
    const compras = movimientos
      .filter((m: any) => m.tipo_movimiento === "ENTRADA" && m.movimiento === "Compra")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    const nacimientos = movimientos
      .filter((m: any) => m.tipo_movimiento === "ENTRADA" && m.movimiento === "Nacimiento")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    const ventas = movimientos
      .filter((m: any) => m.tipo_movimiento === "SALIDA" && m.movimiento === "Venta")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    const mortandad = movimientos
      .filter((m: any) => m.tipo_movimiento === "SALIDA" && m.movimiento === "Mortandad")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    const totalEntradas = movimientos
      .filter((m: any) => m.tipo_movimiento === "ENTRADA")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    const totalSalidas = movimientos
      .filter((m: any) => m.tipo_movimiento === "SALIDA")
      .reduce((sum: number, m: any) => sum + Number(m.cantidad_animales || 0), 0)

    // Calcular métricas
    const totalMovimientos = totalEntradas + totalSalidas
    const saldoNeto = totalEntradas - totalSalidas
    const tasaNatalidad = totalMovimientos > 0 ? (nacimientos / totalMovimientos) * 100 : 0
    const tasaMortandad = totalMovimientos > 0 ? (mortandad / totalMovimientos) * 100 : 0

    // Obtener fecha de última actualización
    const ultimaActualizacion = movimientos.length > 0 ? movimientos[0].fecha : new Date().toISOString()

    const resultado = {
      kpis: {
        compras,
        entradas: totalEntradas,
        nacimientos,
        mortandad,
        ventas,
        salidas: totalSalidas,
      },
      metricas: {
        totalMovimientos,
        saldoNeto,
        tasaNatalidad: Number(tasaNatalidad.toFixed(1)),
        tasaMortandad: Number(tasaMortandad.toFixed(1)),
      },
      ultimaActualizacion,
      rawData: movimientos,
    }

    console.log("📈 KPIs calculados:", resultado.kpis)
    console.log("📊 Métricas calculadas:", resultado.metricas)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("❌ Error completo en movimientos agregados:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
