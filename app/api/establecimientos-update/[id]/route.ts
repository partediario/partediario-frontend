import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { nombre, latitud, longitud } = body

    // Validaciones - solo nombre es requerido
    if (!nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    if (nombre.length < 3) {
      return NextResponse.json({ error: "El nombre debe tener al menos 3 caracteres" }, { status: 400 })
    }

    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const url = `${process.env.SUPABASE_URL}/rest/v1/pd_establecimientos?id=eq.${id}`
    console.log("🏭 [API] Updating establecimiento:", id, body)

    // Preparar datos para actualizar
    const updateData: any = {
      nombre,
    }

    // Solo agregar latitud y longitud si se proporcionan
    if (latitud && latitud.trim() !== "") {
      updateData.latitud = latitud
    }
    if (longitud && longitud.trim() !== "") {
      updateData.longitud = longitud
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error("❌ [API] Error updating establecimiento:", data)
      return NextResponse.json({ error: data }, { status: res.status })
    }

    console.log("✅ [API] Establecimiento actualizado:", data)
    return NextResponse.json({ establecimiento: data[0] })
  } catch (err) {
    console.error("❌ [API] Error /api/establecimientos-update:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
