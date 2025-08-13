import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimiento_id = searchParams.get("establecimiento_id")

    if (!establecimiento_id) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Usar la vista para obtener todos los lotes con su stock
    const { data, error } = await supabase
      .from("pd_lote_stock_view")
      .select("*")
      .eq("establecimiento_id", establecimiento_id)

    if (error) {
      console.error("Error fetching lotes stock:", error)
      return NextResponse.json({ error: "Error al obtener stock de lotes" }, { status: 500 })
    }

    // Transformar los datos para que coincidan con la estructura esperada
    const lotesStock = data.map((lote: any) => ({
      lote_id: lote.lote_id,
      lote_nombre: lote.lote_nombre,
      pd_detalles: lote.pd_detalles.map((detalle: any) => ({
        categoria_animal_id: detalle.categoria_animal_id,
        categoria_animal_nombre: detalle.categoria_animal_nombre,
        cantidad: detalle.cantidad,
        peso_promedio: detalle.peso_promedio || 0,
      })),
    }))

    return NextResponse.json(lotesStock)
  } catch (error) {
    console.error("Error in lotes-stock API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
