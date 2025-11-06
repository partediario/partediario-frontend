import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Construir la URL con el filtro correcto
    let url = `${supabaseUrl}/rest/v1/pd_categoria_animales?select=id,nombre,sexo,edad,empresa_id&order=empresa_id.asc,id.asc`

    if (empresaId === "1") {
      // Solo empresa 1
      url += "&empresa_id=eq.1"
    } else {
      // Empresa 1 Y empresa seleccionada
      url += `&empresa_id=in.(1,${empresaId})`
    }

    console.log(`URL completa para empresa ${empresaId}: ${url}`)

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

    console.log(`Categorías obtenidas para empresa ${empresaId}:`, {
      total: categorias.length,
      empresas: [...new Set(categorias.map((c: any) => c.empresa_id))],
      categorias: categorias.map((c: any) => ({ id: c.id, nombre: c.nombre, empresa_id: c.empresa_id })),
    })

    // Verificar que solo tenemos las empresas correctas
    const empresasEncontradas = [...new Set(categorias.map((c: any) => c.empresa_id))]
    const empresasEsperadas = empresaId === "1" ? [1] : [1, Number.parseInt(empresaId)]

    console.log(
      `Empresas esperadas: [${empresasEsperadas.join(", ")}], Empresas encontradas: [${empresasEncontradas.join(", ")}]`,
    )

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
