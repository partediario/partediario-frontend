import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")
  const establecimiento_id = p.get("establecimiento_id")
  const anho = p.get("anho")
  const mes = p.get("mes")
  const fecha = p.get("fecha")
  const tipo = p.get("tipo")

  // Verificar variables de entorno
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables:", {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
    return NextResponse.json({ error: "Server configuration error - missing environment variables" }, { status: 500 })
  }

  let query = `${process.env.SUPABASE_URL}/rest/v1/pd_partes_diarios_view?select=*`

  if (usuario_id) query += `&usuario_id=eq.${usuario_id}`
  if (establecimiento_id) query += `&pd_establecimiento_id=eq.${establecimiento_id}`
  if (anho) query += `&anho=eq.${anho}`
  if (mes) query += `&mes=eq.${mes}`
  if (fecha) query += `&pd_fecha=eq.${fecha}`
  if (tipo && tipo !== "todos") query += `&pd_tipo=eq.${tipo}`

  // Ordenar por fecha y hora descendente (más reciente primero)
  query += `&order=pd_fecha.desc,pd_hora.desc`

  console.log("Fetching from URL:", query)

  try {
    const res = await fetch(query, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", res.status)

    const data = await res.json()
    if (!res.ok) {
      console.error("Error fetching partes diarios:", data)
      return NextResponse.json({ error: data }, { status: res.status })
    }

    console.log("Partes diarios fetched successfully:", data.length, "records")
    return NextResponse.json({ partes_diarios: data })
  } catch (err) {
    console.error("Error /api/partes-diarios:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
