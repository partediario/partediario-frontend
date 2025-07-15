import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Workbook } from "exceljs"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formato = searchParams.get("formato") || "excel"
    const establecimientoId = searchParams.get("establecimiento_id")
    const ubicacion = searchParams.get("ubicacion")
    const empleado = searchParams.get("empleado")
    const busqueda = searchParams.get("busqueda")

    console.log("Exporting actividades with params:", {
      formato,
      establecimientoId,
      ubicacion,
      empleado,
      busqueda,
    })

    // Obtener información del establecimiento
    let establecimientoNombre = "Establecimiento"
    if (establecimientoId && establecimientoId !== "todos") {
      const { data: establecimiento } = await supabase
        .from("pd_establecimientos")
        .select("nombre")
        .eq("id", establecimientoId)
        .single()

      if (establecimiento) {
        establecimientoNombre = establecimiento.nombre
      }
    }

    let query = supabase.from("pd_actividades_view").select("*")

    // Aplicar los mismos filtros que en la consulta principal
    if (establecimientoId && establecimientoId !== "todos") {
      query = query.eq("establecimiento_id", establecimientoId)
    }

    if (ubicacion && ubicacion !== "todos") {
      query = query.eq("tipo_actividad_ubicacion", ubicacion)
    }

    if (empleado && empleado !== "todos") {
      query = query.eq("usuario", empleado)
    }

    if (busqueda && busqueda.trim() !== "") {
      query = query.or(`tipo_actividad_nombre.ilike.%${busqueda}%,usuario.ilike.%${busqueda}%`)
    }

    // Ordenar por fecha y hora más recientes primero
    query = query.order("fecha", { ascending: false }).order("hora", { ascending: false })

    // Para exportar, no limitamos los resultados
    const { data: actividades, error } = await query

    if (error) {
      console.error("Error fetching actividades for export:", error)
      return NextResponse.json(
        { error: "Error al obtener las actividades para exportar", details: error.message },
        { status: 500 },
      )
    }

    if (formato === "excel") {
      // Generar CSV para Excel (igual formato que movimientos recientes)
      const headers = ["Fecha", "Actividad", "Empleado", "Ubicación", "Insumo", "Cantidad", "Animal", "Cantidad Animal"]

      const csvRows = [
        headers.join(","),
        ...(actividades || []).map((actividad) =>
          [
            actividad.fecha
              ? new Date(actividad.fecha).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "",
            `"${actividad.tipo_actividad_nombre || ""}"`,
            `"${actividad.usuario || ""}"`,
            `"${
              actividad.tipo_actividad_ubicacion
                ? actividad.tipo_actividad_ubicacion.charAt(0).toUpperCase() +
                  actividad.tipo_actividad_ubicacion.slice(1).toLowerCase()
                : ""
            }"`,
            `"${actividad.insumo_nombre || ""}"`,
            actividad.insumo_cantidad || "",
            `"${actividad.categoria_animal || ""}"`,
            actividad.animal_cantidad || "",
          ].join(","),
        ),
      ]

      const csvContent = csvRows.join("\n")
      const buffer = Buffer.from("\ufeff" + csvContent, "utf8") // BOM para Excel

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="actividades_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else if (formato === "pdf") {
      // Generar HTML para PDF con el mismo formato que movimientos recientes
      const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Actividades</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #333;
        }
        
        .header h2 {
            font-size: 14px;
            margin: 0 0 10px 0;
            color: #666;
        }
        
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
        }
        
        .info-item {
            flex: 1;
        }
        
        .info-label {
            font-weight: bold;
            color: #333;
        }
        
        .info-value {
            color: #666;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .table th {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }
        
        .table td {
            border: 1px solid #ccc;
            padding: 6px;
            font-size: 10px;
            vertical-align: top;
        }
        
        .table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .footer {
            position: fixed;
            bottom: 1cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5px;
        }
        
        .no-data {
            text-align: center;
            color: #666;
            padding: 40px;
            font-style: italic;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>REPORTE DE ACTIVIDADES</h1>
        <h2>Actividades del Personal</h2>
    </div>

    <div class="info-section">
        <div class="info-item">
            <div class="info-label">Establecimiento:</div>
            <div class="info-value">${establecimientoNombre}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Fecha de generación:</div>
            <div class="info-value">${fechaGeneracion}</div>
        </div>
    </div>

    ${
      actividades && actividades.length > 0
        ? `
    <table class="table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Actividad</th>
                <th>Empleado</th>
                <th>Ubicación</th>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Animal</th>
                <th>Cantidad</th>
            </tr>
        </thead>
        <tbody>
            ${actividades
              .map(
                (actividad) => `
                <tr>
                    <td>${
                      actividad.fecha
                        ? new Date(actividad.fecha).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                          })
                        : "-"
                    }</td>
                    <td>${actividad.tipo_actividad_nombre || "-"}</td>
                    <td>${actividad.usuario || "-"}</td>
                    <td>${
                      actividad.tipo_actividad_ubicacion
                        ? actividad.tipo_actividad_ubicacion.charAt(0).toUpperCase() +
                          actividad.tipo_actividad_ubicacion.slice(1).toLowerCase()
                        : "-"
                    }</td>
                    <td>${actividad.insumo_nombre || "-"}</td>
                    <td>${actividad.insumo_cantidad || "-"}</td>
                    <td>${actividad.categoria_animal || "-"}</td>
                    <td>${actividad.animal_cantidad || "-"}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    `
        : `
    <div class="no-data">
        <p>No se encontraron actividades con los filtros aplicados.</p>
    </div>
    `
    }

    <div class="footer">
        <div>Página 1 de 1</div>
        <div>Generado por Parte Diario</div>
    </div>
</body>
</html>`

      const buffer = Buffer.from(htmlContent, "utf8")

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="reporte_actividades_${new Date().toISOString().split("T")[0]}.html"`,
        },
      })
    } else if (formato === "xlsx") {
      const workbook = new Workbook()
      const worksheet = workbook.addWorksheet("Actividades")

      worksheet.columns = [
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Actividad", key: "actividad", width: 20 },
        { header: "Empleado", key: "empleado", width: 20 },
        { header: "Ubicación", key: "ubicacion", width: 20 },
        { header: "Insumo", key: "insumo", width: 20 },
        { header: "Cantidad Insumo", key: "cantidadInsumo", width: 15 },
        { header: "Animal", key: "animal", width: 20 },
        { header: "Cantidad Animal", key: "cantidadAnimal", width: 15 },
      ]

      actividades.forEach((actividad) => {
        worksheet.addRow({
          fecha: new Date(actividad.fecha).toLocaleDateString("es-ES"),
          actividad: actividad.tipo_actividad_nombre,
          empleado: actividad.usuario,
          ubicacion:
            actividad.tipo_actividad_ubicacion_formateada ||
            (actividad.tipo_actividad_ubicacion
              ? actividad.tipo_actividad_ubicacion.charAt(0).toUpperCase() +
                actividad.tipo_actividad_ubicacion.slice(1).toLowerCase()
              : ""),
          insumo: actividad.insumo_nombre || "",
          cantidadInsumo: actividad.insumo_cantidad || "",
          animal: actividad.categoria_animal || "",
          cantidadAnimal: actividad.animal_cantidad || "",
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="actividades_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Unexpected error in actividades export API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actividades, format, filters } = body

    console.log("Exporting actividades:", { count: actividades?.length, format, filters })

    if (!actividades || !Array.isArray(actividades)) {
      return NextResponse.json({ error: "Datos de actividades requeridos" }, { status: 400 })
    }

    if (format === "pdf") {
      // Para PDF, retornamos los datos para que el cliente genere el PDF
      const pdfData = {
        title: "Actividades del Personal",
        subtitle: `Establecimiento: ${filters?.establecimiento || "Todos"}`,
        date: new Date().toLocaleDateString("es-ES"),
        filters: {
          establecimiento: filters?.establecimiento || "Todos",
          ubicacion: filters?.ubicacion || "Todas",
          empleado: filters?.empleado || "Todos",
          busqueda: filters?.busqueda || "Sin filtro",
        },
        data: actividades.map((act: any) => ({
          fecha: new Date(act.fecha).toLocaleDateString("es-ES"),
          actividad: act.tipo_actividad_nombre,
          empleado: act.usuario,
          ubicacion:
            act.tipo_actividad_ubicacion_formateada ||
            (act.tipo_actividad_ubicacion
              ? act.tipo_actividad_ubicacion.charAt(0).toUpperCase() +
                act.tipo_actividad_ubicacion.slice(1).toLowerCase()
              : ""),
          insumo: act.insumo_nombre || "",
          cantidadInsumo: act.insumo_cantidad || "",
          animal: act.categoria_animal || "",
          cantidadAnimal: act.animal_cantidad || "",
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
      const xlsxData = actividades.map((act: any) => ({
        Fecha: new Date(act.fecha).toLocaleDateString("es-ES"),
        Actividad: act.tipo_actividad_nombre,
        Empleado: act.usuario,
        Ubicación:
          act.tipo_actividad_ubicacion_formateada ||
          (act.tipo_actividad_ubicacion
            ? act.tipo_actividad_ubicacion.charAt(0).toUpperCase() + act.tipo_actividad_ubicacion.slice(1).toLowerCase()
            : ""),
        Insumo: act.insumo_nombre || "",
        "Cantidad Insumo": act.insumo_cantidad || "",
        Animal: act.categoria_animal || "",
        "Cantidad Animal": act.animal_cantidad || "",
      }))

      return NextResponse.json({
        success: true,
        format: "xlsx",
        data: xlsxData,
        filename: `actividades_${new Date().toISOString().split("T")[0]}.xlsx`,
      })
    }

    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error exporting actividades:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
