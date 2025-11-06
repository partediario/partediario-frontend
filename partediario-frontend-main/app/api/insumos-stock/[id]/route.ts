import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { cantidad } = body

    // Validaciones
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 })
    }

    const { data: stock, error } = await supabase
      .from("pd_insumos_stock")
      .update({
        cantidad: Number.parseInt(cantidad),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating stock:", error)
      return NextResponse.json({ error: "Error al actualizar stock" }, { status: 500 })
    }

    return NextResponse.json({ stock })
  } catch (error) {
    console.error("Error in PUT /api/insumos-stock/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from("pd_insumos_stock").delete().eq("id", id)

    if (error) {
      console.error("Error deleting stock:", error)
      return NextResponse.json({ error: "Error al eliminar stock" }, { status: 500 })
    }

    return NextResponse.json({ message: "Stock eliminado correctamente" })
  } catch (error) {
    console.error("Error in DELETE /api/insumos-stock/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
