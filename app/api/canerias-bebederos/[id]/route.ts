import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    })

    const body = await request.json()
    const { fecha, hora, nota, detalles_potreros, detalles_insumos, establecimiento_id, user_id } = body
    const actividadId = Number.parseInt(params.id)

    // Actualizar la actividad principal
    const { error: actividadError } = await supabase
      .from("pd_actividades")
      .update({
        fecha,
        hora,
        nota,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (actividadError) {
      console.error("Error updating actividad:", actividadError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    // Eliminar detalles existentes de potreros
    const { error: deletePotreroError } = await supabase
      .from("pd_actividad_potreros")
      .delete()
      .eq("actividad_id", actividadId)

    if (deletePotreroError) {
      console.error("Error deleting existing potrero details:", deletePotreroError)
      return NextResponse.json({ error: "Error al eliminar detalles de potreros existentes" }, { status: 500 })
    }

    // Eliminar detalles existentes de insumos
    const { error: deleteInsumoError } = await supabase
      .from("pd_actividad_insumos")
      .delete()
      .eq("actividad_id", actividadId)

    if (deleteInsumoError) {
      console.error("Error deleting existing insumo details:", deleteInsumoError)
      return NextResponse.json({ error: "Error al eliminar detalles de insumos existentes" }, { status: 500 })
    }

    // Insertar nuevos detalles de potreros
    if (detalles_potreros && detalles_potreros.length > 0) {
      const potreroInserts = detalles_potreros.map((detalle: any) => ({
        actividad_id: actividadId,
        potrero_id: detalle.potrero_id,
        tipo_trabajo: detalle.tipo_trabajo,
        incidente_detalle: detalle.observaciones,
        incidente: false, // Para cañerías y bebederos, no manejamos incidentes como boolean
      }))

      const { error: potreroInsertError } = await supabase.from("pd_actividad_potreros").insert(potreroInserts)

      if (potreroInsertError) {
        console.error("Error inserting potrero details:", potreroInsertError)
        return NextResponse.json(
          { error: "Error al crear detalles de potreros: " + potreroInsertError.message },
          { status: 500 },
        )
      }
    }

    // Insertar nuevos detalles de insumos
    if (detalles_insumos && detalles_insumos.length > 0) {
      const insumoInserts = detalles_insumos.map((detalle: any) => ({
        actividad_id: actividadId,
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
      }))

      const { error: insumoInsertError } = await supabase.from("pd_actividad_insumos").insert(insumoInserts)

      if (insumoInsertError) {
        console.error("Error inserting insumo details:", insumoInsertError)
        return NextResponse.json(
          { error: "Error al crear detalles de insumos: " + insumoInsertError.message },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      message: "Actividad de cañerías y bebederos actualizada exitosamente",
      id: actividadId,
    })
  } catch (error) {
    console.error("Error in PUT /api/canerias-bebederos/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
