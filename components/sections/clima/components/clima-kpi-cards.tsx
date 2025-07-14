"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CloudRain, Calendar, HelpCircle, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"

interface ClimaKpiCardsProps {
  totalMesActual: number
  mesActualNombre: string
  totalAnual: number
  year: number
  loading?: boolean
}

export function ClimaKpiCards({
  totalMesActual,
  mesActualNombre,
  totalAnual,
  year,
  loading = false,
}: ClimaKpiCardsProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
      {/* Lluvia mes actual */}
      <Card className="relative border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-600 mb-1">Lluvia mes actual</p>
                <div className="relative">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === "lluvia-actual" ? null : "lluvia-actual")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  {activeTooltip === "lluvia-actual" && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setActiveTooltip(null)} />
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Lluvia mes actual</h4>
                          <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Registro de precipitaciones del mes en curso para el establecimiento seleccionado.</p>
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="font-medium text-blue-900 mb-1">Información incluida:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                              <li>Promedio de lluvia del establecimiento</li>
                              <li>Mes y año actual</li>
                              <li>Medición en milímetros (mm)</li>
                            </ul>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Los datos se actualizan automáticamente con cada registro de lluvia.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{totalMesActual} mm</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                Promedio del establecimiento - {mesActualNombre} Año {year}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CloudRain className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acumulado año */}
      <Card className="relative border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-600 mb-1">Acumulado año</p>
                <div className="relative">
                  <button
                    onClick={() => setActiveTooltip(activeTooltip === "acumulado-anio" ? null : "acumulado-anio")}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  {activeTooltip === "acumulado-anio" && (
                    <>
                      <div className="fixed inset-0 z-[100]" onClick={() => setActiveTooltip(null)} />
                      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">Acumulado año</h4>
                          <button onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Suma total de precipitaciones desde enero hasta el mes actual del año en curso.</p>
                          <div className="bg-green-50 p-3 rounded-md">
                            <p className="font-medium text-green-900 mb-1">Características:</p>
                            <ul className="list-disc list-inside space-y-1 text-green-800">
                              <li>Acumulado desde enero hasta el mes actual</li>
                              <li>Incluye todos los registros del establecimiento</li>
                              <li>Útil para análisis de tendencias anuales</li>
                              <li>Comparación con años anteriores</li>
                            </ul>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Este valor se incrementa automáticamente con cada nuevo registro mensual.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900">{totalAnual} mm</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">Enero - {mesActualNombre}</p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
