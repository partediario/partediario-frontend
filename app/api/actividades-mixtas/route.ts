import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Datos recibidos para actividad mixta:", body)

    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles_animales, detalles_insumos } =
      body

    // Validaciones
    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    if (
      (!detalles_animales || detalles_animales.length === 0) &&
      (!detalles_insumos || detalles_insumos.length === 0)
    ) {
      return NextResponse.json({ error: "Debe agregar al menos un detalle de animales o insumos" }, { status: 400 })
    }

    // Insertar cabecera de actividad
    console.log("💾 Insertando cabecera de actividad mixta...")
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

    // Insertar detalles de animales si existen
    if (detalles_animales && detalles_animales.length > 0) {
      console.log("💾 Insertando detalles de animales...")
      const detallesAnimalesParaInsertar = detalles_animales.map((detalle: any) => {
        const baseDetalle = {
          actividad_id: actividad.id,
          categoria_animal_id: detalle.categoria_animal_id,
          cantidad: detalle.cantidad,
          lote_id: detalle.lote_id,
        }

        // Only add peso and tipo_peso if they exist (for non-sanitación activities)
        if (detalle.peso !== undefined) {
          return {
            ...baseDetalle,
            peso: detalle.peso,
            tipo_peso: detalle.tipo_peso,
          }
        }

        return baseDetalle
      })

      const { data: detallesAnimalesInsertados, error: detallesAnimalesError } = await supabase
        .from("pd_actividad_animales")
        .insert(detallesAnimalesParaInsertar)
        .select()

      if (detallesAnimalesError) {
        console.error("❌ Error insertando detalles de animales:", detallesAnimalesError)
        // Si falla, eliminar la actividad creada
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)
        return NextResponse.json({ error: "Error al guardar los detalles de animales" }, { status: 500 })
      }

      console.log("✅ Detalles de animales insertados:", detallesAnimalesInsertados)
    }

    // Insertar detalles de insumos si existen
    if (detalles_insumos && detalles_insumos.length > 0) {
      console.log("💾 Insertando detalles de insumos...")
      const detallesInsumosParaInsertar = detalles_insumos.map((detalle: any) => ({
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
        // Si falla, eliminar la actividad y detalles de animales creados
        await supabase.from("pd_actividad_animales").delete().eq("actividad_id", actividad.id)
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)
        return NextResponse.json({ error: "Error al guardar los detalles de insumos" }, { status: 500 })
      }

      console.log("✅ Detalles de insumos insertados:", detallesInsumosInsertados)
    }

    return NextResponse.json({
      success: true,
      actividad,
      detalles_animales_count: detalles_animales?.length || 0,
      detalles_insumos_count: detalles_insumos?.length || 0,
    })
  } catch (error) {
    console.error("❌ Error en API actividades-mixtas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
