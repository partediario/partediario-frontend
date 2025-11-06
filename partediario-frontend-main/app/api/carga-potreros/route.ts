import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    console.log("🔍 [API carga-potreros] establecimiento_id:", establecimientoId)

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("pd_carga_potreros_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("potrero", { ascending: true })

    console.log("📊 [API carga-potreros] Datos encontrados:", data?.length || 0, "registros")
    console.log("❓ [API carga-potreros] Error de consulta:", error)

    if (error) {
      console.error("❌ [API carga-potreros] Error en consulta:", error)
      return NextResponse.json({ error: "Error al consultar datos de carga por potrero" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.log("📭 [API carga-potreros] No se encontraron datos para el establecimiento")
      return NextResponse.json([])
    }

    console.log("✅ [API carga-potreros] Datos devueltos:", data.length, "potreros")
    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 [API carga-potreros] Error interno:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
