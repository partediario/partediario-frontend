import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo_insumo_id = searchParams.get("tipo_insumo_id")

    let query = supabase.from("pd_subtipos_insumo").select("*").order("id", { ascending: true })

    if (tipo_insumo_id) {
      query = query.eq("tipo_insumo_id", tipo_insumo_id)
    }

    const { data: subtipos, error } = await query

    if (error) {
      console.error("Error fetching subtipos:", error)
      return NextResponse.json({ error: "Error al obtener subtipos de insumos" }, { status: 500 })
    }

    return NextResponse.json({ subtipos: subtipos || [] })
  } catch (error) {
    console.error("Error in GET /api/subtipos-insumo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
