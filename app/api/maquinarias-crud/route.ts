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

    const url = `${supabaseUrl}/rest/v1/pd_maquinarias?select=id,nombre,categoria,marca,modelo,empresa_id&empresa_id=eq.${empresaId}&order=id.asc`

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

    const maquinarias = await response.json()

    return NextResponse.json({ maquinarias })
  } catch (error) {
    console.error("Error fetching maquinarias:", error)
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
    const { nombre, categoria, marca, modelo, empresa_id } = body

    if (!nombre || !empresa_id) {
      return NextResponse.json({ error: "Nombre y empresa son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Verificar si ya existe una maquinaria con el mismo nombre en la empresa
    const checkNombreUrl = `${supabaseUrl}/rest/v1/pd_maquinarias?select=id&empresa_id=eq.${empresa_id}&nombre=eq.${encodeURIComponent(nombre.trim())}`

    const checkNombreResponse = await fetch(checkNombreUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (checkNombreResponse.ok) {
      const existingMaquinarias = await checkNombreResponse.json()
      if (existingMaquinarias.length > 0) {
        return NextResponse.json(
          { error: `Ya existe una maquinaria con el nombre "${nombre.trim()}" en esta empresa` },
          { status: 400 },
        )
      }
    }

    const url = `${supabaseUrl}/rest/v1/pd_maquinarias`

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
        categoria: categoria?.trim() || null,
        marca: marca?.trim() || null,
        modelo: modelo?.trim() || null,
        empresa_id: Number.parseInt(empresa_id),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error creando maquinaria: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const maquinaria = await response.json()

    return NextResponse.json({ maquinaria: maquinaria[0] })
  } catch (error) {
    console.error("Error creating maquinaria:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
