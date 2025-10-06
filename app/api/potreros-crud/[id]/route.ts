import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nombre, superficie_total, superfice_util, recurso_forrajero, receptividad, receptividad_unidad } = body

    console.log("Datos recibidos en API PUT:", body) // Para debug

    if (!nombre || !superficie_total) {
      return NextResponse.json({ error: "Nombre y superficie total son requeridos" }, { status: 400 })
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

    const getPotreroUrl = `${supabaseUrl}/rest/v1/pd_potreros?select=establecimiento_id&id=eq.${params.id}`
    const getPotreroResponse = await fetch(getPotreroUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!getPotreroResponse.ok) {
      throw new Error("No se pudo obtener el potrero")
    }

    const potreroData = await getPotreroResponse.json()
    if (potreroData.length === 0) {
      return NextResponse.json({ error: "Potrero no encontrado" }, { status: 404 })
    }

    const establecimiento_id = potreroData[0].establecimiento_id

    const checkUrl = `${supabaseUrl}/rest/v1/pd_potreros?select=id&establecimiento_id=eq.${establecimiento_id}&nombre=eq.${encodeURIComponent(nombre.trim())}&id=neq.${params.id}`

    const checkResponse = await fetch(checkUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (checkResponse.ok) {
      const existingPotreros = await checkResponse.json()
      if (existingPotreros.length > 0) {
        return NextResponse.json(
          { error: `Ya existe otro potrero con el nombre "${nombre.trim()}" en este establecimiento` },
          { status: 400 },
        )
      }
    }

    const url = `${supabaseUrl}/rest/v1/pd_potreros?id=eq.${params.id}`

    // Preparar datos para actualizar - usar Number() para preservar decimales
    const updateData = {
      nombre: nombre.trim(),
      superficie_total: Number(superficie_total),
      superfice_util: superfice_util ? Number(superfice_util) : null,
      recurso_forrajero: recurso_forrajero || null,
      receptividad: receptividad ? Number(receptividad) : null,
      receptividad_unidad: receptividad_unidad || null,
    }

    console.log("Datos a actualizar en BD:", updateData) // Para debug

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error actualizando potrero: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const potrero = await response.json()
    console.log("Potrero actualizado:", potrero[0]) // Para debug

    return NextResponse.json({ potrero: potrero[0] })
  } catch (error) {
    console.error("Error updating potrero:", error)
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

    const url = `${supabaseUrl}/rest/v1/pd_potreros?id=eq.${params.id}`

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
      console.error(`Error eliminando potrero: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return NextResponse.json({ message: "Potrero eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting potrero:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
