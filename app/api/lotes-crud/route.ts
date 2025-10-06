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

    const url = `${supabaseUrl}/rest/v1/pd_lotes?select=id,nombre,potrero_id,empresa_id,establecimiento_id,pd_potreros(nombre)&establecimiento_id=eq.${establecimientoId}&order=id.asc`

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

    const lotes = await response.json()

    return NextResponse.json({ lotes })
  } catch (error) {
    console.error("Error fetching lotes:", error)
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
    const { nombre, potrero_id, establecimiento_id, empresa_id } = body

    if (!nombre || !potrero_id || !establecimiento_id) {
      return NextResponse.json({ error: "Nombre, potrero y establecimiento son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const checkNombreUrl = `${supabaseUrl}/rest/v1/pd_lotes?select=id&establecimiento_id=eq.${establecimiento_id}&nombre=eq.${encodeURIComponent(nombre.trim())}`

    const checkNombreResponse = await fetch(checkNombreUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (checkNombreResponse.ok) {
      const existingLotes = await checkNombreResponse.json()
      if (existingLotes.length > 0) {
        return NextResponse.json(
          { error: `Ya existe un lote con el nombre "${nombre.trim()}" en este establecimiento` },
          { status: 400 },
        )
      }
    }

    const checkPotreroUrl = `${supabaseUrl}/rest/v1/pd_lotes?select=id,nombre&potrero_id=eq.${potrero_id}`

    const checkPotreroResponse = await fetch(checkPotreroUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (checkPotreroResponse.ok) {
      const lotesEnPotrero = await checkPotreroResponse.json()
      if (lotesEnPotrero.length > 0) {
        return NextResponse.json(
          { error: `El potrero seleccionado ya tiene asignado el lote "${lotesEnPotrero[0].nombre}"` },
          { status: 400 },
        )
      }
    }

    const url = `${supabaseUrl}/rest/v1/pd_lotes`

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
        potrero_id: Number.parseInt(potrero_id),
        establecimiento_id: Number.parseInt(establecimiento_id),
        empresa_id: empresa_id ? Number.parseInt(empresa_id) : null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error creando lote: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const lote = await response.json()

    return NextResponse.json({ lote: lote[0] })
  } catch (error) {
    console.error("Error creating lote:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
