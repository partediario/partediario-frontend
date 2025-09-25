import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombres, apellidos, telefono, rolId, empresaId, usuarioCreadorId, establecimientoId } =
      await request.json()

    console.log("🔄 [CREATE_USER_EMAIL] Datos recibidos:", {
      email,
      nombres,
      apellidos,
      telefono,
      rolId,
      empresaId,
      usuarioCreadorId,
      establecimientoId,
    })

    // Validaciones básicas - telefono ahora es requerido
    if (!email || !password || !nombres || !apellidos || !telefono || !rolId || !empresaId || !usuarioCreadorId) {
      return NextResponse.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Validar que establecimientoId esté presente
    if (!establecimientoId) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar un establecimiento antes de crear un usuario" },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    console.log("🔐 [CREATE_USER_EMAIL] Creando usuario en Supabase Auth...")

    // Paso 1: Crear usuario en Supabase Auth
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.text()
      console.log("❌ [CREATE_USER_EMAIL] Error en Supabase Auth:", errorData)

      if (errorData.includes("User already registered")) {
        return NextResponse.json(
          { success: false, error: "Ya existe un usuario con este correo electrónico" },
          { status: 409 },
        )
      }

      return NextResponse.json({ success: false, error: "Error al crear usuario en Auth" }, { status: 400 })
    }

    const authData = await authResponse.json()
    const userId = authData.id || authData.user?.id

    if (!userId) {
      console.log("❌ [CREATE_USER_EMAIL] No se pudo obtener el ID del usuario")
      return NextResponse.json({ success: false, error: "Error al obtener ID del usuario" }, { status: 400 })
    }

    console.log("✅ [CREATE_USER_EMAIL] Usuario creado en Auth:", userId)

    try {
      // Paso 2: Insertar datos en pd_usuarios
      const { error: usuarioError } = await supabaseServer.from("pd_usuarios").insert({
        id: userId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        id_creador: usuarioCreadorId,
      })

      if (usuarioError) {
        console.error("❌ [CREATE_USER_EMAIL] Error inserting user data:", usuarioError)

        // Rollback: Eliminar usuario de Auth
        try {
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          })
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: `Error al guardar datos del usuario: ${usuarioError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ [CREATE_USER_EMAIL] Datos de usuario guardados en pd_usuarios")

      // Paso 3: Crear asignación a la empresa y establecimiento CON rol
      const establecimientoIdNumerico = Number.parseInt(establecimientoId)
      const empresaIdNumerico = Number.parseInt(empresaId)
      const rolIdNumerico = Number.parseInt(rolId)

      if (isNaN(establecimientoIdNumerico) || isNaN(empresaIdNumerico) || isNaN(rolIdNumerico)) {
        console.error("❌ [CREATE_USER_EMAIL] IDs inválidos:", { establecimientoId, empresaId, rolId })

        // Rollback
        try {
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          })
          await supabaseServer.from("pd_usuarios").delete().eq("id", userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: "IDs de empresa, establecimiento o rol inválidos" },
          { status: 400 },
        )
      }

      const { error: asignacionError } = await supabaseServer.from("pd_asignacion_usuarios").insert({
        usuario_id: userId,
        empresa_id: empresaIdNumerico,
        establecimiento_id: establecimientoIdNumerico,
        rol_id: rolIdNumerico,
        is_owner: false, // Los usuarios creados no son owners por defecto
      })

      if (asignacionError) {
        console.error("❌ [CREATE_USER_EMAIL] Error creating user assignment:", asignacionError)

        // Rollback
        try {
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          })
          await supabaseServer.from("pd_usuarios").delete().eq("id", userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: `Error al asignar usuario a la empresa: ${asignacionError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ [CREATE_USER_EMAIL] Usuario asignado a la empresa, establecimiento y rol")

      // Paso 5: Actualizar teléfono (ahora requerido)
      try {
        let telefonoFormateado = telefono.replace(/[\s+-]/g, "")

        if (telefonoFormateado.startsWith("0")) {
          telefonoFormateado = "595" + telefonoFormateado.substring(1)
        } else if (!telefonoFormateado.startsWith("595")) {
          telefonoFormateado = "595" + telefonoFormateado
        }

        console.log("📞 [CREATE_USER_EMAIL] Actualizando teléfono:", {
          uid: userId,
          phone_param: telefonoFormateado,
        })

        const phoneResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/actualizar_phone`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            phone_param: telefonoFormateado,
            uid: userId,
          }),
        })

        if (!phoneResponse.ok) {
          const phoneError = await phoneResponse.text()
          console.error("❌ [CREATE_USER_EMAIL] Error al actualizar teléfono:", phoneError)

          // Rollback completo
          try {
            await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
              method: "DELETE",
              headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
            })
            await supabaseServer.from("pd_usuarios").delete().eq("id", userId)
            await supabaseServer.from("pd_asignacion_usuarios").delete().eq("usuario_id", userId)
          } catch (rollbackError) {
            console.error("❌ Error en rollback:", rollbackError)
          }

          return NextResponse.json(
            { success: false, error: "Error al actualizar teléfono del usuario" },
            { status: 500 },
          )
        }

        console.log("✅ [CREATE_USER_EMAIL] Teléfono actualizado correctamente")
      } catch (phoneError) {
        console.error("❌ [CREATE_USER_EMAIL] Error al actualizar teléfono:", phoneError)

        // Rollback completo
        try {
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
              apikey: supabaseServiceKey,
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
          })
          await supabaseServer.from("pd_usuarios").delete().eq("id", userId)
          await supabaseServer.from("pd_asignacion_usuarios").delete().eq("usuario_id", userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json({ success: false, error: "Error al actualizar teléfono del usuario" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Usuario creado exitosamente",
        usuario: {
          id: userId,
          nombres,
          apellidos,
          email,
          telefono: telefono,
          empresa_id: empresaIdNumerico,
          establecimiento_id: establecimientoIdNumerico,
          rol_id: rolIdNumerico,
        },
      })
    } catch (error) {
      console.error("❌ [CREATE_USER_EMAIL] Error in user creation process:", error)

      // Rollback: Eliminar usuario de Auth
      try {
        await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
          headers: {
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
        })
      } catch (rollbackError) {
        console.error("❌ Error in rollback:", rollbackError)
      }

      return NextResponse.json(
        { success: false, error: "Error interno durante la creación del usuario" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [CREATE_USER_EMAIL] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
