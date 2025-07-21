import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: clases, error } = await supabase.from("pd_clase_insumos").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching clases:", error)
      return NextResponse.json({ error: "Error al obtener clases de insumos" }, { status: 500 })
    }

    return NextResponse.json({ clases: clases || [] })
  } catch (error) {
    console.error("Error in GET /api/clase-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
