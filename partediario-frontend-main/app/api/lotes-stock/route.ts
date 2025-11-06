import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id is required" }, { status: 400 })
    }

    // Query the view with the inactivo filter
    const { data, error } = await supabaseServer
      .from("pd_lote_stock_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .eq("inactivo", false) // Only show active lots (inactivo = FALSE)
      .order("lote_id")

    if (error) {
      console.error("Error fetching lotes stock:", error)
      return NextResponse.json({ error: "Error fetching lotes stock" }, { status: 500 })
    }

    // Filter out lots with no animals (empty pd_detalles)
    const lotesWithAnimals = data?.filter((lote) => lote.pd_detalles && lote.pd_detalles.length > 0) || []

    return NextResponse.json(lotesWithAnimals)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
