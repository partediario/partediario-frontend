import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

// Crear cliente de Supabase
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    console.log("Fetching stock actual with params:", {
      establecimientoId,
    })

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Construir query para la vista de stock actual con agrupación por categoría
    const query = supabase
      .from("pd_stock_actual_view")
      .select(`
    categoria_animal_id,
    categoria_animal,
    cantidad_animales,
    peso_total,
    ug,
    establecimiento_id
  `)
      .eq("establecimiento_id", establecimientoId)

    console.log("Executing stock actual query...")

    const { data: rawData, error } = await query

    if (error) {
      console.error("Error fetching stock actual:", error)
      return NextResponse.json({ error: "Error al obtener stock actual" }, { status: 500 })
    }

    // Agrupar y sumar por categoría animal
    const groupedData =
      rawData?.reduce((acc: any[], item: any) => {
        const existingCategory = acc.find((cat) => cat.categoria_animal_id === item.categoria_animal_id)

        if (existingCategory) {
          // Sumar valores existentes
          existingCategory.cantidad_animales += item.cantidad_animales || 0
          existingCategory.peso_total += item.peso_total || 0
          existingCategory.ug += item.ug || 0
        } else {
          // Crear nueva entrada para la categoría
          acc.push({
            lote_stock_id: `grouped_${item.categoria_animal_id}`, // ID único para el grupo
            categoria_animal_id: item.categoria_animal_id,
            categoria_animal: item.categoria_animal,
            cantidad_animales: item.cantidad_animales || 0,
            peso_total: item.peso_total || 0,
            ug: item.ug || 0,
            establecimiento_id: item.establecimiento_id,
          })
        }

        return acc
      }, []) || []

    // Ordenar por categoria_animal_id de forma ascendente
    const sortedData = groupedData.sort((a, b) => a.categoria_animal_id - b.categoria_animal_id)

    console.log("Stock actual grouped data:", sortedData?.length || 0, "categories")

    return NextResponse.json({
      stock_actual: sortedData,
      success: true,
    })
  } catch (error) {
    console.error("Error completo fetching stock actual:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
