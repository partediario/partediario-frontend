import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Función para formatear fechas sin conversión a Date
const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return ""

  // Si la fecha viene en formato YYYY-MM-DD, la parseamos directamente
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
      // Sin filtro de fecha
      return null
  }
}

const agruparActividades = (actividades: any[]) => {
  const actividadesAgrupadas = new Map()

  actividades.forEach((actividad) => {
    const actividadId = actividad.actividad_id

    if (!actividadesAgrupadas.has(actividadId)) {
      // Primera ocurrencia de esta actividad
      actividadesAgrupadas.set(actividadId, {
        ...actividad,
        detalles_combinados: [],
        detalles_completos: [],
      })
    }

    // Agregar detalles de animales/insumos si existen
    const actividadExistente = actividadesAgrupadas.get(actividadId)

    if (actividad.categoria_animal && actividad.animal_cantidad) {
      actividadExistente.detalles_combinados.push(`${actividad.categoria_animal} (${actividad.animal_cantidad})`)
      actividadExistente.detalles_completos.push({
        tipo: "animal",
        categoria: actividad.categoria_animal,
        cantidad: actividad.animal_cantidad,
        peso_total: actividad.peso_total_animales,
        peso_promedio: actividad.peso_promedio_animales,
        categoria_id: actividad.categoria_animal_id,
      })
    }

    if (actividad.insumo_nombre && actividad.insumo_cantidad) {
      actividadExistente.detalles_combinados.push(`${actividad.insumo_nombre} (${actividad.insumo_cantidad})`)
      actividadExistente.detalles_completos.push({
        tipo: "insumo",
        nombre: actividad.insumo_nombre,
        cantidad: actividad.insumo_cantidad,
        insumo_id: actividad.insumo_id,
      })
    }
  })

  // Convertir Map a array y formatear detalles
  const resultado = Array.from(actividadesAgrupadas.values()).map((actividad) => {
    const detallesCombinados =
      actividad.detalles_combinados.length > 0
        ? actividad.detalles_combinados.join(", ")
        : actividad.categoria_animal || actividad.insumo_nombre || ""

    return {
      ...actividad,
      detalle: detallesCombinados,
      detalles_completos: actividad.detalles_completos,
      // Remover campos temporales
      detalles_combinados: undefined,
    }
  })

  return resultado
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const ubicacion = searchParams.get("ubicacion")
    const empleado = searchParams.get("empleado")
    const busqueda = searchParams.get("busqueda")
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

    // Construir la consulta base
    let query = supabase.from("pd_actividades_view").select("*").eq("establecimiento_id", establecimientoId)

    // Aplicar filtro de fecha si se especifica un período
    if (periodo && periodo !== "todos") {
      const rangoFechas = obtenerRangoFechas(periodo)
      if (rangoFechas) {
        query = query.gte("fecha", rangoFechas.fechaInicio).lte("fecha", rangoFechas.fechaFin)
      }
    }

    // Aplicar otros filtros
    if (ubicacion && ubicacion !== "todos") {
      query = query.eq("tipo_actividad_ubicacion", ubicacion.toUpperCase())
    }

    if (empleado && empleado !== "todos") {
      query = query.eq("usuario", empleado)
    }

    if (busqueda && busqueda.trim()) {
      query = query.or(`tipo_actividad_nombre.ilike.%${busqueda}%,usuario.ilike.%${busqueda}%`)
    }

    // Ordenar por fecha y hora descendente
    query = query.order("fecha", { ascending: false }).order("hora", { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    const actividadesAgrupadas = agruparActividades(data || [])

    // Formatear los datos agrupados
    const actividadesFormateadas = actividadesAgrupadas.map((actividad: any) => ({
      ...actividad,
      fecha_formateada: formatearFecha(actividad.fecha),
      tipo_actividad_ubicacion_formateada: formatearUbicacion(actividad.tipo_actividad_ubicacion),
    }))

    return NextResponse.json({
      success: true,
      actividades: actividadesFormateadas,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
