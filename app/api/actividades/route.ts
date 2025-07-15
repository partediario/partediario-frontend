import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const ubicacion = searchParams.get("ubicacion")
    const empleado = searchParams.get("empleado")
    const busqueda = searchParams.get("busqueda")

    console.log("Fetching actividades with params:", {
      establecimientoId,
      ubicacion,
      empleado,
      busqueda,
    })

    let query = supabase.from("pd_actividades_view").select("*")

    // Filtrar por establecimiento (obligatorio)
    if (establecimientoId && establecimientoId !== "todos") {
      query = query.eq("establecimiento_id", establecimientoId)
    }

    // Filtrar por ubicación si se proporciona
    if (ubicacion && ubicacion !== "todos") {
      query = query.eq("tipo_actividad_ubicacion", ubicacion)
    }

    // Filtrar por empleado si se proporciona (por nombre, no por ID)
    if (empleado && empleado !== "todos") {
      query = query.eq("usuario", empleado)
    }

    // Búsqueda por texto
    if (busqueda && busqueda.trim() !== "") {
      query = query.or(`tipo_actividad_nombre.ilike.%${busqueda}%,usuario.ilike.%${busqueda}%`)
    }

    // Ordenar por fecha y hora más recientes primero
    query = query.order("fecha", { ascending: false }).order("hora", { ascending: false })

    // Limitar a 50 resultados para la vista
    query = query.limit(50)

    const { data: actividades, error } = await query

    if (error) {
      console.error("Error fetching actividades:", error)
      return NextResponse.json({ error: "Error al obtener las actividades", details: error.message }, { status: 500 })
    }

    // Formatear los datos antes de enviarlos
    const actividadesFormateadas = (actividades || []).map((actividad) => ({
      ...actividad,
      fecha_formateada: actividad.fecha
        ? new Date(actividad.fecha).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "",
      tipo_actividad_ubicacion_formateada: actividad.tipo_actividad_ubicacion
        ? actividad.tipo_actividad_ubicacion.charAt(0).toUpperCase() +
          actividad.tipo_actividad_ubicacion.slice(1).toLowerCase()
        : "",
    }))

    console.log(`Found ${actividadesFormateadas.length} actividades`)

    return NextResponse.json({
      success: true,
      actividades: actividadesFormateadas,
    })
  } catch (error) {
    console.error("Unexpected error in actividades API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
