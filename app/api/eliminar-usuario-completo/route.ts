import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    const { usuarioId, empresasIds, usuarioEliminadorId } = await request.json()

    console.log("🗑️ Iniciando eliminación completa de usuario:", { usuarioId, empresasIds, usuarioEliminadorId })

    if (!usuarioId || !empresasIds || !Array.isArray(empresasIds) || empresasIds.length === 0 || !usuarioEliminadorId) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Paso 1: Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from("pd_user_profile_view")
      .select("phone, email")
      .eq("id", usuarioId)
      .single()

    if (userError || !userData) {
      console.error("❌ Error al obtener datos del usuario:", userError)
      return NextResponse.json({ success: false, error: "Error al obtener datos del usuario" }, { status: 500 })
    }

    console.log("📱 Teléfono original del usuario:", userData.phone)
    console.log("📧 Email original del usuario:", userData.email)

    // Paso 2: Obtener todas las asignaciones del usuario
    const { data: todasAsignaciones, error: asignacionesError } = await supabase
      .from("pd_asignacion_usuarios")
      .select("*")
      .eq("usuario_id", usuarioId)

    if (asignacionesError) {
      console.error("❌ Error al obtener asignaciones:", asignacionesError)
      return NextResponse.json({ success: false, error: "Error al obtener asignaciones del usuario" }, { status: 500 })
    }

    console.log("📊 Total de asignaciones del usuario:", todasAsignaciones?.length || 0)

    // Paso 3: Eliminar todas las asignaciones de las empresas del administrador
    const { error: deleteAsignacionesError } = await supabase
      .from("pd_asignacion_usuarios")
      .delete()
      .eq("usuario_id", usuarioId)
      .in("empresa_id", empresasIds)

    if (deleteAsignacionesError) {
      console.error("❌ Error al eliminar asignaciones:", deleteAsignacionesError)
      return NextResponse.json({ success: false, error: "Error al eliminar asignaciones del usuario" }, { status: 500 })
    }

    console.log("✅ Asignaciones eliminadas de las empresas:", empresasIds)

    // Paso 4: Verificar si el usuario tiene asignaciones en otras empresas
    const asignacionesEnOtrasEmpresas = todasAsignaciones?.filter((asig) => !empresasIds.includes(asig.empresa_id))

    console.log("📊 Asignaciones en otras empresas:", asignacionesEnOtrasEmpresas?.length || 0)

    // Si el usuario no tiene más asignaciones, hacer soft delete completo
    if (!asignacionesEnOtrasEmpresas || asignacionesEnOtrasEmpresas.length === 0) {
      console.log("🔒 Usuario sin más asignaciones, procediendo con soft delete completo")

      const timestamp = Date.now()
      const newEmail = `pd_${timestamp}@partediario.com`

      // Limpiar el teléfono original (quitar +, espacios, guiones)
      const cleanPhone = userData.phone?.replace(/[\s\-+()]/g, "") || "000000000"
      const newPhone = `pd_${cleanPhone}`

      console.log("📧 Nuevo email:", newEmail)
      console.log("📱 Nuevo teléfono:", newPhone)

      try {
        // Actualizar email en auth.users
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${usuarioId}`, {
          method: "PUT",
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newEmail,
          }),
        })

        if (!authResponse.ok) {
          const errorData = await authResponse.json()
          console.error("❌ Error al actualizar email:", errorData)
          return NextResponse.json(
            { success: false, error: "Error al actualizar email de autenticación" },
            { status: 500 },
          )
        }

        console.log("✅ Email actualizado en auth.users")
      } catch (authError) {
        console.error("❌ Error en llamada a Auth API:", authError)
        return NextResponse.json(
          { success: false, error: "Error al conectar con servicio de autenticación" },
          { status: 500 },
        )
      }

      try {
        // Actualizar teléfono usando RPC
        const phoneResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/actualizar_phone`, {
          method: "POST",
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_param: newPhone,
            uid: usuarioId,
          }),
        })

        if (!phoneResponse.ok) {
          const errorData = await phoneResponse.json()
          console.error("❌ Error al actualizar phone:", errorData)
          return NextResponse.json({ success: false, error: "Error al actualizar teléfono" }, { status: 500 })
        }

        console.log("✅ Teléfono actualizado usando RPC")
      } catch (phoneError) {
        console.error("❌ Error en llamada a RPC actualizar_phone:", phoneError)
        return NextResponse.json({ success: false, error: "Error al actualizar teléfono" }, { status: 500 })
      }

      // Actualizar pd_usuarios con soft delete
      const { error: updateUsuarioError } = await supabase
        .from("pd_usuarios")
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_user_id: usuarioEliminadorId,
        })
        .eq("id", usuarioId)

      if (updateUsuarioError) {
        console.error("❌ Error al actualizar pd_usuarios:", updateUsuarioError)
        return NextResponse.json({ success: false, error: "Error al marcar usuario como eliminado" }, { status: 500 })
      }

      console.log("✅ Usuario marcado como eliminado en pd_usuarios")

      return NextResponse.json({
        success: true,
        message: "Usuario eliminado completamente del sistema",
        tipo: "completo",
      })
    } else {
      // Si el usuario tiene asignaciones en otras empresas
      console.log("✅ Usuario eliminado de tus empresas (mantiene acceso a otras empresas)")

      return NextResponse.json({
        success: true,
        message: "Usuario eliminado de todas tus empresas",
        tipo: "parcial",
      })
    }
  } catch (error) {
    console.error("❌ Error general al eliminar usuario:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
