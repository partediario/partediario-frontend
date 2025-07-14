import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id")

    if (!empresaId) {
      return NextResponse.json({ error: "empresa_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Construir filtros para empresa_id=1 y empresa seleccionada
    let empresaFilter = "empresa_id.eq.1"
    if (empresaId && empresaId !== "1") {
      empresaFilter = `empresa_id.in.(1,${empresaId})`
    }

    const url = `${supabaseUrl}/rest/v1/pd_categoria_animales?select=id,nombre,empresa_id&${empresaFilter}&order=id.asc`

    console.log("Fetching categorias from:", url)

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

    const categorias = await response.json()

    console.log(`Categorias encontradas: ${categorias.length}`)

    return NextResponse.json({ categorias })
  } catch (error) {
    console.error("Error fetching categorias:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
