import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🏭 [API] Obteniendo datos de establecimiento ID:", params.id)

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.from("pd_establecimientos").select("*").eq("id", params.id).single()

    if (error) {
      console.error("❌ [API] Error al obtener establecimiento:", error)
      return NextResponse.json({ error: "Error al obtener datos del establecimiento" }, { status: 500 })
    }

    if (!data) {
      console.log("⚠️ [API] Establecimiento no encontrado:", params.id)
      return NextResponse.json({ error: "Establecimiento no encontrado" }, { status: 404 })
    }

    console.log("✅ [API] Establecimiento obtenido:", data.nombre)
    return NextResponse.json(data)
  } catch (error) {
    console.error("❌ [API] Error general:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
