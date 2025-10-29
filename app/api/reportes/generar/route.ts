import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      establecimiento_id,
      establecimiento_nombre,
      usuario_nombre,
      tipo_reporte,
      periodo,
      fecha_desde,
      fecha_hasta,
    } = body

    // Validar campos requeridos
    if (!establecimiento_id || !establecimiento_nombre || !usuario_nombre || !tipo_reporte) {
      return NextResponse.json(
        {
          success: false,
          error: "Faltan campos requeridos",
        },
        { status: 400 },
      )
    }

    // Calcular fechas según el periodo
    const now = new Date()
    let fechaInicio: Date
    let fechaFinal: Date = now

    if (periodo === "personalizado") {
      if (!fecha_desde || !fecha_hasta) {
        return NextResponse.json(
          {
            success: false,
            error: "Para periodo personalizado se requieren fecha_desde y fecha_hasta",
          },
          { status: 400 },
        )
      }
      fechaInicio = new Date(fecha_desde)
      fechaFinal = new Date(fecha_hasta)
    } else {
      // Calcular fechas según el periodo predefinido
      switch (periodo) {
        case "ultima-semana":
          fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "ultimo-mes":
          fechaInicio = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case "ultimos-3-meses":
          fechaInicio = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        case "ultimos-6-meses":
          fechaInicio = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case "ultimo-ano":
          fechaInicio = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        case "ano-actual":
          fechaInicio = new Date(now.getFullYear(), 0, 1)
          break
        default:
          fechaInicio = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      }
    }

    // Formatear fechas para el JSON
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    const formatDateTime = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    const formatTime = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${hours}:${minutes}`
    }

    // Construir el JSON para enviar a N8N
    const reportData = {
      establecimiento_id: Number(establecimiento_id),
      establecimiento_nombre,
      usuario_nombre,
      fecha_generacion: formatDateTime(now),
      hora_generacion: formatTime(now),
      filtros_aplicados: "Periodo de fechas",
      tipo_reporte,
      fecha_inicio: formatDate(fechaInicio),
      fecha_final: formatDate(fechaFinal),
      anho: now.getFullYear(),
    }

    console.log("[v0] JSON enviado a N8N:", JSON.stringify(reportData, null, 2))

    // Enviar a N8N
    const n8nUrl = process.env.REPORTES_N8N_URL

    if (!n8nUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "URL de reportes no configurada",
        },
        { status: 500 },
      )
    }

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    })

    console.log("[v0] Status de respuesta N8N:", n8nResponse.status)
    console.log("[v0] Content-Type de respuesta:", n8nResponse.headers.get("content-type"))

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error("[v0] Error de N8N:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Error al generar el reporte",
          details: errorText,
        },
        { status: n8nResponse.status },
      )
    }

    const pdfBuffer = await n8nResponse.arrayBuffer()
    console.log("[v0] PDF recibido, tamaño:", pdfBuffer.byteLength, "bytes")

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte_${tipo_reporte}_${formatDate(now)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error al generar reporte:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
