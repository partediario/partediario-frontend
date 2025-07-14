import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id")
    const soloAnimales = searchParams.get("solo_animales") === "true"

    if (!empresaId) {
      return NextResponse.json({ error: "empresa_id es requerido" }, { status: 400 })
    }

    // Query base - obtener tipos de actividades de empresa por defecto (1) y empresa seleccionada
    let query = supabase
      .from("pd_tipo_actividades")
      .select("id, nombre, ubicacion, descripcion, animales, insumos")
      .or(`empresa_id.eq.1,empresa_id.eq.${empresaId}`)
      .order("id", { ascending: true })

    // Solo aplicar filtros de animales si se solicita específicamente
    if (soloAnimales) {
      query = query.eq("animales", "OBLIGATORIO").eq("insumos", "NO APLICA")
    }

    const { data: tiposActividades, error } = await query

    if (error) {
      console.error("Error fetching tipos actividades:", error)
      return NextResponse.json({ error: "Error al obtener tipos de actividades" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tipos_actividades: tiposActividades || [],
    })
  } catch (error) {
    console.error("Error in tipos-actividades API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
