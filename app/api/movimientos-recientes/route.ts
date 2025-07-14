import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const search = searchParams.get("search")
    const tipo = searchParams.get("tipo")
    const fechaDesde = searchParams.get("fecha_desde")
    const fechaHasta = searchParams.get("fecha_hasta")

    console.log("Fetching movimientos recientes with params:", {
      establecimientoId,
      search,
      tipo,
      fechaDesde,
      fechaHasta,
    })

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Construir la consulta con filtros
    let query = `${supabaseUrl}/rest/v1/pd_movimientos_animales_view?establecimiento_id=eq.${establecimientoId}`

    // Filtro por tipo de movimiento - usar comparación exacta en lugar de ilike
    if (tipo && tipo !== "todos") {
      query += `&tipo_movimiento=eq.${tipo}`
    }

    // Filtro por rango de fechas
    if (fechaDesde) {
      query += `&fecha=gte.${fechaDesde}`
    }
    if (fechaHasta) {
      query += `&fecha=lte.${fechaHasta}`
    }

    // Ordenar por fecha y hora descendente (más recientes primero)
    query += "&order=fecha.desc,hora.desc"

    console.log("Query URL:", query)

    const response = await fetch(query, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error fetching movimientos:", errorText)
      throw new Error(`Error fetching movimientos: ${errorText}`)
    }

    let movimientos = await response.json()
    console.log("Movimientos fetched:", movimientos.length)

    // Filtro por búsqueda (categoría, usuario, tipo de movimiento)
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim()
      movimientos = movimientos.filter(
        (mov: any) =>
          mov.categoria_animal?.toLowerCase().includes(searchLower) ||
          mov.usuario?.toLowerCase().includes(searchLower) ||
          mov.movimiento?.toLowerCase().includes(searchLower) ||
          mov.tipo_movimiento?.toLowerCase().includes(searchLower),
      )
      console.log("Movimientos after search filter:", movimientos.length)
    }

    // Asegurar que cada movimiento tenga un ID único para evitar keys duplicadas
    movimientos = movimientos.map((mov: any, index: number) => ({
      ...mov,
      unique_key: `${mov.movimiento_id}_${index}`, // Crear una key única
    }))

    return NextResponse.json({
      success: true,
      movimientos: movimientos,
      total: movimientos.length,
    })
  } catch (error) {
    console.error("Error completo fetching movimientos recientes:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
