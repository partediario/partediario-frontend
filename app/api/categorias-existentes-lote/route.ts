import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get("lote_id")

    if (!loteId) {
      return NextResponse.json({ error: "lote_id es requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("categoria_animales_existentes_view")
      .select("*")
      .eq("lote_id", loteId)
      .order("nombre_categoria_animal")

    if (error) {
      console.error("Error fetching categorias existentes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ categorias: data || [] })
  } catch (error) {
    console.error("Error in categorias-existentes-lote API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
