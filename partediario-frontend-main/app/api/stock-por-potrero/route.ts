import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

// Crear cliente de Supabase
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")

    console.log("Fetching stock por potrero with params:", {
      establecimientoId,
    })

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    // Query para obtener stock detallado por potrero
    const query = supabase
      .from("pd_stock_actual_view")
      .select(`
        categoria_animal_id,
        categoria_animal,
        cantidad_animales,
        peso_total,
        ug,
        potrero_id,
        potrero,
        lote,
        establecimiento_id
      `)
      .eq("establecimiento_id", establecimientoId)
      .order("potrero_id", { ascending: true })
      .order("categoria_animal_id", { ascending: true })

    console.log("Executing stock por potrero query...")

    const { data: rawData, error } = await query

    if (error) {
      console.error("Error fetching stock por potrero:", error)
      return NextResponse.json({ error: "Error al obtener stock por potrero" }, { status: 500 })
    }

    // Agrupar datos por potrero y categoría
    const stockPorPotrero =
      rawData?.reduce((acc: any[], item: any) => {
        // Buscar si ya existe el potrero
        let potrero = acc.find((p) => p.potrero_id === item.potrero_id)

        if (!potrero) {
          // Crear nuevo potrero
          potrero = {
            potrero_id: item.potrero_id,
            potrero: item.potrero,
            categorias: [],
            totales: {
              cantidad_total: 0,
              peso_total: 0,
              ug_total: 0,
            },
          }
          acc.push(potrero)
        }

        // Buscar si ya existe la categoría en este potrero
        let categoria = potrero.categorias.find((c: any) => c.categoria_animal_id === item.categoria_animal_id)

        if (!categoria) {
          // Crear nueva categoría
          categoria = {
            categoria_animal_id: item.categoria_animal_id,
            categoria_animal: item.categoria_animal,
            cantidad_animales: 0,
            peso_total: 0,
            ug: 0,
            peso_promedio: 0, // Initialize peso_promedio
            lotes: [],
          }
          potrero.categorias.push(categoria)
        }

        // Sumar valores a la categoría
        categoria.cantidad_animales += item.cantidad_animales || 0
        categoria.peso_total += item.peso_total || 0
        categoria.ug += item.ug || 0
        // Calculate peso_promedio for the category
        categoria.peso_promedio =
          categoria.cantidad_animales > 0 ? categoria.peso_total / categoria.cantidad_animales : 0

        // Agregar lote si no existe
        if (item.lote && !categoria.lotes.includes(item.lote)) {
          categoria.lotes.push(item.lote)
        }

        // Sumar a totales del potrero
        potrero.totales.cantidad_total += item.cantidad_animales || 0
        potrero.totales.peso_total += item.peso_total || 0
        potrero.totales.ug_total += item.ug || 0

        return acc
      }, []) || []

    // Ordenar categorías dentro de cada potrero
    stockPorPotrero.forEach((potrero: any) => {
      potrero.categorias.sort((a: any, b: any) => a.categoria_animal_id - b.categoria_animal_id)
      potrero.categorias.forEach((categoria: any) => {
        categoria.lotes.sort()
      })
    })

    console.log("Stock por potrero grouped data:", stockPorPotrero?.length || 0, "potreros")

    return NextResponse.json({
      stock_por_potrero: stockPorPotrero,
      success: true,
    })
  } catch (error) {
    console.error("Error completo fetching stock por potrero:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
