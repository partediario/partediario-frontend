"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Weight, Download, ChevronDown, HelpCircle, X } from "lucide-react"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"

// Tipos para integración con Supabase
export interface StockItem {
  lote_stock_id: string
  categoria_animal_id: number
  categoria_animal: string
  cantidad_animales: number
  peso_promedio: number
  peso_total: number
  ug: number
  lote_id: number
  empresa_id: number
  empresa: string
  establecimiento_id: number
  establecimiento: string
  potrero_id: number
  potrero: string
  lote: string
}

interface StockActualProps {
  onRowClick?: (id: string) => void
}

export default function StockActual({ onRowClick }: StockActualProps) {
  const { establecimientoSeleccionado, getEstablecimientoNombre } = useEstablishment()

  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Cargar stock actual
  const fetchStockActual = async () => {
    if (!establecimientoSeleccionado) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        establecimiento_id: establecimientoSeleccionado,
      })

      const response = await fetch(`/api/stock-actual?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar stock actual")

      const data = await response.json()
      setStockItems(data.stock_actual || [])
    } catch (error) {
      console.error("Error fetching stock actual:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el stock actual",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStockActual()
  }, [establecimientoSeleccionado])

  // Función para descargar archivo Excel manualmente
  const downloadExcelFile = (data: any[], filename: string) => {
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename.replace(".xlsx", ".csv"))
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Función de exportación
  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)

    try {
      toast({
        title: "Generando archivo",
        description: `Preparando archivo ${format.toUpperCase()}...`,
      })

      // Datos para exportar
      const dataToExport = stockItems.map((item) => ({
        Categoría: item.categoria_animal,
        Cantidad: item.cantidad_animales || 0,
        "Peso Total (kg)": item.peso_total || 0,
        UG: item.ug || 0,
      }))

      // Agregar fila de totales
      const totales = stockItems.reduce(
        (acc, item) => {
          acc.cantidad += item.cantidad_animales || 0
          acc.pesoTotal += item.peso_total || 0
          acc.ug += item.ug || 0
          return acc
        },
        { cantidad: 0, pesoTotal: 0, ug: 0 },
      )

      dataToExport.push({
        Categoría: "TOTAL",
        Cantidad: totales.cantidad,
        "Peso Total (kg)": totales.pesoTotal,
        UG: totales.ug,
      })

      if (format === "pdf") {
        // Importar jsPDF dinámicamente
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height

        // Color principal verde oliva
        const primaryColor = [140, 156, 120] // #8C9C78

        // Cargar y agregar logo
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = "anonymous"
          logoImg.src = "/logo-parte-diario.png"

          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = () => {
              console.log("Logo no encontrado, continuando sin logo")
              resolve(null)
            }
            setTimeout(reject, 3000)
          })

          doc.addImage(logoImg, "PNG", pageWidth - 40, 10, 30, 30)
        } catch (logoError) {
          console.log("No se pudo cargar el logo:", logoError)
        }

        // Encabezado principal
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")

        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("REPORTE DE STOCK ACTUAL", 20, 25)

        doc.setFontSize(16)
        doc.text("Stock Actual del Establecimiento", 20, 35)

        // Línea decorativa
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(20, 55, pageWidth - 20, 55)

        // Información del establecimiento
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

        const establecimientoNombre = getEstablecimientoNombre(establecimientoSeleccionado) || "No especificado"
        const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        // Caja de información
        doc.setFillColor(248, 249, 250)
        doc.rect(20, 65, pageWidth - 40, 45, "F")
        doc.setDrawColor(220, 220, 220)
        doc.rect(20, 65, pageWidth - 40, 45, "S")

        doc.setFont("helvetica", "bold")
        doc.text("Establecimiento:", 25, 75)
        doc.setFont("helvetica", "normal")
        doc.text(establecimientoNombre, 25, 85)

        doc.setFont("helvetica", "bold")
        doc.text("Fecha de generación:", 25, 95)
        doc.setFont("helvetica", "normal")
        doc.text(fechaGeneracion, 25, 105)

        // Preparar datos para la tabla (solo 4 columnas)
        const tableData = dataToExport.map((item) => [
          item.Categoría,
          item.Cantidad.toLocaleString(),
          `${item["Peso Total (kg)"].toLocaleString()} kg`,
          item.UG.toLocaleString().replace(".", ","),
        ])

        // Crear tabla centrada
        autoTable(doc, {
          head: [["Categoría", "Cantidad", "Peso Total", "UG"]],
          body: tableData,
          startY: 120,
          styles: {
            fontSize: 10,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 11,
            cellPadding: 5,
            halign: "center",
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            0: { cellWidth: 50, halign: "center" }, // Categoría - más ancho
            1: { cellWidth: 30, halign: "center" }, // Cantidad
            2: { cellWidth: 40, halign: "center" }, // Peso Total - más ancho
            3: { cellWidth: 25, halign: "center" }, // UG
          },
          margin: { left: 30, right: 30 }, // Márgenes más amplios para centrar
          tableWidth: "wrap", // Ajustar ancho de tabla
          didParseCell: (data) => {
            // Aplicar negrita a la fila TOTAL (última fila)
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = "bold"
              data.cell.styles.fillColor = [240, 240, 240] // Fondo ligeramente más oscuro para el total
            }
          },
          didDrawPage: (data) => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()

            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })
            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        const fileName = `stock_actual_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else if (format === "xlsx") {
        try {
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Stock Actual")

          const colWidths = [
            { wch: 20 }, // Categoría
            { wch: 12 }, // Cantidad
            { wch: 15 }, // Peso Total
            { wch: 10 }, // UG
            { wch: 15 }, // Potrero
            { wch: 15 }, // Lote
          ]
          ws["!cols"] = colWidths

          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `stock_actual_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          const fileName = `stock_actual_${new Date().toISOString().split("T")[0]}.xlsx`
          downloadExcelFile(dataToExport, fileName)
        }
      }

      toast({
        title: "Éxito",
        description: `Archivo ${format.toUpperCase()} descargado correctamente`,
      })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error",
        description: `No se pudo exportar el archivo ${format.toUpperCase()}. Intenta de nuevo.`,
        variant: "destructive",
      })
    }
  }

  // Calcular totales
  const totales = stockItems.reduce(
    (acc, item) => {
      acc.cantidad += item.cantidad_animales || 0
      acc.pesoTotal += item.peso_total || 0
      acc.ug += item.ug || 0
      return acc
    },
    { cantidad: 0, pesoTotal: 0, ug: 0 },
  )

  if (!establecimientoSeleccionado) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Selecciona un establecimiento para ver el stock</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Weight className="w-5 h-5 text-[#4285F4]" />
            <CardTitle className="text-lg">Stock Actual del Establecimiento</CardTitle>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                onClick={() => setShowTooltip(!showTooltip)}
              >
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </Button>
              {showTooltip && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
                  <div className="absolute top-8 left-0 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Stock Actual del Establecimiento</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowTooltip(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Inventario completo del ganado por categoría animal.</p>
                      <div className="space-y-1">
                        <p>
                          <strong>• Por categoría:</strong> Clasificación por tipo de animal
                        </p>
                        <p>
                          <strong>• Cantidad total:</strong> Número de animales por categoría
                        </p>
                        <p>
                          <strong>• Peso total:</strong> Biomasa total del establecimiento
                        </p>
                        <p>
                          <strong>• UG:</strong> Unidades ganaderas equivalentes
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botón Exportar */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="w-4 h-4" />
              Exportar
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showExportMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-40">
                <div className="py-1">
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                    onClick={() => handleExport("xlsx")}
                  >
                    <span>📊</span>
                    Excel
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                    onClick={() => handleExport("pdf")}
                  >
                    <span>📄</span>
                    PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Overlay para cerrar menú */}
        {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Categoría</TableHead>
                <TableHead className="font-semibold">Cantidad</TableHead>
                <TableHead className="font-semibold">Peso Total (kg)</TableHead>
                <TableHead className="font-semibold">UG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Cargando stock actual...
                  </TableCell>
                </TableRow>
              ) : stockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No se encontró stock actual
                  </TableCell>
                </TableRow>
              ) : (
                stockItems.map((item) => (
                  <TableRow
                    key={item.lote_stock_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onRowClick && onRowClick(item.lote_stock_id)}
                  >
                    <TableCell className="font-medium">{item.categoria_animal}</TableCell>
                    <TableCell className="text-[#4285F4] font-semibold">
                      {item.cantidad_animales?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{item.peso_total?.toLocaleString() || 0}</TableCell>
                    <TableCell>{item.ug?.toFixed(2).replace(".", ",") || "0,00"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-gray-50">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="font-bold">{totales.cantidad.toLocaleString()}</TableCell>
                <TableCell className="font-bold">{totales.pesoTotal.toLocaleString()}</TableCell>
                <TableCell className="font-bold">{totales.ug.toFixed(2).replace(".", ",")}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
