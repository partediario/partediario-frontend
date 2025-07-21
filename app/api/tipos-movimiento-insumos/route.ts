import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const direccion = searchParams.get("direccion")

    let query = supabase
      .from("pd_tipo_movimiento_insumos")
      .select("id, nombre, direccion")
      .order("id", { ascending: true }) // Añadido: ordenar por id ascendente

    if (direccion) {
      query = query.eq("direccion", direccion)
    }

    const { data: tipos, error } = await query

    if (error) {
      console.error("Error fetching tipos movimiento insumos:", error)
      return NextResponse.json(
        { error: "Error al obtener tipos de movimiento", details: error.message },
        { status: 500 },
      )
    }

    const tiposFormateados = (tipos || []).map((tipo) => ({
      id: tipo.id.toString(),
      nombre: tipo.nombre,
      direccion: tipo.direccion,
    }))

    return NextResponse.json({
      success: true,
      tipos: tiposFormateados,
    })
  } catch (error) {
    console.error("Error in GET /api/tipos-movimiento-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
