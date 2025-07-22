import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const parteId = params.id

    console.log("🔍 Obteniendo actividad mixta con ID:", parteId)

    // Obtener el parte diario principal
    const { data: parteDiario, error: parteError } = await supabase
      .from("pd_partes_diarios")
      .select(`
        *,
        pd_usuarios (nombres, apellidos),
        pd_tipo_actividades (id, nombre, ubicacion, descripcion, animales, insumos)
      `)
      .eq("pd_id", parteId)
      .single()

    if (parteError) {
      console.error("❌ Error al obtener parte diario:", parteError)
      return NextResponse.json({ error: "Parte diario no encontrado" }, { status: 404 })
    }

    // Obtener detalles de animales
    const { data: detallesAnimales, error: animalesError } = await supabase
      .from("pd_actividades_animales_detalle")
      .select(`
        *,
        pd_lotes (nombre),
        pd_categorias_animales (nombre)
      `)
      .eq("parte_diario_id", parteId)

    if (animalesError) {
      console.error("❌ Error al obtener detalles de animales:", animalesError)
    }

    // Obtener detalles de insumos
    const { data: detallesInsumos, error: insumosError } = await supabase
      .from("pd_actividades_insumos_detalle")
      .select(`
        *,
        pd_insumos (
          nombre,
          pd_unidad_medida_insumos (nombre)
        )
      `)
      .eq("parte_diario_id", parteId)

    if (insumosError) {
      console.error("❌ Error al obtener detalles de insumos:", insumosError)
    }

    const resultado = {
      ...parteDiario,
      pd_actividades_animales_detalle: detallesAnimales || [],
      pd_actividades_insumos_detalle: detallesInsumos || [],
    }

    console.log("✅ Actividad mixta obtenida:", resultado)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("❌ Error en GET /api/actividades-mixtas/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const parteId = params.id
    const body = await request.json()

    console.log("🔄 Actualizando actividad mixta:", parteId, body)

    const { fecha, hora, nota, detalles_animales, detalles_insumos } = body

    // Actualizar el parte diario principal
    const { error: updateError } = await supabase
      .from("pd_partes_diarios")
      .update({
        pd_fecha: fecha,
        pd_hora: hora,
        pd_nota: nota,
        pd_fecha_modificacion: new Date().toISOString(),
      })
      .eq("pd_id", parteId)

    if (updateError) {
      console.error("❌ Error al actualizar parte diario:", updateError)
      return NextResponse.json({ error: "Error al actualizar parte diario" }, { status: 500 })
    }

    // Eliminar detalles existentes de animales
    const { error: deleteAnimalesError } = await supabase
      .from("pd_actividades_animales_detalle")
      .delete()
      .eq("parte_diario_id", parteId)

    if (deleteAnimalesError) {
      console.error("❌ Error al eliminar detalles de animales:", deleteAnimalesError)
    }

    // Eliminar detalles existentes de insumos
    const { error: deleteInsumosError } = await supabase
      .from("pd_actividades_insumos_detalle")
      .delete()
      .eq("parte_diario_id", parteId)

    if (deleteInsumosError) {
      console.error("❌ Error al eliminar detalles de insumos:", deleteInsumosError)
    }

    // Insertar nuevos detalles de animales
    if (detalles_animales && detalles_animales.length > 0) {
      const detallesAnimalesParaInsertar = detalles_animales.map((detalle: any) => ({
        parte_diario_id: Number.parseInt(parteId),
        lote_id: detalle.lote_id,
        categoria_animal_id: detalle.categoria_animal_id,
        cantidad: detalle.cantidad,
        peso: detalle.peso,
        tipo: detalle.tipo,
      }))

      const { error: insertAnimalesError } = await supabase
        .from("pd_actividades_animales_detalle")
        .insert(detallesAnimalesParaInsertar)

      if (insertAnimalesError) {
        console.error("❌ Error al insertar detalles de animales:", insertAnimalesError)
        return NextResponse.json({ error: "Error al insertar detalles de animales" }, { status: 500 })
      }
    }

    // Insertar nuevos detalles de insumos
    if (detalles_insumos && detalles_insumos.length > 0) {
      const detallesInsumosParaInsertar = detalles_insumos.map((detalle: any) => ({
        parte_diario_id: Number.parseInt(parteId),
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: insertInsumosError } = await supabase
        .from("pd_actividades_insumos_detalle")
        .insert(detallesInsumosParaInsertar)

      if (insertInsumosError) {
        console.error("❌ Error al insertar detalles de insumos:", insertInsumosError)
        return NextResponse.json({ error: "Error al insertar detalles de insumos" }, { status: 500 })
      }
    }

    console.log("✅ Actividad mixta actualizada correctamente")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error en PUT /api/actividades-mixtas/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
