import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nombre, categoria, marca, modelo } = body

    if (!nombre) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Obtener la maquinaria actual para verificar la empresa
    const getMaquinariaUrl = `${supabaseUrl}/rest/v1/pd_maquinarias?select=empresa_id&id=eq.${params.id}`
    const getMaquinariaResponse = await fetch(getMaquinariaUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!getMaquinariaResponse.ok) {
      throw new Error("No se pudo obtener la maquinaria")
    }

    const maquinariaData = await getMaquinariaResponse.json()
    if (maquinariaData.length === 0) {
      return NextResponse.json({ error: "Maquinaria no encontrada" }, { status: 404 })
    }

    const empresa_id = maquinariaData[0].empresa_id

    // Verificar si ya existe otra maquinaria con el mismo nombre en la empresa
    const checkNombreUrl = `${supabaseUrl}/rest/v1/pd_maquinarias?select=id&empresa_id=eq.${empresa_id}&nombre=eq.${encodeURIComponent(nombre.trim())}&id=neq.${params.id}`

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
          { error: `Ya existe otra maquinaria con el nombre "${nombre.trim()}" en esta empresa` },
          { status: 400 },
        )
      }
    }

    const url = `${supabaseUrl}/rest/v1/pd_maquinarias?id=eq.${params.id}`

    const response = await fetch(url, {
      method: "PATCH",
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
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error actualizando maquinaria: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const maquinaria = await response.json()

    return NextResponse.json({ maquinaria: maquinaria[0] })
  } catch (error) {
    console.error("Error updating maquinaria:", error)
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

    const url = `${supabaseUrl}/rest/v1/pd_maquinarias?id=eq.${params.id}`

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
      console.error(`Error eliminando maquinaria: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return NextResponse.json({ message: "Maquinaria eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting maquinaria:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
