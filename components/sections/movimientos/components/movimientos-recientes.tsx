"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Search, Filter, Download, User, ChevronDown } from "lucide-react"
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
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null })

  // Estados para controlar los menús desplegables
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Función para obtener el texto del filtro
  const getFilterText = () => {
    switch (tipoFiltro) {
      case "ENTRADA":
        return "Filtrar: Entrada"
      case "SALIDA":
        return "Filtrar: Salida"
      default:
        return "Filtrar"
    }
  }

  // Cargar movimientos
  const fetchMovimientos = async () => {
    if (!establecimientoSeleccionado) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        establecimiento_id: establecimientoSeleccionado,
      })

      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      if (tipoFiltro !== "todos") params.append("tipo", tipoFiltro)
      if (dateRange.from) params.append("fecha_desde", dateRange.from.toISOString().split("T")[0])
      if (dateRange.to) params.append("fecha_hasta", dateRange.to.toISOString().split("T")[0])

      const response = await fetch(`/api/movimientos-recientes?${params.toString()}`)
      if (!response.ok) throw new Error("Error al cargar movimientos")

      const data = await response.json()
      setMovimientos(data.movimientos || [])
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
  }, [establecimientoSeleccionado, searchTerm, tipoFiltro, dateRange])

  // Función para descargar archivo Excel manualmente
  const downloadExcelFile = (data: any[], filename: string) => {
    // Crear CSV como alternativa más simple
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escapar comillas y envolver en comillas si contiene comas
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

  // Función de exportación con PDF profesional corregido
  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)

    try {
      toast({
        title: "Generando archivo",
        description: `Preparando archivo ${format.toUpperCase()}...`,
      })

      // Datos para exportar
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
            setTimeout(reject, 3000) // Timeout después de 3 segundos
          })

          // Agregar logo en la esquina superior derecha
          doc.addImage(logoImg, "PNG", pageWidth - 40, 10, 30, 30)
        } catch (logoError) {
          console.log("No se pudo cargar el logo:", logoError)
        }

        // Encabezado principal con color verde oliva
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")

        // Título principal en blanco
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("REPORTE DE MOVIMIENTOS", 20, 25)

        doc.setFontSize(16)
        doc.text("Movimientos Recientes de Animales", 20, 35)

        // Línea decorativa
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(20, 55, pageWidth - 20, 55)

        // Información del establecimiento con estilo - CORREGIDO
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

        const establecimientoNombre = getEstablecimientoNombre(establecimientoSeleccionado) || "No especificado"
        const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        // Caja de información - ALTURA AUMENTADA para incluir fecha
        doc.setFillColor(248, 249, 250)
        doc.rect(20, 65, pageWidth - 40, 45, "F") // Aumenté la altura de 35 a 45
        doc.setDrawColor(220, 220, 220)
        doc.rect(20, 65, pageWidth - 40, 45, "S")

        // Establecimiento
        doc.setFont("helvetica", "bold")
        doc.text("Establecimiento:", 25, 75)
        doc.setFont("helvetica", "normal")
        doc.text(establecimientoNombre, 25, 85)

        // Fecha de generación - MOVIDA DENTRO DEL CUADRO
        doc.setFont("helvetica", "bold")
        doc.text("Fecha de generación:", 25, 95)
        doc.setFont("helvetica", "normal")
        doc.text(fechaGeneracion, 25, 105)

        // Filtros aplicados con estilo
        let yPosition = 120 // Ajustado por el aumento de altura del cuadro anterior
        if (tipoFiltro !== "todos" || searchTerm) {
          doc.setFillColor(233, 246, 255)
          doc.rect(20, yPosition, pageWidth - 40, 30, "F")
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(20, yPosition, pageWidth - 40, 30, "S")

          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.text("Filtros aplicados:", 25, yPosition + 10)

          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
          let filterY = yPosition + 18
          if (tipoFiltro !== "todos") {
            doc.text(`• Tipo de movimiento: ${tipoFiltro}`, 25, filterY)
            filterY += 8
          }
          if (searchTerm) {
            doc.text(`• Búsqueda: ${searchTerm}`, 25, filterY)
          }
          yPosition += 40
        }

        // Preparar datos para la tabla
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

        // Crear tabla profesional - CORREGIDA Y CENTRADA
        autoTable(doc, {
          head: [["Fecha", "Categoría", "Tipo", "Movimiento", "Cantidad", "Peso Prom.", "Peso Total", "Usuario"]],
          body: tableData,
          startY: yPosition + 10,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            halign: "center", // Centrar todo el contenido
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
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            0: { cellWidth: 22, halign: "center" }, // Fecha
            1: { cellWidth: 30, halign: "center" }, // Categoría
            2: { cellWidth: 18, halign: "center" }, // Tipo
            3: { cellWidth: 26, halign: "center" }, // Movimiento
            4: { cellWidth: 22, halign: "center" }, // Cantidad - ancho aumentado
            5: { cellWidth: 24, halign: "center" }, // Peso Prom. - ancho aumentado para "kg"
            6: { cellWidth: 24, halign: "center" }, // Peso Total - ancho aumentado para "kg"
            7: { cellWidth: 24, halign: "center" }, // Usuario
          },
          margin: { left: 15, right: 15 }, // Márgenes para centrar
          tableWidth: "auto",
          didDrawPage: (data) => {
            // Pie de página profesional
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()

            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })

            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        // Descargar el PDF
        const fileName = `movimientos_recientes_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else if (format === "xlsx") {
        try {
          // Intentar usar XLSX primero
          const XLSX = await import("xlsx")

          // Crear hoja de cálculo
          const ws = XLSX.utils.json_to_sheet(dataToExport)

          // Crear libro
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Movimientos")

          // Configurar ancho de columnas
          const colWidths = [
            { wch: 12 }, // Fecha
            { wch: 20 }, // Categoría
            { wch: 10 }, // Tipo
            { wch: 15 }, // Movimiento
            { wch: 10 }, // Cantidad
            { wch: 12 }, // Peso Prom.
            { wch: 12 }, // Peso Total
            { wch: 20 }, // Usuario
          ]
          ws["!cols"] = colWidths

          // Crear buffer y descargar manualmente
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
          // Fallback a CSV si XLSX falla
          const fileName = `movimientos_recientes_${new Date().toISOString().split("T")[0]}.xlsx`
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

          {/* Botón Filtrar */}
          <div className="relative">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${tipoFiltro !== "todos" ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
              onClick={() => {
                setShowFilterMenu(!showFilterMenu)
                setShowExportMenu(false)
              }}
            >
              <Filter className="w-4 h-4" />
              {getFilterText()}
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showFilterMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48">
                <div className="p-3 space-y-3">
                  <h4 className="font-medium text-sm">Filtrar por tipo</h4>
                  <Select
                    value={tipoFiltro}
                    onValueChange={(value) => {
                      setTipoFiltro(value)
                      setShowFilterMenu(false)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SALIDA">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoFiltro !== "todos" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTipoFiltro("todos")
                        setShowFilterMenu(false)
                      }}
                      className="w-full"
                    >
                      Limpiar filtro
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botón Exportar */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center gap-2"
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

        {/* Tabla con altura fija y scroll */}
        <div className="border rounded-lg">
          <div className="overflow-auto" style={{ height: "480px" }}>
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Categoría</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Movimiento</TableHead>
                  <TableHead className="font-semibold">Cantidad</TableHead>
                  <TableHead className="font-semibold">Peso Prom.</TableHead>
                  <TableHead className="font-semibold">Peso Total</TableHead>
                  <TableHead className="font-semibold">Usuario</TableHead>
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
                      No se encontraron movimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((mov, index) => (
                    <TableRow
                      key={mov.unique_key || `${mov.movimiento_id}_${index}`}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onRowClick && onRowClick(mov.movimiento_id)}
                    >
                      <TableCell className="font-medium">{new Date(mov.fecha).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>{mov.categoria_animal}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            mov.tipo_movimiento === "ENTRADA" ? "bg-[#34A853] text-white" : "bg-[#EA4335] text-white"
                          }
                        >
                          {mov.tipo_movimiento === "ENTRADA" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.movimiento}</TableCell>
                      <TableCell
                        className={
                          mov.tipo_movimiento === "ENTRADA"
                            ? "text-[#34A853] font-semibold"
                            : "text-[#EA4335] font-semibold"
                        }
                      >
                        {mov.total_cantidad_animales?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>{mov.peso_promedio?.toLocaleString() || "0"} kg</TableCell>
                      <TableCell>{mov.peso_total?.toLocaleString() || "0"} kg</TableCell>
                      <TableCell className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        {mov.usuario}
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
