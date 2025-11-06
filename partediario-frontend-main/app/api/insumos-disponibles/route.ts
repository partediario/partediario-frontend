import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    console.log("Buscando insumos para establecimiento:", establecimientoId)

    // Obtener el ID de la empresa del establecimiento
    const { data: establecimientoData, error: establecimientoError } = await supabase
      .from("pd_establecimientos")
      .select("empresa_id")
      .eq("id", establecimientoId)
      .single()

    if (establecimientoError || !establecimientoData) {
      console.error(
        "Error al obtener empresa_id del establecimiento:",
        establecimientoError?.message || "No se encontró el establecimiento",
      )
      return NextResponse.json(
        { error: "Establecimiento no encontrado o error al obtener empresa_id" },
        { status: 404 },
      )
    }

    const empresaId = establecimientoData.empresa_id

    // Obtener insumos filtrados por empresa_id
    const { data: insumos, error: insumosError } = await supabase
      .from("pd_insumos")
      .select("id, nombre, unidad_medida_uso, empresa_id")
      .eq("empresa_id", empresaId) // Filtrar por empresa_id
      .order("id", { ascending: true }) // Añadido: ordenar por id ascendente

    if (insumosError) {
      console.error("Error obteniendo insumos:", insumosError)
      return NextResponse.json({ error: "Error al obtener insumos", details: insumosError.message }, { status: 500 })
    }

    console.log("Insumos encontrados:", insumos?.length || 0)

    // Obtener unidades de medida por separado
    const { data: unidades, error: unidadesError } = await supabase
      .from("pd_unidad_medida_insumos")
      .select("id, nombre")

    if (unidadesError) {
      console.error("Error obteniendo unidades:", unidadesError)
      // Continuar sin unidades si hay error
    }

    // Crear mapa de unidades
    const unidadesMap = new Map()
    unidades?.forEach((unidad) => {
      unidadesMap.set(unidad.id, unidad.nombre)
    })

    // Formatear insumos
    const insumosFormateados = (insumos || []).map((insumo) => ({
      insumo_id: insumo.id.toString(),
      nombre_insumo: insumo.nombre,
      unidad_medida: unidadesMap.get(insumo.unidad_medida_uso) || "Unidad",
      unidad_medida_uso_id: insumo.unidad_medida_uso,
    }))

    console.log("Insumos formateados:", insumosFormateados.length)

    return NextResponse.json({
      success: true,
      insumos: insumosFormateados,
    })
  } catch (error: any) {
    console.error("Error en GET /api/insumos-disponibles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
