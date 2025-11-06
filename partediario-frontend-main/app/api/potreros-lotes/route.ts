import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("pd_potreros_lotes_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("potrero_id", { ascending: true })

    if (error) {
      console.error("Error fetching potreros-lotes:", error)
      return NextResponse.json({ error: "Error al obtener potreros y lotes" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in potreros-lotes API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
