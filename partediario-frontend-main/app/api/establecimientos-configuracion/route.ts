import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")

  console.log("=== API ESTABLECIMIENTOS-CONFIGURACION ===")
  console.log("Parámetros:", { usuario_id, empresa_id })

  if (!usuario_id || !empresa_id) {
    return NextResponse.json({ error: "usuario_id y empresa_id obligatorios" }, { status: 400 })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    // Construir URL de forma segura
    const supabaseUrl = process.env.SUPABASE_URL
    const endpoint = `/rest/v1/establecimientos_asignados_por_usuario_view`
    const params = `?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=*`

    console.log("Consultando establecimientos asignados para configuración")

    const res = await fetch(`${supabaseUrl}${endpoint}${params}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Error fetching from view:", errorData)
      return NextResponse.json({ error: errorData }, { status: res.status })
    }

    const data = await res.json()
    console.log(`Establecimientos para configuración: ${data.length}`)

    // Transformar al formato esperado por el componente de configuración
    const establecimientos = data.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      empresa_id: item.empresa_id,
      longitud: item.longitud,
      latitud: item.latitud,
    }))

    console.log("Establecimientos de configuración procesados")

    return NextResponse.json({ establecimientos })
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
