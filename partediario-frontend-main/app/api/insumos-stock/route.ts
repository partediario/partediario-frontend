import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const insumo_id = searchParams.get("insumo_id")

    let query = supabase.from("pd_insumos_stock").select("*").order("id", { ascending: true })

    if (insumo_id) {
      query = query.eq("insumo_id", insumo_id)
    }

    const { data: stock, error } = await query

    if (error) {
      console.error("Error fetching stock:", error)
      return NextResponse.json({ error: "Error al obtener stock" }, { status: 500 })
    }

    return NextResponse.json({ stock: stock || [] })
  } catch (error) {
    console.error("Error in GET /api/insumos-stock:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { insumo_id, cantidad } = body

    // Validaciones
    if (!insumo_id) {
      return NextResponse.json({ error: "insumo_id es requerido" }, { status: 400 })
    }

    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 })
    }

    const { data: stock, error } = await supabase
      .from("pd_insumos_stock")
      .insert({
        insumo_id: Number.parseInt(insumo_id),
        cantidad: Number.parseInt(cantidad),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating stock:", error)
      return NextResponse.json({ error: "Error al crear stock" }, { status: 500 })
    }

    return NextResponse.json({ stock })
  } catch (error) {
    console.error("Error in POST /api/insumos-stock:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
