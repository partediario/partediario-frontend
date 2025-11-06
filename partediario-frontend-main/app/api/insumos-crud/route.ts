import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establecimiento_id = searchParams.get("establecimiento_id")

    if (!establecimiento_id) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const { data: insumos, error } = await supabase
      .from("pd_insumos")
      .select(`
        *,
        pd_clase_insumos(nombre),
        pd_tipos_insumo(nombre),
        pd_subtipos_insumo(nombre),
        pd_unidad_medida_producto:pd_unidad_medida_insumos!pd_insumos_unidad_medida_producto_fkey(nombre),
        pd_unidad_medida_uso:pd_unidad_medida_insumos!pd_insumos_unidad_medida_uso_fkey(nombre),
        pd_insumos_stock(id, cantidad)
      `)
      .eq("establecimiento_id", establecimiento_id)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching insumos:", error)
      return NextResponse.json({ error: "Error al obtener insumos" }, { status: 500 })
    }

    // Transformar los datos para incluir el stock
    const insumosConStock =
      insumos?.map((insumo) => ({
        ...insumo,
        stock: insumo.pd_insumos_stock?.[0] || null,
      })) || []

    return NextResponse.json({ insumos: insumosConStock })
  } catch (error) {
    console.error("Error in GET /api/insumos-crud:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      contenido,
      clase_insumo_id,
      tipo_insumo_id,
      subtipo_insumo_id,
      unidad_medida_producto,
      unidad_medida_uso,
      empresa_id,
      establecimiento_id,
    } = body

    // Validaciones
    if (!nombre || nombre.trim().length < 3) {
      return NextResponse.json({ error: "El nombre debe tener al menos 3 caracteres" }, { status: 400 })
    }

    if (!contenido || contenido <= 0) {
      return NextResponse.json({ error: "El contenido debe ser mayor a 0" }, { status: 400 })
    }

    if (!clase_insumo_id || !tipo_insumo_id || !subtipo_insumo_id) {
      return NextResponse.json({ error: "Debe seleccionar clase, tipo y subtipo de insumo" }, { status: 400 })
    }

    if (!unidad_medida_producto || !unidad_medida_uso) {
      return NextResponse.json({ error: "Debe seleccionar las unidades de medida" }, { status: 400 })
    }

    if (!empresa_id || !establecimiento_id) {
      return NextResponse.json({ error: "Empresa y establecimiento son requeridos" }, { status: 400 })
    }

    const { data: insumo, error } = await supabase
      .from("pd_insumos")
      .insert({
        nombre: nombre.trim(),
        contenido: Number.parseInt(contenido),
        clase_insumo_id: Number.parseInt(clase_insumo_id),
        tipo_insumo_id: Number.parseInt(tipo_insumo_id),
        subtipo_insumo_id: Number.parseInt(subtipo_insumo_id),
        unidad_medida_producto: Number.parseInt(unidad_medida_producto),
        unidad_medida_uso: Number.parseInt(unidad_medida_uso),
        empresa_id: Number.parseInt(empresa_id),
        establecimiento_id: Number.parseInt(establecimiento_id),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating insumo:", error)
      return NextResponse.json({ error: "Error al crear insumo" }, { status: 500 })
    }

    return NextResponse.json({ insumo })
  } catch (error) {
    console.error("Error in POST /api/insumos-crud:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
