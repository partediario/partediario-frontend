import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, asignaciones } = await request.json()

    console.log("🔄 [ASIGNAR_USUARIO_MULTIPLE] Datos recibidos:", {
      usuarioId,
      asignaciones,
    })

    // Validaciones básicas
    if (!usuarioId || !asignaciones || !Array.isArray(asignaciones) || asignaciones.length === 0) {
      return NextResponse.json(
        { success: false, error: "Usuario ID y al menos una asignación son requeridos" },
        { status: 400 },
      )
    }

    // Validar cada asignación
    for (const asignacion of asignaciones) {
      if (!asignacion.empresaId || !asignacion.establecimientoId || !asignacion.rolId) {
        return NextResponse.json(
          { success: false, error: "Cada asignación debe tener empresa, establecimiento y rol" },
          { status: 400 },
        )
      }
    }

    // Preparar las asignaciones para insertar
    const asignacionesParaInsertar = asignaciones.map((asignacion) => ({
      usuario_id: usuarioId,
      empresa_id: Number.parseInt(asignacion.empresaId),
      establecimiento_id: Number.parseInt(asignacion.establecimientoId),
      rol_id: Number.parseInt(asignacion.rolId),
      is_owner: false,
    }))

    // Verificar si ya existen asignaciones duplicadas
    for (const asignacion of asignacionesParaInsertar) {
      const { data: asignacionExistente, error: errorBusqueda } = await supabaseServer
        .from("pd_asignacion_usuarios")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("empresa_id", asignacion.empresa_id)
        .eq("establecimiento_id", asignacion.establecimiento_id)

      if (errorBusqueda) {
        console.error("❌ [ASIGNAR_USUARIO_MULTIPLE] Error buscando asignación:", errorBusqueda)
        return NextResponse.json(
          { success: false, error: "Error al verificar asignaciones existentes" },
          { status: 500 },
        )
      }

      if (asignacionExistente && asignacionExistente.length > 0) {
        // Buscar el nombre del establecimiento
        const { data: establecimiento } = await supabaseServer
          .from("pd_establecimientos")
          .select("nombre")
          .eq("id", asignacion.establecimiento_id)
          .single()

        return NextResponse.json(
          {
            success: false,
            error: `El usuario ya está asignado al establecimiento ${establecimiento?.nombre || asignacion.establecimiento_id}`,
          },
          { status: 409 },
        )
      }
    }

    // Insertar todas las asignaciones
    const { error: asignacionError } = await supabaseServer
      .from("pd_asignacion_usuarios")
      .insert(asignacionesParaInsertar)

    if (asignacionError) {
      console.error("❌ [ASIGNAR_USUARIO_MULTIPLE] Error creando asignaciones:", asignacionError)
      return NextResponse.json(
        { success: false, error: `Error al asignar usuario: ${asignacionError.message}` },
        { status: 500 },
      )
    }

    console.log("✅ [ASIGNAR_USUARIO_MULTIPLE] Usuario asignado exitosamente a múltiples establecimientos")

    return NextResponse.json({
      success: true,
      message: "Usuario asignado exitosamente a los establecimientos seleccionados",
    })
  } catch (error) {
    console.error("❌ [ASIGNAR_USUARIO_MULTIPLE] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
