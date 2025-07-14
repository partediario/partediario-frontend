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

    const response = await fetch(
      `${supabaseUrl}/rest/v1/categoria_animales_existentes_view?lote_id=eq.${loteId}&select=categoria_animal_id,nombre_categoria_animal,sexo,edad,lote_id&order=categoria_animal_id.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const categorias = await response.json()

    console.log(
      `Categorías existentes obtenidas para lote ${loteId} (ordenadas por categoria_animal_id asc):`,
      categorias.length,
    )

    return NextResponse.json({ categorias })
  } catch (error) {
    console.error("Error fetching categorias existentes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
