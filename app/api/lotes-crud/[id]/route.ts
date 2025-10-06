import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { nombre, potrero_id } = body

    if (!nombre || !potrero_id) {
      return NextResponse.json({ error: "Nombre y potrero son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const getLoteUrl = `${supabaseUrl}/rest/v1/pd_lotes?select=establecimiento_id,potrero_id&id=eq.${params.id}`
    const getLoteResponse = await fetch(getLoteUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!getLoteResponse.ok) {
      throw new Error("No se pudo obtener el lote")
    }

    const loteData = await getLoteResponse.json()
    if (loteData.length === 0) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 })
    }

    const establecimiento_id = loteData[0].establecimiento_id
    const potrero_id_anterior = loteData[0].potrero_id

    const checkNombreUrl = `${supabaseUrl}/rest/v1/pd_lotes?select=id&establecimiento_id=eq.${establecimiento_id}&nombre=eq.${encodeURIComponent(nombre.trim())}&id=neq.${params.id}`

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
          { error: `Ya existe otro lote con el nombre "${nombre.trim()}" en este establecimiento` },
          { status: 400 },
        )
      }
    }

    if (Number.parseInt(potrero_id) !== potrero_id_anterior) {
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
    }

    const url = `${supabaseUrl}/rest/v1/pd_lotes?id=eq.${params.id}`

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
        potrero_id: Number.parseInt(potrero_id),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error actualizando lote: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const lote = await response.json()

    return NextResponse.json({ lote: lote[0] })
  } catch (error) {
    console.error("Error updating lote:", error)
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

    const url = `${supabaseUrl}/rest/v1/pd_lotes?id=eq.${params.id}`

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
      console.error(`Error eliminando lote: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return NextResponse.json({ message: "Lote eliminado correctamente" })
  } catch (error) {
    console.error("Error deleting lote:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
