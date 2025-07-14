import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombres, apellidos, telefono, empresaId, usuarioCreadorId, establecimientoId } = body

    console.log("🔄 Datos recibidos en API:", {
      nombres,
      apellidos,
      telefono,
      empresaId,
      usuarioCreadorId,
      establecimientoId,
    })

    // Validaciones básicas
    if (!nombres || !apellidos || !telefono || !empresaId || !usuarioCreadorId) {
      return NextResponse.json({ success: false, error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Validar que establecimientoId esté presente
    if (!establecimientoId) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar un establecimiento antes de crear un usuario" },
        { status: 400 },
      )
    }

    // Formatear teléfono a formato internacional - VALIDACIÓN CORREGIDA
    let telefonoFormateado = telefono.trim()

    // Si ya tiene formato internacional correcto, usarlo directamente
    if (/^\+595\d{9}$/.test(telefonoFormateado)) {
      // Ya está en formato correcto
    } else {
      // Limpiar y formatear
      const numeroLimpio = telefono.replace(/\D/g, "")

      if (numeroLimpio.startsWith("0") && numeroLimpio.length === 10) {
        // Formato nacional: 0987123456 -> +595987123456
        telefonoFormateado = "+595" + numeroLimpio.substring(1)
      } else if (numeroLimpio.startsWith("595") && numeroLimpio.length === 12) {
        // Formato sin +: 595987123456 -> +595987123456
        telefonoFormateado = "+" + numeroLimpio
      } else if (numeroLimpio.length === 9) {
        // Solo el número: 987123456 -> +595987123456
        telefonoFormateado = "+595" + numeroLimpio
      } else {
        return NextResponse.json(
          { success: false, error: "Formato de teléfono inválido. Use formato: 0987123456 o +595987123456" },
          { status: 400 },
        )
      }
    }

    // Validación final: debe ser +595 seguido de exactamente 9 dígitos
    if (!/^\+595\d{9}$/.test(telefonoFormateado)) {
      return NextResponse.json(
        { success: false, error: "Formato de teléfono inválido. Use formato: 0987123456 o +595987123456" },
        { status: 400 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("🔄 Iniciando creación de usuario...")
    console.log("📱 Teléfono formateado:", telefonoFormateado)
    console.log("🏢 Empresa ID:", empresaId)
    console.log("🏭 Establecimiento ID:", establecimientoId)

    // Método 1: Intentar con Admin API
    console.log("🔄 Intentando crear usuario con Admin API...")
    let authUser = null
    let authError = null

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        phone: telefonoFormateado,
        password: "ParteDiario753",
        phone_confirm: true,
        user_metadata: {
          nombres,
          apellidos,
          created_by: usuarioCreadorId,
        },
      })
      authUser = data
      authError = error
    } catch (error) {
      console.log("❌ Admin API falló, intentando con REST API...")
      authError = error
    }

    // Método 2: Si Admin API falla, intentar con REST API directa
    if (authError && authError.message?.includes("User not allowed")) {
      console.log("🔄 Intentando con REST API directa...")

      try {
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            phone: telefonoFormateado,
            password: "ParteDiario753",
            phone_confirm: true,
          }),
        })

        if (authResponse.ok) {
          const authData = await authResponse.json()
          authUser = { user: authData.user || authData }
          authError = null
          console.log("✅ Usuario creado con REST API")
        } else {
          const errorData = await authResponse.text()
          console.log("❌ REST API también falló:", errorData)
          authError = { message: errorData }
        }
      } catch (restError) {
        console.log("❌ Error en REST API:", restError)
        authError = restError
      }
    }

    // Si ambos métodos fallan, devolver error específico
    if (authError || !authUser?.user) {
      console.error("❌ Error creating auth user:", authError)

      // Manejar errores específicos
      if (authError?.message?.includes("User already registered")) {
        return NextResponse.json(
          { success: false, error: "Ya existe un usuario con este número de teléfono" },
          { status: 409 },
        )
      }

      if (authError?.message?.includes("User not allowed") || authError?.message?.includes("Signups not allowed")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "La configuración de Supabase no permite crear usuarios automáticamente. Opciones:\n\n1. Habilitar 'Enable phone signup' en Supabase Dashboard > Authentication > Settings\n2. Cambiar 'Allow new users to sign up' a 'enabled'\n3. Verificar las políticas RLS en la tabla auth.users\n\nContacte al administrador del sistema.",
            details: {
              suggestion: "Revisar configuración de autenticación en Supabase",
              steps: [
                "Ir a Supabase Dashboard",
                "Authentication > Settings",
                "Habilitar 'Enable phone signup'",
                "Cambiar 'Allow new users to sign up' a 'enabled'",
              ],
            },
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `Error al crear usuario: ${authError?.message || "Error desconocido"}`,
          details: authError,
        },
        { status: 400 },
      )
    }

    const userId = authUser.user.id
    console.log("✅ Usuario Auth creado:", userId)

    try {
      // Paso 2: Insertar datos en pd_usuarios (SIN campo 'activo')
      const { error: usuarioError } = await supabase.from("pd_usuarios").insert({
        id: userId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        id_creador: usuarioCreadorId,
        // No incluir 'activo' porque no existe en la tabla
      })

      if (usuarioError) {
        console.error("❌ Error inserting user data:", usuarioError)

        // Rollback: Eliminar usuario de Auth
        try {
          await supabase.auth.admin.deleteUser(userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: `Error al guardar datos del usuario: ${usuarioError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ Datos de usuario guardados en pd_usuarios")

      // Paso 3: Crear asignación a la empresa y establecimiento
      const establecimientoIdNumerico = Number.parseInt(establecimientoId)
      const empresaIdNumerico = Number.parseInt(empresaId)

      // Validar que los IDs sean números válidos
      if (isNaN(establecimientoIdNumerico) || isNaN(empresaIdNumerico)) {
        console.error("❌ IDs inválidos:", { establecimientoId, empresaId })

        // Rollback
        try {
          await supabase.auth.admin.deleteUser(userId)
          await supabase.from("pd_usuarios").delete().eq("id", userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: "IDs de empresa o establecimiento inválidos" },
          { status: 400 },
        )
      }

      const asignacionData = {
        usuario_id: userId,
        empresa_id: empresaIdNumerico,
        establecimiento_id: establecimientoIdNumerico,
      }

      console.log("🔄 Insertando asignación con datos:", asignacionData)

      const { error: asignacionError } = await supabase.from("pd_asignacion_usuarios").insert(asignacionData)

      if (asignacionError) {
        console.error("❌ Error creating user assignment:", asignacionError)

        // Rollback: Eliminar usuario de Auth y pd_usuarios
        try {
          await supabase.auth.admin.deleteUser(userId)
          await supabase.from("pd_usuarios").delete().eq("id", userId)
        } catch (rollbackError) {
          console.error("❌ Error en rollback:", rollbackError)
        }

        return NextResponse.json(
          { success: false, error: `Error al asignar usuario a la empresa: ${asignacionError.message}` },
          { status: 500 },
        )
      }

      console.log("✅ Usuario asignado a la empresa y establecimiento exitosamente")

      return NextResponse.json({
        success: true,
        message: "Usuario creado exitosamente",
        usuario: {
          id: userId,
          nombres,
          apellidos,
          telefono: telefonoFormateado,
          empresa_id: empresaIdNumerico,
          establecimiento_id: establecimientoIdNumerico,
        },
      })
    } catch (error) {
      console.error("❌ Error in user creation process:", error)

      // Rollback: Eliminar usuario de Auth
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (rollbackError) {
        console.error("❌ Error in rollback:", rollbackError)
      }

      return NextResponse.json(
        { success: false, error: "Error interno durante la creación del usuario" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Error in crear-usuario-telefono:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
