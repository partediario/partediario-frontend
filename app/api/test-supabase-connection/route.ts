import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabaseServer.from("pd_actividades_view").select("count(*)").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Conexión a Supabase exitosa",
      data,
    })
  } catch (error) {
    console.error("Test connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
