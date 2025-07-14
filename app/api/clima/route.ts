import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📊 Datos de clima recibidos:", body)

    const { establecimiento_id, medida, fecha, hora, nota, user_id } = body

    // Validaciones básicas
    if (!establecimiento_id) {
      return NextResponse.json({ error: "El establecimiento es requerido" }, { status: 400 })
    }

    if (!medida || isNaN(Number.parseFloat(medida))) {
      return NextResponse.json(
        { error: "La medida de lluvia es requerida y debe ser un número válido" },
        { status: 400 },
      )
    }

    if (!fecha) {
      return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 })
    }

    if (!hora) {
      return NextResponse.json({ error: "La hora es requerida" }, { status: 400 })
    }

    if (!user_id) {
      return NextResponse.json({ error: "El ID del usuario es requerido" }, { status: 400 })
    }

    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Variables de entorno faltantes")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Preparar datos para insertar
    const climaData = {
      establecimiento_id: Number.parseInt(establecimiento_id),
      indicador_clima_id: 1, // LLUVIA (hardcoded como solicitado)
      punto_toma_id: 1, // Punto de toma por defecto (hardcoded como solicitado)
      medida: medida.toString(),
      fecha,
      hora,
      nota: nota || null,
      user_id,
    }

    console.log("📊 Datos preparados para insertar:", climaData)

    // Insertar en la tabla pd_clima
    const insertUrl = `${process.env.SUPABASE_URL}/rest/v1/pd_clima`

    const insertResponse = await fetch(insertUrl, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(climaData),
    })

    if (!insertResponse.ok) {
      const errorData = await insertResponse.json()
      console.error("❌ Error insertando datos de clima:", errorData)
      return NextResponse.json(
        { error: "Error al guardar los datos de clima", details: errorData },
        { status: insertResponse.status },
      )
    }

    const insertedData = await insertResponse.json()
    console.log("✅ Datos de clima guardados exitosamente:", insertedData)

    return NextResponse.json({
      success: true,
      message: "Datos de clima guardados exitosamente",
      data: insertedData,
    })
  } catch (error) {
    console.error("💥 Error en /api/clima:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("🔄 PUT /api/clima - Actualizando registro de lluvia")

    const body = await request.json()
    console.log("📝 Datos recibidos para actualización:", body)

    const { id, establecimiento_id, medida, fecha, hora, nota, user_id } = body

    // Validaciones
    if (!id) {
      console.error("❌ ID del registro faltante")
      return NextResponse.json({ error: "ID del registro es requerido" }, { status: 400 })
    }

    if (!establecimiento_id) {
      console.error("❌ establecimiento_id faltante")
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    if (!medida) {
      console.error("❌ medida faltante")
      return NextResponse.json({ error: "medida es requerida" }, { status: 400 })
    }

    if (!fecha) {
      console.error("❌ fecha faltante")
      return NextResponse.json({ error: "fecha es requerida" }, { status: 400 })
    }

    if (!hora) {
      console.error("❌ hora faltante")
      return NextResponse.json({ error: "hora es requerida" }, { status: 400 })
    }

    if (!user_id) {
      console.error("❌ user_id faltante")
      return NextResponse.json({ error: "user_id es requerido" }, { status: 400 })
    }

    console.log("✅ Todas las validaciones pasaron")

    // Verificar variables de entorno
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ Variables de entorno faltantes")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    console.log("✅ Variables de entorno verificadas")
    console.log("🔗 SUPABASE_URL:", process.env.SUPABASE_URL)

    // Primero, verificar si el registro existe en pd_clima
    const checkUrl = `${process.env.SUPABASE_URL}/rest/v1/pd_clima?id=eq.${id}&select=id,medida,fecha,hora,nota`

    console.log("🔍 Verificando existencia del registro en pd_clima...")
    console.log("🔗 URL de verificación:", checkUrl)

    const checkResponse = await fetch(checkUrl, {
      method: "GET",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    })

    console.log("📡 Respuesta de verificación - Status:", checkResponse.status)

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text()
      console.error("❌ Error verificando registro:", errorText)
      return NextResponse.json({ error: "Error verificando registro existente" }, { status: 500 })
    }

    const existingRecords = await checkResponse.json()
    console.log("📋 Registros encontrados en pd_clima:", existingRecords)

    if (!existingRecords || existingRecords.length === 0) {
      console.error("❌ No se encontró el registro con ID:", id)
      return NextResponse.json({ error: `No se encontró el registro de clima con ID ${id}` }, { status: 404 })
    }

    const existingRecord = existingRecords[0]
    console.log("📄 Registro existente:", existingRecord)

    console.log("📊 Actualizando registro de clima con ID:", id)

    // Preparar datos de actualización para la tabla pd_clima
    const updateData = {
      establecimiento_id: Number.parseInt(establecimiento_id),
      medida: medida.toString(),
      fecha: fecha,
      hora: hora,
      nota: nota || null,
      user_id: user_id,
      updated_at: new Date().toISOString(),
    }

    console.log("📦 Datos de actualización preparados:", updateData)

    // Actualizar la tabla pd_clima directamente
    const updateUrl = `${process.env.SUPABASE_URL}/rest/v1/pd_clima?id=eq.${id}`

    console.log("🔗 URL de actualización:", updateUrl)

    const updateResponse = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    console.log("📡 Respuesta de actualización - Status:", updateResponse.status)

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("❌ Error actualizando registro de clima - Status:", updateResponse.status)
      console.error("❌ Error actualizando registro de clima - Response:", errorText)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }

      return NextResponse.json(
        { error: "Error actualizando registro de clima", details: errorData },
        { status: updateResponse.status },
      )
    }

    const updatedDataText = await updateResponse.text()
    console.log("📄 Respuesta de actualización (texto):", updatedDataText)

    let updatedData
    try {
      updatedData = JSON.parse(updatedDataText)
    } catch {
      console.error("❌ Error parseando respuesta JSON")
      return NextResponse.json({ error: "Error procesando respuesta del servidor" }, { status: 500 })
    }

    if (!updatedData || updatedData.length === 0) {
      console.error("❌ No se actualizó ningún registro")
      return NextResponse.json({ error: "No se pudo actualizar el registro" }, { status: 500 })
    }

    console.log("✅ Registro de clima actualizado exitosamente:", updatedData[0])

    return NextResponse.json({
      success: true,
      message: "Registro de lluvia actualizado exitosamente",
      data: updatedData[0],
    })
  } catch (error) {
    console.error("💥 Error en PUT /api/clima:", error)
    console.error("💥 Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
