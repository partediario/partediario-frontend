import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Obtener datos de lluvia mensual del año actual
    const { data: lluviaData, error } = await supabase
      .from("partes_diarios")
      .select("pd_fecha, pd_descripcion")
      .eq("pd_establecimiento_id", establecimientoId)
      .eq("pd_tipo", "Lluvia")
      .gte("pd_fecha", `${year}-01-01`)
      .lte("pd_fecha", `${year}-12-31`)
      .order("pd_fecha", { ascending: true })

    if (error) {
      console.error("Error fetching lluvia data:", error)
      return NextResponse.json({ error: "Error al obtener datos de lluvia" }, { status: 500 })
    }

    // Procesar datos por mes
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i, 1).toLocaleDateString("es-ES", { month: "long" }),
      total: 0,
      days: [],
    }))

    lluviaData?.forEach((registro) => {
      const fecha = new Date(registro.pd_fecha)
      const month = fecha.getMonth()
      const day = fecha.getDate()
      const cantidad = Number.parseFloat(registro.pd_descripcion || "0")

      monthlyData[month].total += cantidad
      monthlyData[month].days.push({
        day,
        amount: cantidad,
        date: registro.pd_fecha,
      })
    })

    // Calcular totales
    const totalAnual = monthlyData.reduce((sum, month) => sum + month.total, 0)
    const mesActual = new Date().getMonth()
    const totalMesActual = monthlyData[mesActual].total

    return NextResponse.json({
      success: true,
      data: {
        totalAnual,
        totalMesActual,
        mesActualNombre: monthlyData[mesActual].monthName,
        monthlyData,
        year: Number.parseInt(year),
      },
    })
  } catch (error) {
    console.error("Error in lluvia-mensual API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
