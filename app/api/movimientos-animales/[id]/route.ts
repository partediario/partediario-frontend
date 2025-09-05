import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("Obteniendo movimiento con ID:", id)

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Obtener la cabecera del movimiento
    const cabeceraResponse = await fetch(`${supabaseUrl}/rest/v1/pd_movimientos_animales?id=eq.${id}&select=*`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!cabeceraResponse.ok) {
      const errorText = await cabeceraResponse.text()
      console.error("Error obteniendo cabecera:", errorText)
      throw new Error(`Error obteniendo cabecera: ${errorText}`)
    }

    const cabeceraData = await cabeceraResponse.json()
    if (!cabeceraData || cabeceraData.length === 0) {
      return NextResponse.json({ error: "Movimiento no encontrado" }, { status: 404 })
    }

    const cabecera = cabeceraData[0]
    console.log("Cabecera encontrada:", cabecera)

    // Obtener los detalles del movimiento con información adicional
    const detallesResponse = await fetch(
      `${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles?movimiento_animal_id=eq.${id}&select=*,pd_categoria_animales(nombre),pd_tipo_movimientos(nombre)`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!detallesResponse.ok) {
      const errorText = await detallesResponse.text()
      console.error("Error obteniendo detalles:", errorText)
      throw new Error(`Error obteniendo detalles: ${errorText}`)
    }

    const detallesData = await detallesResponse.json()
    console.log("Detalles encontrados:", detallesData)

    // Formatear los detalles con los nombres
    const detallesFormateados = detallesData.map((detalle: any) => ({
      ...detalle,
      categoria_nombre: detalle.pd_categoria_animales?.nombre || "Categoría desconocida",
      tipo_movimiento_nombre: detalle.pd_tipo_movimientos?.nombre || "Tipo desconocido",
    }))

    // Obtener información del lote si es necesario
    let loteNombre = null
    if (cabecera.lote_id) {
      try {
        const loteResponse = await fetch(`${supabaseUrl}/rest/v1/pd_lotes?id=eq.${cabecera.lote_id}&select=nombre`, {
          method: "GET",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        })

        if (loteResponse.ok) {
          const loteData = await loteResponse.json()
          if (loteData && loteData.length > 0) {
            loteNombre = loteData[0].nombre
          }
        }
      } catch (error) {
        console.warn("Error obteniendo nombre del lote:", error)
      }
    }

    const movimientoCompleto = {
      ...cabecera,
      lote_nombre: loteNombre,
      detalles: detallesFormateados,
    }

    console.log("Movimiento completo:", movimientoCompleto)

    return NextResponse.json({
      success: true,
      movimiento: movimientoCompleto,
    })
  } catch (error) {
    console.error("Error completo obteniendo movimiento:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    console.log("Soft delete para movimiento ID:", id, "con datos:", body)

    const { deleted, deleted_at, deleted_user_id } = body

    // Validar datos requeridos para soft delete
    if (typeof deleted !== "boolean" || !deleted_at || !deleted_user_id) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: deleted, deleted_at y deleted_user_id son obligatorios" },
        { status: 400 },
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    // Actualizar el registro con soft delete
    const updateData = {
      deleted: deleted,
      deleted_at: deleted_at,
      deleted_user_id: deleted_user_id,
    }

    console.log("Actualizando registro con soft delete:", updateData)

    const response = await fetch(`${supabaseUrl}/rest/v1/pd_movimientos_animales?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error en soft delete:", errorText)
      throw new Error(`Error en soft delete: ${errorText}`)
    }

    const updatedRecord = await response.json()
    console.log("Registro actualizado con soft delete:", updatedRecord)

    return NextResponse.json({
      success: true,
      message: "Parte diario eliminado correctamente",
      data: updatedRecord,
    })
  } catch (error) {
    console.error("Error completo en soft delete:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
