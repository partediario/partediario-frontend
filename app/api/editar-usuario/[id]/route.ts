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

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      usuario: {
        id: userId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
      },
    })
  } catch (error) {
    console.error("❌ [EDIT_USER] Error general:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
