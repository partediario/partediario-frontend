import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { establecimiento_id, user_id, fecha, hora, nota, reclasificaciones } = body

    if (!establecimiento_id || !user_id || !fecha || !hora || !reclasificaciones) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (!Array.isArray(reclasificaciones) || reclasificaciones.length === 0) {
      return NextResponse.json({ error: "Debe incluir al menos una reclasificación" }, { status: 400 })
    }

    // Crear actividad en pd_actividades con tipo 38 (Reclasificación por Lote)
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .insert({
        establecimiento_id: Number(establecimiento_id),
        tipo_actividad_id: 38, // ID para reclasificación por lote
        user_id: user_id,
        fecha: fecha,
        hora: hora,
        nota: nota || null,
      })
      .select("id")
      .single()

    if (actividadError || !actividad) {
      console.error("Error creando actividad:", actividadError)
      return NextResponse.json(
        {
          error: "Error al crear la actividad",
          message: actividadError?.message,
        },
        { status: 500 },
      )
    }

    // Procesar cada reclasificación
    const actualizacionesExitosas = []
    const actualizacionesFallidas = []

    for (const reclasificacion of reclasificaciones) {
      const { lote_origen_id, categoria_animal_id, categoria_destino_id, cantidad, peso_promedio } = reclasificacion

      try {
        // Obtener el registro de stock actual
        const { data: stockActual, error: errorStock } = await supabase
          .from("pd_lote_stock")
          .select("id, cantidad, peso_total")
          .eq("lote_id", lote_origen_id)
          .eq("categoria_animal_id", categoria_animal_id)
          .single()

        if (errorStock || !stockActual) {
          console.error(
            `Error obteniendo stock para lote ${lote_origen_id}, categoría ${categoria_animal_id}:`,
            errorStock,
          )
          actualizacionesFallidas.push({ lote_origen_id, categoria_animal_id, error: "No se encontró el stock" })
          continue
        }

        // Calcular peso total a transferir
        const pesoTotal = peso_promedio * cantidad

        // Si la cantidad a recategorizar es igual a la cantidad total, actualizar el registro existente
        if (cantidad === stockActual.cantidad) {
          const { error: updateError } = await supabase
            .from("pd_lote_stock")
            .update({ categoria_animal_id: categoria_destino_id })
            .eq("id", stockActual.id)

          if (updateError) {
            console.error(`Error actualizando stock completo:`, updateError)
            actualizacionesFallidas.push({ lote_origen_id, categoria_animal_id, error: updateError.message })
            continue
          }
        } else {
          // Si es parcial, reducir la cantidad del registro original
          const nuevaCantidadOrigen = stockActual.cantidad - cantidad
          const nuevoPesoOrigen = stockActual.peso_total - pesoTotal

          const { error: updateOrigenError } = await supabase
            .from("pd_lote_stock")
            .update({
              cantidad: nuevaCantidadOrigen,
              peso_total: nuevoPesoOrigen,
            })
            .eq("id", stockActual.id)

          if (updateOrigenError) {
            console.error(`Error actualizando stock origen:`, updateOrigenError)
            actualizacionesFallidas.push({ lote_origen_id, categoria_animal_id, error: updateOrigenError.message })
            continue
          }

          // Verificar si ya existe un registro con la categoría destino en el mismo lote
          const { data: stockDestino, error: errorStockDestino } = await supabase
            .from("pd_lote_stock")
            .select("id, cantidad, peso_total")
            .eq("lote_id", lote_origen_id)
            .eq("categoria_animal_id", categoria_destino_id)
            .maybeSingle()

          if (stockDestino) {
            // Si existe, sumar las cantidades
            const { error: updateDestinoError } = await supabase
              .from("pd_lote_stock")
              .update({
                cantidad: stockDestino.cantidad + cantidad,
                peso_total: stockDestino.peso_total + pesoTotal,
              })
              .eq("id", stockDestino.id)

            if (updateDestinoError) {
              console.error(`Error actualizando stock destino existente:`, updateDestinoError)
              actualizacionesFallidas.push({ lote_origen_id, categoria_animal_id, error: updateDestinoError.message })
              continue
            }
          } else {
            // Si no existe, crear nuevo registro
            const { error: insertDestinoError } = await supabase.from("pd_lote_stock").insert({
              lote_id: lote_origen_id,
              categoria_animal_id: categoria_destino_id,
              cantidad: cantidad,
              peso_total: pesoTotal,
            })

            if (insertDestinoError) {
              console.error(`Error creando stock destino:`, insertDestinoError)
              actualizacionesFallidas.push({ lote_origen_id, categoria_animal_id, error: insertDestinoError.message })
              continue
            }
          }
        }

        // Registrar en pd_actividad_animales
        const { error: errorActividadAnimal } = await supabase.from("pd_actividad_animales").insert({
          actividad_id: actividad.id,
          categoria_animal_id: categoria_destino_id,
          cantidad: cantidad,
          peso: peso_promedio, // Using peso_promedio instead of peso_total
          tipo_peso: "PROMEDIO", // Changed from TOTAL to PROMEDIO
          lote_id: Number(lote_origen_id),
          categoria_animal_id_anterior: categoria_animal_id,
          peso_anterior: peso_promedio, // Using peso_promedio
          tipo_peso_anterior: "PROMEDIO", // Changed from TOTAL to PROMEDIO
        })

        if (errorActividadAnimal) {
          console.error(`Error creando actividad animal:`, errorActividadAnimal)
        }

        actualizacionesExitosas.push({ lote_origen_id, categoria_animal_id, categoria_destino_id })
      } catch (error) {
        console.error(`Error procesando reclasificación:`, error)
        actualizacionesFallidas.push({
          lote_origen_id,
          categoria_animal_id,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    if (actualizacionesFallidas.length > 0) {
      console.error("Algunas actualizaciones fallaron:", actualizacionesFallidas)
      return NextResponse.json(
        {
          error: "Error al procesar algunas reclasificaciones",
          fallidas: actualizacionesFallidas,
          exitosas: actualizacionesExitosas,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Reclasificación guardada exitosamente",
      actividad_id: actividad.id,
      reclasificaciones_procesadas: reclasificaciones.length,
      actualizaciones_exitosas: actualizacionesExitosas.length,
    })
  } catch (error) {
    console.error("Error en API guardar-reclasificacion-lote:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
