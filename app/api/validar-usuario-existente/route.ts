import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { email, telefono } = await request.json()

    console.log("🔍 [VALIDAR_USUARIO] Validando usuario existente:", { email, telefono })

    if (!email && !telefono) {
      return NextResponse.json(
        { success: false, error: "Debe proporcionar email o teléfono para validar" },
        { status: 400 },
      )
    }

    // Normalizar teléfono a formato 595XXXXXXXXX
    let telefonoNormalizado = ""
    if (telefono) {
      telefonoNormalizado = telefono.replace(/[\s+-]/g, "")

      // Si empieza con 0, reemplazar por 595
      if (telefonoNormalizado.startsWith("0")) {
        telefonoNormalizado = "595" + telefonoNormalizado.substring(1)
      }
      // Si no empieza con 595, agregarlo
      else if (!telefonoNormalizado.startsWith("595")) {
        telefonoNormalizado = "595" + telefonoNormalizado
      }
    }

    console.log("📞 [VALIDAR_USUARIO] Teléfono normalizado:", telefonoNormalizado)

    if (email) {
      const { data: usuariosPorEmail, error: errorEmail } = await supabaseServer
        .from("pd_user_profile_view")
        .select("*")
        .ilike("email", email.trim())

      if (errorEmail) {
        console.error("❌ [VALIDAR_USUARIO] Error buscando por email:", errorEmail)
        return NextResponse.json({ success: false, error: "Error al validar email" }, { status: 500 })
      }

      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        console.log("⚠️ [VALIDAR_USUARIO] Usuario encontrado con email:", usuariosPorEmail[0])
        return NextResponse.json({
          success: true,
          existe: true,
          tipo: "email",
          usuario: {
            id: usuariosPorEmail[0].id,
            nombres: usuariosPorEmail[0].nombres,
            apellidos: usuariosPorEmail[0].apellidos,
            email: usuariosPorEmail[0].email,
            telefono: usuariosPorEmail[0].phone,
          },
        })
      }
    }

    if (telefonoNormalizado) {
      const { data: usuariosPorTelefono, error: errorTelefono } = await supabaseServer
        .from("pd_user_profile_view")
        .select("*")
        .eq("phone", telefonoNormalizado)

      if (errorTelefono) {
        console.error("❌ [VALIDAR_USUARIO] Error buscando por teléfono:", errorTelefono)
        return NextResponse.json({ success: false, error: "Error al validar teléfono" }, { status: 500 })
      }

      if (usuariosPorTelefono && usuariosPorTelefono.length > 0) {
        console.log("⚠️ [VALIDAR_USUARIO] Usuario encontrado con teléfono:", usuariosPorTelefono[0])
        return NextResponse.json({
          success: true,
          existe: true,
          tipo: "telefono",
          usuario: {
            id: usuariosPorTelefono[0].id,
            nombres: usuariosPorTelefono[0].nombres,
            apellidos: usuariosPorTelefono[0].apellidos,
            email: usuariosPorTelefono[0].email,
            telefono: usuariosPorTelefono[0].phone,
          },
        })
      }
    }

    // No se encontró ningún usuario
    console.log("✅ [VALIDAR_USUARIO] No se encontró usuario existente")
    return NextResponse.json({
      success: true,
      existe: false,
    })
  } catch (error) {
    console.error("❌ [VALIDAR_USUARIO] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
