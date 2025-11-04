import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, razon_social, ruc, direccion, contacto_nombre, email_contacto, nro_tel_contac, usuario_id } = body

    console.log("🏢 [EMPRESAS-CREATE] Iniciando creación de empresa:", nombre)

    if (!nombre || !usuario_id) {
      return NextResponse.json({ error: "Nombre y usuario_id son requeridos" }, { status: 400 })
    }

    // Paso 1: Crear empresa en pd_empresas
    console.log("🏢 [EMPRESAS-CREATE] Creando empresa...")
    const { data: empresaData, error: empresaError } = await supabaseServer
      .from("pd_empresas")
      .insert({
        nombre,
        razon_social: razon_social || null,
        ruc: ruc || null,
        direccion: direccion || null,
        contacto_nombre: contacto_nombre || null,
        email_contacto: email_contacto || null,
        nro_tel_contac: nro_tel_contac ? Number.parseInt(nro_tel_contac) : null,
        usuario_id,
      })
      .select()

    if (empresaError) {
      console.error("❌ [EMPRESAS-CREATE] Error al crear empresa:", empresaError)
      return NextResponse.json({ error: "Error al crear empresa" }, { status: 400 })
    }

    const empresaId = empresaData[0]?.id
    console.log("✅ [EMPRESAS-CREATE] Empresa creada con ID:", empresaId)

    // Paso 2: Crear establecimiento por defecto
    console.log("🏭 [EMPRESAS-CREATE] Creando establecimiento por defecto...")
    const { data: establecimientoData, error: establecimientoError } = await supabaseServer
      .from("pd_establecimientos")
      .insert({
        nombre: `${nombre} - Establecimiento 1`,
        empresa_id: empresaId,
      })
      .select()

    if (establecimientoError) {
      console.error("❌ [EMPRESAS-CREATE] Error al crear establecimiento:", establecimientoError)
      return NextResponse.json({ error: "Error al crear establecimiento por defecto" }, { status: 400 })
    }

    const establecimientoId = establecimientoData[0]?.id
    console.log("✅ [EMPRESAS-CREATE] Establecimiento creado con ID:", establecimientoId)

    // Paso 3: Crear asignación de usuario con is_owner = true
    console.log("🔐 [EMPRESAS-CREATE] Creando asignación de usuario...")
    const { error: asignacionError } = await supabaseServer.from("pd_asignacion_usuarios").insert({
      empresa_id: empresaId,
      usuario_id,
      establecimiento_id: establecimientoId,
      is_owner: true,
      rol_id: 4, // ADMINISTRADOR
    })

    if (asignacionError) {
      console.error("❌ [EMPRESAS-CREATE] Error en asignación:", asignacionError)
      return NextResponse.json({ error: "Error al asignar usuario a empresa" }, { status: 400 })
    }

    console.log("✅ [EMPRESAS-CREATE] Asignación creada con is_owner = true")

    return NextResponse.json({
      success: true,
      empresa: empresaData[0],
      establecimiento: establecimientoData[0],
    })
  } catch (error) {
    console.error("❌ [EMPRESAS-CREATE] Error general:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
