import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioId = searchParams.get("usuario_id")
    const empresasIds = searchParams.get("empresas_ids")

    console.log("[v0] Fetching asignaciones for usuario:", usuarioId)
    console.log("[v0] Filtering by empresas:", empresasIds)

    if (!usuarioId) {
      return NextResponse.json({ success: false, error: "usuario_id es requerido" }, { status: 400 })
    }

    if (!empresasIds) {
      return NextResponse.json({ success: false, error: "empresas_ids es requerido" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const empresasArray = empresasIds.split(",").map((id) => Number.parseInt(id.trim()))

    const { data: asignaciones, error } = await supabase
      .from("pd_asignacion_usuarios")
      .select(
        `
        id,
        empresa_id,
        establecimiento_id,
        rol_id,
        is_owner,
        pd_empresas!pd_asignacion_usuarios_pd_empresas_id_fk (
          id,
          nombre
        ),
        pd_establecimientos!pd_asignacion_usuarios_pd_establecimientos_id_fk (
          id,
          nombre
        ),
        pd_roles!pd_asignacion_usuarios_rol_id_fkey (
          id,
          nombre
        )
      `,
      )
      .eq("usuario_id", usuarioId)
      .in("empresa_id", empresasArray)

    if (error) {
      console.error("[v0] Error obteniendo asignaciones:", error)
      return NextResponse.json({ success: false, error: "Error al obtener asignaciones del usuario" }, { status: 500 })
    }

    console.log("[v0] Asignaciones obtenidas:", asignaciones?.length || 0)

    const asignacionesFormateadas = asignaciones.map((asig: any) => ({
      id: asig.id,
      empresaId: asig.empresa_id?.toString() || "",
      establecimientoId: asig.establecimiento_id?.toString() || "",
      rolId: asig.rol_id?.toString() || "",
      empresaNombre: asig.pd_empresas?.nombre || "",
      establecimientoNombre: asig.pd_establecimientos?.nombre || "",
      rolNombre: asig.pd_roles?.nombre || "",
      isOwner: asig.is_owner || false,
    }))

    return NextResponse.json({
      success: true,
      asignaciones: asignacionesFormateadas,
    })
  } catch (error) {
    console.error("[v0] Error en obtener-asignaciones-usuario:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
