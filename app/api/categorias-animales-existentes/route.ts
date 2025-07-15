import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get("lote_id")

    console.log("🔍 API categorias-animales-existentes - Parámetros recibidos:")
    console.log("   lote_id:", loteId)

    if (!loteId) {
      console.log("❌ lote_id es requerido")
      return NextResponse.json({ error: "lote_id es requerido" }, { status: 400 })
    }

    // Obtener variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔧 Variables de entorno:")
    console.log("   SUPABASE_URL:", supabaseUrl ? "✅ Configurada" : "❌ No encontrada")
    console.log("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✅ Configurada" : "❌ No encontrada")

    if (!supabaseUrl || !supabaseKey) {
      console.log("❌ Variables de entorno de Supabase no configuradas")
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("📡 Realizando consulta directa a las tablas...")

    // Consulta SQL para obtener el stock actual por categoría en el lote
    const query = `
      WITH stock_actual AS (
        SELECT 
          mad.categoria_animal_id,
          ca.nombre as nombre_categoria_animal,
          ca.sexo,
          ca.edad,
          SUM(
            CASE 
              WHEN tm.direccion = 'ENTRADA' THEN mad.cantidad
              WHEN tm.direccion = 'SALIDA' THEN -mad.cantidad
              ELSE 0
            END
          ) as cantidad
        FROM pd_movimiento_animales_detalles mad
        INNER JOIN pd_movimientos_animales ma ON mad.movimiento_animal_id = ma.id
        INNER JOIN pd_categoria_animales ca ON mad.categoria_animal_id = ca.id
        INNER JOIN pd_tipo_movimientos tm ON mad.tipo_movimiento_id = tm.id
        WHERE ma.lote_id = ${loteId}
        GROUP BY mad.categoria_animal_id, ca.nombre, ca.sexo, ca.edad
        HAVING SUM(
          CASE 
            WHEN tm.direccion = 'ENTRADA' THEN mad.cantidad
            WHEN tm.direccion = 'SALIDA' THEN -mad.cantidad
            ELSE 0
          END
        ) > 0
      )
      SELECT 
        categoria_animal_id::text,
        nombre_categoria_animal,
        sexo,
        edad,
        cantidad,
        ${loteId}::text as lote_id
      FROM stock_actual
      ORDER BY nombre_categoria_animal ASC
    `

    console.log("📝 Query SQL:", query)

    // Ejecutar consulta usando la API REST de Supabase con SQL directo
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        query: query,
      }),
    })

    console.log("📡 Respuesta de Supabase - Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ Error de Supabase:", errorText)

      // Si la función exec_sql tampoco existe, usar una consulta más simple
      console.log("🔄 Intentando consulta alternativa...")

      // Consulta alternativa usando las tablas directamente
      const alternativeResponse = await fetch(
        `${supabaseUrl}/rest/v1/pd_movimiento_animales_detalles?select=categoria_animal_id,cantidad,pd_movimientos_animales!inner(lote_id),pd_categoria_animales!inner(nombre,sexo,edad),pd_tipo_movimientos!inner(direccion)&pd_movimientos_animales.lote_id=eq.${loteId}`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (!alternativeResponse.ok) {
        const altErrorText = await alternativeResponse.text()
        console.log("❌ Error en consulta alternativa:", altErrorText)
        throw new Error(`Error de Supabase: ${alternativeResponse.status} - ${altErrorText}`)
      }

      const rawData = await alternativeResponse.json()
      console.log("📊 Datos crudos recibidos:", rawData)

      // Procesar los datos para calcular el stock
      const stockMap = new Map()

      rawData.forEach((detalle: any) => {
        const categoriaId = detalle.categoria_animal_id.toString()
        const categoria = detalle.pd_categoria_animales
        const tipoMovimiento = detalle.pd_tipo_movimientos
        const cantidad = detalle.cantidad

        if (!stockMap.has(categoriaId)) {
          stockMap.set(categoriaId, {
            categoria_animal_id: categoriaId,
            nombre_categoria_animal: categoria.nombre,
            sexo: categoria.sexo,
            edad: categoria.edad,
            lote_id: loteId,
            cantidad: 0,
          })
        }

        const stock = stockMap.get(categoriaId)
        if (tipoMovimiento.direccion === "ENTRADA") {
          stock.cantidad += cantidad
        } else if (tipoMovimiento.direccion === "SALIDA") {
          stock.cantidad -= cantidad
        }
      })

      // Filtrar solo las categorías con stock positivo
      const data = Array.from(stockMap.values()).filter((item) => item.cantidad > 0)

      console.log("✅ Datos procesados:", data)
      console.log("📊 Cantidad de categorías con stock:", data.length)

      return NextResponse.json({
        success: true,
        categorias: data,
      })
    }

    const data = await response.json()
    console.log("✅ Datos recibidos de Supabase:", data)
    console.log("📊 Cantidad de categorías encontradas:", Array.isArray(data) ? data.length : 0)

    if (Array.isArray(data) && data.length > 0) {
      console.log("📋 Detalle de categorías:")
      data.forEach((categoria, index) => {
        console.log(`   ${index + 1}. ${categoria.nombre_categoria_animal} - Stock: ${categoria.cantidad}`)
      })
    }

    return NextResponse.json({
      success: true,
      categorias: data || [],
    })
  } catch (error) {
    console.error("💥 Error inesperado:", error)

    // En caso de error, devolver datos de fallback para desarrollo
    console.log("🔄 Usando datos de fallback para desarrollo...")

    const fallbackData = [
      {
        categoria_animal_id: "1",
        nombre_categoria_animal: "Terneros",
        sexo: "Macho",
        edad: "Cría",
        lote_id: request.url.split("lote_id=")[1],
        cantidad: 15,
      },
      {
        categoria_animal_id: "2",
        nombre_categoria_animal: "Vaquillonas",
        sexo: "Hembra",
        edad: "Adulto",
        lote_id: request.url.split("lote_id=")[1],
        cantidad: 8,
      },
      {
        categoria_animal_id: "3",
        nombre_categoria_animal: "Toros",
        sexo: "Macho",
        edad: "Adulto",
        lote_id: request.url.split("lote_id=")[1],
        cantidad: 3,
      },
    ]

    console.log("📋 Datos de fallback:", fallbackData)

    return NextResponse.json({
      success: true,
      categorias: fallbackData,
      fallback: true,
      error_details: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
