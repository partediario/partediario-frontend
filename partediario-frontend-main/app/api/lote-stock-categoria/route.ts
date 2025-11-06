import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get("lote_id")

    console.log("🔍 API lote-stock-categoria - Parámetros recibidos:")
    console.log("   lote_id:", loteId)

    if (!loteId) {
      return NextResponse.json({ error: "lote_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    console.log("📡 Consultando movimientos para el lote:", loteId)

    // Obtener todos los movimientos del lote
    const movimientosResponse = await fetch(
      `${supabaseUrl}/rest/v1/pd_movimientos_animales?lote_id=eq.${loteId}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!movimientosResponse.ok) {
      throw new Error(`Error obteniendo movimientos: ${movimientosResponse.status}`)
    }

    const movimientos = await movimientosResponse.json()
    console.log("📋 Movimientos encontrados:", movimientos.length)

    if (movimientos.length === 0) {
      return NextResponse.json({
        success: true,
        categorias: [],
        message: "No hay movimientos en este lote",
      })
    }

    // Obtener IDs de movimientos
    const movimientoIds = movimientos.map((m: any) => m.id)
    console.log("🔢 IDs de movimientos:", movimientoIds)

    // Obtener detalles de movimientos con información relacionada
    const detallesQuery = `pd_movimiento_animales_detalles?movimiento_animal_id=in.(${movimientoIds.join(
      ",",
    )})&select=categoria_animal_id,cantidad,tipo_movimiento_id,pd_categoria_animales(nombre,sexo,edad),pd_tipo_movimientos(direccion)`

    console.log("📝 Query de detalles:", detallesQuery)

    const detallesResponse = await fetch(`${supabaseUrl}/rest/v1/${detallesQuery}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!detallesResponse.ok) {
      const errorText = await detallesResponse.text()
      console.log("❌ Error obteniendo detalles:", errorText)
      throw new Error(`Error obteniendo detalles: ${detallesResponse.status}`)
    }

    const detalles = await detallesResponse.json()
    console.log("📊 Detalles obtenidos:", detalles.length)

    // Calcular stock por categoría
    const stockMap = new Map()

    detalles.forEach((detalle: any) => {
      const categoriaId = detalle.categoria_animal_id.toString()
      const categoria = detalle.pd_categoria_animales
      const tipoMovimiento = detalle.pd_tipo_movimientos
      const cantidad = detalle.cantidad

      console.log(`📝 Procesando detalle:`, {
        categoriaId,
        categoria: categoria?.nombre,
        direccion: tipoMovimiento?.direccion,
        cantidad,
      })

      if (!categoria || !tipoMovimiento) {
        console.log("⚠️ Detalle incompleto, saltando...")
        return
      }

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
        console.log(`  ➕ Entrada: +${cantidad} (total: ${stock.cantidad})`)
      } else if (tipoMovimiento.direccion === "SALIDA") {
        stock.cantidad -= cantidad
        console.log(`  ➖ Salida: -${cantidad} (total: ${stock.cantidad})`)
      }
    })

    // Filtrar solo las categorías con stock positivo
    const categoriasConStock = Array.from(stockMap.values()).filter((item) => item.cantidad > 0)

    console.log("✅ Categorías con stock positivo:", categoriasConStock.length)
    categoriasConStock.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.nombre_categoria_animal}: ${cat.cantidad} animales`)
    })

    return NextResponse.json({
      success: true,
      categorias: categoriasConStock,
      total_movimientos: movimientos.length,
      total_detalles: detalles.length,
    })
  } catch (error) {
    console.error("💥 Error en lote-stock-categoria:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
