import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const anho = searchParams.get("anho")
    const mes = searchParams.get("mes")

    if (!establecimientoId || !anho || !mes) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: establecimiento_id, anho, mes" },
        { status: 400 },
      )
    }

    console.log("🌧️ Fetching lluvia mes actual:", { establecimientoId, anho, mes })

    const { data, error } = await supabase
      .from("pd_lluvias_anho_total_mes_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .eq("anho", anho)
      .eq("mes", mes)
      .single()

    if (error) {
      console.error("❌ Error fetching lluvia mes actual:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Lluvia mes actual data:", data)

    return NextResponse.json({
      success: true,
      data: {
        total_lluvia_mes: data?.total_lluvia_mes || 0,
        unidad_medida: data?.unidad_medida || "mm",
        nombre_mes: data?.nombre_mes || "",
        anho: data?.anho || anho,
        mes: data?.mes || mes,
      },
    })
  } catch (error) {
    console.error("❌ Error in lluvia-mes-actual API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
