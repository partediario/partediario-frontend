import { type NextRequest, NextResponse } from "next/server"

const TIPOS_PESO_OPCIONAL = [2, 8] // Nacimiento (2) y Mortandad (8)

async function obtenerPesoPromedio(
  loteId: number,
  categoriaId: number,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<number | null> {
  try {
    console.log(`[v0] Obteniendo peso promedio para lote ${loteId}, categoría ${categoriaId}`)

    const response = await fetch(
      `${supabaseUrl}/rest/v1/pd_lote_stock?lote_id=eq.${loteId}&categoria_animal_id=eq.${categoriaId}&select=peso_total,cantidad`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!response.ok) {
      console.log(`[v0] Error obteniendo stock: ${response.status}`)
      return null
    }

    const stock = await response.json()
    console.log(`[v0] Stock obtenido:`, stock)

    if (!stock || stock.length === 0 || !stock[0].peso_total || !stock[0].cantidad) {
      console.log(`[v0] No hay datos de peso/cantidad en el stock`)
      return null
    }

    const pesoTotal = Number(stock[0].peso_total)
    const cantidad = Number(stock[0].cantidad)

    if (cantidad === 0) {
      console.log(`[v0] Cantidad es 0, no se puede calcular promedio`)
      return null
    }

    const pesoPromedio = Math.round(pesoTotal / cantidad)
    console.log(`[v0] Peso promedio calculado: ${pesoPromedio} (${pesoTotal} / ${cantidad})`)

    return pesoPromedio
  } catch (error) {
    console.error(`[v0] Error calculando peso promedio:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Datos recibidos para guardar:", body)

    const { establecimiento_id, nota, fecha, hora, lote_id, user_id, detalles } = body

    // Validar datos requeridos
    if (!establecimiento_id || !lote_id || !user_id || !detalles || detalles.length === 0) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: establecimiento_id, lote_id, user_id y detalles son obligatorios",
        },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("Guardando cabecera del movimiento...")

    // 1. Guardar cabecera en pd_movimientos_animales
    const cabeceraData = {
      establecimiento_id: Number.parseInt(establecimiento_id),
      nota: nota || null,
      fecha: fecha,
      hora: hora,
      lote_id: Number.parseInt(lote_id),
      user_id: user_id,
    }

    console.log("Datos de cabecera a guardar:", cabeceraData)

    const cabeceraResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimientos_animales`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(cabeceraData),
    })

    if (!cabeceraResponse.ok) {
      const errorText = await cabeceraResponse.text()
      console.error("Error guardando cabecera:", errorText)
      throw new Error(`Error guardando cabecera: ${errorText}`)
    }

    const cabeceraGuardada = await cabeceraResponse.json()
    if (!cabeceraGuardada || !Array.isArray(cabeceraGuardada) || cabeceraGuardada.length === 0) {
      console.error("Respuesta de cabecera inválida:", cabeceraGuardada)
      throw new Error("No se recibió un ID válido para la cabecera")
    }

    const movimientoId = cabeceraGuardada[0].id
    console.log("Cabecera guardada con ID:", movimientoId)

    const detallesConPeso = await Promise.all(
      detalles.map(async (detalle: any) => {
        let pesoFinal = detalle.peso ? Number.parseInt(detalle.peso) : 0
        let tipoPesoFinal = detalle.tipo_peso || "TOTAL"
        const tipoMovimientoId = Number.parseInt(detalle.tipo_movimiento_id)

        // Solo calcular peso promedio si es Nacimiento o Mortandad Y no se proporcionó peso
        if (TIPOS_PESO_OPCIONAL.includes(tipoMovimientoId) && (!pesoFinal || pesoFinal === 0)) {
          console.log(
            `[v0] Tipo ${tipoMovimientoId} permite peso opcional. Calculando promedio para categoría ${detalle.categoria_id}...`,
          )

          const pesoPromedio = await obtenerPesoPromedio(
            Number.parseInt(lote_id),
            Number.parseInt(detalle.categoria_id),
            supabaseUrl,
            supabaseKey,
          )

          if (pesoPromedio) {
            pesoFinal = pesoPromedio
            tipoPesoFinal = "PROMEDIO"
            console.log(`[v0] Usando peso promedio calculado: ${pesoFinal} kg`)
          } else {
            console.log(`[v0] No se pudo calcular peso promedio, usando 0`)
            pesoFinal = 0
          }
        }

        return {
          movimiento_animal_id: movimientoId,
          categoria_animal_id: Number.parseInt(detalle.categoria_id),
          cantidad: Number.parseInt(detalle.cantidad),
          peso: pesoFinal,
          tipo_peso: tipoPesoFinal,
          tipo_movimiento_id: tipoMovimientoId,
        }
      }),
    )

    console.log("Datos de detalles a guardar (con pesos calculados):", detallesConPeso)

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(detallesConPeso),
    })

    if (!detallesResponse.ok) {
      const errorText = await detallesResponse.text()
      console.error("Error guardando detalles:", errorText)

      // Si falla el guardado de detalles, intentar eliminar la cabecera para mantener consistencia
      try {
        await fetch(`${supabaseUrl}/rest/v1/pd_movimientos_animales?id=eq.${movimientoId}`, {
          method: "DELETE",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        })
        console.log("Cabecera eliminada debido a error en detalles")
      } catch (deleteError) {
        console.error("Error eliminando cabecera:", deleteError)
      }

      throw new Error(`Error guardando detalles: ${errorText}`)
    }

    const detallesGuardados = await detallesResponse.json()
    console.log("Detalles guardados:", detallesGuardados)

    return NextResponse.json({
      success: true,
      movimiento_id: movimientoId,
      message: "Movimiento de animales guardado correctamente",
      data: {
        cabecera: cabeceraGuardada[0],
        detalles: detallesGuardados,
      },
    })
  } catch (error) {
    console.error("Error completo saving movimiento:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Datos recibidos para actualizar:", body)

    const { id, establecimiento_id, nota, fecha, hora, lote_id, user_id, detalles } = body

    // Validar datos requeridos
    if (!id || !establecimiento_id || !lote_id || !user_id || !detalles || detalles.length === 0) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: id, establecimiento_id, lote_id, user_id y detalles son obligatorios",
        },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("Actualizando cabecera del movimiento...")

    // 1. Actualizar cabecera en pd_movimientos_animales
    const cabeceraData = {
      establecimiento_id: Number.parseInt(establecimiento_id),
      nota: nota || null,
      fecha: fecha,
      hora: hora,
      lote_id: Number.parseInt(lote_id),
      user_id: user_id,
    }

    console.log("Datos de cabecera a actualizar:", cabeceraData)

    const cabeceraResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimientos_animales?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(cabeceraData),
    })

    if (!cabeceraResponse.ok) {
      const errorText = await cabeceraResponse.text()
      console.error("Error actualizando cabecera:", errorText)
      throw new Error(`Error actualizando cabecera: ${errorText}`)
    }

    const cabeceraActualizada = await cabeceraResponse.json()
    console.log("Cabecera actualizada:", cabeceraActualizada)

    // 2. Eliminar detalles existentes
    console.log("Eliminando detalles existentes...")
    const eliminarResponse = await fetch(
      `${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles?movimiento_animal_id=eq.${id}`,
      {
        method: "DELETE",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    )

    if (!eliminarResponse.ok) {
      const errorText = await eliminarResponse.text()
      console.error("Error eliminando detalles existentes:", errorText)
      throw new Error(`Error eliminando detalles existentes: ${errorText}`)
    }

    console.log("Detalles existentes eliminados")

    const detallesConPeso = await Promise.all(
      detalles.map(async (detalle: any) => {
        let pesoFinal = detalle.peso ? Number.parseInt(detalle.peso) : 0
        let tipoPesoFinal = detalle.tipo_peso || "TOTAL"
        const tipoMovimientoId = Number.parseInt(detalle.tipo_movimiento_id)

        // Solo calcular peso promedio si es Nacimiento o Mortandad Y no se proporcionó peso
        if (TIPOS_PESO_OPCIONAL.includes(tipoMovimientoId) && (!pesoFinal || pesoFinal === 0)) {
          console.log(
            `[v0] Tipo ${tipoMovimientoId} permite peso opcional. Calculando promedio para categoría ${detalle.categoria_id}...`,
          )

          const pesoPromedio = await obtenerPesoPromedio(
            Number.parseInt(lote_id),
            Number.parseInt(detalle.categoria_id),
            supabaseUrl,
            supabaseKey,
          )

          if (pesoPromedio) {
            pesoFinal = pesoPromedio
            tipoPesoFinal = "PROMEDIO"
            console.log(`[v0] Usando peso promedio calculado: ${pesoFinal} kg`)
          } else {
            console.log(`[v0] No se pudo calcular peso promedio, usando 0`)
            pesoFinal = 0
          }
        }

        return {
          movimiento_animal_id: Number.parseInt(id),
          categoria_animal_id: Number.parseInt(detalle.categoria_id),
          cantidad: Number.parseInt(detalle.cantidad),
          peso: pesoFinal,
          tipo_peso: tipoPesoFinal,
          tipo_movimiento_id: tipoMovimientoId,
        }
      }),
    )

    console.log("Datos de nuevos detalles a insertar (con pesos calculados):", detallesConPeso)

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(detallesConPeso),
    })

    if (!detallesResponse.ok) {
      const errorText = await detallesResponse.text()
      console.error("Error insertando nuevos detalles:", errorText)
      throw new Error(`Error insertando nuevos detalles: ${errorText}`)
    }

    const detallesInsertados = await detallesResponse.json()
    console.log("Nuevos detalles insertados:", detallesInsertados)

    return NextResponse.json({
      success: true,
      movimiento_id: id,
      message: "Movimiento de animales actualizado correctamente",
      data: {
        cabecera: cabeceraActualizada[0] || cabeceraActualizada,
        detalles: detallesInsertados,
      },
    })
  } catch (error) {
    console.error("Error completo actualizando movimiento:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
