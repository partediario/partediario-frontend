import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Obtener categorías actuales con stock
    const { data: categorias, error } = await supabase
      .from("pd_lote_stock_categoria_por_empresa_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .gt("total_cantidad", 0)

    if (error) {
      console.error("Error fetching categorias:", error)
      return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
    }

    return NextResponse.json({ categorias: categorias || [] })
  } catch (error) {
    console.error("Error in GET /api/reclasificacion-categorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { empresa_id, establecimiento_id, reclasificaciones, fecha, hora, nota, user_id } = body

    if (!empresa_id || !establecimiento_id || !reclasificaciones || reclasificaciones.length === 0) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Crear actividad en cabecera
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id,
        tipo_actividad_id: 37, // ID para reclasificación
        fecha,
        hora,
        nota,
        user_id,
      })
      .select()
      .single()

    if (actividadError) {
      console.error("Error creating actividad:", actividadError)
      return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 })
    }

    // Procesar cada reclasificación
    for (const reclasificacion of reclasificaciones) {
      const { categoria_actual_id, nueva_categoria_id, cantidad, peso } = reclasificacion

      // Llamar a la función de Supabase para actualizar categoría
      const { error: rpcError } = await supabase.rpc("actualizar_categoria", {
        _categoria_animal_actual: categoria_actual_id,
        _empresa_id: empresa_id,
        _establecimiento_id: establecimiento_id,
        _nueva_categoria_id: nueva_categoria_id,
      })

      if (rpcError) {
        console.error("Error in actualizar_categoria:", rpcError)
        return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 })
      }

      // Registrar en detalles
      const { error: detalleError } = await supabase.from("pd_actividad_animales").insert({
        actividad_id: actividad.id,
        categoria_animal_id: nueva_categoria_id,
        cantidad,
        peso,
        tipo_peso: "TOTAL",
        categoria_animal_id_anterior: categoria_actual_id,
        peso_anterior: peso,
        tipo_peso_anterior: "TOTAL",
      })

      if (detalleError) {
        console.error("Error creating detalle:", detalleError)
        return NextResponse.json({ error: "Error al crear detalle" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Reclasificación completada exitosamente",
      actividad_id: actividad.id,
    })
  } catch (error) {
    console.error("Error in POST /api/reclasificacion-categorias:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
