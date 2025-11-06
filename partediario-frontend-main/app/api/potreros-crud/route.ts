import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_potreros?select=id,nombre,superficie_total,superfice_util,recurso_forrajero,receptividad,receptividad_unidad,establecimiento_id&establecimiento_id=eq.${establecimientoId}&order=id.asc`

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

    const potreros = await response.json()

    return NextResponse.json({ potreros })
  } catch (error) {
    console.error("Error fetching potreros:", error)
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
    const {
      nombre,
      superficie_total,
      superfice_util,
      recurso_forrajero,
      receptividad,
      receptividad_unidad,
      establecimiento_id,
      empresa_id,
    } = body

    if (!nombre || !superficie_total || !establecimiento_id) {
      return NextResponse.json({ error: "Nombre, superficie total y establecimiento son requeridos" }, { status: 400 })
    }

    // Validar valores de enum para receptividad_unidad
    const unidadesValidas = ["UG", "KILOS"]
    if (receptividad_unidad && !unidadesValidas.includes(receptividad_unidad)) {
      return NextResponse.json(
        { error: "Unidad de receptividad no válida. Valores permitidos: UG, KILOS" },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_potreros`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        nombre: nombre.trim(),
        superficie_total: Number.parseFloat(superficie_total),
        superfice_util: superfice_util ? Number.parseFloat(superfice_util) : null,
        recurso_forrajero: recurso_forrajero || null,
        receptividad: receptividad ? Number.parseFloat(receptividad) : null,
        receptividad_unidad: receptividad_unidad || null,
        establecimiento_id: Number.parseInt(establecimiento_id),
        empresa_id: empresa_id ? Number.parseInt(empresa_id) : null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error creando potrero: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const potrero = await response.json()

    return NextResponse.json({ potrero: potrero[0] })
  } catch (error) {
    console.error("Error creating potrero:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
