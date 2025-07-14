import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { establecimiento_id, establecimiento_nombre, year } = await request.json()

    if (!establecimiento_id || !year) {
      return NextResponse.json({ error: "Parámetros requeridos faltantes" }, { status: 400 })
    }

    // Obtener datos de lluvia del año
    const { data: datosLluvia, error } = await supabase
      .from("pd_clima")
      .select("fecha, lluvia")
      .eq("establecimiento_id", establecimiento_id)
      .gte("fecha", `${year}-01-01`)
      .lte("fecha", `${year}-12-31`)
      .order("fecha")

    if (error) {
      console.error("Error fetching clima data:", error)
      return NextResponse.json({ error: "Error al obtener datos de lluvia" }, { status: 500 })
    }

    // Procesar datos por mes
    const datosPorMes = Array.from({ length: 12 }, (_, i) => ({
      mes: new Date(year, i).toLocaleDateString("es-ES", { month: "long" }),
      mesNumero: i + 1,
      totalMm: 0,
      diasConLluvia: 0,
      promedio: 0,
    }))

    datosLluvia?.forEach((registro) => {
      const fecha = new Date(registro.fecha)
      const mesIndex = fecha.getMonth()
      const lluvia = registro.lluvia || 0

      if (lluvia > 0) {
        datosPorMes[mesIndex].totalMm += lluvia
        datosPorMes[mesIndex].diasConLluvia += 1
      }
    })

    // Calcular promedios
    datosPorMes.forEach((mes) => {
      mes.promedio = mes.diasConLluvia > 0 ? Math.round(mes.totalMm / mes.diasConLluvia) : 0
    })

    const totalAnual = datosPorMes.reduce((sum, mes) => sum + mes.totalMm, 0)
    const totalDiasConLluvia = datosPorMes.reduce((sum, mes) => sum + mes.diasConLluvia, 0)

    // Generar HTML para el PDF
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                font-size: 12px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #333;
                padding-bottom: 15px;
            }
            .title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 5px; 
            }
            .subtitle { 
                font-size: 14px; 
                color: #666; 
            }
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                background-color: #f8f9fa;
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
                margin-top: 2px;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 20px;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: center; 
            }
            th { 
                background-color: #f2f2f2; 
                font-weight: bold; 
            }
            .total-row {
                background-color: #e8f5e8;
                font-weight: bold;
            }
            .footer { 
                position: fixed; 
                bottom: 20px; 
                left: 20px; 
                right: 20px; 
                text-align: center; 
                font-size: 10px; 
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            .no-data {
                color: #999;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">REPORTE DE LLUVIAS</div>
            <div class="subtitle">Análisis Mensual de Precipitaciones</div>
        </div>
        
        <div class="info-section">
            <div class="info-item">
                <div class="info-label">Establecimiento:</div>
                <div class="info-value">${establecimiento_nombre}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Año:</div>
                <div class="info-value">${year}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha de generación:</div>
                <div class="info-value">${new Date().toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Mes</th>
                    <th>Total (mm)</th>
                    <th>Días con lluvia</th>
                    <th>Promedio por día (mm)</th>
                </tr>
            </thead>
            <tbody>
                ${datosPorMes
                  .map(
                    (mes) => `
                    <tr>
                        <td style="text-align: left; text-transform: capitalize;">${mes.mes}</td>
                        <td>${mes.totalMm > 0 ? `${mes.totalMm} mm` : '<span class="no-data">0 mm</span>'}</td>
                        <td>${mes.diasConLluvia > 0 ? mes.diasConLluvia : '<span class="no-data">0</span>'}</td>
                        <td>${mes.promedio > 0 ? `${mes.promedio} mm` : '<span class="no-data">0 mm</span>'}</td>
                    </tr>
                `,
                  )
                  .join("")}
                <tr class="total-row">
                    <td style="text-align: left;"><strong>TOTAL ANUAL</strong></td>
                    <td><strong>${totalAnual} mm</strong></td>
                    <td><strong>${totalDiasConLluvia}</strong></td>
                    <td><strong>${totalDiasConLluvia > 0 ? Math.round(totalAnual / totalDiasConLluvia) : 0} mm</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <div>Página 1 de 1 | Generado por Parte Diario</div>
        </div>
    </body>
    </html>
    `

    // Usar Puppeteer para generar PDF
    const puppeteer = require("puppeteer")
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="reporte-lluvias-${establecimiento_nombre}-${year}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
