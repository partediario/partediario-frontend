import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movimientoId = params.id
    console.log("Buscando movimiento ID:", movimientoId)

    // Primero buscar en la vista de partes diarios
    const { data: parteDiario, error: parteError } = await supabase
      .from("pd_partes_diarios_view")
      .select("*")
      .eq("pd_tipo", "INSUMOS")
      .eq("pd_detalles->>detalle_id", movimientoId)
      .single()

    if (!parteError && parteDiario) {
      console.log("Encontrado en vista partes diarios:", parteDiario)

      const detalles = parteDiario.pd_detalles

      // Buscar el insumo real por nombre
      const { data: insumoReal } = await supabase
        .from("pd_insumos")
        .select("id, nombre, unidad_medida_uso")
        .ilike("nombre", `%${detalles.detalle_insumo}%`)
        .single()

      // Buscar tipo de movimiento por nombre
      const { data: tipoReal } = await supabase
        .from("pd_tipo_movimiento_insumos")
        .select("id, nombre")
        .ilike("nombre", `%${detalles.detalle_tipo}%`)
        .single()

      const movimiento = {
        id: Number.parseInt(movimientoId),
        fecha: parteDiario.pd_fecha,
        hora: parteDiario.pd_hora,
        nota: parteDiario.pd_nota,
        cantidad: detalles.detalle_cantidad,
        insumo_id: insumoReal?.id || Number.parseInt(movimientoId),
        tipo_movimiento_insumo: tipoReal?.id || 1,
        pd_insumos: {
          id: insumoReal?.id || Number.parseInt(movimientoId),
          nombre: detalles.detalle_insumo,
          pd_unidad_medida_insumos: {
            nombre: detalles.detalle_unidad_medida,
          },
        },
        pd_tipo_movimientos_insumos: {
          id: tipoReal?.id || 1,
          nombre: detalles.detalle_tipo,
        },
        pd_usuarios: {
          nombres: parteDiario.pd_usuario_nombres,
          apellidos: parteDiario.pd_usuario_apellidos,
        },
      }

      console.log("Movimiento construido desde vista:", movimiento)
      return NextResponse.json({ movimiento })
    }

    // Si no se encuentra en la vista, buscar directamente
    const { data: movimientoDirecto, error: errorDirecto } = await supabase
      .from("pd_movimiento_insumos")
      .select("*")
      .eq("id", movimientoId)
      .single()

    if (errorDirecto) {
      console.error("Error fetching movimiento directo:", errorDirecto)
      return NextResponse.json(
        { error: "Error al obtener el movimiento", details: errorDirecto.message },
        { status: 500 },
      )
    }

    if (!movimientoDirecto) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    console.log("Movimiento directo encontrado:", movimientoDirecto)

    // Obtener información relacionada
    const [insumoResult, tipoResult, usuarioResult] = await Promise.all([
      supabase
        .from("pd_insumos")
        .select("id, nombre, unidad_medida_uso")
        .eq("id", movimientoDirecto.insumo_id)
        .single(),
      supabase
        .from("pd_tipo_movimiento_insumos")
        .select("id, nombre")
        .eq("id", movimientoDirecto.tipo_movimiento_insumo)
        .single(),
      supabase.from("pd_usuarios").select("nombres, apellidos").eq("id", movimientoDirecto.user_id).single(),
    ])

    // Obtener unidad de medida si existe
    let unidadMedida = null
    if (insumoResult.data?.unidad_medida_uso) {
      const { data: unidad } = await supabase
        .from("pd_unidad_medida_insumos")
        .select("nombre")
        .eq("id", insumoResult.data.unidad_medida_uso)
        .single()
      unidadMedida = unidad
    }

    const movimiento = {
      ...movimientoDirecto,
      pd_insumos: {
        id: insumoResult.data?.id,
        nombre: insumoResult.data?.nombre,
        pd_unidad_medida_insumos: {
          nombre: unidadMedida?.nombre,
        },
      },
      pd_tipo_movimientos_insumos: {
        id: tipoResult.data?.id,
        nombre: tipoResult.data?.nombre,
      },
      pd_usuarios: {
        nombres: usuarioResult.data?.nombres,
        apellidos: usuarioResult.data?.apellidos,
      },
    }

    console.log("Movimiento final:", movimiento)
    return NextResponse.json({ movimiento })
  } catch (error) {
    console.error("Error in GET /api/movimientos-insumos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movimientoId = params.id
    const body = await request.json()

    const { fecha, nota, insumo_id, cantidad, tipo_movimiento_insumo } = body

    // Actualizar el movimiento
    const { data: movimientoActualizado, error } = await supabase
      .from("pd_movimiento_insumos")
      .update({
        fecha,
        nota,
        insumo_id,
        cantidad,
        tipo_movimiento_insumo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", movimientoId)
      .select()
      .single()

    if (error) {
      console.error("Error updating movimiento insumo:", error)
      return NextResponse.json({ error: "Error al actualizar el movimiento", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Movimiento actualizado exitosamente",
      movimiento: movimientoActualizado,
    })
  } catch (error) {
    console.error("Error in PUT /api/movimientos-insumos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const movimientoId = params.id
    const body = await request.json()

    const { deleted, deleted_at, deleted_user_id } = body

    // Soft delete the movimiento
    const { data: movimientoEliminado, error } = await supabase
      .from("pd_movimiento_insumos")
      .update({
        deleted,
        deleted_at,
        deleted_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", movimientoId)
      .select()
      .single()

    if (error) {
      console.error("Error en soft delete:", error)
      return NextResponse.json({ error: "Error al eliminar el movimiento", details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "Movimiento eliminado exitosamente",
      movimiento: movimientoEliminado,
    })
  } catch (error) {
    console.error("Error in PATCH /api/movimientos-insumos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
