import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Variables de entorno de Supabase no configuradas" }, { status: 500 })
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/pd_movimientos_animales?id=eq.${params.id}&select=deleteable`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      },
    )

    if (!response.ok) {
      console.error("Error consultando deleteable:", response.status, response.statusText)
      return NextResponse.json(
        { error: `Error ${response.status}: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const deleteable = data.length > 0 ? data[0].deleteable : false

    return NextResponse.json({ deleteable })
  } catch (error) {
    console.error("Error consultando deleteable:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
