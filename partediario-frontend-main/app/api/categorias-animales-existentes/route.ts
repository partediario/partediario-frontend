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

    console.log("📡 Consultando vista categoria_animales_existentes_view...")

    // Usar la API REST de Supabase directamente para consultar la vista
    // Cambio: cantidad=gte.0 para incluir categorías con cantidad 0
    const response = await fetch(
      `${supabaseUrl}/rest/v1/categoria_animales_existentes_view?lote_id=eq.${loteId}&cantidad=gte.0&order=nombre_categoria_animal.asc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    console.log("📡 Respuesta de Supabase - Status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ Error de Supabase:", errorText)
      throw new Error(`Error de Supabase: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ Datos obtenidos de la vista:", data)
    console.log("📊 Cantidad de categorías encontradas:", data?.length || 0)

    if (data && data.length > 0) {
      console.log("📋 Detalle de categorías:")
      data.forEach((categoria: any, index: number) => {
        console.log(
          `  ${index + 1}. ID: ${categoria.categoria_animal_id} | Nombre: ${categoria.nombre_categoria_animal} | Stock: ${categoria.cantidad} | Sexo: ${categoria.sexo || "N/A"} | Edad: ${categoria.edad || "N/A"}`,
        )
      })
    } else {
      console.log("❌ No se encontraron categorías para el lote")
    }

    return NextResponse.json({
      success: true,
      categorias: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error("💥 Error inesperado:", error)

    // En caso de error, devolver datos de fallback para desarrollo
    console.log("🔄 Usando datos de fallback para desarrollo...")

    const loteId = new URL(request.url).searchParams.get("lote_id")

    const fallbackData = [
      {
        categoria_animal_id: "1",
        nombre_categoria_animal: "Terneros",
        sexo: "Macho",
        edad: "Cría",
        lote_id: loteId,
        cantidad: 15,
        peso_total: 3750,
      },
      {
        categoria_animal_id: "2",
        nombre_categoria_animal: "Vaquillonas",
        sexo: "Hembra",
        edad: "Adulto",
        lote_id: loteId,
        cantidad: 8,
        peso_total: 3200,
      },
      {
        categoria_animal_id: "3",
        nombre_categoria_animal: "Toros",
        sexo: "Macho",
        edad: "Adulto",
        lote_id: loteId,
        cantidad: 0,
        peso_total: 0,
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
