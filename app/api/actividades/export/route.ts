import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Workbook } from "exceljs"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para formatear fecha sin conversión a Date
const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return ""

  if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = fechaStr.split("-")
    return `${day}/${month}/${year}`
  }

  if (fechaStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return fechaStr
  }

  return fechaStr
}

// Función para formatear ubicación
const formatearUbicacion = (ubicacion: string) => {
  if (!ubicacion) return ""

  const ubicacionesMap: { [key: string]: string } = {
    CAMPO: "Campo",
    CORRAL: "Corral",
    ADMINISTRACION: "Administración",
    OFICINA: "Oficina",
    DEPOSITO: "Depósito",
    GALPONES: "Galpones",
  }

  return ubicacionesMap[ubicacion.toUpperCase()] || ubicacion
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const formato = searchParams.get("formato") || "csv"

    if (!establecimientoId) {
      return NextResponse.json(
        {
          success: false,
          error: "establecimiento_id es requerido",
        },
        { status: 400 },
      )
    }

    console.log("Exportando actividades for establecimiento:", establecimientoId, "formato:", formato)

    // Obtener todas las actividades
    const { data, error } = await supabase
      .from("pd_actividades_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false })

    if (error) {
      console.error("Error fetching actividades for export:", error)
      throw error
    }

    // Formatear los datos para exportación
    const actividadesParaExportar =
      data?.map((actividad: any) => ({
        Fecha: formatearFecha(actividad.fecha),
        Hora: actividad.hora || "",
        "Tipo de Actividad": actividad.tipo_actividad_nombre || "",
        "Categoría de Actividad": actividad.categoria_actividad_nombre || "",
        Empleado: actividad.usuario || "",
        Ubicación: formatearUbicacion(actividad.tipo_actividad_ubicacion),
        Empresa: actividad.empresa || "",
        Establecimiento: actividad.establecimiento || "",
        "Insumo Utilizado": actividad.insumo_nombre || "",
        "Cantidad Insumo": actividad.insumo_cantidad || "",
        "Categoría Animal": actividad.categoria_animal || "",
        "Cantidad Animal": actividad.animal_cantidad || "",
        "Peso Total Animales": actividad.peso_total_animales || "",
        "Peso Promedio Animales": actividad.peso_promedio_animales || "",
      })) || []

    if (formato === "json") {
      return NextResponse.json({
        success: true,
        data: actividadesParaExportar,
      })
    }

    // Generar CSV
    if (actividadesParaExportar.length === 0) {
      return new NextResponse("No hay datos para exportar", { status: 404 })
    }

    const headers = Object.keys(actividadesParaExportar[0])
    const csvContent = [
      headers.join(","),
      ...actividadesParaExportar.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="actividades_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error in actividades export API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actividades, format, filters } = body

    console.log("Exporting actividades:", { count: actividades?.length, format, filters })

    if (!actividades || !Array.isArray(actividades)) {
      return NextResponse.json({ error: "Datos de actividades requeridos" }, { status: 400 })
    }

    // Función para formatear fecha sin conversión a Date
    const formatearFecha = (fechaStr: string) => {
      if (!fechaStr) return ""

      if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fechaStr.split("-")
        return `${day}/${month}/${year}`
      }

      if (fechaStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return fechaStr
      }

      return fechaStr
    }

    // Función para formatear ubicación
    const formatearUbicacion = (ubicacion: string) => {
      if (!ubicacion) return ""

      const ubicacionesMap: { [key: string]: string } = {
        CAMPO: "Campo",
        CORRAL: "Corral",
        ADMINISTRACION: "Administración",
        OFICINA: "Oficina",
        DEPOSITO: "Depósito",
        GALPONES: "Galpones",
      }

      return ubicacionesMap[ubicacion.toUpperCase()] || ubicacion
    }

    if (format === "pdf") {
      // Para PDF, retornamos los datos para que el cliente genere el PDF
      const pdfData = {
        title: "Actividades del Personal",
        subtitle: `Establecimiento: ${filters?.establecimiento || "Todos"}`,
        date: new Date().toLocaleDateString("es-ES"),
        filters: {
          establecimiento: filters?.establecimiento || "Todos",
          ubicacion: filters?.ubicacion || "Todas",
          empleado: filters?.empleado || "Todos",
          busqueda: filters?.busqueda || "Sin filtro",
        },
        data: actividades.map((act: any) => ({
          fecha: act.fecha_formateada || formatearFecha(act.fecha),
          actividad: act.tipo_actividad_nombre,
          empleado: act.usuario,
          ubicacion: act.tipo_actividad_ubicacion_formateada || formatearUbicacion(act.tipo_actividad_ubicacion),
          insumo: act.insumo_nombre || "",
          cantidadInsumo: act.insumo_cantidad || "",
          animal: act.categoria_animal || "",
          cantidadAnimal: act.animal_cantidad || "",
          pesoTotalAnimales: act.peso_total_animales || "",
          pesoPromedioAnimales: act.peso_promedio_animales || "",
        })),
      }

      return NextResponse.json({
        success: true,
        format: "pdf",
        data: pdfData,
      })
    }

    if (format === "xlsx") {
      // Para XLSX, preparamos los datos en formato tabular
      const workbook = new Workbook()
      const worksheet = workbook.addWorksheet("Actividades")

      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Hora", key: "hora", width: 10 },
        { header: "Tipo de Actividad", key: "actividad", width: 20 },
        { header: "Categoría de Actividad", key: "categoriaActividad", width: 20 },
        { header: "Empleado", key: "empleado", width: 20 },
        { header: "Ubicación", key: "ubicacion", width: 20 },
        { header: "Empresa", key: "empresa", width: 20 },
        { header: "Establecimiento", key: "establecimiento", width: 20 },
        { header: "Insumo Utilizado", key: "insumo", width: 20 },
        { header: "Cantidad Insumo", key: "cantidadInsumo", width: 15 },
        { header: "Categoría Animal", key: "animal", width: 20 },
        { header: "Cantidad Animal", key: "cantidadAnimal", width: 15 },
        { header: "Peso Total Animales", key: "pesoTotalAnimales", width: 20 },
        { header: "Peso Promedio Animales", key: "pesoPromedioAnimales", width: 20 },
      ]

      actividades?.forEach((actividad) => {
        worksheet.addRow({
          fecha: formatearFecha(actividad.fecha),
          hora: actividad.hora || "",
          actividad: actividad.tipo_actividad_nombre,
          categoriaActividad: actividad.categoria_actividad_nombre || "",
          empleado: actividad.usuario,
          ubicacion: formatearUbicacion(actividad.tipo_actividad_ubicacion),
          empresa: actividad.empresa || "",
          establecimiento: actividad.establecimiento || "",
          insumo: actividad.insumo_nombre || "",
          cantidadInsumo: actividad.insumo_cantidad || "",
          animal: actividad.categoria_animal || "",
          cantidadAnimal: actividad.animal_cantidad || "",
          pesoTotalAnimales: actividad.peso_total_animales || "",
          pesoPromedioAnimales: actividad.peso_promedio_animales || "",
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="actividades_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting actividades:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
