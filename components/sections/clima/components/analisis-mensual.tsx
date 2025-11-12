"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, BarChart3, HelpCircle, X } from "lucide-react"
import { PluviometriaTable } from "./pluviometria-table"
import { DistribucionChart } from "./distribucion-chart"

interface AnalisisMensualProps {
  year: number
}

export function AnalisisMensual({ year }: AnalisisMensualProps) {
  const [activeTab, setActiveTab] = useState<"tabla" | "grafico">("tabla")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-lg border">
      {/* Header con título y botones */}
      <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 pb-0 gap-3">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Análisis Mensual - Año {year}</h2>
            <div className="relative">
              <button
                onClick={() => setActiveTooltip(activeTooltip === "analisis-mensual" ? null : "analisis-mensual")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              {activeTooltip === "analisis-mensual" && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setActiveTooltip(null)} />
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Análisis Mensual</h4>
                      <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Vista detallada de la distribución de lluvias mes a mes durante el año seleccionado.</p>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-medium text-gray-900 mb-1">Opciones de visualización:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>
                            <strong>Tabla:</strong> Vista de calendario con datos mensuales
                          </li>
                          <li>
                            <strong>Gráfico:</strong> Representación visual de tendencias
                          </li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="font-medium text-blue-900 mb-1">Información incluida:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>Precipitaciones mensuales detalladas</li>
                          <li>Comparación entre meses</li>
                          <li>Identificación de patrones estacionales</li>
                          <li>Análisis de distribución anual</li>
                        </ul>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Utiliza esta vista para planificar actividades agrícolas y ganaderas basadas en patrones
                        climáticos.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Vista de calendario de distribución de lluvias</p>
        </div>

        {/* Botones de navegación */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
          <Button
            variant={activeTab === "tabla" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("tabla")}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Table className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Tabla</span>
          </Button>
          <Button
            variant={activeTab === "grafico" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("grafico")}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Gráfico</span>
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6 pt-4">
        {activeTab === "tabla" ? <PluviometriaTable year={year} /> : <DistribucionChart year={year} />}
      </div>
    </div>
  )
}
