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

    // Get ALL lots (active and inactive) for destination selection
    const { data, error } = await supabaseServer
      .from("pd_lotes")
      .select("id, nombre, inactivo")
      .eq("establecimiento_id", establecimientoId)
      .order("id")

    if (error) {
      console.error("Error fetching all lotes:", error)
      return NextResponse.json({ error: "Error fetching all lotes" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
