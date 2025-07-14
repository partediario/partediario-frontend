import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { movimientos, format, filters } = body

    console.log("Exporting movimientos:", { count: movimientos?.length, format, filters })

    if (!movimientos || !Array.isArray(movimientos)) {
      return NextResponse.json({ error: "Datos de movimientos requeridos" }, { status: 400 })
    }

    if (format === "pdf") {
      // Para PDF, retornamos los datos para que el cliente genere el PDF
      const pdfData = {
        title: "Movimientos Recientes de Animales",
        subtitle: `Establecimiento: ${filters?.establecimiento || "Todos"}`,
        date: new Date().toLocaleDateString("es-ES"),
        filters: {
          establecimiento: filters?.establecimiento || "Todos",
          fechaDesde: filters?.fechaDesde || "Sin filtro",
          fechaHasta: filters?.fechaHasta || "Sin filtro",
          tipo: filters?.tipo || "Todos",
          busqueda: filters?.search || "Sin filtro",
        },
        data: movimientos.map((mov: any) => ({
          fecha: new Date(mov.fecha).toLocaleDateString("es-ES"),
          hora: mov.hora,
          categoria: mov.categoria_animal,
          tipo: mov.tipo_movimiento,
          movimiento: mov.movimiento,
          cantidad: mov.total_cantidad_animales?.toLocaleString() || "0",
          pesoProm: `${mov.peso_promedio?.toLocaleString() || "0"} kg`,
          pesoTotal: `${mov.peso_total?.toLocaleString() || "0"} kg`,
          usuario: mov.usuario,
        })),
      }

      return NextResponse.json({
        success: true,
        format: "pdf",
        data: pdfData,
      })
    }

    if (format === "xlsx") {
      // Para XLSX, preparamos los datos en formato tabular
      const xlsxData = movimientos.map((mov: any) => ({
        Fecha: new Date(mov.fecha).toLocaleDateString("es-ES"),
        Hora: mov.hora,
        Categoría: mov.categoria_animal,
        Tipo: mov.tipo_movimiento,
        Movimiento: mov.movimiento,
        Cantidad: mov.total_cantidad_animales || 0,
        "Peso Promedio (kg)": mov.peso_promedio || 0,
        "Peso Total (kg)": mov.peso_total || 0,
        Usuario: mov.usuario,
        Establecimiento: mov.establecimiento,
        Empresa: mov.empresa,
      }))

      return NextResponse.json({
        success: true,
        format: "xlsx",
        data: xlsxData,
        filename: `movimientos_recientes_${new Date().toISOString().split("T")[0]}.xlsx`,
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting movimientos:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
