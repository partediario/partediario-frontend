"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MilkIcon as Cow, TableIcon, BarChart3, Download, ChevronDown, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Tipos para integración con Supabase
export interface PotreroData {
  potrero_id: string
  potrero: string
  cantidad_animales: number
  cabezas_por_ha: number
  peso_total: number
  kg_por_ha: number
  ug_por_ha: number
  hectareas_utiles: number
  hectareas_totales: number
  empresa_id: string
  empresa: string
  establecimiento_id: string
  establecimiento: string
}

interface CargaPotreroProps {
  data?: PotreroData[]
  isLoading?: boolean
}

export default function CargaPotrero({ data: propData, isLoading: propLoading = false }: CargaPotreroProps) {
  const [data, setData] = useState<PotreroData[]>(propData || [])
  const [isLoading, setIsLoading] = useState(propLoading)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedPotrero, setSelectedPotrero] = useState<string | null>(null)
  const [currentEstablecimiento, setCurrentEstablecimiento] = useState<string>("")
  const { toast } = useToast()

  // Función para obtener el establecimiento actual del localStorage
  const getCurrentEstablishment = () => {
    try {
      const userData = localStorage.getItem("user_data")
      const selectedEstablishment = localStorage.getItem("selected_establishment")

      if (selectedEstablishment) {
        const establishment = JSON.parse(selectedEstablishment)
        console.log("🏭 [CargaPotrero] Establecimiento desde localStorage:", establishment.id)
        return establishment.id
      }

      console.log("⚠️ [CargaPotrero] No hay establecimiento en localStorage")
      return null
    } catch (error) {
      console.error("❌ [CargaPotrero] Error obteniendo establecimiento:", error)
      return null
    }
  }

  // Cargar establecimiento inicial al montar el componente
  useEffect(() => {
    const initialEstablishment = getCurrentEstablishment()
    if (initialEstablishment) {
      console.log("🚀 [CargaPotrero] Carga inicial con establecimiento:", initialEstablishment)
      setCurrentEstablecimiento(initialEstablishment)
    }
  }, [])

  // Escuchar cambios en el establecimiento seleccionado
  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      const { establecimientoId } = event.detail
      console.log("🏭 [CargaPotrero] Establecimiento cambiado a:", establecimientoId)
      setCurrentEstablecimiento(establecimientoId)
    }

    window.addEventListener("establishmentChange", handleEstablishmentChange as EventListener)

    return () => {
      window.removeEventListener("establishmentChange", handleEstablishmentChange as EventListener)
    }
  }, [])

  // Cargar datos cuando cambie el establecimiento
  useEffect(() => {
    if (currentEstablecimiento && !propData) {
      fetchCargaPotreros()
    }
  }, [currentEstablecimiento, propData])

  const fetchCargaPotreros = async () => {
    if (!currentEstablecimiento) {
      console.log("⚠️ [CargaPotrero] No hay establecimiento seleccionado")
      return
    }

    console.log("🔄 [CargaPotrero] Cargando datos para establecimiento:", currentEstablecimiento)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/carga-potreros?establecimiento_id=${currentEstablecimiento}`)
      if (!response.ok) {
        throw new Error("Error al cargar datos de carga por potrero")
      }
      const result = await response.json()
      console.log("✅ [CargaPotrero] Datos cargados:", result)
      setData(result)
    } catch (error) {
      console.error("❌ [CargaPotrero] Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de carga por potrero",
        variant: "destructive",
      })
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  // Función para determinar el estado del potrero
  const getEstado = (cabHas: number | null): string => {
    const cabezas = cabHas || 0
    if (cabezas === 0) return "vacio"
    if (cabezas < 0.4) return "bajo"
    if (cabezas > 1.0) return "sobrecarga"
    return "optimo"
  }

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case "optimo":
        return "bg-[#34A853] text-white"
      case "bajo":
        return "bg-[#FF9800] text-white"
      case "sobrecarga":
        return "bg-[#EA4335] text-white"
      case "vacio":
      default:
        return "bg-gray-200 text-gray-700"
    }
  }

  // Función para obtener el texto del estado
  const getEstadoText = (estado: string): string => {
    switch (estado) {
      case "optimo":
        return "Óptimo"
      case "bajo":
        return "Bajo"
      case "sobrecarga":
        return "Sobrecarga"
      case "vacio":
      default:
        return "Vacío"
    }
  }

  // Función para obtener el color del valor de carga
  const getCargaColor = (estado: string): string => {
    switch (estado) {
      case "optimo":
        return "text-[#34A853] font-semibold"
      case "bajo":
        return "text-[#FF9800] font-semibold"
      case "sobrecarga":
        return "text-[#EA4335] font-semibold"
      case "vacio":
      default:
        return "text-gray-500"
    }
  }

  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)

    if (!data.length) return

    try {
      toast({
        title: "Generando archivo",
        description: `Preparando archivo ${format.toUpperCase()}...`,
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
        doc.text("REPORTE DE CARGA POR POTRERO", 20, 25)

        doc.setFontSize(16)
        doc.text("Carga por Potrero del Establecimiento", 20, 35)

        // Información del establecimiento
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

        const establecimientoNombre = data[0]?.establecimiento || "No especificado"
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

        // Preparar datos para la tabla
        const tableData = data.map((item) => [
          item.potrero,
          (item.cabezas_por_ha || 0).toFixed(2),
          (item.hectareas_utiles || 0).toString(),
          `${(item.kg_por_ha || 0).toFixed(2)} kg`,
          (item.ug_por_ha || 0).toFixed(2),
        ])

        // Crear tabla centrada
        autoTable(doc, {
          head: [["Potrero", "Cab/Has", "Has Ganaderas", "Kg/Has", "UG/Has"]],
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
            0: { cellWidth: 40, halign: "left" },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 35, halign: "center" },
            3: { cellWidth: 30, halign: "center" },
            4: { cellWidth: 30, halign: "center" },
          },
          margin: { left: 25, right: 25 },
          tableWidth: "wrap",
        })

        const fileName = `carga_potreros_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else if (format === "xlsx") {
        try {
          const XLSX = await import("xlsx")

          const exportData = data.map((item) => ({
            Potrero: item.potrero,
            "Cab/Has": (item.cabezas_por_ha || 0).toFixed(2),
            "Kg/Has": (item.kg_por_ha || 0).toFixed(2),
            "UG/Has": (item.ug_por_ha || 0).toFixed(2),
            "Cantidad Animales": item.cantidad_animales,
            "Peso Total (kg)": item.peso_total,
          }))

          const ws = XLSX.utils.json_to_sheet(exportData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Carga Potreros")

          const colWidths = [
            { wch: 20 }, // Potrero
            { wch: 12 }, // Cab/Has
            { wch: 15 }, // Has Ganaderas
            { wch: 12 }, // Kg/Has
            { wch: 12 }, // UG/Has
            { wch: 15 }, // Cantidad Animales
            { wch: 15 }, // Peso Total
          ]
          ws["!cols"] = colWidths

          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `carga_potreros_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          // Fallback a CSV
          const headers = [
            "Potrero",
            "Cab/Has",
            "Has Ganaderas",
            "Kg/Has",
            "UG/Has",
            "Cantidad Animales",
            "Peso Total (kg)",
          ]
          const csvContent = [
            headers.join(","),
            ...data.map((item) =>
              [
                item.potrero,
                item.cabezas_por_ha.toFixed(2),
                item.hectareas_utiles,
                item.kg_por_ha.toFixed(2),
                item.ug_por_ha.toFixed(2),
                item.cantidad_animales,
                item.peso_total,
              ].join(","),
            ),
          ].join("\n")

          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `carga_potreros_${new Date().toISOString().split("T")[0]}.csv`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
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

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cow className="w-5 h-5 text-[#34A853]" />
            Carga por Potrero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cow className="w-5 h-5 text-[#34A853]" />
            <CardTitle className="text-lg">Carga por Potrero</CardTitle>
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
                      <h4 className="font-semibold text-gray-900">Carga por Potrero</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowTooltip(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Análisis detallado de la carga animal por potrero individual.</p>
                      <div className="space-y-1">
                        <p>
                          <strong>• Vista de tabla:</strong> Datos detallados comparativos
                        </p>
                        <p>
                          <strong>• Estados:</strong> Vacío, Bajo, Óptimo, Sobrecarga
                        </p>
                        <p>
                          <strong>• Métricas:</strong> Cab/Has, Kg/Has, UG/Has
                        </p>
                        <p>
                          <strong>• Comparación:</strong> Entre diferentes potreros
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!data.length}
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
        {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}
        <Tabs defaultValue="tabla" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="tabla" className="flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              Tabla
            </TabsTrigger>
            <TabsTrigger value="grafico" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gráfico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tabla">
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay datos disponibles para este establecimiento</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Potrero</TableHead>
                      <TableHead className="font-semibold">Cab/Has</TableHead>
                      <TableHead className="font-semibold">Has Ganaderas</TableHead>
                      <TableHead className="font-semibold">Kg/Has</TableHead>
                      <TableHead className="font-semibold">UG/Has</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((potrero) => {
                      const estado = getEstado(potrero.cabezas_por_ha)
                      return (
                        <TableRow
                          key={potrero.potrero_id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            setSelectedPotrero(potrero.potrero_id === selectedPotrero ? null : potrero.potrero_id)
                          }
                        >
                          <TableCell className="font-medium">{potrero.potrero}</TableCell>
                          <TableCell className={getCargaColor(estado)}>
                            {(potrero.cabezas_por_ha || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>{potrero.hectareas_utiles}</TableCell>
                          <TableCell>{(potrero.kg_por_ha || 0).toFixed(2)}</TableCell>
                          <TableCell>{(potrero.ug_por_ha || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(estado)}>{getEstadoText(estado)}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grafico">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">Gráfico de Carga por Potrero</p>
                <p className="text-sm text-gray-400">Visualización por burbujas o barras apiladas próximamente</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
