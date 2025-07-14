import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log("🔄 API lote-stock-individual - Iniciando...")

  try {
    const { searchParams } = new URL(request.url)
    const establecimiento_id = searchParams.get("establecimiento_id")
    const lote_id = searchParams.get("lote_id")

    console.log("📋 Parámetros recibidos:")
    console.log("- establecimiento_id:", establecimiento_id)
    console.log("- lote_id:", lote_id)

    if (!establecimiento_id || !lote_id) {
      console.log("❌ Error: Faltan parámetros requeridos")
      return NextResponse.json({ error: "establecimiento_id y lote_id son requeridos" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("✅ Cliente Supabase creado")

    // Consultar la vista pd_lote_stock_categoria_view
    console.log("🔍 Consultando vista pd_lote_stock_categoria_view...")
    const { data: categorias, error } = await supabase
      .from("pd_lote_stock_categoria_view")
      .select("*")
      .eq("establecimiento_id", Number(establecimiento_id))
      .eq("lote_id", Number(lote_id))

    if (error) {
      console.error("❌ Error consultando vista:", error)
      return NextResponse.json(
        {
          error: "Error al consultar los datos de stock",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("📊 Datos obtenidos de la vista:", categorias?.length || 0, "registros")

    if (!categorias || categorias.length === 0) {
      console.log("⚠️ No se encontraron registros")
      return NextResponse.json({
        categorias: [],
        message: "No se encontraron registros de stock para este lote",
      })
    }

    // Mapear los datos para que coincidan con la interfaz esperada
    const categoriasFormateadas = categorias.map((cat) => ({
      lote_stock_id: cat.lote_stock_id,
      lote_id: cat.lote_id,
      empresa_id: cat.empresa_id,
      establecimiento_id: cat.establecimiento_id,
      categoria_animal_id: cat.categoria_animal_id,
      categoria_animal_nombre: cat.categoria_animal_nombre,
      sexo: cat.sexo,
      edad: cat.edad,
      cantidad: cat.cantidad,
      peso_total: cat.peso_total,
    }))

    console.log("✅ Datos formateados:", categoriasFormateadas.length, "registros")

    return NextResponse.json({
      categorias: categoriasFormateadas,
      total: categoriasFormateadas.length,
    })
  } catch (error) {
    console.error("❌ Error general en API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
