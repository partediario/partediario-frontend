import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Obteniendo tipo de actividad con ID:", params.id)

    const { data: tipoActividad, error } = await supabase
      .from("pd_tipo_actividades")
      .select("id, nombre, animales, insumos")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error al obtener tipo de actividad:", error)
      return NextResponse.json({ error: "Error al obtener el tipo de actividad" }, { status: 500 })
    }

    if (!tipoActividad) {
      return NextResponse.json({ error: "Tipo de actividad no encontrado" }, { status: 404 })
    }

    console.log("Tipo de actividad obtenido:", tipoActividad)
    return NextResponse.json(tipoActividad)
  } catch (error) {
    console.error("Error en GET /api/tipos-actividades/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
