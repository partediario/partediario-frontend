import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"

    console.log("🔍 Obteniendo insumos para empresa:", empresaId)

    // Obtener insumos filtrados por empresa_id (1 por defecto + empresa seleccionada)
    const empresaIds = empresaId === "1" ? [1] : [1, Number.parseInt(empresaId)]

    const { data: insumos, error } = await supabase
      .from("pd_insumos")
      .select(`
        id,
        nombre,
        contenido,
        unidad_medida_producto,
        unidad_medida_uso,
        pd_unidad_medida_insumos!pd_insumos_unidad_medida_uso_fkey(
          id,
          nombre
        )
      `)
      .in("empresa_id", empresaIds)
      .order("nombre", { ascending: true })

    if (error) {
      console.error("❌ Error al obtener insumos:", error)
      return NextResponse.json({ error: "Error al obtener insumos" }, { status: 500 })
    }

    console.log("✅ Insumos obtenidos:", insumos?.length || 0)

    return NextResponse.json({
      insumos: insumos || [],
      total: insumos?.length || 0,
    })
  } catch (error) {
    console.error("❌ Error en API insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
