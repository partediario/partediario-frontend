import { type NextRequest, NextResponse } from "next/server"

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

    // 2. Guardar detalles en pd_movimiento_animales_detalles
    const detallesData = detalles.map((detalle: any) => ({
      movimiento_animal_id: movimientoId,
      categoria_animal_id: Number.parseInt(detalle.categoria_id),
      cantidad: Number.parseInt(detalle.cantidad),
      peso: Number.parseInt(detalle.peso), // La tabla espera integer
      tipo_peso: detalle.tipo_peso, // 'TOTAL' o 'PROMEDIO'
      tipo_movimiento_id: Number.parseInt(detalle.tipo_movimiento_id),
    }))

    console.log("Datos de detalles a guardar:", detallesData)

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(detallesData),
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

    // 3. Insertar nuevos detalles
    const detallesData = detalles.map((detalle: any) => ({
      movimiento_animal_id: Number.parseInt(id),
      categoria_animal_id: Number.parseInt(detalle.categoria_id),
      cantidad: Number.parseInt(detalle.cantidad),
      peso: Number.parseInt(detalle.peso),
      tipo_peso: detalle.tipo_peso,
      tipo_movimiento_id: Number.parseInt(detalle.tipo_movimiento_id),
    }))

    console.log("Datos de nuevos detalles a insertar:", detallesData)

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(detallesData),
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
