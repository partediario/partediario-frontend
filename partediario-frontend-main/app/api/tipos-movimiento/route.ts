import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresa_id") || "1"
    const direccion = searchParams.get("direccion") || "ENTRADA"

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Construir filtro para empresa_id (empresa 1 + empresa seleccionada)
    let empresaFilter = "empresa_id.eq.1"
    if (empresaId !== "1") {
      empresaFilter = `empresa_id.in.(1,${empresaId})`
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/pd_tipo_movimientos?${empresaFilter}&direccion=eq.${direccion}&select=id,nombre,direccion,empresa_id&order=id.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const tipos = await response.json()

    console.log(
      `Tipos de movimiento obtenidos para empresa ${empresaId} y direccion ${direccion} (ordenados por ID asc):`,
      tipos.length,
    )

    return NextResponse.json({ tipos })
  } catch (error) {
    console.error("Error fetching tipos movimiento:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
