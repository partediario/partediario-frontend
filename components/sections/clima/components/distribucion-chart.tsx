"use client"

import type React from "react"

import { usePluviometriaData } from "@/hooks/use-pluviometria-data"
import { CloudRain, Droplets, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useRef } from "react"

interface DistribucionChartProps {
  year: number
}

// Colores profesionales para las barras
const getBarColor = (value: number, maxValue: number) => {
  const intensity = value / maxValue
  if (intensity > 0.8) return "#1e40af" // Azul intenso para valores altos
  if (intensity > 0.6) return "#3b82f6" // Azul medio
  if (intensity > 0.4) return "#60a5fa" // Azul claro
  if (intensity > 0.2) return "#93c5fd" // Azul muy claro
  return "#dbeafe" // Azul pálido para valores bajos
}

interface TooltipData {
  mes: string
  lluvia: number
  totalAnual: number
  promedioMensual: number
  x: number
  y: number
}

export function DistribucionChart({ year }: DistribucionChartProps) {
  const { datosMensuales, loading, error } = usePluviometriaData(year)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Cargando datos de pluviometría...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-red-600">
            <CloudRain className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium mb-2">Error al cargar datos</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!datosMensuales || datosMensuales.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-gray-500">
            <CloudRain className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium mb-2">No hay datos de pluviometría disponibles</p>
            <p className="text-sm">Para el año {year}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular estadísticas
  const totalAnual = datosMensuales.reduce((sum, item) => sum + (item.total_lluvia_mes || 0), 0)
  const promedioMensual = totalAnual / 12
  const maxValue = Math.max(...datosMensuales.map((item) => item.total_lluvia_mes || 0))

  // Preparar datos para el gráfico
  const chartData = datosMensuales.map((item) => ({
    mes: item.nombre_mes,
    lluvia: item.total_lluvia_mes || 0,
    unidad: item.unidad_medida || "mm",
  }))

  // Manejadores de eventos para tooltip manual
  const handleBarHover = (event: React.MouseEvent, data: any) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (rect) {
      setTooltip({
        mes: data.mes,
        lluvia: data.lluvia,
        totalAnual,
        promedioMensual,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
  }

  const handleBarLeave = () => {
    setTooltip(null)
  }

  // Altura del área del gráfico en píxeles
  const CHART_HEIGHT = 300

  return (
    <div className="w-full space-y-6">
      {/* Gráfico Principal */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Droplets className="w-6 h-6 text-blue-500" />
            Distribución Mensual de Lluvias - {year}
          </CardTitle>
          <CardDescription className="text-base">Análisis detallado de precipitaciones durante el año</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div ref={chartRef} className="w-full relative bg-gray-50 rounded-lg p-4" style={{ height: "500px" }}>
            {/* Eje Y */}
            <div
              className="absolute left-2 top-4 flex flex-col justify-between text-xs text-gray-600"
              style={{ height: `${CHART_HEIGHT}px` }}
            >
              <span>{maxValue.toFixed(0)}</span>
              <span>{(maxValue * 0.75).toFixed(0)}</span>
              <span>{(maxValue * 0.5).toFixed(0)}</span>
              <span>{(maxValue * 0.25).toFixed(0)}</span>
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

            {/* Contenedor de barras */}
            <div
              className="absolute left-12 right-4 top-4 flex justify-between gap-1"
              style={{ height: `${CHART_HEIGHT}px` }}
            >
              {chartData.map((item, index) => {
                const barHeight = maxValue > 0 ? (item.lluvia / maxValue) * CHART_HEIGHT : 0
                const barWidth = `${Math.max(100 / chartData.length - 2, 4)}%`

                return (
                  <div
                    key={index}
                    className="flex flex-col justify-end items-center h-full"
                    style={{ width: barWidth }}
                  >
                    {/* Barra */}
                    <div
                      className="cursor-pointer transition-all duration-200 hover:opacity-80 hover:scale-105 relative bg-blue-500"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: getBarColor(item.lluvia, maxValue),
                        borderRadius: "6px 6px 0 0",
                        border: "1px solid #e5e7eb",
                        minHeight: item.lluvia > 0 ? "4px" : "0px",
                        width: "80%",
                      }}
                      onMouseEnter={(e) => handleBarHover(e, item)}
                      onMouseLeave={handleBarLeave}
                      onMouseMove={(e) => handleBarHover(e, item)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Etiquetas de meses */}
            <div
              className="absolute left-12 right-4 flex justify-between gap-1"
              style={{ top: `${CHART_HEIGHT + 30}px` }}
            >
              {chartData.map((item, index) => {
                const barWidth = `${Math.max(100 / chartData.length - 2, 4)}%`
                const mesAbreviado = item.mes.substring(0, 3)
                return (
                  <div key={index} className="flex justify-center items-center" style={{ width: barWidth }}>
                    <span className="text-xs text-gray-600 transform -rotate-45 origin-left whitespace-nowrap mt-4">
                      {mesAbreviado}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Etiqueta del eje Y */}

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute bg-white p-4 border border-gray-200 rounded-lg shadow-xl z-50 min-w-[250px] pointer-events-none"
                style={{
                  left: Math.min(
                    tooltip.x + 10,
                    chartRef.current?.clientWidth ? chartRef.current.clientWidth - 270 : tooltip.x,
                  ),
                  top: Math.max(tooltip.y - 100, 10),
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <p className="font-bold text-gray-900 text-lg">{tooltip.mes}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Precipitación:</span>
                    <span className="font-bold text-blue-600 text-lg">{tooltip.lluvia.toFixed(1)} mm</span>
                  </div>

                  {tooltip.totalAnual > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">% del total anual:</span>
                      <span className="font-semibold text-gray-900">
                        {((tooltip.lluvia / tooltip.totalAnual) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {tooltip.promedioMensual > 0 && tooltip.lluvia > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {tooltip.lluvia > tooltip.promedioMensual ? (
                          <span className="text-green-600 font-medium">
                            ↗ {(tooltip.lluvia - tooltip.promedioMensual).toFixed(1)} mm por encima del promedio
                          </span>
                        ) : tooltip.lluvia < tooltip.promedioMensual ? (
                          <span className="text-orange-600 font-medium">
                            ↘ {(tooltip.promedioMensual - tooltip.lluvia).toFixed(1)} mm por debajo del promedio
                          </span>
                        ) : (
                          <span className="text-gray-600 font-medium">= Igual al promedio mensual</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Anual</p>
                <p className="text-3xl font-bold text-blue-900">{totalAnual.toFixed(1)}</p>
                <p className="text-sm text-blue-600">mm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Promedio Mensual</p>
                <p className="text-3xl font-bold text-green-900">{promedioMensual.toFixed(1)}</p>
                <p className="text-sm text-green-600">mm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-full">
                <CloudRain className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Máximo Mensual</p>
                <p className="text-3xl font-bold text-purple-900">{maxValue.toFixed(1)}</p>
                <p className="text-sm text-purple-600">mm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500 rounded-full">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Mes Pico</p>
                <p className="text-2xl font-bold text-orange-900">
                  {datosMensuales.find((m) => (m.total_lluvia_mes || 0) === maxValue)?.nombre_mes || "N/A"}
                </p>
                <p className="text-sm text-orange-600">del año</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
