import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(request: NextRequest) {
  try {
    const { usuarioId, empresaId, usuarioEliminadorId } = await request.json()

    console.log("🗑️ Iniciando eliminación de usuario:", { usuarioId, empresaId, usuarioEliminadorId })

    if (!usuarioId || !empresaId || !usuarioEliminadorId) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

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

    // Paso 1: Obtener todas las asignaciones del usuario en todas las empresas
    const { data: todasAsignaciones, error: asignacionesError } = await supabase
      .from("pd_asignacion_usuarios")
      .select("*")
      .eq("usuario_id", usuarioId)

    if (asignacionesError) {
      console.error("❌ Error al obtener asignaciones:", asignacionesError)
      return NextResponse.json({ success: false, error: "Error al obtener asignaciones del usuario" }, { status: 500 })
    }

    console.log("📊 Total de asignaciones del usuario:", todasAsignaciones?.length || 0)

    // Paso 2: Eliminar la asignación de la empresa actual
    const { error: deleteAsignacionError } = await supabase
      .from("pd_asignacion_usuarios")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("empresa_id", empresaId)

    if (deleteAsignacionError) {
      console.error("❌ Error al eliminar asignación:", deleteAsignacionError)
      return NextResponse.json({ success: false, error: "Error al eliminar asignación del usuario" }, { status: 500 })
    }

    console.log("✅ Asignación eliminada de la empresa:", empresaId)

    // Paso 3: Verificar si el usuario está solo en esta empresa
    const asignacionesEnOtrasEmpresas = todasAsignaciones?.filter((asig) => asig.empresa_id !== Number(empresaId))

    console.log("📊 Asignaciones en otras empresas:", asignacionesEnOtrasEmpresas?.length || 0)

    // Si el usuario está solo en esta empresa, hacer soft delete completo
    if (!asignacionesEnOtrasEmpresas || asignacionesEnOtrasEmpresas.length === 0) {
      console.log("🔒 Usuario solo en esta empresa, procediendo con soft delete completo")

      const timestamp = Date.now()
      const newEmail = `pd_${timestamp}@partediario.com`

      // Limpiar el teléfono original (quitar +, espacios, guiones)
      const cleanPhone = userData.phone?.replace(/[\s\-+()]/g, "") || "000000000"
      const newPhone = `pd_${cleanPhone}`

      console.log("📧 Nuevo email:", newEmail)
      console.log("📱 Nuevo teléfono:", newPhone)

      try {
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
        message: "Usuario eliminado completamente (soft delete)",
        tipo: "completo",
      })
    } else {
      // Si el usuario está en otras empresas, solo eliminamos la asignación
      console.log("✅ Usuario eliminado solo de esta empresa (mantiene acceso a otras empresas)")

      return NextResponse.json({
        success: true,
        message: "Usuario eliminado de esta empresa",
        tipo: "parcial",
      })
    }
  } catch (error) {
    console.error("❌ Error general al eliminar usuario:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
