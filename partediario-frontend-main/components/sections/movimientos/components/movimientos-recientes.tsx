"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Search, Filter, Download, User, ChevronDown, Calculator, X, HelpCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"

export interface MovimientoReciente {
  movimiento_id: number
  unique_key?: string
  fecha: string
  hora: string
  categoria_animal_id: number
  categoria_animal: string
  tipo_movimiento_id: number
  tipo_movimiento: string
  movimiento: string
  total_cantidad_animales: number
  peso_total: number
  peso_promedio: number
  empresa_id: number
  empresa: string
  establecimiento_id: number
  establecimiento: string
  usuario_id: string
  usuario: string
}

interface MovimientosRecientesProps {
  onRowClick?: (id: number) => void
}

export default function MovimientosRecientes({ onRowClick }: MovimientosRecientesProps) {
  const { establecimientoSeleccionado, getEstablecimientoNombre } = useEstablishment()

  const [movimientos, setMovimientos] = useState<MovimientoReciente[]>([])
  const [movimientosOriginales, setMovimientosOriginales] = useState<MovimientoReciente[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showHelpTooltip, setShowHelpTooltip] = useState(false)

  // Filtros individuales
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [movimientoFiltro, setMovimientoFiltro] = useState<string>("todos")
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todos")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })

  // Estados para menús
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Opciones únicas
  const getOpcionesUnicas = () => {
    const movimientosUnicos = [...new Set(movimientosOriginales.map((mov) => mov.movimiento))].sort()
    const categoriasUnicas = [...new Set(movimientosOriginales.map((mov) => mov.categoria_animal))].sort()
    return { movimientos: movimientosUnicos, categorias: categoriasUnicas }
  }

  const opcionesUnicas = getOpcionesUnicas()

  // Contador de filtros activos
  const contarFiltrosActivos = () => {
    let count = 0
    if (tipoFiltro !== "todos") count++
    if (movimientoFiltro !== "todos") count++
    if (categoriaFiltro !== "todos") count++
    if (searchTerm.trim()) count++
    // Nota: si agregas dateRange en UI, puedes sumar aquí también
    return count
  }
  const filtrosActivos = contarFiltrosActivos()

  // Aplicar filtros locales
  const aplicarFiltros = () => {
    let movimientosFiltrados = [...movimientosOriginales]

    if (tipoFiltro !== "todos") {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.tipo_movimiento === tipoFiltro)
    }
    if (movimientoFiltro !== "todos") {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.movimiento === movimientoFiltro)
    }
    if (categoriaFiltro !== "todos") {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.categoria_animal === categoriaFiltro)
    }
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      movimientosFiltrados = movimientosFiltrados.filter(
        (mov) =>
          mov.categoria_animal?.toLowerCase().includes(searchLower) ||
          mov.usuario?.toLowerCase().includes(searchLower) ||
          mov.movimiento?.toLowerCase().includes(searchLower) ||
          mov.tipo_movimiento?.toLowerCase().includes(searchLower),
      )
    }

    setMovimientos(movimientosFiltrados)
  }

  useEffect(() => {
    aplicarFiltros()
  }, [movimientosOriginales, tipoFiltro, movimientoFiltro, categoriaFiltro, searchTerm])

  const limpiarFiltros = () => {
    setTipoFiltro("todos")
    setMovimientoFiltro("todos")
    setCategoriaFiltro("todos")
    setSearchTerm("")
    setShowFilterMenu(false)
  }

  // Subtotales dinámicos
  const calcularSubtotales = () => {
    if (movimientos.length === 0) {
      return { totalCantidad: 0, totalPesoTotal: 0, pesoPromedioPonderado: 0 }
    }
    const totalCantidad = movimientos.reduce((sum, mov) => sum + (mov.total_cantidad_animales || 0), 0)
    const totalPesoTotal = movimientos.reduce((sum, mov) => sum + (mov.peso_total || 0), 0)
    const pesoPromedioPonderado = totalCantidad > 0 ? totalPesoTotal / totalCantidad : 0
    return { totalCantidad, totalPesoTotal, pesoPromedioPonderado }
  }
  const subtotales = calcularSubtotales()

  // Carga de movimientos
  const fetchMovimientos = async () => {
    if (!establecimientoSeleccionado) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        establecimiento_id: establecimientoSeleccionado,
      })
      if (dateRange.from) params.append("fecha_desde", dateRange.from.toISOString().split("T")[0])
      if (dateRange.to) params.append("fecha_hasta", dateRange.to.toISOString().split("T")[0])

      const response = await fetch(`/api/movimientos-recientes?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar movimientos")

      const data = await response.json()
      const movimientosData = data.movimientos || []
      const movimientosConKey = movimientosData.map((mov: any, index: number) => ({
        ...mov,
        unique_key: `${mov.movimiento_id}_${index}`,
      }))
      setMovimientosOriginales(movimientosConKey)
    } catch (error) {
      console.error("Error fetching movimientos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos recientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimientos()
  }, [establecimientoSeleccionado, dateRange])

  // Export helpers
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

  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)
    try {
      toast({ title: "Generando archivo", description: `Preparando archivo ${format.toUpperCase()}...` })

      const dataToExport = movimientos.map((mov) => ({
        Fecha: new Date(mov.fecha).toLocaleDateString("es-ES"),
        Categoría: mov.categoria_animal,
        Tipo: mov.tipo_movimiento === "ENTRADA" ? "Entrada" : "Salida",
        Movimiento: mov.movimiento,
        Cantidad: mov.total_cantidad_animales || 0,
        "Peso Promedio (kg)": mov.peso_promedio || 0,
        "Peso Total (kg)": mov.peso_total || 0,
        Usuario: mov.usuario,
      }))

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const primaryColor = [140, 156, 120]

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

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("REPORTE DE MOVIMIENTOS", 20, 25)
        doc.setFontSize(16)
        doc.text("Movimientos Recientes de Animales", 20, 35)

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

        // Filtros aplicados (solo si hay filtros activos)
        let yPosition = 120
        if (filtrosActivos > 0) {
          doc.setFillColor(233, 246, 255)
          doc.rect(20, yPosition, pageWidth - 40, 40, "F")
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(20, yPosition, pageWidth - 40, 40, "S")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.text("Filtros aplicados:", 25, yPosition + 10)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
          let filterY = yPosition + 18
          if (tipoFiltro !== "todos") {
            doc.text(`• Tipo de movimiento: ${tipoFiltro}`, 25, filterY)
            filterY += 6
          }
          if (movimientoFiltro !== "todos") {
            doc.text(`• Movimiento: ${movimientoFiltro}`, 25, filterY)
            filterY += 6
          }
          if (categoriaFiltro !== "todos") {
            doc.text(`• Categoría: ${categoriaFiltro}`, 25, filterY)
            filterY += 6
          }
          if (searchTerm) {
            doc.text(`• Búsqueda: ${searchTerm}`, 25, filterY)
          }
          yPosition += 50
        }

        const tableData = dataToExport.map((item) => [
          item.Fecha,
          item.Categoría,
          item.Tipo,
          item.Movimiento,
          item.Cantidad.toLocaleString(),
          `${item["Peso Promedio (kg)"].toLocaleString()} kg`,
          `${item["Peso Total (kg)"].toLocaleString()} kg`,
          item.Usuario,
        ])

        autoTable(doc, {
          head: [["Fecha", "Categoría", "Tipo", "Movimiento", "Cantidad", "Peso Prom.", "Peso Total", "Usuario"]],
          body: tableData,
          startY: yPosition + 10,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 4,
            halign: "center",
          },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 22, halign: "center" },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 18, halign: "center" },
            3: { cellWidth: 26, halign: "center" },
            4: { cellWidth: 22, halign: "center" },
            5: { cellWidth: 24, halign: "center" },
            6: { cellWidth: 24, halign: "center" },
            7: { cellWidth: 24, halign: "center" },
          },
          margin: { left: 15, right: 15 },
          tableWidth: "auto",
          didDrawPage: () => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })
            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        const fileName = `movimientos_recientes_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else {
        try {
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Movimientos")
          // @ts-ignore
          ws["!cols"] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 10 },
            { wch: 15 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
            { wch: 20 },
          ]
          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `movimientos_recientes_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          const fileName = `movimientos_recientes_${new Date().toISOString().split("T")[0]}.xlsx`
          downloadExcelFile(dataToExport, fileName)
        }
      }

      toast({ title: "Éxito", description: `Archivo ${format.toUpperCase()} descargado correctamente` })
    } catch (error) {
      console.error("Error exporting:", error)
      toast({
        title: "Error",
        description: `No se pudo exportar el archivo ${format.toUpperCase()}. Intenta de nuevo.`,
        variant: "destructive",
      })
    }
  }

  if (!establecimientoSeleccionado) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Selecciona un establecimiento para ver los movimientos</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-gray-700" />
          Movimientos Recientes
          <div className="relative">
            <button
              className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowHelpTooltip(!showHelpTooltip)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
            {showHelpTooltip && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowHelpTooltip(false)} />
                <div className="absolute top-8 left-0 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Movimientos Recientes</h4>
                    <button onClick={() => setShowHelpTooltip(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Historial de movimientos de animales con filtros avanzados y exportación.
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">• Tipos:</span> Entradas, Salidas
                    </p>
                    <p>
                      <span className="font-medium">• Filtros:</span> Categoría, Usuario, Tipo, Búsqueda
                    </p>
                    <p>
                      <span className="font-medium">• Exportar:</span> Excel, PDF
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por categoría, usuario o tipo de movimiento..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botón Filtros Múltiples */}
          <div className="relative">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${filtrosActivos > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
              onClick={() => {
                setShowFilterMenu(!showFilterMenu)
                setShowExportMenu(false)
              }}
            >
              <Filter className="w-4 h-4" />
              {filtrosActivos > 0 ? `${filtrosActivos} filtros activos` : "Filtros"}
              {filtrosActivos > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
                  {filtrosActivos}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showFilterMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-80">
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Filtros Combinados</h4>
                    {filtrosActivos > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={limpiarFiltros}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Limpiar todo
                      </Button>
                    )}
                  </div>

                  {/* Filtro por Tipo */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de Movimiento</label>
                    <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los tipos</SelectItem>
                        <SelectItem value="ENTRADA">Entrada</SelectItem>
                        <SelectItem value="SALIDA">Salida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Movimiento */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Movimiento Específico</label>
                    <Select value={movimientoFiltro} onValueChange={setMovimientoFiltro}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar movimiento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los movimientos</SelectItem>
                        {opcionesUnicas.movimientos.map((movimiento) => (
                          <SelectItem key={movimiento} value={movimiento}>
                            {movimiento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Categoría */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría de Animal</label>
                    <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las categorías</SelectItem>
                        {opcionesUnicas.categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Exportar */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => {
                setShowExportMenu(!showExportMenu)
                setShowFilterMenu(false)
              }}
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

        {/* Overlay para cerrar menús */}
        {(showFilterMenu || showExportMenu) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowFilterMenu(false)
              setShowExportMenu(false)
            }}
          />
        )}

        {/* Subtotales dinámicos: SOLO cuando hay filtros activos */}
        {!isLoading && movimientos.length > 0 && filtrosActivos > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Subtotales de Resultados Filtrados</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Total Cantidad</div>
                <div className="text-xl font-bold text-blue-600">
                  {subtotales.totalCantidad.toLocaleString()} animales
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Total Kg Totales</div>
                <div className="text-xl font-bold text-green-600">{subtotales.totalPesoTotal.toLocaleString()} kg</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="text-sm text-gray-600 mb-1">Kg Promedio (Ponderado)</div>
                <div className="text-xl font-bold text-orange-600">
                  {subtotales.pesoPromedioPonderado.toFixed(2)} kg/animal
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              * Los totales reflejan únicamente los {movimientos.length} movimientos mostrados según los filtros
              aplicados
            </div>
          </div>
        )}

        {/* Tabla con una sola estructura */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-auto" style={{ height: "480px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[100px]">Fecha</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[140px]">Categoría</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[80px]">Tipo</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[120px]">Movimiento</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[80px]">Cantidad</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[100px]">Peso Prom.</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[100px]">Peso Total</TableHead>
                  <TableHead className="font-semibold h-12 px-4 text-left align-middle w-[120px]">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Cargando movimientos...
                    </TableCell>
                  </TableRow>
                ) : movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {filtrosActivos > 0
                        ? "No se encontraron movimientos con los filtros aplicados"
                        : "No se encontraron movimientos"}
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((mov, index) => (
                    <TableRow
                      key={mov.unique_key || `${mov.movimiento_id}_${index}`}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onRowClick && onRowClick(mov.movimiento_id)}
                    >
                      <TableCell className="h-12 px-4 text-left align-middle font-medium w-[100px]">
                        {new Date(mov.fecha).toLocaleDateString("es-ES")}
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[140px]">
                        {mov.categoria_animal}
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[80px]">
                        <Badge
                          className={
                            mov.tipo_movimiento === "ENTRADA" ? "bg-[#34A853] text-white" : "bg-[#EA4335] text-white"
                          }
                        >
                          {mov.tipo_movimiento === "ENTRADA" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[120px]">{mov.movimiento}</TableCell>
                      <TableCell
                        className={`h-12 px-4 text-left align-middle font-semibold w-[80px] ${
                          mov.tipo_movimiento === "ENTRADA" ? "text-[#34A853]" : "text-[#EA4335]"
                        }`}
                      >
                        {mov.total_cantidad_animales?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[100px]">
                        {mov.peso_promedio?.toLocaleString() || "0"} kg
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[100px]">
                        {mov.peso_total?.toLocaleString() || "0"} kg
                      </TableCell>
                      <TableCell className="h-12 px-4 text-left align-middle w-[120px]">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {mov.usuario}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
