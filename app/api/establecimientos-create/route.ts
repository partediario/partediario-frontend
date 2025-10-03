import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, latitud, longitud, empresa_id, usuario_id, rol_id } = body

    console.log("🏭 [API] Creating establecimiento with assignment:", body)

    // Validaciones - nombre, empresa_id, usuario_id y rol_id son requeridos
    if (!nombre || !empresa_id || !usuario_id || !rol_id) {
      return NextResponse.json({ error: "El nombre, empresa_id, usuario_id y rol_id son requeridos" }, { status: 400 })
    }

    if (nombre.length < 3) {
      return NextResponse.json({ error: "El nombre debe tener al menos 3 caracteres" }, { status: 400 })
    }

    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const baseUrl = process.env.SUPABASE_URL
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Preparar datos para crear el establecimiento
    const establecimientoData: any = {
      nombre,
      empresa_id: Number.parseInt(empresa_id),
    }

    // Solo agregar latitud y longitud si se proporcionan
    if (latitud && latitud.trim() !== "") {
      establecimientoData.latitud = latitud
    }
    if (longitud && longitud.trim() !== "") {
      establecimientoData.longitud = longitud
    }

    // 1. Crear el establecimiento
    const establecimientoUrl = `${baseUrl}/rest/v1/pd_establecimientos`
    const establecimientoRes = await fetch(establecimientoUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(establecimientoData),
    })

    const establecimientoResponseData = await establecimientoRes.json()
    if (!establecimientoRes.ok) {
      console.error("❌ [API] Error creating establecimiento:", establecimientoResponseData)
      return NextResponse.json({ error: establecimientoResponseData }, { status: establecimientoRes.status })
    }

    const nuevoEstablecimiento = establecimientoResponseData[0]
    console.log("✅ [API] Establecimiento creado:", nuevoEstablecimiento)

    // 2. Crear la asignación de usuario CON rol
    const asignacionUrl = `${baseUrl}/rest/v1/pd_asignacion_usuarios`
    const asignacionRes = await fetch(asignacionUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        empresa_id: Number.parseInt(empresa_id),
        establecimiento_id: nuevoEstablecimiento.id,
        usuario_id: usuario_id,
        rol_id: Number.parseInt(rol_id), // Incluir rol_id en el insert
        is_owner: false,
      }),
    })

    const asignacionData = await asignacionRes.json()
    if (!asignacionRes.ok) {
      console.error("❌ [API] Error creating user assignment:", asignacionData)
      // Si falla la asignación, podrías considerar eliminar el establecimiento creado
      // Por ahora solo logueamos el error
    } else {
      console.log("✅ [API] Asignación de usuario creada con rol:", asignacionData)
    }

    return NextResponse.json({
      establecimiento: nuevoEstablecimiento,
      asignacion: asignacionData[0] || null,
    })
  } catch (err) {
    console.error("❌ [API] Error /api/establecimientos-create:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
