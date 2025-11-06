import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const anho = searchParams.get("anho")

    if (!establecimientoId || !anho) {
      return NextResponse.json({ error: "Faltan parámetros requeridos: establecimiento_id, anho" }, { status: 400 })
    }

    console.log("🌧️ Fetching lluvia año total:", { establecimientoId, anho })

    const { data, error } = await supabase
      .from("pd_lluvias_anho_total_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .eq("anho", anho)
      .single()

    if (error) {
      console.error("❌ Error fetching lluvia año total:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Lluvia año total data:", data)

    return NextResponse.json({
      success: true,
      data: {
        total_lluvia_anho: data?.total_lluvia_anho || 0,
        unidad_medida: data?.unidad_medida || "mm",
        anho: data?.anho || anho,
      },
    })
  } catch (error) {
    console.error("❌ Error in lluvia-anho-total API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
