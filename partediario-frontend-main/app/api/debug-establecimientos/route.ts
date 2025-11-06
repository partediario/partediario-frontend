import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const p = new URL(request.url).searchParams
  const usuario_id = p.get("usuario_id")
  const empresa_id = p.get("empresa_id")

  console.log("=== DEBUG ESTABLECIMIENTOS ===")
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

    // 1. Consultar toda la vista sin filtros para ver qué hay
    console.log("1. Consultando toda la vista...")
    const vistaCompleta = await fetch(`${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?select=*`, {
      headers,
    })
    const datosCompletos = await vistaCompleta.json()
    console.log("Datos completos de la vista:", datosCompletos)

    // 2. Consultar solo por usuario_id
    console.log("2. Consultando solo por usuario_id...")
    const porUsuario = await fetch(
      `${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?usuario_id=eq.${usuario_id}&select=*`,
      {
        headers,
      },
    )
    const datosPorUsuario = await porUsuario.json()
    console.log("Datos por usuario:", datosPorUsuario)

    // 3. Consultar solo por empresa_id
    console.log("3. Consultando solo por empresa_id...")
    const porEmpresa = await fetch(
      `${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?empresa_id=eq.${empresa_id}&select=*`,
      {
        headers,
      },
    )
    const datosPorEmpresa = await porEmpresa.json()
    console.log("Datos por empresa:", datosPorEmpresa)

    // 4. Consultar con ambos filtros
    console.log("4. Consultando con ambos filtros...")
    const conAmbos = await fetch(
      `${supabaseUrl}/rest/v1/establecimientos_asignados_por_usuario_view?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=*`,
      {
        headers,
      },
    )
    const datosConAmbos = await conAmbos.json()
    console.log("Datos con ambos filtros:", datosConAmbos)

    // 5. Consultar tabla de asignaciones directamente
    console.log("5. Consultando tabla pd_asignacion_usuarios...")
    const asignaciones = await fetch(
      `${supabaseUrl}/rest/v1/pd_asignacion_usuarios?usuario_id=eq.${usuario_id}&empresa_id=eq.${empresa_id}&select=*`,
      {
        headers,
      },
    )
    const datosAsignaciones = await asignaciones.json()
    console.log("Asignaciones directas:", datosAsignaciones)

    // 6. Consultar establecimientos de la empresa
    console.log("6. Consultando establecimientos de la empresa...")
    const establecimientos = await fetch(
      `${supabaseUrl}/rest/v1/pd_establecimientos?empresa_id=eq.${empresa_id}&select=*`,
      {
        headers,
      },
    )
    const datosEstablecimientos = await establecimientos.json()
    console.log("Establecimientos de la empresa:", datosEstablecimientos)

    return NextResponse.json({
      debug: {
        vistaCompleta: datosCompletos,
        porUsuario: datosPorUsuario,
        porEmpresa: datosPorEmpresa,
        conAmbos: datosConAmbos,
        asignacionesDirectas: datosAsignaciones,
        establecimientosEmpresa: datosEstablecimientos,
      },
    })
  } catch (error) {
    console.error("Error en debug:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
