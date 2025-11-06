import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")

  console.log("=== DEBUG ASIGNACIONES ===")
  console.log("Parámetros:", { usuario_id, empresa_id })

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const headers = {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    }

    // 1. Consultar asignaciones directamente
    console.log("1. Consultando pd_asignacion_usuarios...")
    const asignacionesRes = await fetch(
      `${supabaseUrl}/rest/v1/pd_asignacion_usuarios?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=*`,
      { headers },
    )
    const asignaciones = await asignacionesRes.json()
    console.log("Asignaciones encontradas:", asignaciones)

    // 2. Consultar establecimientos de esas asignaciones
    if (asignaciones.length > 0) {
      const establecimientoIds = asignaciones.map((a: any) => a.establecimiento_id)
      console.log("2. Consultando establecimientos con IDs:", establecimientoIds)

      const establecimientosRes = await fetch(
        `${supabaseUrl}/rest/v1/pd_establecimientos?id=in.(${establecimientoIds.join(",")})&select=*`,
        { headers },
      )
      const establecimientos = await establecimientosRes.json()
      console.log("Establecimientos encontrados:", establecimientos)

      // 3. Hacer JOIN manual
      const resultado = asignaciones.map((asignacion: any) => {
        const establecimiento = establecimientos.find((e: any) => e.id === asignacion.establecimiento_id)
        return {
          id: establecimiento?.id,
          nombre: establecimiento?.nombre,
          empresa_id: asignacion.empresa_id,
          longitud: establecimiento?.longitud,
          latitud: establecimiento?.latitud,
          usuario_id: asignacion.usuario_id,
        }
      })
      console.log("JOIN manual resultado:", resultado)
    }

    // 4. Consultar la vista directamente
    console.log("4. Consultando vista establecimientos_asignados_por_usuario_view...")
    const vistaRes = await fetch(
      `${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=*`,
      { headers },
    )
    const vistaData = await vistaRes.json()
    console.log("Vista resultado:", vistaData)

    // 5. Consultar toda la vista para este usuario
    console.log("5. Consultando toda la vista para este usuario...")
    const vistaUsuarioRes = await fetch(
      `${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?usuario_id=eq.${usuario_id}&select=*`,
      { headers },
    )
    const vistaUsuarioData = await vistaUsuarioRes.json()
    console.log("Vista completa para usuario:", vistaUsuarioData)

    return NextResponse.json({
      debug: {
        asignaciones,
        vista: vistaData,
        vistaCompleta: vistaUsuarioData,
        parametros: { usuario_id, empresa_id },
      },
    })
  } catch (error) {
    console.error("Error en debug asignaciones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
