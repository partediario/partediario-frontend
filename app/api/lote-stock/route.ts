import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get("lote_id")

    if (!loteId) {
      return NextResponse.json({ error: "lote_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_lote_stock?select=id,lote_id,categoria_animal_id,cantidad,peso_total,pd_categoria_animales(nombre)&lote_id=eq.${loteId}&order=id.asc`

    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en respuesta de Supabase: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const stock = await response.json()

    return NextResponse.json({ stock })
  } catch (error) {
    console.error("Error fetching lote stock:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lote_id, categoria_animal_id, cantidad, peso_total } = body

    if (!lote_id || !categoria_animal_id || !cantidad) {
      return NextResponse.json({ error: "lote_id, categoria_animal_id y cantidad son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_lote_stock`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        lote_id: Number.parseInt(lote_id),
        categoria_animal_id: Number.parseInt(categoria_animal_id),
        cantidad: Number.parseInt(cantidad),
        peso_total: peso_total ? Number.parseInt(peso_total) : null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error creando stock: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const stock = await response.json()

    return NextResponse.json({ stock: stock[0] })
  } catch (error) {
    console.error("Error creating lote stock:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
