import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const claseInsumoId = searchParams.get("clase_insumo_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "Se requiere establecimiento_id" }, { status: 400 })
    }

    let query = supabase
      .from("insumos_existentes_view")
      .select("insumo_id, nombre_insumo, establecimiento_id, cantidad_disponible, unidad_medida_uso, clase_insumo_id")
      .eq("establecimiento_id", establecimientoId)
      .gte("cantidad_disponible", 0)

    if (claseInsumoId) {
      query = query.eq("clase_insumo_id", claseInsumoId)
    }

    const { data: insumosExistentes, error: insumosError } = await query.order("insumo_id", { ascending: true })

    if (insumosError) {
      console.error("Error obteniendo insumos existentes:", insumosError)
      return NextResponse.json(
        { error: "Error al obtener insumos existentes", details: insumosError.message },
        { status: 500 },
      )
    }

    const { data: unidades, error: unidadesError } = await supabase
      .from("pd_unidad_medida_insumos")
      .select("id, nombre")
      .order("id", { ascending: true })

    if (unidadesError) {
      console.error("Error obteniendo unidades:", unidadesError)
      return NextResponse.json({ error: "Error al obtener unidades", details: unidadesError.message }, { status: 500 })
    }

    const unidadesMap = new Map(unidades?.map((u) => [u.id, u.nombre]) || [])

    const insumosFormateados = (insumosExistentes || []).map((insumo) => ({
      insumo_id: insumo.insumo_id.toString(),
      nombre_insumo: insumo.nombre_insumo,
      cantidad_disponible: insumo.cantidad_disponible,
      unidad_medida: unidadesMap.get(insumo.unidad_medida_uso) || "Unidad",
      unidad_medida_uso_id: insumo.unidad_medida_uso,
      clase_insumo_id: insumo.clase_insumo_id,
    }))

    return NextResponse.json({
      success: true,
      insumos: insumosFormateados,
    })
  } catch (error) {
    console.error("Error en GET /api/insumos-existentes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
