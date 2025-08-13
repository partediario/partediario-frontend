import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { categoria_animal_id, cantidad, peso_total } = body

    if (!categoria_animal_id || !cantidad) {
      return NextResponse.json({ error: "categoria_animal_id y cantidad son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_lote_stock?id=eq.${params.id}`

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        categoria_animal_id: Number.parseInt(categoria_animal_id),
        cantidad: Number.parseInt(cantidad),
        peso_total: peso_total ? Number.parseInt(peso_total) : null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error actualizando stock: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const stock = await response.json()

    return NextResponse.json({ stock: stock[0] })
  } catch (error) {
    console.error("Error updating lote stock:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_lote_stock?id=eq.${params.id}`

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error eliminando stock: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return NextResponse.json({ message: "Stock eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting lote stock:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
