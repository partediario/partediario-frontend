import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log("=== API LOTE STOCK CATEGORIA ===")

  try {
    const { searchParams } = new URL(request.url)
    const establecimiento_id = searchParams.get("establecimiento_id")

    console.log("📋 Parámetros recibidos:")
    console.log("  - establecimiento_id:", establecimiento_id)

    if (!establecimiento_id) {
      console.log("❌ Error: establecimiento_id es requerido")
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    console.log("🔗 Conectando a Supabase...")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("📊 Consultando vista pd_lote_stock_categoria_por_empresa_view...")

    const { data, error } = await supabase
      .from("pd_lote_stock_categoria_por_empresa_view")
      .select("*")
      .eq("establecimiento_id", establecimiento_id)
      .order("categoria_animal_nombre")

    if (error) {
      console.error("❌ Error en consulta Supabase:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    console.log("✅ Datos obtenidos:")
    console.log("  - Número de registros:", data?.length || 0)
    console.log("  - Datos:", data)

    return NextResponse.json({
      categorias: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error("💥 Error general en API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
