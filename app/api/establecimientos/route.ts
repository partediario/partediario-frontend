import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")

  console.log("=== API ESTABLECIMIENTOS ===")
  console.log("Parámetros recibidos:", { usuario_id, empresa_id })

  if (!usuario_id || !empresa_id) {
    return NextResponse.json({ error: "usuario_id y empresa_id obligatorios" }, { status: 400 })
  }

  // Verificar variables de entorno
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    // Construir URL usando la vista que funcionaba en v1
    const supabaseUrl = process.env.SUPABASE_URL
    const endpoint = `/rest/v1/pd_usuarios_establecimientos_view`
    const params = `?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}`

    console.log("Consultando vista pd_usuarios_establecimientos_view")

    const res = await fetch(`${supabaseUrl}${endpoint}${params}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Status de respuesta:", res.status)

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Error fetching from view:", errorData)
      return NextResponse.json({ error: errorData }, { status: res.status })
    }

    const data = await res.json()
    console.log(`Establecimientos encontrados: ${data.length}`)

    if (data.length > 0) {
      console.log("Primer establecimiento:", data[0])
    }

    // Transformar los datos al formato esperado por el frontend
    const establecimientos = data.map((item: any) => ({
      usuario_id: item.usuario_id,
      empresa_id: item.empresa_id.toString(),
      establecimiento_id: item.establecimiento_id.toString(),
      nombre: item.nombre,
      longitud: item.longitud || null,
      latitud: item.latitud || null,
    }))

    console.log("Establecimientos procesados correctamente")

    return NextResponse.json({ establecimientos })
  } catch (err) {
    console.error("Error /api/establecimientos:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
