import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimiento_id = searchParams.get("establecimiento_id")
    const anho = searchParams.get("anho")

    if (!establecimiento_id || !anho) {
      return NextResponse.json(
        { error: "Faltan parámetros: establecimiento_id y anho son requeridos" },
        { status: 400 },
      )
    }

    console.log("🌧️ Fetching pluviometria anual para:", { establecimiento_id, anho })

    const { data, error } = await supabase
      .from("pd_lluvias_anho_view")
      .select("*")
      .eq("establecimiento_id", establecimiento_id)
      .eq("anho", anho)
      .order("mes")
      .order("dia")

    if (error) {
      console.error("❌ Error en pluviometria anual:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Pluviometria anual data:", data?.length, "registros")

    return NextResponse.json({
      pluviometria_anual: data || [],
      total_registros: data?.length || 0,
    })
  } catch (error) {
    console.error("❌ Error general en pluviometria anual:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
