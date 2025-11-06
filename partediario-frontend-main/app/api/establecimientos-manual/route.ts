import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")

  console.log("=== API ESTABLECIMIENTOS MANUAL ===")
  console.log("Parámetros recibidos:", { usuario_id, empresa_id })

  if (!usuario_id || !empresa_id) {
    return NextResponse.json({ error: "usuario_id y empresa_id obligatorios" }, { status: 400 })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing environment variables")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    }

    console.log("Paso 1: Obteniendo asignaciones...")

    // Paso 1: Obtener asignaciones del usuario para la empresa
    const asignacionesRes = await fetch(
      `${supabaseUrl}/rest/v1/pd_asignacion_usuarios?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=establecimiento_id`,
      { headers },
    )

    if (!asignacionesRes.ok) {
      const errorData = await asignacionesRes.json()
      console.error("Error obteniendo asignaciones:", errorData)
      return NextResponse.json({ error: errorData }, { status: asignacionesRes.status })
    }

    const asignaciones = await asignacionesRes.json()
    console.log(`Asignaciones encontradas: ${asignaciones.length}`)

    if (asignaciones.length === 0) {
      console.log("No hay asignaciones para este usuario y empresa")
      return NextResponse.json({ establecimientos: [] })
    }

    // Paso 2: Obtener los IDs de establecimientos
    const establecimientoIds = asignaciones.map((a: any) => a.establecimiento_id)
    console.log("IDs de establecimientos:", establecimientoIds)

    console.log("Paso 2: Obteniendo datos de establecimientos...")

    // Paso 3: Obtener datos completos de los establecimientos
    const establecimientosRes = await fetch(
      `${supabaseUrl}/rest/v1/pd_establecimientos?id=in.(${establecimientoIds.join(",")})&select=id,nombre,empresa_id,longitud,latitud`,
      { headers },
    )

    if (!establecimientosRes.ok) {
      const errorData = await establecimientosRes.json()
      console.error("Error obteniendo establecimientos:", errorData)
      return NextResponse.json({ error: errorData }, { status: establecimientosRes.status })
    }

    const establecimientos = await establecimientosRes.json()
    console.log(`Establecimientos encontrados: ${establecimientos.length}`)

    // Paso 4: Transformar al formato esperado
    const establecimientosTransformados = establecimientos.map((item: any) => ({
      usuario_id: usuario_id,
      empresa_id: item.empresa_id.toString(),
      establecimiento_id: item.id.toString(),
      nombre: item.nombre,
      longitud: item.longitud,
      latitud: item.latitud,
    }))

    console.log("Establecimientos transformados:", establecimientosTransformados)

    return NextResponse.json({ establecimientos: establecimientosTransformados })
  } catch (err) {
    console.error("Error /api/establecimientos-manual:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
