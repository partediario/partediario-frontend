import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { empresaId: string } }) {
  const { empresaId } = params
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")

  console.log("=== API ESTABLECIMIENTOS-EMPRESA ===")
  console.log("EmpresaId:", empresaId)
  console.log("UsuarioId:", usuario_id)

  if (!empresaId) {
    return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL

    // Si hay usuario_id, usar la vista para filtrar por asignaciones
    if (usuario_id) {
      const endpoint = `/rest/v1/establecimientos_asignados_por_usuario_view`
      const params = `?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresaId}&select=*`

      console.log("Consultando establecimientos asignados por empresa")

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
      console.log(`Establecimientos asignados encontrados: ${data.length}`)

      const establecimientos = data.map((item: any) => ({
        id: item.id,
        nombre: item.nombre,
        empresa_id: item.empresa_id,
        longitud: item.longitud,
        latitud: item.latitud,
      }))

      return NextResponse.json({ establecimientos })
    } else {
      // Sin usuario_id, devolver todos los establecimientos de la empresa
      const endpoint = `/rest/v1/pd_establecimientos`
      const params = `?empresa_id=eq.${empresaId}&order=id.asc`

      console.log("Consultando todos los establecimientos de la empresa")

      const res = await fetch(`${supabaseUrl}${endpoint}${params}`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      if (!res.ok) {
        console.error("Error fetching establecimientos:", data)
        return NextResponse.json({ error: data }, { status: res.status })
      }

      console.log(`Establecimientos de empresa encontrados: ${data.length}`)
      return NextResponse.json({ establecimientos: data })
    }
  } catch (err) {
    console.error("Error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
