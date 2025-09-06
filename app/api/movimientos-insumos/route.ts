import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const limit = searchParams.get("limit") || "50"

    if (!establecimientoId) {
      return NextResponse.json({ error: "Se requiere establecimiento_id" }, { status: 400 })
    }

    const { data: movimientos, error } = await supabase
      .from("pd_movimiento_insumos")
      .select(`
        *,
        insumo:pd_insumos(nombre),
        tipo_movimiento:pd_tipo_movimiento_insumos(nombre, direccion),
        usuario:user_id(nombres, apellidos)
      `)
      .eq("establecimiento_id", establecimientoId)
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      console.error("Error obteniendo movimientos:", error)
      return NextResponse.json({ error: "Error al obtener movimientos", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      movimientos: movimientos || [],
    })
  } catch (error) {
    console.error("Error en GET /api/movimientos-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { insumo_id, cantidad, establecimiento_id, fecha, hora, nota, user_id, tipo_movimiento_insumo } = body

    // Validar campos requeridos
    if (!insumo_id || !cantidad || !establecimiento_id || !tipo_movimiento_insumo) {
      return NextResponse.json(
        { error: "Se requieren insumo_id, cantidad, establecimiento_id y tipo_movimiento_insumo" },
        { status: 400 },
      )
    }

    // Crear el movimiento
    const { data: movimiento, error } = await supabase
      .from("pd_movimiento_insumos")
      .insert({
        insumo_id,
        cantidad,
        establecimiento_id,
        fecha: fecha || new Date().toISOString().split("T")[0],
        hora: hora || new Date().toTimeString().split(" ")[0],
        nota,
        user_id,
        tipo_movimiento_insumo,
      })
      .select(`
        *,
        insumo:pd_insumos(nombre),
        tipo_movimiento:pd_tipo_movimiento_insumos(nombre, direccion),
        usuario:user_id(nombres, apellidos)
      `)
      .single()

    if (error) {
      console.error("Error creando movimiento:", error)
      return NextResponse.json({ error: "Error al crear movimiento", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      movimiento,
    })
  } catch (error) {
    console.error("Error en POST /api/movimientos-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 })
    }

    const { data: movimiento, error } = await supabase
      .from("pd_movimiento_insumos")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        insumo:pd_insumos(nombre),
        tipo_movimiento:pd_tipo_movimiento_insumos(nombre, direccion),
        usuario:user_id(nombres, apellidos)
      `)
      .single()

    if (error) {
      console.error("Error actualizando movimiento:", error)
      return NextResponse.json({ error: "Error al actualizar movimiento", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      movimiento,
    })
  } catch (error) {
    console.error("Error en PUT /api/movimientos-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Se requiere id" }, { status: 400 })
    }

    const { error } = await supabase.from("pd_movimiento_insumos").delete().eq("id", id)

    if (error) {
      console.error("Error eliminando movimiento:", error)
      return NextResponse.json({ error: "Error al eliminar movimiento", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Movimiento eliminado exitosamente",
    })
  } catch (error) {
    console.error("Error en DELETE /api/movimientos-insumos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
