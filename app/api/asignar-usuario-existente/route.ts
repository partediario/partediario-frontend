import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, empresaId, establecimientoId, rolId } = await request.json()

    console.log("🔄 [ASIGNAR_USUARIO_EXISTENTE] Datos recibidos:", {
      usuarioId,
      empresaId,
      establecimientoId,
      rolId,
    })

    // Validaciones básicas
    if (!usuarioId || !empresaId || !establecimientoId || !rolId) {
      return NextResponse.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 })
    }

    const empresaIdNumerico = Number.parseInt(empresaId)
    const establecimientoIdNumerico = Number.parseInt(establecimientoId)
    const rolIdNumerico = Number.parseInt(rolId)

    if (isNaN(empresaIdNumerico) || isNaN(establecimientoIdNumerico) || isNaN(rolIdNumerico)) {
      return NextResponse.json(
        { success: false, error: "IDs de empresa, establecimiento o rol inválidos" },
        { status: 400 },
      )
    }

    // Verificar si ya existe una asignación para este usuario en esta empresa y establecimiento
    const { data: asignacionExistente, error: errorBusqueda } = await supabaseServer
      .from("pd_asignacion_usuarios")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("empresa_id", empresaIdNumerico)
      .eq("establecimiento_id", establecimientoIdNumerico)

    if (errorBusqueda) {
      console.error("❌ [ASIGNAR_USUARIO_EXISTENTE] Error buscando asignación:", errorBusqueda)
      return NextResponse.json({ success: false, error: "Error al verificar asignación existente" }, { status: 500 })
    }

    if (asignacionExistente && asignacionExistente.length > 0) {
      console.log("⚠️ [ASIGNAR_USUARIO_EXISTENTE] Ya existe asignación para este usuario")
      return NextResponse.json(
        { success: false, error: "El usuario ya está asignado a este establecimiento" },
        { status: 409 },
      )
    }

    // Crear la asignación
    const { error: asignacionError } = await supabaseServer.from("pd_asignacion_usuarios").insert({
      usuario_id: usuarioId,
      empresa_id: empresaIdNumerico,
      establecimiento_id: establecimientoIdNumerico,
      rol_id: rolIdNumerico,
      is_owner: false,
    })

    if (asignacionError) {
      console.error("❌ [ASIGNAR_USUARIO_EXISTENTE] Error creando asignación:", asignacionError)
      return NextResponse.json(
        { success: false, error: `Error al asignar usuario: ${asignacionError.message}` },
        { status: 500 },
      )
    }

    console.log("✅ [ASIGNAR_USUARIO_EXISTENTE] Usuario asignado exitosamente")

    return NextResponse.json({
      success: true,
      message: "Usuario asignado exitosamente a la empresa y establecimiento",
    })
  } catch (error) {
    console.error("❌ [ASIGNAR_USUARIO_EXISTENTE] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
