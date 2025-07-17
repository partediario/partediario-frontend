import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Función para obtener rango de fechas con zona horaria correcta
const obtenerRangoFechas = (periodo: string) => {
  // Obtener fecha actual en zona horaria local (Argentina/Paraguay - UTC-3)
  const ahora = new Date()

  // Ajustar a zona horaria local (UTC-3)
  const offsetLocal = -3 * 60 // -3 horas en minutos
  const fechaLocal = new Date(ahora.getTime() + offsetLocal * 60 * 1000)

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const año = fechaLocal.getFullYear()
  const mes = String(fechaLocal.getMonth() + 1).padStart(2, "0")
  const dia = String(fechaLocal.getDate()).padStart(2, "0")
  const fechaHoy = `${año}-${mes}-${dia}`

  console.log("🕐 Fecha local calculada para categorías:", fechaHoy, "período:", periodo)

  switch (periodo) {
    case "hoy":
      return {
        fechaInicio: fechaHoy,
        fechaFin: fechaHoy,
      }

    case "semana":
      // Calcular fecha de hace 7 días
      const fechaInicioSemana = new Date(fechaLocal)
      fechaInicioSemana.setDate(fechaLocal.getDate() - 6) // 7 días incluyendo hoy

      const añoSemana = fechaInicioSemana.getFullYear()
      const mesSemana = String(fechaInicioSemana.getMonth() + 1).padStart(2, "0")
      const diaSemana = String(fechaInicioSemana.getDate()).padStart(2, "0")
      const fechaInicioSemanaStr = `${añoSemana}-${mesSemana}-${diaSemana}`

      return {
        fechaInicio: fechaInicioSemanaStr,
        fechaFin: fechaHoy,
      }

    case "mes":
      // Calcular fecha de hace 30 días
      const fechaInicioMes = new Date(fechaLocal)
      fechaInicioMes.setDate(fechaLocal.getDate() - 29) // 30 días incluyendo hoy

      const añoMes = fechaInicioMes.getFullYear()
      const mesMes = String(fechaInicioMes.getMonth() + 1).padStart(2, "0")
      const diaMes = String(fechaInicioMes.getDate()).padStart(2, "0")
      const fechaInicioMesStr = `${añoMes}-${mesMes}-${diaMes}`

      return {
        fechaInicio: fechaInicioMesStr,
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
        console.log("📅 Filtrando categorías por fechas:", rangoFechas)
        query = query.gte("fecha", rangoFechas.fechaInicio).lte("fecha", rangoFechas.fechaFin)
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

    console.log("✅ Categorías encontradas:", categorias.length, "para período:", periodo)

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
