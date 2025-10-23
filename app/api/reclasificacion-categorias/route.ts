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

    const { data: lotes, error } = await supabase
      .from("pd_lote_stock_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)

    if (error) {
      console.error("Error fetching lotes:", error)
      return NextResponse.json({ error: "Error al obtener lotes" }, { status: 500 })
    }

    // Agregar categorías de todos los lotes
    const categoriasMap = new Map<
      number,
      {
        categoria_animal_id: number
        categoria_animal_nombre: string
        sexo: string
        edad: string
        total_cantidad: number
        total_peso: number
        lotes: Array<{
          lote_id: number
          lote_nombre: string
          cantidad: number
          peso_total: number
          peso_promedio: number
        }>
      }
    >()

    for (const lote of lotes || []) {
      const detalles = lote.pd_detalles || []
      for (const detalle of detalles) {
        const categoriaId = detalle.categoria_animal_id
        if (!categoriasMap.has(categoriaId)) {
          categoriasMap.set(categoriaId, {
            categoria_animal_id: categoriaId,
            categoria_animal_nombre: detalle.categoria_animal_nombre,
            sexo: detalle.sexo,
            edad: detalle.edad,
            total_cantidad: 0,
            total_peso: 0,
            lotes: [],
          })
        }

        const categoria = categoriasMap.get(categoriaId)!
        categoria.total_cantidad += detalle.cantidad
        categoria.total_peso += detalle.peso_total
        categoria.lotes.push({
          lote_id: lote.lote_id,
          lote_nombre: lote.lote_nombre,
          cantidad: detalle.cantidad,
          peso_total: detalle.peso_total,
          peso_promedio: detalle.peso_promedio,
        })
      }
    }

    // Convertir a array y filtrar categorías con cantidad > 0
    const categorias = Array.from(categoriasMap.values()).filter((cat) => cat.total_cantidad > 0)

    return NextResponse.json({ categorias })
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

    for (const reclasificacion of reclasificaciones) {
      const { categoria_actual_id, nueva_categoria_id, lotes } = reclasificacion

      // Iterar sobre cada lote que tiene esta categoría
      for (const loteInfo of lotes) {
        const { lote_id, cantidad, peso_total, peso_promedio } = loteInfo

        // Llamar a la función de reclasificación por lote
        const { error: rpcError } = await supabase.rpc("reclasificar_lote_animales", {
          p_lote_id: lote_id,
          p_categoria_origen_id: categoria_actual_id,
          p_categoria_destino_id: nueva_categoria_id,
          p_cantidad_a_mover: cantidad,
          p_peso_promedio_animal: peso_promedio,
        })

        if (rpcError) {
          console.error("Error in reclasificar_lote_animales:", rpcError)
          return NextResponse.json({ error: "Error al reclasificar animales" }, { status: 500 })
        }

        // Registrar en pd_actividad_animales por cada lote
        const { error: detalleError } = await supabase.from("pd_actividad_animales").insert({
          actividad_id: actividad.id,
          lote_id: lote_id,
          categoria_animal_id: nueva_categoria_id,
          cantidad,
          peso: peso_total,
          tipo_peso: "TOTAL",
          categoria_animal_id_anterior: categoria_actual_id,
          peso_anterior: peso_total,
          tipo_peso_anterior: "TOTAL",
        })

        if (detalleError) {
          console.error("Error creating detalle:", detalleError)
          return NextResponse.json({ error: "Error al crear detalle" }, { status: 500 })
        }
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
