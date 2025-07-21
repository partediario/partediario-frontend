import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: unidades, error } = await supabase
      .from("pd_unidad_medida_insumos")
      .select("id, nombre")
      .order("id", { ascending: true })

    if (error) {
      console.error("Error obteniendo unidades de medida:", error)
      return NextResponse.json(
        { error: "Error al obtener unidades de medida", details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      unidades: unidades || [],
    })
  } catch (error) {
    console.error("Error en GET /api/unidad-medida-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
