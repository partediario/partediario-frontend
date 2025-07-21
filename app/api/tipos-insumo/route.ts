import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clase_insumo_id = searchParams.get("clase_insumo_id")

    let query = supabase.from("pd_tipos_insumo").select("*").order("id", { ascending: true })

    if (clase_insumo_id) {
      query = query.eq("clase_insumo_id", clase_insumo_id)
    }

    const { data: tipos, error } = await query

    if (error) {
      console.error("Error fetching tipos:", error)
      return NextResponse.json({ error: "Error al obtener tipos de insumos" }, { status: 500 })
    }

    return NextResponse.json({ tipos: tipos || [] })
  } catch (error) {
    console.error("Error in GET /api/tipos-insumo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
