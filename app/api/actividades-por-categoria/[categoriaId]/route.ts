import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Función para formatear fechas sin conversión a Date
const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return ""

  if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = fechaStr.split("-")
    return `${day}/${month}/${year}`
  }

  return fechaStr
}

// Función para formatear ubicaciones
const formatearUbicacion = (ubicacion: string) => {
  if (!ubicacion) return ""

  const ubicacionLower = ubicacion.toLowerCase()
  switch (ubicacionLower) {
    case "campo":
      return "Campo"
    case "corral":
      return "Corral"
    case "administracion":
      return "Administración"
    default:
      return ubicacion.charAt(0).toUpperCase() + ubicacion.slice(1).toLowerCase()
  }
}

// Función para obtener rango de fechas
const obtenerRangoFechas = (periodo: string) => {
  const hoy = new Date()
  const fechaHoy = hoy.toISOString().split("T")[0]

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

export async function GET(request: NextRequest, { params }: { params: { categoriaId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const periodo = searchParams.get("periodo")
    const categoriaId = params.categoriaId

    if (!establecimientoId) {
      return NextResponse.json(
        {
          success: false,
          error: "establecimiento_id es requerido",
        },
        { status: 400 },
      )
    }

    if (!categoriaId) {
      return NextResponse.json(
        {
          success: false,
          error: "categoriaId es requerido",
        },
        { status: 400 },
      )
    }

    console.log(
      "🔍 Consultando actividades de categoría:",
      categoriaId,
      "establecimiento:",
      establecimientoId,
      "período:",
      periodo,
    )

    // Construir la consulta base
    let query = supabase
      .from("pd_actividades_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .eq("categoria_actividad_id", categoriaId)

    // Aplicar filtro de fecha si se especifica un período
    if (periodo && periodo !== "todos") {
      const rangoFechas = obtenerRangoFechas(periodo)
      if (rangoFechas) {
        query = query.gte("fecha", rangoFechas.fechaInicio).lte("fecha", rangoFechas.fechaFin)
        console.log("📅 Filtrando actividades de categoría por fechas:", rangoFechas)
      }
    }

    // Ordenar por fecha y hora descendente
    query = query.order("fecha", { ascending: false }).order("hora", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("❌ Error fetching actividades de categoría:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Formatear los datos
    const actividadesFormateadas = (data || []).map((actividad: any) => ({
      ...actividad,
      fecha_formateada: formatearFecha(actividad.fecha),
      tipo_actividad_ubicacion_formateada: formatearUbicacion(actividad.tipo_actividad_ubicacion),
    }))

    console.log("✅ Actividades de categoría encontradas:", actividadesFormateadas.length)

    return NextResponse.json({
      success: true,
      actividades: actividadesFormateadas,
    })
  } catch (error) {
    console.error("❌ Error in actividades de categoría API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
