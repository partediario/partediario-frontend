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
      .from("pd_carga_view")
      .select("*")
      .eq("establecimiento_id", establecimientoId)
      .single()

    if (error) {
      console.error("Error fetching carga campo:", error)
      return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
    }

    if (format === "excel") {
      const exportData = [
        {
          Establecimiento: data.establecimiento,
          "Has Ganaderas": data.hectareas_utiles,
          "Cab/Has": data.cabezas_por_ha,
          "Kg/Has": data.kg_por_ha,
          "UG/Has": data.ug_por_ha,
          "Peso Total (kg)": data.peso_total,
        },
      ]

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Carga Campo")

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="carga-campo-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error in export API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
