import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")

  console.log("=== API EMPRESAS ===")
  console.log("Usuario ID:", usuario_id)

  if (!usuario_id) {
    return NextResponse.json({ error: "usuario_id es requerido" }, { status: 400 })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const endpoint = `/rest/v1/pd_asignacion_usuarios`
    const params = `?select=empresa_id,pd_empresas(id,nombre)&usuario_id=eq.${usuario_id}`

    console.log("Consultando empresas asignadas al usuario")

    const res = await fetch(`${supabaseUrl}${endpoint}${params}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Error fetching empresas:", errorData)
      return NextResponse.json({ error: errorData }, { status: res.status })
    }

    const data = await res.json()
    console.log(`Asignaciones encontradas: ${data.length}`)

    // Extraer empresas únicas
    const empresasMap = new Map()
    data.forEach((item: any) => {
      if (item.pd_empresas) {
        empresasMap.set(item.pd_empresas.id, {
          id: item.pd_empresas.id,
          nombre: item.pd_empresas.nombre,
        })
      }
    })

    const empresas = Array.from(empresasMap.values())
    console.log(`Empresas únicas procesadas: ${empresas.length}`)

    return NextResponse.json({ empresas })
  } catch (err) {
    console.error("Error /api/empresas:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
