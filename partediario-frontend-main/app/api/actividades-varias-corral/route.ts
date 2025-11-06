import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Datos recibidos para actividad varias de corral:", body)

    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, lotes_seleccionados, detalles } = body

    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const tieneLotsSeleccionados = lotes_seleccionados && lotes_seleccionados.length > 0
    const tieneDetalles = detalles && detalles.length > 0
    const tieneNota = nota && nota.trim().length > 0

    if (!tieneLotsSeleccionados && !tieneDetalles && !tieneNota) {
      return NextResponse.json(
        {
          error: "Debe seleccionar lotes, agregar detalles de insumos, o escribir una nota",
        },
        { status: 400 },
      )
    }

    // Insertar cabecera de actividad
    console.log("💾 Insertando cabecera de actividad varias de corral...")
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id,
        fecha,
        hora,
        nota: nota || null,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("❌ Error insertando actividad:", actividadError)
      return NextResponse.json({ error: "Error al guardar la actividad" }, { status: 500 })
    }

    console.log("✅ Actividad creada:", actividad)

    if (tieneDetalles) {
      console.log("💾 Insertando detalles de insumos...")
      const detallesInsumosParaInsertar = detalles.map((detalle: any) => ({
        actividad_id: actividad.id,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { data: detallesInsumosInsertados, error: detallesInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .insert(detallesInsumosParaInsertar)
        .select()

      if (detallesInsumosError) {
        console.error("❌ Error insertando detalles de insumos:", detallesInsumosError)
        // Si falla, eliminar la actividad creada
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)
        return NextResponse.json({ error: "Error al guardar los detalles de insumos" }, { status: 500 })
      }

      console.log("✅ Detalles de insumos insertados:", detallesInsumosInsertados)
    }

    if (tieneLotsSeleccionados) {
      console.log("💾 Asociando lotes a la actividad...")
      const detallesLotesParaInsertar = lotes_seleccionados.map((loteId: number) => ({
        actividad_id: actividad.id,
        lote_id: loteId,
        cantidad: 0, // No hay cantidad específica de animales para actividades varias
        categoria_animal_id: null, // No hay categoría específica
        peso: null,
        tipo_peso: null,
      }))

      const { data: detallesLotesInsertados, error: detallesLotesError } = await supabase
        .from("pd_actividad_animales")
        .insert(detallesLotesParaInsertar)
        .select()

      if (detallesLotesError) {
        console.error("❌ Error asociando lotes:", detallesLotesError)
        // Si falla, limpiar todo lo creado
        if (tieneDetalles) {
          await supabase.from("pd_actividad_insumos").delete().eq("actividad_id", actividad.id)
        }
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)
        return NextResponse.json({ error: "Error al asociar los lotes" }, { status: 500 })
      }

      console.log("✅ Lotes asociados:", detallesLotesInsertados)
    }

    return NextResponse.json({
      success: true,
      actividad,
      lotes_count: tieneLotsSeleccionados ? lotes_seleccionados.length : 0,
      detalles_insumos_count: tieneDetalles ? detalles.length : 0,
      total_registros_insumos: tieneDetalles ? detalles.length : 0,
    })
  } catch (error) {
    console.error("❌ Error en API actividades-varias-corral:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
