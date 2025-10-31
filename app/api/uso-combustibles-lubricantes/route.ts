import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Datos recibidos para uso de combustibles y lubricantes:", body)

    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, maquinarias_seleccionadas, detalles } =
      body

    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const tieneMaquinariasSeleccionadas = maquinarias_seleccionadas && maquinarias_seleccionadas.length > 0
    const tieneDetalles = detalles && detalles.length > 0
    const tieneNota = nota && nota.trim().length > 0

    if (!tieneMaquinariasSeleccionadas && !tieneDetalles && !tieneNota) {
      return NextResponse.json(
        {
          error: "Debe seleccionar maquinarias, agregar detalles de insumos, o escribir una nota",
        },
        { status: 400 },
      )
    }

    // Insertar cabecera de actividad
    console.log("💾 Insertando cabecera de actividad uso de combustibles y lubricantes...")
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

    // Insertar detalles de insumos (combustibles y lubricantes con clase_insumo_id = 5)
    if (tieneDetalles) {
      console.log("💾 Insertando detalles de insumos (combustibles y lubricantes)...")
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

    // Asociar maquinarias a la actividad
    if (tieneMaquinariasSeleccionadas) {
      console.log("💾 Asociando maquinarias a la actividad...")
      const detallesMaquinariasParaInsertar = maquinarias_seleccionadas.map((maquinariaId: number) => ({
        actividad_id: actividad.id,
        maquinaria_id: maquinariaId,
      }))

      const { data: detallesMaquinariasInsertados, error: detallesMaquinariasError } = await supabase
        .from("pd_actividad_maquinarias")
        .insert(detallesMaquinariasParaInsertar)
        .select()

      if (detallesMaquinariasError) {
        console.error("❌ Error asociando maquinarias:", detallesMaquinariasError)
        // Si falla, limpiar todo lo creado
        if (tieneDetalles) {
          await supabase.from("pd_actividad_insumos").delete().eq("actividad_id", actividad.id)
        }
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)
        return NextResponse.json({ error: "Error al asociar las maquinarias" }, { status: 500 })
      }

      console.log("✅ Maquinarias asociadas:", detallesMaquinariasInsertados)
    }

    return NextResponse.json({
      success: true,
      actividad,
      maquinarias_count: tieneMaquinariasSeleccionadas ? maquinarias_seleccionadas.length : 0,
      detalles_insumos_count: tieneDetalles ? detalles.length : 0,
      total_registros_insumos: tieneDetalles ? detalles.length : 0,
    })
  } catch (error) {
    console.error("❌ Error en API uso-combustibles-lubricantes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
