import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriaOrigenIds = searchParams.get("categoria_origen_ids")
    const empresaId = searchParams.get("empresa_id")

    console.log("[v0] Destete API called with categoria_origen_ids:", categoriaOrigenIds)
    console.log("[v0] Destete API called with empresa_id:", empresaId)

    if (!categoriaOrigenIds) {
      return NextResponse.json({ categorias: [] })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const origenIds = categoriaOrigenIds.split(",")
    const allCategorias: any[] = []

    for (const origenId of origenIds) {
      let categoriaEstandarId: number | null = null

      if (origenId === "21") {
        categoriaEstandarId = 19
        console.log("[v0] Terneros (21) -> filtering with categoria_animal_estandar_id = 19")
      } else if (origenId === "22") {
        categoriaEstandarId = 20
        console.log("[v0] Terneras (22) -> filtering with categoria_animal_estandar_id = 20")
      }

      if (categoriaEstandarId) {
        let query = supabase
          .from("pd_categoria_animales")
          .select("id,nombre,sexo,edad,empresa_id,categoria_animal_estandar_id")

        if (empresaId) {
          query = query.or(
            `id.eq.${categoriaEstandarId},and(or(empresa_id.eq.${empresaId},empresa_id.eq.1),categoria_animal_estandar_id.eq.${categoriaEstandarId})`,
          )
        } else {
          query = query.or(`id.eq.${categoriaEstandarId},categoria_animal_estandar_id.eq.${categoriaEstandarId}`)
        }

        const { data: categories, error } = await query.order("id", { ascending: true })

        if (error) {
          console.error(`[v0] Error getting categories for origen ${origenId}:`, error)
        } else if (categories && categories.length > 0) {
          categories.forEach((category) => {
            if (!allCategorias.find((c) => c.id === category.id)) {
              allCategorias.push(category)
            }
          })
          console.log(`[v0] Found ${categories.length} categories for origen ${origenId}:`, categories)
        }
      }
    }

    allCategorias.sort((a, b) => a.id - b.id)

    console.log(`[v0] Final result - returning ${allCategorias.length} categories:`, allCategorias)
    return NextResponse.json({ categorias: allCategorias })
  } catch (error) {
    console.error("[v0] Destete API Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
