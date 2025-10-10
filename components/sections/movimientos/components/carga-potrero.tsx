"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Cog as Cow,
  TableIcon,
  BarChart3,
  Download,
  ChevronDown,
  HelpCircle,
  X,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react"
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

interface TooltipData {
  potrero: string
  cabHas: number
  kgHas: number
  ugHas: number
  hectareas: number
  x: number
  y: number
}

export default function CargaPotrero({ data: propData, isLoading: propLoading = false }: CargaPotreroProps) {
  const [data, setData] = useState<PotreroData[]>(propData || [])
  const [isLoading, setIsLoading] = useState(propLoading)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedPotrero, setSelectedPotrero] = useState<string | null>(null)
  const [currentEstablecimiento, setCurrentEstablecimiento] = useState<string>("")
  const [tooltip, setTooltipData] = useState<TooltipData | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Función para obtener el establecimiento actual del localStorage
  const getCurrentEstablishment = () => {
    try {
      const selectedEstablishment = localStorage.getItem("selected_establishment")
      if (selectedEstablishment) {
        const establishment = JSON.parse(selectedEstablishment)
        return establishment.id
      }
      return null
    } catch (error) {
      console.error("❌ [CargaPotrero] Error obteniendo establecimiento:", error)
      return null
    }
  }

  useEffect(() => {
    const initialEstablishment = getCurrentEstablishment()
    if (initialEstablishment) {
      setCurrentEstablecimiento(initialEstablishment)
    }
  }, [])

  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      const { establecimientoId } = event.detail
      setCurrentEstablecimiento(establecimientoId)
    }
    window.addEventListener("establishmentChange", handleEstablishmentChange as EventListener)
    return () => window.removeEventListener("establishmentChange", handleEstablishmentChange as EventListener)
  }, [])

  useEffect(() => {
    if (currentEstablecimiento && !propData) {
      fetchCargaPotreros()
    }
  }, [currentEstablecimiento, propData])

  const fetchCargaPotreros = async () => {
    if (!currentEstablecimiento) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/carga-potreros?establecimiento_id=${currentEstablecimiento}`)
      if (!response.ok) {
        throw new Error("Error al cargar datos de carga por potrero")
      }
      const result = await response.json()
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

  // Estado del potrero
  const getEstado = (cabHas: number | null): string => {
    const cabezas = cabHas || 0
    if (cabezas === 0) return "vacio"
    if (cabezas < 0.4) return "bajo"
    if (cabezas > 1.0) return "sobrecarga"
    return "optimo"
  }

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

  // Estadísticas para las tarjetas
  const estadisticas = useMemo(() => {
    if (!data.length) return null

    const totalCabHas = data.reduce((sum, item) => sum + (item.cabezas_por_ha || 0), 0)
    const promedioCabHas = totalCabHas / data.length
    const maxCabHas = Math.max(...data.map((item) => item.cabezas_por_ha || 0))
    const potreroMaxCarga = data.find((item) => (item.cabezas_por_ha || 0) === maxCabHas)

    const totalKgHas = data.reduce((sum, item) => sum + (item.kg_por_ha || 0), 0)
    const promedioKgHas = totalKgHas / data.length

    const totalUgHas = data.reduce((sum, item) => sum + (item.ug_por_ha || 0), 0)
    const promedioUgHas = totalUgHas / data.length

    return {
      promedioCabHas,
      maxCabHas,
      potreroMaxCarga: potreroMaxCarga?.potrero || "N/A",
      promedioKgHas,
      promedioUgHas,
      totalPotreros: data.length,
    }
  }, [data])

  // Colores para las barras según el valor
  const getBarColor = (value: number, maxValue: number, type: "cab" | "kg" | "ug") => {
    const intensity = maxValue > 0 ? value / maxValue : 0

    if (type === "cab") {
      if (intensity > 0.8) return "#1e40af" // Azul intenso
      if (intensity > 0.6) return "#3b82f6" // Azul medio
      if (intensity > 0.4) return "#60a5fa" // Azul claro
      if (intensity > 0.2) return "#93c5fd" // Azul muy claro
      return "#dbeafe" // Azul pálido
    } else if (type === "kg") {
      if (intensity > 0.8) return "#dc2626" // Rojo intenso
      if (intensity > 0.6) return "#ef4444" // Rojo medio
      if (intensity > 0.4) return "#f87171" // Rojo claro
      if (intensity > 0.2) return "#fca5a5" // Rojo muy claro
      return "#fecaca" // Rojo pálido
    } else {
      // ug
      if (intensity > 0.8) return "#059669" // Verde intenso
      if (intensity > 0.6) return "#10b981" // Verde medio
      if (intensity > 0.4) return "#34d399" // Verde claro
      if (intensity > 0.2) return "#6ee7b7" // Verde muy claro
      return "#a7f3d0" // Verde pálido
    }
  }

  // Manejadores de tooltip
  const handleBarHover = (event: React.MouseEvent, potreroData: PotreroData) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (rect) {
      setTooltipData({
        potrero: potreroData.potrero,
        cabHas: potreroData.cabezas_por_ha || 0,
        kgHas: potreroData.kg_por_ha || 0,
        ugHas: potreroData.ug_por_ha || 0,
        hectareas: potreroData.hectareas_utiles || 0,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
  }

  const handleBarLeave = () => {
    setTooltipData(null)
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
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width

        const primaryColor = [140, 156, 120] // #8C9C78

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
        doc.text("REPORTE DE CARGA POR POTRERO", 20, 25)

        doc.setFontSize(16)
        doc.text("Carga por Potrero del Establecimiento", 20, 35)

        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

        const establecimientoNombre = data[0]?.establecimiento || "No especificado"
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

        const tableData = data.map((item) => [
          item.potrero,
          (item.cabezas_por_ha || 0).toFixed(2),
          (item.hectareas_utiles || 0).toString(),
          `${(item.kg_por_ha || 0).toFixed(2)} kg`,
          (item.ug_por_ha || 0).toFixed(2),
        ])

        autoTable(doc, {
          head: [["Potrero", "Cab/ha", "ha Ganaderas", "kg/ha", "UG/ha"]],
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
          alternateRowStyles: { fillColor: [248, 249, 250] },
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
            "Cab/ha": (item.cabezas_por_ha || 0).toFixed(2),
            "kg/ha": (item.kg_por_ha || 0).toFixed(2),
            "UG/ha": (item.ug_por_ha || 0).toFixed(2),
            "ha Ganaderas": item.hectareas_utiles,
            "Cantidad Animales": item.cantidad_animales,
            "Peso Total (kg)": item.peso_total,
          }))
          const ws = XLSX.utils.json_to_sheet(exportData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Carga Potreros")
          ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }]
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
          const headers = [
            "Potrero",
            "Cab/ha",
            "ha Ganaderas",
            "kg/ha",
            "UG/ha",
            "Cantidad Animales",
            "Peso Total (kg)",
          ]
          const csvContent = [
            headers.join(","),
            ...data.map((item) =>
              [
                item.potrero,
                (item.cabezas_por_ha || 0).toFixed(2),
                item.hectareas_utiles,
                (item.kg_por_ha || 0).toFixed(2),
                (item.ug_por_ha || 0).toFixed(2),
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

  // Altura del área del gráfico en píxeles
  const CHART_HEIGHT = 350
  const maxCabHas = Math.max(...data.map((item) => item.cabezas_por_ha || 0))
  const maxKgHas = Math.max(...data.map((item) => item.kg_por_ha || 0))
  const maxUgHas = Math.max(...data.map((item) => item.ug_por_ha || 0))

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
                      <p>Análisis de carga animal por potrero con tabla y gráfico de barras.</p>
                      <div className="space-y-1">
                        <p>
                          <strong>• Métricas:</strong> Cab/ha, kg/ha, UG/ha
                        </p>
                        <p>
                          <strong>• Estados:</strong> Vacío, Bajo, Óptimo, Sobrecarga
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
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Potrero</TableHead>
                      <TableHead className="font-semibold">Cab/ha</TableHead>
                      <TableHead className="font-semibold">ha Ganaderas</TableHead>
                      <TableHead className="font-semibold">kg/ha</TableHead>
                      <TableHead className="font-semibold">UG/ha</TableHead>
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
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="grafico">
            {data.length === 0 ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Sin datos para graficar</p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-6">
                {/* Gráfico Principal */}
                <Card className="w-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChart3 className="w-6 h-6 text-blue-500" />
                      Análisis de Carga por Potrero
                    </CardTitle>
                    <p className="text-base text-gray-600">Comparación de métricas de carga animal entre potreros</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div
                      ref={chartRef}
                      className="w-full relative bg-gray-50 rounded-lg p-4"
                      style={{ height: "500px" }}
                    >
                      {/* Eje Y */}
                      <div
                        className="absolute left-2 top-4 flex flex-col justify-between text-xs text-gray-600"
                        style={{ height: `${CHART_HEIGHT}px` }}
                      >
                        <span>{Math.max(maxCabHas, maxKgHas, maxUgHas).toFixed(0)}</span>
                        <span>{(Math.max(maxCabHas, maxKgHas, maxUgHas) * 0.75).toFixed(0)}</span>
                        <span>{(Math.max(maxCabHas, maxKgHas, maxUgHas) * 0.5).toFixed(0)}</span>
                        <span>{(Math.max(maxCabHas, maxKgHas, maxUgHas) * 0.25).toFixed(0)}</span>
                        <span>0</span>
                      </div>

                      {/* Líneas de cuadrícula */}
                      <div className="absolute left-12 right-4 top-4" style={{ height: `${CHART_HEIGHT}px` }}>
                        {[0, 1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className="absolute w-full border-t border-gray-200"
                            style={{ top: `${(index / 4) * 100}%` }}
                          />
                        ))}
                      </div>

                      {/* Contenedor de barras agrupadas */}
                      <div
                        className="absolute left-12 right-4 top-4 flex justify-between gap-2"
                        style={{ height: `${CHART_HEIGHT}px` }}
                      >
                        {data.map((item, index) => {
                          const maxValue = Math.max(maxCabHas, maxKgHas, maxUgHas)
                          const cabHeight = maxValue > 0 ? ((item.cabezas_por_ha || 0) / maxValue) * CHART_HEIGHT : 0
                          const kgHeight = maxValue > 0 ? ((item.kg_por_ha || 0) / maxValue) * CHART_HEIGHT : 0
                          const ugHeight = maxValue > 0 ? ((item.ug_por_ha || 0) / maxValue) * CHART_HEIGHT : 0
                          const groupWidth = `${Math.max(100 / data.length - 3, 8)}%`

                          return (
                            <div
                              key={index}
                              className="flex flex-col justify-end items-center h-full"
                              style={{ width: groupWidth }}
                            >
                              {/* Grupo de 3 barras */}
                              <div className="flex justify-center items-end gap-1 w-full">
                                {/* Barra Cab/ha */}
                                <div
                                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105"
                                  style={{
                                    height: `${cabHeight}px`,
                                    backgroundColor: getBarColor(item.cabezas_por_ha || 0, maxCabHas, "cab"),
                                    borderRadius: "4px 4px 0 0",
                                    border: "1px solid #e5e7eb",
                                    minHeight: (item.cabezas_por_ha || 0) > 0 ? "4px" : "0px",
                                    width: "30%",
                                  }}
                                  onMouseEnter={(e) => handleBarHover(e, item)}
                                  onMouseLeave={handleBarLeave}
                                  onMouseMove={(e) => handleBarHover(e, item)}
                                />
                                {/* Barra kg/ha */}
                                <div
                                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105"
                                  style={{
                                    height: `${kgHeight}px`,
                                    backgroundColor: getBarColor(item.kg_por_ha || 0, maxKgHas, "kg"),
                                    borderRadius: "4px 4px 0 0",
                                    border: "1px solid #e5e7eb",
                                    minHeight: (item.kg_por_ha || 0) > 0 ? "4px" : "0px",
                                    width: "30%",
                                  }}
                                  onMouseEnter={(e) => handleBarHover(e, item)}
                                  onMouseLeave={handleBarLeave}
                                  onMouseMove={(e) => handleBarHover(e, item)}
                                />
                                {/* Barra UG/ha */}
                                <div
                                  className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105"
                                  style={{
                                    height: `${ugHeight}px`,
                                    backgroundColor: getBarColor(item.ug_por_ha || 0, maxUgHas, "ug"),
                                    borderRadius: "4px 4px 0 0",
                                    border: "1px solid #e5e7eb",
                                    minHeight: (item.ug_por_ha || 0) > 0 ? "4px" : "0px",
                                    width: "30%",
                                  }}
                                  onMouseEnter={(e) => handleBarHover(e, item)}
                                  onMouseLeave={handleBarLeave}
                                  onMouseMove={(e) => handleBarHover(e, item)}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Etiquetas de potreros */}
                      <div
                        className="absolute left-12 right-4 flex justify-between gap-2"
                        style={{ top: `${CHART_HEIGHT + 20}px` }}
                      >
                        {data.map((item, index) => {
                          const groupWidth = `${Math.max(100 / data.length - 3, 8)}%`
                          return (
                            <div key={index} className="flex justify-center items-center" style={{ width: groupWidth }}>
                              <span className="text-xs text-gray-600 transform -rotate-45 origin-center whitespace-nowrap">
                                {item.potrero}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Leyenda */}
                      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>Cab/ha</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>kg/ha</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>UG/ha</span>
                          </div>
                        </div>
                      </div>

                      {/* Tooltip */}
                      {tooltip && (
                        <div
                          className="absolute bg-white p-4 border border-gray-200 rounded-lg shadow-xl z-50 min-w-[280px] pointer-events-none"
                          style={{
                            left: Math.min(
                              tooltip.x + 10,
                              chartRef.current?.clientWidth ? chartRef.current.clientWidth - 300 : tooltip.x,
                            ),
                            top: Math.max(tooltip.y - 120, 10),
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                            <Cow className="w-5 h-5 text-green-500" />
                            <p className="font-bold text-gray-900 text-lg">{tooltip.potrero}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Cab/ha:</span>
                              <span className="font-bold text-blue-600 text-lg">{tooltip.cabHas.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">kg/ha:</span>
                              <span className="font-bold text-red-600 text-lg">{tooltip.kgHas.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">UG/ha:</span>
                              <span className="font-bold text-green-600 text-lg">{tooltip.ugHas.toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">ha Ganaderas:</span>
                                <span className="font-semibold text-gray-900">{tooltip.hectareas}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Estadísticas Resumen */}
                {estadisticas && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500 rounded-full">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-700">Prom. Cab/ha</p>
                            <p className="text-3xl font-bold text-blue-900">{estadisticas.promedioCabHas.toFixed(2)}</p>
                            <p className="text-sm text-blue-600">cab/ha</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-500 rounded-full">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-700">Prom. kg/ha</p>
                            <p className="text-3xl font-bold text-green-900">{estadisticas.promedioKgHas.toFixed(0)}</p>
                            <p className="text-sm text-green-600">kg/ha</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500 rounded-full">
                            <Activity className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-purple-700">Prom. UG/ha</p>
                            <p className="text-3xl font-bold text-purple-900">
                              {estadisticas.promedioUgHas.toFixed(2)}
                            </p>
                            <p className="text-sm text-purple-600">UG/ha</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-500 rounded-full">
                            <Cow className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-700">Mayor Carga</p>
                            <p className="text-2xl font-bold text-orange-900">{estadisticas.potreroMaxCarga}</p>
                            <p className="text-sm text-orange-600">{estadisticas.maxCabHas.toFixed(2)} cab/ha</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
