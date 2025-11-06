import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const establecimientoId = searchParams.get("establecimiento_id")
    const format = searchParams.get("format") || "excel"

    if (!establecimientoId) {
      return NextResponse.json({ error: "establecimiento_id es requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("pd_carga_potreros_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .order("potrero", { ascending: true })

    if (error) {
      console.error("Error fetching carga potreros:", error)
      return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
    }

    if (format === "excel") {
      const exportData = data.map((item) => ({
        Potrero: item.potrero,
        "Cab/Has": item.cabezas_por_ha,
        "Has Ganaderas": item.hectareas_utiles,
        "Kg/Has": item.kg_por_ha,
        "UG/Has": item.ug_por_ha,
        "Cantidad Animales": item.cantidad_animales,
        "Peso Total (kg)": item.peso_total,
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Carga Potreros")

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="carga-potreros-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error in export API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
