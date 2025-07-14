import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nombres, apellidos, rolId } = await request.json()
    const userId = params.id

    console.log("🔄 [EDIT_USER] Datos recibidos:", {
      userId,
      nombres,
      apellidos,
      rolId,
    })

    // Validaciones básicas
    if (!nombres || !apellidos) {
      return NextResponse.json({ success: false, error: "Nombres y apellidos son requeridos" }, { status: 400 })
    }

    // Verificar el rol actual del usuario para determinar si es maestro
    const { data: usuarioRolData, error: rolCheckError } = await supabaseServer
      .from("pd_usuario_roles")
      .select(`
        rol_id,
        pd_roles (
          id,
          nombre
        )
      `)
      .eq("usuario_id", userId)
      .single()

    if (rolCheckError) {
      console.error("❌ [EDIT_USER] Error checking user role:", rolCheckError)
      return NextResponse.json(
        { success: false, error: `Error al verificar rol del usuario: ${rolCheckError.message}` },
        { status: 500 },
      )
    }

    // Log para inspeccionar los datos del rol tal como vienen de Supabase
    console.log("DEBUG: usuarioRolData (raw):", JSON.stringify(usuarioRolData, null, 2))

    // Determinar si es un usuario maestro basado en el nombre del rol, insensible a mayúsculas/minúsculas
    // Se considera "MAESTRO" o "ADMINISTRADOR" como roles de maestro para mayor flexibilidad
    const currentRoleName = usuarioRolData?.pd_roles?.nombre?.toUpperCase()
    const isMaestro = currentRoleName === "MAESTRO" || currentRoleName === "ADMINISTRADOR"

    console.log("🔍 [EDIT_USER] Verificación de rol:", {
      rolActual: usuarioRolData?.pd_roles?.nombre,
      isMaestro,
    })

    // Lógica de validación del rol:
    // Solo validar rol si NO es usuario maestro y no se proporcionó rolId
    // Si es un usuario maestro, no se requiere rolId para la actualización.
    if (!isMaestro && (rolId === undefined || rolId === null)) {
      console.error("❌ [EDIT_USER] Validación fallida: Rol requerido para usuario no maestro sin rolId.")
      return NextResponse.json({ success: false, error: "El rol es requerido" }, { status: 400 })
    }

    // Actualizar datos en pd_usuarios
    const { error: usuarioError } = await supabaseServer
      .from("pd_usuarios")
      .update({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (usuarioError) {
      console.error("❌ [EDIT_USER] Error updating user data:", usuarioError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar datos del usuario: ${usuarioError.message}` },
        { status: 500 },
      )
    }

    console.log("✅ [EDIT_USER] Datos de usuario actualizados en pd_usuarios")

    // Solo actualizar rol si NO es usuario maestro y se proporcionó un rolId válido
    if (!isMaestro && rolId !== undefined && rolId !== null) {
      const { error: rolError } = await supabaseServer
        .from("pd_usuario_roles")
        .update({
          rol_id: Number.parseInt(rolId),
        })
        .eq("usuario_id", userId)

      if (rolError) {
        console.error("❌ [EDIT_USER] Error updating user role:", rolError)
        return NextResponse.json(
          { success: false, error: `Error al actualizar rol del usuario: ${rolError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ [EDIT_USER] Rol de usuario actualizado correctamente")
    } else if (isMaestro) {
      console.log("ℹ️ [EDIT_USER] Usuario maestro - rol no modificado")
    }

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      usuario: {
        id: userId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rol_id: rolId ? Number.parseInt(rolId) : usuarioRolData?.rol_id, // Devolver el rol_id actual si no se actualizó
        rol: usuarioRolData?.pd_roles?.nombre, // Devolver el nombre del rol actual
      },
    })
  } catch (error) {
    console.error("❌ [EDIT_USER] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
