"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Weight, Download, ChevronDown, HelpCircle, X, MapPin, Search } from "lucide-react"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"

// Tipos para integración con Supabase
export interface StockItem {
  lote_stock_id: string
  categoria_animal_id: number
  categoria_animal: string
  cantidad_animales: number
  peso_promedio: number | null
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

// Tipo para stock por potrero
export interface StockPorPotrero {
  potrero_id: number
  potrero: string
  categorias: {
    categoria_animal_id: number
    categoria_animal: string
    cantidad_animales: number
    peso_promedio: number | null
    peso_total: number
    ug: number
    lotes: string[]
  }[]
  totales: {
    cantidad_total: number
    peso_total: number
    ug_total: number
  }
}

interface StockActualProps {
  onRowClick?: (id: string) => void
}

const POTREROS_PER_PAGE = 3 // Cambiado de 5 a 3 potreros por página

function calcPromedio(pesoTotal: number | null | undefined, cantidad: number | null | undefined): number {
  const total = Number(pesoTotal ?? 0)
  const cant = Number(cantidad ?? 0)
  if (!cant || cant <= 0) return 0
  if (!total || total <= 0) return 0
  return total / cant
}

export default function StockActual({ onRowClick }: StockActualProps) {
  const { establecimientoSeleccionado, getEstablecimientoNombre } = useEstablishment()

  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stockPorPotrero, setStockPorPotrero] = useState<StockPorPotrero[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [viewMode, setViewMode] = useState<"total" | "potrero">("total")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Cargar stock actual (vista total)
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

  // Cargar stock por potrero
  const fetchStockPorPotrero = async () => {
    if (!establecimientoSeleccionado) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        establecimiento_id: establecimientoSeleccionado,
      })
      const response = await fetch(`/api/stock-por-potrero?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar stock por potrero")
      const data = await response.json()
      setStockPorPotrero(data.stock_por_potrero || [])
      setCurrentPage(1)
    } catch (error) {
      console.error("Error fetching stock por potrero:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el stock por potrero",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos según el modo de vista
  useEffect(() => {
    if (establecimientoSeleccionado) {
      if (viewMode === "total") {
        fetchStockActual()
      } else {
        fetchStockPorPotrero()
      }
    }
  }, [establecimientoSeleccionado, viewMode])

  // Filtrado de potreros por búsqueda
  const filteredPotreros = useMemo(() => {
    if (!searchTerm) {
      return stockPorPotrero
    }
    return stockPorPotrero.filter(
      (p) =>
        p.potrero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categorias.some((cat) => cat.lotes.some((lote) => lote.toLowerCase().includes(searchTerm.toLowerCase()))),
    )
  }, [stockPorPotrero, searchTerm])

  // Paginación
  const indexOfLastPotrero = currentPage * POTREROS_PER_PAGE
  const indexOfFirstPotrero = indexOfLastPotrero - POTREROS_PER_PAGE
  const currentPotreros = filteredPotreros.slice(indexOfFirstPotrero, indexOfLastPotrero)
  const totalPages = Math.ceil(filteredPotreros.length / POTREROS_PER_PAGE)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Descarga CSV fallback
  const downloadExcelFile = (data: any[], filename: string) => {
    if (!data.length) return
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

  // Exportaciones
  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)

    try {
      toast({
        title: "Generando archivo",
        description: `Preparando archivo ${format.toUpperCase()}...`,
      })

      let dataToExport: any[] = []

      if (viewMode === "total") {
        dataToExport = stockItems.map((item) => {
          const promedio =
            item.peso_promedio && item.peso_promedio > 0
              ? item.peso_promedio
              : calcPromedio(item.peso_total, item.cantidad_animales)
          return {
            Categoría: item.categoria_animal,
            Cantidad: item.cantidad_animales || 0,
            "Peso Promedio (kg)": Number(promedio.toFixed(2)),
            "Peso Total (kg)": item.peso_total || 0,
            "UG Total": item.ug || 0,
          }
        })

        // Totales
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
          "Peso Promedio (kg)": "",
          "Peso Total (kg)": totales.pesoTotal,
          "UG Total": totales.ug,
        })
      } else {
        // Exportar usando los potreros filtrados para coincidir con la vista
        filteredPotreros.forEach((potrero) => {
          potrero.categorias.forEach((cat) => {
            const promedio =
              cat.peso_promedio && cat.peso_promedio > 0
                ? cat.peso_promedio
                : calcPromedio(cat.peso_total, cat.cantidad_animales)
            dataToExport.push({
              Potrero: potrero.potrero,
              Categoría: cat.categoria_animal,
              Cantidad: cat.cantidad_animales,
              "Peso Promedio (kg)": Number(promedio.toFixed(2)),
              "Peso Total (kg)": cat.peso_total,
              "UG Total": cat.ug,
            })
          })
          // Fila TOTAL por potrero
          dataToExport.push({
            Potrero: potrero.potrero,
            Categoría: "TOTAL",
            Cantidad: potrero.totales.cantidad_total,
            "Peso Promedio (kg)": "",
            "Peso Total (kg)": potrero.totales.peso_total,
            "UG Total": potrero.totales.ug_total,
          })
        })
      }

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const primaryColor = [140, 156, 120] // #8C9C78

        // Logo (opcional)
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = "anonymous"
          logoImg.src = "/logo-parte-diario.png"
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = () => resolve(null)
            setTimeout(reject, 3000)
          })
          doc.addImage(logoImg, "PNG", pageWidth - 40, 10, 30, 30)
        } catch {}

        // Encabezado
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text(`STOCK ACTUAL ${viewMode === "potrero" ? "POR POTRERO" : "TOTAL"}`, 20, 25)
        doc.setFontSize(16)
        doc.text("Stock Actual del Establecimiento", 20, 35)

        // Info
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        const establecimientoNombre = getEstablecimientoNombre(establecimientoSeleccionado) || "No especificado"
        const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

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

        // Tabla
        let headers: string[] = []
        let body: string[][] = []

        if (viewMode === "total") {
          headers = ["Categoría", "Cantidad", "Peso Promedio (kg)", "Peso Total (kg)", "UG Total"]
          body = dataToExport.map((item) => [
            item.Categoría?.toString() ?? "",
            (item.Cantidad ?? "").toString(),
            item["Peso Promedio (kg)"] !== "" ? `${item["Peso Promedio (kg)"]} kg` : "",
            `${item["Peso Total (kg)"] ?? 0} kg`,
            (item["UG Total"] ?? 0).toLocaleString().replace(".", ","),
          ])
        } else {
          headers = ["Potrero", "Categoría", "Cantidad", "Peso Promedio (kg)", "Peso Total (kg)", "UG Total"]
          body = dataToExport.map((item) => [
            item.Potrero?.toString() ?? "",
            item.Categoría?.toString() ?? "",
            (item.Cantidad ?? "").toString(),
            item["Peso Promedio (kg)"] !== "" ? `${item["Peso Promedio (kg)"]} kg` : "",
            `${item["Peso Total (kg)"] ?? 0} kg`,
            (item["UG Total"] ?? 0).toLocaleString().replace(".", ","),
          ])
        }

        autoTable(doc, {
          head: [headers],
          body,
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
          alternateRowStyles: { fillColor: [248, 249, 250] },
          margin: { left: 10, right: 10 },
          tableWidth: "wrap",
          didDrawPage: () => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })
            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        const fileName = `stock_actual_${viewMode}_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else {
        try {
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, `Stock ${viewMode === "potrero" ? "por Potrero" : "Total"}`)

          const colWidths =
            viewMode === "total"
              ? [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
              : [{ wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }]
          // @ts-ignore
          ws["!cols"] = colWidths

          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `stock_actual_${viewMode}_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          const fileName = `stock_actual_${viewMode}_${new Date().toISOString().split("T")[0]}.xlsx`
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

  // Totales vista total
  const totales = stockItems.reduce(
    (acc, item) => {
      acc.cantidad += item.cantidad_animales || 0
      acc.pesoTotal += item.peso_total || 0
      acc.ug += item.ug || 0
      return acc
    },
    { cantidad: 0, pesoTotal: 0, ug: 0 },
  )

  // Totales generales para vista por potrero (con filtro aplicado)
  const totalesGenerales = filteredPotreros.reduce(
    (acc, potrero) => {
      acc.cantidad += potrero.totales.cantidad_total
      acc.pesoTotal += potrero.totales.peso_total
      acc.ug += potrero.totales.ug_total
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Weight className="w-5 h-5 text-[#4285F4]" />
            <CardTitle className="text-base sm:text-lg">Stock Actual del Establecimiento</CardTitle>
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
                          <strong>• Vista Total:</strong> Resumen por categoría de todo el establecimiento
                        </p>
                        <p>
                          <strong>• Vista por Potrero:</strong> Detalle de stock distribuido por potrero con totales por
                          tabla
                        </p>
                        <p>
                          <strong>• UG Total:</strong> Unidades ganaderas equivalentes
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Toggle vista */}
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 sm:px-3 text-xs ${
                  viewMode === "total" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100 text-gray-600"
                }`}
                onClick={() => setViewMode("total")}
              >
                <Weight className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Total</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 sm:px-3 text-xs ${
                  viewMode === "potrero" ? "bg-gray-200 text-gray-900" : "hover:bg-gray-100 text-gray-600"
                }`}
                onClick={() => setViewMode("potrero")}
              >
                <MapPin className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Por Potrero - Lote</span>
              </Button>
            </div>

            {/* Exportar */}
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Overlay para cerrar menú */}
        {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}

        <div className="overflow-x-auto">
          {viewMode === "total" ? (
            // Vista Total
            <Table className="text-xs sm:text-sm min-w-[480px]">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold min-w-[100px]">Categoría</TableHead>
                  <TableHead className="font-semibold min-w-[70px]">Cantidad</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Peso Prom (kg)</TableHead>
                  <TableHead className="font-semibold min-w-[95px]">Peso Tot (kg)</TableHead>
                  <TableHead className="font-semibold min-w-[70px]">UG Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Cargando stock actual...
                    </TableCell>
                  </TableRow>
                ) : stockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontró stock actual
                    </TableCell>
                  </TableRow>
                ) : (
                  stockItems.map((item) => {
                    const promedio =
                      item.peso_promedio && item.peso_promedio > 0
                        ? item.peso_promedio
                        : calcPromedio(item.peso_total, item.cantidad_animales)
                    return (
                      <TableRow
                        key={item.lote_stock_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onRowClick && onRowClick(item.lote_stock_id)}
                      >
                        <TableCell className="font-medium">{item.categoria_animal}</TableCell>
                        <TableCell className="text-[#4285F4] font-semibold">
                          {item.cantidad_animales?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell>{promedio.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{item.peso_total?.toLocaleString() || 0}</TableCell>
                        <TableCell>{item.ug?.toFixed(2).replace(".", ",") || "0,00"}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-bold">TOTAL</TableCell>
                  <TableCell className="font-bold">{totales.cantidad.toLocaleString()}</TableCell>
                  <TableCell className="font-bold">
                    {calcPromedio(totales.pesoTotal, totales.cantidad).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="font-bold">{totales.pesoTotal.toLocaleString()}</TableCell>
                  <TableCell className="font-bold">{totales.ug.toFixed(2).replace(".", ",")}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          ) : (
            // Vista Por Potrero
            <div className="space-y-4">
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Buscar potrero o lote..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-8 pr-4 py-2 border rounded-md w-full"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {isLoading ? (
                <div className="text-center py-8">Cargando stock por potrero...</div>
              ) : filteredPotreros.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No se encontró stock por potrero</div>
              ) : (
                currentPotreros.map((potrero) => {
                  const loteNombre =
                    potrero.categorias.length > 0 && potrero.categorias[0].lotes.length > 0
                      ? potrero.categorias[0].lotes[0]
                      : null
                  const potreroDisplayName = loteNombre
                    ? `${potrero.potrero} - ${loteNombre}`
                    : `${potrero.potrero} - (Vacío)`

                  return (
                    <div key={potrero.potrero_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header del potrero (sin totales a la derecha) */}
                      <div className="bg-[#4285F4]/10 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#4285F4]" />
                          <h3 className="text-xs sm:text-base font-semibold text-gray-900">{potreroDisplayName}</h3>
                        </div>
                      </div>

                      {/* Tabla de categorías del potrero */}
                      <div className="overflow-x-auto">
                        <Table className="text-xs sm:text-sm min-w-[480px]">
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold min-w-[100px]">Categoría</TableHead>
                              <TableHead className="font-semibold min-w-[70px]">Cantidad</TableHead>
                              <TableHead className="font-semibold min-w-[100px]">Peso Prom (kg)</TableHead>
                              <TableHead className="font-semibold min-w-[95px]">Peso Tot (kg)</TableHead>
                              <TableHead className="font-semibold min-w-[70px]">UG Total</TableHead>
                            </TableRow>
                          </TableHeader>
                        <TableBody>
                          {potrero.categorias.map((categoria) => {
                            const promedio =
                              categoria.peso_promedio && categoria.peso_promedio > 0
                                ? categoria.peso_promedio
                                : calcPromedio(categoria.peso_total, categoria.cantidad_animales)
                            return (
                              <TableRow
                                key={`${potrero.potrero_id}-${categoria.categoria_animal_id}`}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">{categoria.categoria_animal}</TableCell>
                                <TableCell className="text-[#4285F4] font-semibold">
                                  {categoria.cantidad_animales.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {promedio.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>{categoria.peso_total.toLocaleString()}</TableCell>
                                <TableCell>{categoria.ug.toFixed(2).replace(".", ",")}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                          <TableFooter>
                            <TableRow className="bg-gray-50">
                              <TableCell className="font-bold">TOTAL</TableCell>
                              <TableCell className="font-bold">
                                {potrero.totales.cantidad_total.toLocaleString()}
                              </TableCell>
                              <TableCell className="font-bold">
                                {calcPromedio(potrero.totales.peso_total, potrero.totales.cantidad_total).toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 2 },
                                )}
                              </TableCell>
                              <TableCell className="font-bold">{potrero.totales.peso_total.toLocaleString()}</TableCell>
                              <TableCell className="font-bold">
                                {potrero.totales.ug_total.toFixed(2).replace(".", ",")}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        aria-disabled={currentPage === 1}
                        tabIndex={currentPage === 1 ? -1 : undefined}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                      >
                        Anterior
                      </PaginationPrevious>
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(i + 1)
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        aria-disabled={currentPage === totalPages}
                        tabIndex={currentPage === totalPages ? -1 : undefined}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                      >
                        Siguiente
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {/* Totales generales para la lista renderizada */}
              {filteredPotreros.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h3 className="font-bold text-xs sm:text-base text-gray-900">TOTALES GENERALES</h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                      <span className="font-bold">Cant: {totalesGenerales.cantidad.toLocaleString()}</span>
                      <span className="font-bold">Peso: {totalesGenerales.pesoTotal.toLocaleString()} kg</span>
                      <span className="font-bold">UG: {totalesGenerales.ug.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
