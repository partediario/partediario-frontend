import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const insumoClaseId = searchParams.get("insumo_clase_id")
    const insumoId = searchParams.get("insumo_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    let query = supabase.from("pd_movimientos_insumos_view").select("*").eq("establecimiento_id", establecimientoId)

    // Aplicar filtros opcionales
    if (insumoClaseId) {
      query = query.eq("insumo_clase_id", insumoClaseId)
    }

    if (insumoId) {
      query = query.eq("pd_id", insumoId)
    }

    // Ordenar por nombre del insumo
    query = query.order("pd_nombre", { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching pd_movimientos_insumos_view:", error)
      return NextResponse.json({ error: "Error al consultar los datos" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching pd_movimientos_insumos_view:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
