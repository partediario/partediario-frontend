import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log("=== API CATEGORIAS ANIMALES EMPRESA ===")

  try {
    const { searchParams } = new URL(request.url)
    const empresa_id = searchParams.get("empresa_id")
    const sexo = searchParams.get("sexo")

    console.log("📋 Parámetros recibidos:")
    console.log("  - empresa_id:", empresa_id)
    console.log("  - sexo:", sexo)

    if (!empresa_id) {
      console.log("❌ Error: empresa_id es requerido")
      return NextResponse.json({ error: "empresa_id es requerido" }, { status: 400 })
    }

    console.log("🔗 Conectando a Supabase...")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("📊 Consultando tabla pd_categoria_animales...")

    // Construir query con filtros
    let query = supabase
      .from("pd_categoria_animales")
      .select("id, nombre, sexo, edad, empresa_id")
      .or(`empresa_id.eq.1,empresa_id.eq.${empresa_id}`)
      .order("id", { ascending: true })

    // Agregar filtro de sexo si se proporciona
    if (sexo) {
      query = query.eq("sexo", sexo)
    }

    console.log("🔍 Ejecutando query...")
    const { data, error } = await query

    if (error) {
      console.error("❌ Error en consulta Supabase:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    console.log("✅ Datos obtenidos:")
    console.log("  - Número de registros:", data?.length || 0)
    console.log("  - Datos:", data)

    return NextResponse.json({
      categorias: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error("💥 Error general en API:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
