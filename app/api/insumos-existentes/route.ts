import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "Se requiere establecimiento_id" }, { status: 400 })
    }

    // Usar la vista insumos_existentes_view y filtrar directamente por establecimiento_id
    const { data: insumosExistentes, error: insumosError } = await supabase
      .from("insumos_existentes_view")
      .select("insumo_id, nombre_insumo, establecimiento_id, cantidad_disponible, unidad_medida_uso")
      .eq("establecimiento_id", establecimientoId) // Filtrar directamente por establecimiento_id
      .gte("cantidad_disponible", 0) // Insumos con stock >= 0 (incluye stock 0)
      .order("insumo_id", { ascending: true }) // Ordenar por insumo_id ascendente

    if (insumosError) {
      console.error("Error obteniendo insumos existentes:", insumosError)
      return NextResponse.json(
        { error: "Error al obtener insumos existentes", details: insumosError.message },
        { status: 500 },
      )
    }

    // Obtener todas las unidades de medida en consulta separada
    const { data: unidades, error: unidadesError } = await supabase
      .from("pd_unidad_medida_insumos")
      .select("id, nombre")
      .order("id", { ascending: true }) // Ordenar unidades por id ascendente

    if (unidadesError) {
      console.error("Error obteniendo unidades:", unidadesError)
      return NextResponse.json({ error: "Error al obtener unidades", details: unidadesError.message }, { status: 500 })
    }

    // Mapear unidades por ID para fácil acceso
    const unidadesMap = new Map(unidades?.map((u) => [u.id, u.nombre]) || [])

    const insumosFormateados = (insumosExistentes || []).map((insumo) => ({
      insumo_id: insumo.insumo_id.toString(),
      nombre_insumo: insumo.nombre_insumo,
      cantidad_disponible: insumo.cantidad_disponible,
      unidad_medida: unidadesMap.get(insumo.unidad_medida_uso) || "Unidad",
      unidad_medida_uso_id: insumo.unidad_medida_uso,
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
