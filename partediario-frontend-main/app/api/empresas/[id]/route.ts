import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 [API] Obteniendo datos de empresa ID:", params.id)

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.from("pd_empresas").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ [API] Error al obtener empresa:", error)
      return NextResponse.json({ error: "Error al obtener datos de la empresa" }, { status: 500 })
    }

    if (!data) {
      console.log("⚠️ [API] Empresa no encontrada:", params.id)
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    console.log("✅ [API] Empresa obtenida:", data.nombre)
    return NextResponse.json({ empresa: data })
  } catch (error) {
    console.error("❌ [API] Error general:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏢 [API] Actualizando empresa ID:", params.id)

    const body = await request.json()
    const { nombre, direccion, razon_social, ruc, contacto_nombre, email_contacto, nro_tel_contac } = body

    // Validaciones básicas
    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    if (!ruc?.trim()) {
      return NextResponse.json({ error: "El RUC es requerido" }, { status: 400 })
    }

    if (!email_contacto?.trim()) {
      return NextResponse.json({ error: "El email de contacto es requerido" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_contacto)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    // Validar formato de RUC (formato paraguayo: 80000001-7)
    const rucRegex = /^\d+-\d$/
    if (!rucRegex.test(ruc)) {
      return NextResponse.json({ error: "Formato de RUC inválido (ej: 568-8, 5864897-8)" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar que la empresa existe
    const { data: existingEmpresa, error: checkError } = await supabase
      .from("pd_empresas")
      .select("id")
      .eq("id", params.id)
      .single()

    if (checkError || !existingEmpresa) {
      console.log("⚠️ [API] Empresa no encontrada para actualizar:", params.id)
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    // Actualizar empresa
    const { data, error } = await supabase
      .from("pd_empresas")
      .update({
        nombre: nombre.trim(),
        direccion: direccion?.trim() || null,
        razon_social: razon_social?.trim() || null,
        ruc: ruc.trim(),
        contacto_nombre: contacto_nombre?.trim() || null,
        email_contacto: email_contacto.trim(),
        nro_tel_contac: nro_tel_contac ? Number.parseInt(nro_tel_contac) : null,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error al actualizar empresa:", error)
      return NextResponse.json({ error: "Error al actualizar la empresa" }, { status: 500 })
    }

    console.log("✅ [API] Empresa actualizada:", data.nombre)
    return NextResponse.json({
      message: "Empresa actualizada correctamente",
      empresa: data,
    })
  } catch (error) {
    console.error("❌ [API] Error general al actualizar:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
