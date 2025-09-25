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

    const { data: asignacionData, error: asignacionCheckError } = await supabaseServer
      .from("pd_asignacion_usuarios")
      .select(`
        rol_id,
        is_owner,
        pd_roles (
          id,
          nombre
        )
      `)
      .eq("usuario_id", userId)
      .single()

    if (asignacionCheckError) {
      console.error("❌ [EDIT_USER] Error checking user assignment:", asignacionCheckError)
      return NextResponse.json(
        { success: false, error: `Error al verificar asignación del usuario: ${asignacionCheckError.message}` },
        { status: 500 },
      )
    }

    // Log para inspeccionar los datos de la asignación tal como vienen de Supabase
    console.log("DEBUG: asignacionData (raw):", JSON.stringify(asignacionData, null, 2))

    // Determinar si es un usuario owner o maestro basado en is_owner o el nombre del rol
    const currentRoleName = asignacionData?.pd_roles?.nombre?.toUpperCase()
    const isOwner = asignacionData?.is_owner === true
    const isMaestro = currentRoleName === "MAESTRO"

    console.log("🔍 [EDIT_USER] Verificación de rol:", {
      rolActual: asignacionData?.pd_roles?.nombre,
      isOwner,
      isMaestro,
    })

    // Lógica de validación del rol:
    // Solo validar rol si NO es owner/maestro y no se proporcionó rolId
    if (!isOwner && !isMaestro && (rolId === undefined || rolId === null)) {
      console.error("❌ [EDIT_USER] Validación fallida: Rol requerido para usuario no owner/maestro sin rolId.")
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

    if (!isOwner && !isMaestro && rolId !== undefined && rolId !== null) {
      const { error: rolError } = await supabaseServer
        .from("pd_asignacion_usuarios")
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
    } else if (isOwner || isMaestro) {
      console.log("ℹ️ [EDIT_USER] Usuario owner/maestro - rol no modificado")
    }

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      usuario: {
        id: userId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        rol_id: rolId ? Number.parseInt(rolId) : asignacionData?.rol_id, // Devolver el rol_id actual si no se actualizó
        rol: asignacionData?.pd_roles?.nombre, // Devolver el nombre del rol actual
        is_owner: isOwner,
      },
    })
  } catch (error) {
    console.error("❌ [EDIT_USER] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
