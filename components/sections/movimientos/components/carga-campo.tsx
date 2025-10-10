"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import type { JSX } from "react"
import { MapPin, Download, ChevronDown, HelpCircle, X } from "lucide-react"

// Tipos para integración con Supabase
export interface CargaCampoData {
  establecimiento_id: string
  establecimiento: string
  cabezas_por_ha: number
  peso_total: number
  kg_por_ha: number
  ug_por_ha: number
  hectareas_utiles: number
  hectareas_totales: number
  empresa_id: string
  empresa: string
}

interface CargaCampoProps {
  data?: CargaCampoData
  isLoading?: boolean
}

export default function CargaCampo({ data: propData, isLoading: propLoading = false }: CargaCampoProps) {
  const [data, setData] = useState<CargaCampoData | null>(propData || null)
  const [isLoading, setIsLoading] = useState(propLoading)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [currentEstablecimiento, setCurrentEstablecimiento] = useState<string>("")
  const { toast } = useToast()

  // Función para obtener el establecimiento actual del localStorage
  const getCurrentEstablishment = () => {
    try {
      const userData = localStorage.getItem("user_data")
      const selectedEstablishment = localStorage.getItem("selected_establishment")

      if (selectedEstablishment) {
        const establishment = JSON.parse(selectedEstablishment)
        console.log("🏭 [CargaCampo] Establecimiento desde localStorage:", establishment.id)
        return establishment.id
      }

      console.log("⚠️ [CargaCampo] No hay establecimiento en localStorage")
      return null
    } catch (error) {
      console.error("❌ [CargaCampo] Error obteniendo establecimiento:", error)
      return null
    }
  }

  // Cargar establecimiento inicial al montar el componente
  useEffect(() => {
    const initialEstablishment = getCurrentEstablishment()
    if (initialEstablishment) {
      console.log("🚀 [CargaCampo] Carga inicial con establecimiento:", initialEstablishment)
      setCurrentEstablecimiento(initialEstablishment)
    }
  }, [])

  // Escuchar cambios en el establecimiento seleccionado
  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      const { establecimientoId } = event.detail
      console.log("🏭 [CargaCampo] Establecimiento cambiado a:", establecimientoId)
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
      fetchCargaCampo()
    }
  }, [currentEstablecimiento, propData])

  const fetchCargaCampo = async () => {
    if (!currentEstablecimiento) {
      console.log("⚠️ [CargaCampo] No hay establecimiento seleccionado")
      return
    }

    console.log("🔄 [CargaCampo] Cargando datos para establecimiento:", currentEstablecimiento)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/carga-campo?establecimiento_id=${currentEstablecimiento}`)

      if (response.status === 404) {
        console.log("📭 [CargaCampo] No hay datos disponibles")
        setData(null)
        return
      }

      if (!response.ok) {
        throw new Error("Error al cargar datos de carga del campo")
      }

      const result = await response.json()
      console.log("✅ [CargaCampo] Datos cargados:", result)
      setData(result)
    } catch (error) {
      console.error("❌ [CargaCampo] Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de carga del campo",
        variant: "destructive",
      })
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para determinar si un valor está fuera de rango
  const isOutOfRange = (current: number, optimal: number): boolean => {
    const threshold = 0.15 // 15% de variación
    return Math.abs(current - optimal) / optimal > threshold
  }

  // Función para obtener el color según el valor
  const getValueColor = (current: number, optimal: number): string => {
    if (isOutOfRange(current, optimal)) {
      return current > optimal ? "text-[#EA4335]" : "text-[#FF9800]"
    }
    return "text-[#34A853]"
  }

  // Función para obtener el badge según el valor
  const getValueBadge = (current: number, optimal: number): JSX.Element => {
    if (isOutOfRange(current, optimal)) {
      return current > optimal ? (
        <Badge className="bg-[#EA4335] text-white ml-2">Alto</Badge>
      ) : (
        <Badge className="bg-[#FF9800] text-white ml-2">Bajo</Badge>
      )
    }
    return <Badge className="bg-[#34A853] text-white ml-2">Óptimo</Badge>
  }

  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)

    if (!data) return

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
        doc.text("REPORTE DE CARGA DEL CAMPO", 20, 25)

        doc.setFontSize(16)
        doc.text("Carga Total del Establecimiento", 20, 35)

        // Información del establecimiento
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)

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
        doc.text(data.establecimiento, 25, 85)

        doc.setFont("helvetica", "bold")
        doc.text("Fecha de generación:", 25, 95)
        doc.setFont("helvetica", "normal")
        doc.text(fechaGeneracion, 25, 105)

        // Preparar datos para la tabla
        const tableData = [
          ["ha Ganaderas", data.hectareas_utiles.toString()],
          ["Cab/ha", data.cabezas_por_ha.toFixed(2)],
          ["kg/ha", `${data.kg_por_ha.toFixed(2)} kg`],
          ["UG/ha", data.ug_por_ha.toFixed(2)],
          ["Peso Total", `${data.peso_total.toFixed(2)} kg`],
        ]

        // Crear tabla centrada
        autoTable(doc, {
          head: [["Métrica", "Valor"]],
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
            0: { cellWidth: 60, halign: "left", fontStyle: "bold" },
            1: { cellWidth: 60, halign: "center" },
          },
          margin: { left: 40, right: 40 },
          tableWidth: "wrap",
        })

        const fileName = `carga_campo_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else if (format === "xlsx") {
        try {
          const XLSX = await import("xlsx")

          const exportData = [
            {
              Establecimiento: data.establecimiento,
              "ha Ganaderas": data.hectareas_utiles,
              "Cab/ha": data.cabezas_por_ha.toFixed(2),
              "kg/ha": data.kg_por_ha,
              "UG/ha": data.ug_por_ha.toFixed(2),
              "Peso Total (kg)": data.peso_total,
            },
          ]

          const ws = XLSX.utils.json_to_sheet(exportData)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Carga Campo")

          const colWidths = [
            { wch: 20 }, // Establecimiento
            { wch: 15 }, // ha Ganaderas
            { wch: 12 }, // Cab/ha
            { wch: 12 }, // kg/ha
            { wch: 12 }, // UG/ha
            { wch: 15 }, // Peso Total
          ]
          ws["!cols"] = colWidths

          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `carga_campo_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("XLSX failed, using CSV fallback:", xlsxError)
          // Fallback a CSV
          const csvContent = [
            "Establecimiento,ha Ganaderas,Cab/ha,kg/ha,UG/ha,Peso Total (kg)",
            `${data.establecimiento},${data.hectareas_utiles},${data.cabezas_por_ha.toFixed(2)},${data.kg_por_ha},${data.ug_por_ha.toFixed(2)},${data.peso_total}`,
          ].join("\n")

          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `carga_campo_${new Date().toISOString().split("T")[0]}.csv`)
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
            <MapPin className="w-5 h-5 text-[#34A853]" />
            Carga Total del Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-[#34A853]" />
            Carga Total del Campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No hay datos disponibles para este establecimiento</div>
        </CardContent>
      </Card>
    )
  }

  // Valores óptimos de referencia
  const optimalValues = {
    cabHas: 0.6,
    kgHas: 130,
    ugHas: 180,
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#34A853]" />
            <CardTitle className="text-lg">Carga Total del Campo</CardTitle>
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
                      <h4 className="font-semibold text-gray-900">Carga Total del Campo</h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowTooltip(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Análisis integral de la carga animal del establecimiento.</p>
                      <div className="space-y-1">
                        <p>
                          <strong>• Cab/ha:</strong> Cabezas de ganado por hectárea
                        </p>
                        <p>
                          <strong>• kg/ha:</strong> Kilogramos de peso vivo por hectárea
                        </p>
                        <p>
                          <strong>• UG/ha:</strong> Unidades ganaderas por hectárea
                        </p>
                        <p>
                          <strong>• Indicadores:</strong> Verde=Óptimo, Naranja=Bajo, Rojo=Alto
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
              disabled={!data}
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{data.hectareas_utiles}</p>
            <p className="text-sm text-gray-600">ha Ganaderas</p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 bg-gray-50 rounded-lg cursor-help">
                  <div className="flex items-center justify-center">
                    <p className={`text-2xl font-bold ${getValueColor(data.cabezas_por_ha, optimalValues.cabHas)}`}>
                      {data.cabezas_por_ha.toFixed(2)}
                    </p>
                    {getValueBadge(data.cabezas_por_ha, optimalValues.cabHas)}
                  </div>
                  <p className="text-sm text-gray-600">Cab/ha</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Valor óptimo: {optimalValues.cabHas.toFixed(2)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 bg-gray-50 rounded-lg cursor-help">
                  <div className="flex items-center justify-center">
                    <p className={`text-2xl font-bold ${getValueColor(data.kg_por_ha, optimalValues.kgHas)}`}>
                      {data.kg_por_ha.toFixed(2)}
                    </p>
                    {getValueBadge(data.kg_por_ha, optimalValues.kgHas)}
                  </div>
                  <p className="text-sm text-gray-600">kg/ha</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Valor óptimo: {optimalValues.kgHas.toFixed(2)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-4 bg-gray-50 rounded-lg cursor-help">
                  <div className="flex items-center justify-center">
                    <p className={`text-2xl font-bold ${getValueColor(data.ug_por_ha, optimalValues.ugHas)}`}>
                      {data.ug_por_ha.toFixed(2)}
                    </p>
                    {getValueBadge(data.ug_por_ha, optimalValues.ugHas)}
                  </div>
                  <p className="text-sm text-gray-600">UG/ha</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Valor óptimo: {optimalValues.ugHas.toFixed(2)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
