import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Función para obtener rango de fechas
const obtenerRangoFechas = (periodo: string) => {
  const hoy = new Date()
  const fechaHoy = hoy.toISOString().split("T")[0] // YYYY-MM-DD

  switch (periodo) {
    case "hoy":
      return {
        fechaInicio: fechaHoy,
        fechaFin: fechaHoy,
      }

    case "semana":
      const inicioSemana = new Date(hoy)
      inicioSemana.setDate(hoy.getDate() - 7)
      return {
        fechaInicio: inicioSemana.toISOString().split("T")[0],
        fechaFin: fechaHoy,
      }

    case "mes":
      const inicioMes = new Date(hoy)
      inicioMes.setDate(hoy.getDate() - 30)
      return {
        fechaInicio: inicioMes.toISOString().split("T")[0],
        fechaFin: fechaHoy,
      }

    default:
      return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const periodo = searchParams.get("periodo")

    if (!establecimientoId) {
      return NextResponse.json(
        {
          success: false,
          error: "establecimiento_id es requerido",
        },
        { status: 400 },
      )
    }

    console.log(
      "🔍 Consultando categorías de actividades para establecimiento:",
      establecimientoId,
      "período:",
      periodo,
    )

    // Construir la consulta base
    let query = supabase
      .from("pd_actividades_view")
      .select("categoria_actividad_id, categoria_actividad_nombre")
      .eq("establecimiento_id", establecimientoId)

    // Aplicar filtro de fecha si se especifica un período
    if (periodo && periodo !== "todos") {
      const rangoFechas = obtenerRangoFechas(periodo)
      if (rangoFechas) {
        query = query.gte("fecha", rangoFechas.fechaInicio).lte("fecha", rangoFechas.fechaFin)
        console.log("📅 Filtrando categorías por fechas:", rangoFechas)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error fetching categorías:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Agrupar y contar por categoría de actividad
    const categoriasMap = new Map<number, { categoria_id: number; categoria_nombre: string; cantidad: number }>()

    data?.forEach((item: any) => {
      if (item.categoria_actividad_id && item.categoria_actividad_nombre) {
        const key = item.categoria_actividad_id
        if (categoriasMap.has(key)) {
          categoriasMap.get(key)!.cantidad += 1
        } else {
          categoriasMap.set(key, {
            categoria_id: item.categoria_actividad_id,
            categoria_nombre: item.categoria_actividad_nombre,
            cantidad: 1,
          })
        }
      }
    })

    // Convertir a array y ordenar por cantidad descendente
    const categorias = Array.from(categoriasMap.values()).sort((a, b) => b.cantidad - a.cantidad)

    console.log("✅ Categorías encontradas:", categorias.length)

    return NextResponse.json({
      success: true,
      categorias,
    })
  } catch (error) {
    console.error("❌ Error in categorías API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
