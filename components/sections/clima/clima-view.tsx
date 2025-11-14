"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { ClimaKpiCards } from "./components/clima-kpi-cards"
import { AnalisisMensual } from "./components/analisis-mensual"
import { useClimaData } from "@/hooks/use-clima-data"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { toast } from "@/hooks/use-toast"

export default function ClimaView() {
  const [selectedYear, setSelectedYear] = useState("2025")
  const [isExporting, setIsExporting] = useState(false)
  const { climaData, loading, error } = useClimaData()
  const { currentEstablishment } = useCurrentEstablishment()

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const handleExportPDF = async () => {
    if (!currentEstablishment?.id) {
      toast({
        title: "Error",
        description: "No se ha seleccionado un establecimiento",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await fetch(
        `/api/clima/export?establecimiento_id=${currentEstablishment.id}&year=${selectedYear}&format=pdf`,
      )

      if (!response.ok) {
        throw new Error("Error al generar el reporte")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `reporte-lluvia-${selectedYear}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Éxito",
        description: "Reporte de lluvia descargado correctamente",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: "Error al descargar el reporte",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 px-0 py-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Climático</h1>
          <p className="text-gray-600 mt-1">Análisis de lluvias - Parte Diario Pro</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="hidden bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Generando..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Analizando:</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            📅 Año {selectedYear}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            📊 Mensual
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <ClimaKpiCards
        totalMesActual={climaData?.lluvia_mes_actual || 0}
        mesActualNombre={climaData?.mes_actual_nombre || "Mes actual"}
        totalAnual={climaData?.lluvia_anho_total || 0}
        year={currentYear}
        loading={loading}
      />

      {/* Análisis Mensual */}
      <AnalisisMensual year={Number.parseInt(selectedYear)} />
    </div>
  )
}
