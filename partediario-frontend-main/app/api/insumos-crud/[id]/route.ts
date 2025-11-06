import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      nombre,
      contenido,
      clase_insumo_id,
      tipo_insumo_id,
      subtipo_insumo_id,
      unidad_medida_producto,
      unidad_medida_uso,
    } = body

    // Validaciones
    if (!nombre || nombre.trim().length < 3) {
      return NextResponse.json({ error: "El nombre debe tener al menos 3 caracteres" }, { status: 400 })
    }

    if (!contenido || contenido <= 0) {
      return NextResponse.json({ error: "El contenido debe ser mayor a 0" }, { status: 400 })
    }

    if (!clase_insumo_id || !tipo_insumo_id || !subtipo_insumo_id) {
      return NextResponse.json({ error: "Debe seleccionar clase, tipo y subtipo de insumo" }, { status: 400 })
    }

    if (!unidad_medida_producto || !unidad_medida_uso) {
      return NextResponse.json({ error: "Debe seleccionar las unidades de medida" }, { status: 400 })
    }

    const { data: insumo, error } = await supabase
      .from("pd_insumos")
      .update({
        nombre: nombre.trim(),
        contenido: Number.parseInt(contenido),
        clase_insumo_id: Number.parseInt(clase_insumo_id),
        tipo_insumo_id: Number.parseInt(tipo_insumo_id),
        subtipo_insumo_id: Number.parseInt(subtipo_insumo_id),
        unidad_medida_producto: Number.parseInt(unidad_medida_producto),
        unidad_medida_uso: Number.parseInt(unidad_medida_uso),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating insumo:", error)
      return NextResponse.json({ error: "Error al actualizar insumo" }, { status: 500 })
    }

    return NextResponse.json({ insumo })
  } catch (error) {
    console.error("Error in PUT /api/insumos-crud/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Primero eliminar el stock relacionado
    await supabase.from("pd_insumos_stock").delete().eq("insumo_id", id)

    // Luego eliminar el insumo
    const { error } = await supabase.from("pd_insumos").delete().eq("id", id)

    if (error) {
      console.error("Error deleting insumo:", error)
      return NextResponse.json({ error: "Error al eliminar insumo" }, { status: 500 })
    }

    return NextResponse.json({ message: "Insumo eliminado correctamente" })
  } catch (error) {
    console.error("Error in DELETE /api/insumos-crud/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
