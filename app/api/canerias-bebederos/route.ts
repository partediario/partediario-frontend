import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, tipo_actividad_id, fecha, hora, nota, user_id, detalles_potreros, detalles_insumos } =
      body

    if (!establecimiento_id || !tipo_actividad_id || !fecha || !hora || !user_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    if (!detalles_potreros || detalles_potreros.length === 0) {
      return NextResponse.json({ error: "Debe agregar al menos un potrero" }, { status: 400 })
    }

    // Crear la actividad principal
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id,
        fecha,
        hora,
        nota,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("Error al crear actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad: " + actividadError.message }, { status: 500 })
    }

    // Insertar detalles de potreros
    if (detalles_potreros && detalles_potreros.length > 0) {
      const detallesPotrerosParaInsertar = detalles_potreros.map((detalle: any) => ({
        actividad_id: actividad.id,
        potrero_id: detalle.potrero_id,
        tipo_trabajo: detalle.tipo_trabajo,
        incidente: false, // No hay incidentes en cañerías y bebederos
        incidente_detalle: detalle.incidente_detalle || null,
      }))

      const { error: detallesPotrerosError } = await supabase
        .from("pd_actividad_potreros")
        .insert(detallesPotrerosParaInsertar)

      if (detallesPotrerosError) {
        // Rollback: eliminar la actividad creada
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)

        console.error("Error al crear detalles de potreros:", detallesPotrerosError)
        return NextResponse.json(
          { error: "Error al crear detalles de potreros: " + detallesPotrerosError.message },
          { status: 500 },
        )
      }
    }

    // Insertar detalles de insumos (opcional)
    if (detalles_insumos && detalles_insumos.length > 0) {
      const detallesInsumosParaInsertar = detalles_insumos.map((detalle: any) => ({
        actividad_id: actividad.id,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: detallesInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .insert(detallesInsumosParaInsertar)

      if (detallesInsumosError) {
        // Rollback: eliminar la actividad y detalles de potreros creados
        await supabase.from("pd_actividad_potreros").delete().eq("actividad_id", actividad.id)
        await supabase.from("pd_actividades").delete().eq("id", actividad.id)

        console.error("Error al crear detalles de insumos:", detallesInsumosError)
        return NextResponse.json(
          { error: "Error al crear detalles de insumos: " + detallesInsumosError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      actividad_id: actividad.id,
      message: `Cañerías y bebederos registrada exitosamente con ${detalles_potreros.length} potrero${detalles_potreros.length > 1 ? "s" : ""} y ${detalles_insumos?.length || 0} insumo${(detalles_insumos?.length || 0) > 1 ? "s" : ""}`,
    })
  } catch (error) {
    console.error("Error en API cañerías-bebederos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
