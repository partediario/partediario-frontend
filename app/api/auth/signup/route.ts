import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombres, apellidos, empresa, telefono } = await request.json()

    console.log(`🔐 [REGISTER] Iniciando creación de cuenta para: ${email}`)

    // Paso 1: Validar datos
    if (!email || !password || !nombres || !apellidos || !empresa || !telefono) {
      console.log("❌ [REGISTER] Faltan campos requeridos")
      return NextResponse.json(
        {
          success: false,
          message: "Todos los campos son requeridos",
        },
        { status: 400 },
      )
    }

    // Paso 2: Crear usuario en Supabase Auth usando API REST
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔐 [REGISTER] Creando usuario en Supabase Auth...")

    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    })

    if (!authResponse.ok) {
      const errorData = await authResponse.text()
      console.log("❌ [REGISTER] Error en Supabase Auth:", errorData)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear usuario en Auth",
        },
        { status: 400 },
      )
    }

    const authData = await authResponse.json()
    console.log("✅ [REGISTER] Usuario creado en Auth:", authData.id)

    // Extraer ID del usuario
    const userId = authData.id || authData.user?.id
    if (!userId) {
      console.log("❌ [REGISTER] No se pudo obtener el ID del usuario")
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener ID del usuario",
        },
        { status: 400 },
      )
    }

    // Paso 3: Insertar en pd_usuarios
    console.log("🔐 [REGISTER] Insertando en pd_usuarios...")
    const { data: userData, error: userError } = await supabaseServer
      .from("pd_usuarios")
      .insert({
        id: userId,
        nombres,
        apellidos,
        created_at: new Date().toISOString(),
      })
      .select()

    if (userError) {
      console.log("❌ [REGISTER] Error al insertar usuario:", userError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear perfil de usuario",
        },
        { status: 400 },
      )
    }

    console.log("✅ [REGISTER] Usuario insertado en pd_usuarios")

    // Paso 4: Crear empresa en pd_empresas
    console.log("🔐 [REGISTER] Creando empresa...")
    const { data: empresaData, error: empresaError } = await supabaseServer
      .from("pd_empresas")
      .insert({
        nombre: empresa,
        usuario_id: userId,
      })
      .select()

    if (empresaError) {
      console.log("❌ [REGISTER] Error al crear empresa:", empresaError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear empresa",
        },
        { status: 400 },
      )
    }

    const empresaId = empresaData[0]?.id || empresaData[0]?.empresa_id
    if (!empresaId) {
      console.log("❌ [REGISTER] No se pudo obtener el ID de la empresa")
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener ID de empresa",
        },
        { status: 400 },
      )
    }

    console.log("✅ [REGISTER] Empresa creada con ID:", empresaId)

    console.log("🏭 [REGISTER] Creando establecimiento por defecto...")
    const { data: establecimientoData, error: establecimientoError } = await supabaseServer
      .from("pd_establecimientos")
      .insert({
        nombre: `${empresa} - Establecimiento 1`,
        empresa_id: empresaId,
      })
      .select()

    if (establecimientoError) {
      console.log("❌ [REGISTER] Error al crear establecimiento:", establecimientoError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al crear establecimiento por defecto",
        },
        { status: 400 },
      )
    }

    const establecimientoId = establecimientoData[0]?.id
    if (!establecimientoId) {
      console.log("❌ [REGISTER] No se pudo obtener el ID del establecimiento")
      return NextResponse.json(
        {
          success: false,
          message: "Error al obtener ID del establecimiento",
        },
        { status: 400 },
      )
    }

    console.log("✅ [REGISTER] Establecimiento creado con ID:", establecimientoId)

    console.log("🔐 [REGISTER] Creando asignación de usuario con rol...")
    const { error: asignacionError } = await supabaseServer.from("pd_asignacion_usuarios").insert({
      empresa_id: empresaId,
      usuario_id: userId,
      establecimiento_id: establecimientoId,
      is_owner: true,
      rol_id: 4, // ADMINISTRADOR
    })

    if (asignacionError) {
      console.log("❌ [REGISTER] Error en asignación:", asignacionError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al asignar usuario a empresa",
        },
        { status: 400 },
      )
    }

    console.log("✅ [REGISTER] Asignación creada con rol ADMINISTRADOR")

    // Paso 7: Actualizar teléfono usando la API externa
    console.log("📱 [REGISTER] Actualizando teléfono...")
    try {
      // Formatear teléfono a formato paraguayo (595XXXXXXXXX)
      let telefonoFormateado = telefono.replace(/[\s+-]/g, "") // quitar espacios, + y guiones

      if (telefonoFormateado.startsWith("0")) {
        telefonoFormateado = "595" + telefonoFormateado.substring(1)
      } else if (!telefonoFormateado.startsWith("595")) {
        telefonoFormateado = "595" + telefonoFormateado
      }

      const phoneResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/actualizar_phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          phone_param: telefonoFormateado,
          uid: userId,
        }),
      })

      if (phoneResponse.ok) {
        console.log("✅ [REGISTER] Teléfono actualizado correctamente")
      } else {
        console.log("⚠️ [REGISTER] Error al actualizar teléfono (no crítico):", await phoneResponse.text())
      }
    } catch (phoneError) {
      console.log("⚠️ [REGISTER] Error al actualizar teléfono (no crítico):", phoneError)
    }

    console.log("🎉 [REGISTER] Cuenta creada exitosamente para:", email)

    return NextResponse.json({
      success: true,
      message: "✅ Cuenta creada con éxito. Revise su correo electrónico para validar su cuenta.",
      userId,
    })
  } catch (error) {
    console.log("❌ [REGISTER] Error general:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
