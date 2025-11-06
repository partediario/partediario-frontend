import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    console.log("🔍 [API carga-campo] establecimiento_id:", establecimientoId)

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Primero verificamos si existen datos
    const { data: allData, error: queryError } = await supabase
      .from("pd_carga_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)

    console.log("📊 [API carga-campo] Todos los datos encontrados:", allData)
    console.log("❓ [API carga-campo] Error de consulta:", queryError)

    if (queryError) {
      console.error("❌ [API carga-campo] Error en consulta:", queryError)
      return NextResponse.json({ error: "Error al consultar datos de carga del campo" }, { status: 500 })
    }

    if (!allData || allData.length === 0) {
      console.log("📭 [API carga-campo] No se encontraron datos para el establecimiento")
      return NextResponse.json({ error: "No hay datos disponibles para este establecimiento" }, { status: 404 })
    }

    // Si hay múltiples registros, tomamos el primero o los agregamos
    let result
    if (allData.length === 1) {
      result = allData[0]
      console.log("✅ [API carga-campo] Un registro encontrado:", result)
    } else {
      console.log("🔢 [API carga-campo] Múltiples registros encontrados:", allData.length)
      // Si hay múltiples registros, tomamos el primero
      result = allData[0]
      console.log("✅ [API carga-campo] Usando el primer registro:", result)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("💥 [API carga-campo] Error interno:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
