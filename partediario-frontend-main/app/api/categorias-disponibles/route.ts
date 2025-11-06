import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id")

    if (!empresaId) {
      return NextResponse.json({ error: "empresa_id es requerido" }, { status: 400 })
    }

    // Obtener categorías disponibles (empresa_id = 1 y empresa seleccionada)
    const { data: categorias, error } = await supabase
      .from("pd_categoria_animales")
      .select("*")
      .or(`empresa_id.eq.1,empresa_id.eq.${empresaId}`)
      .order("nombre")

    if (error) {
      console.error("Error fetching categorias disponibles:", error)
      return NextResponse.json({ error: "Error al obtener categorías disponibles" }, { status: 500 })
    }

    return NextResponse.json({ categorias: categorias || [] })
  } catch (error) {
    console.error("Error in GET /api/categorias-disponibles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
