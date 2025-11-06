"use client"

import { usePluviometriaData } from "@/hooks/use-pluviometria-data"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface DistribucionChartProps {
  year: number
}

export function DistribucionChart({ year }: DistribucionChartProps) {
  const { currentEstablishment } = useCurrentEstablishment()
  const { datosAnuales, loading, error } = usePluviometriaData(year, currentEstablishment?.id)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar los datos: {error}</p>
      </div>
    )
  }

  if (!datosAnuales || datosAnuales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay datos disponibles para el año {year}</p>
      </div>
    )
  }

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  // Organizar datos por mes y calcular totales
  const datosPorMes = datosAnuales.reduce(
    (acc, dato) => {
      const mes = dato.mes - 1
      if (!acc[mes]) {
        acc[mes] = 0
      }
      acc[mes] += dato.total_caidos
      return acc
    },
    {} as Record<number, number>,
  )

  // Preparar datos para el gráfico
  const chartData = meses.map((mes, index) => ({
    mes: mes.substring(0, 3), // Abreviar nombres de meses
    mesCompleto: mes,
    total: datosPorMes[index] || 0,
  }))

  const totalAnual = chartData.reduce((sum, item) => sum + item.total, 0)
  const promedioMensual = totalAnual / 12

  // Función para determinar el color de la barra según la cantidad de lluvia
  const getBarColor = (valor: number) => {
    if (valor === 0) return "#E5E7EB" // gray-200
    if (valor <= 50) return "#DBEAFE" // blue-100
    if (valor <= 100) return "#93C5FD" // blue-300
    if (valor <= 150) return "#3B82F6" // blue-500
    return "#1E40AF" // blue-800
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Anual</p>
          <p className="text-2xl font-bold text-blue-900">{totalAnual.toFixed(1)} mm</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Promedio Mensual</p>
          <p className="text-2xl font-bold text-green-900">{promedioMensual.toFixed(1)} mm</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Mes con Mayor Lluvia</p>
          <p className="text-2xl font-bold text-purple-900">
            {chartData.reduce((max, item) => (item.total > max.total ? item : max), chartData[0]).mesCompleto}
          </p>
          <p className="text-sm text-purple-600">
            {chartData.reduce((max, item) => (item.total > max.total ? item : max), chartData[0]).total.toFixed(1)} mm
          </p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Mensual de Precipitaciones</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="mes" tick={{ fill: "#6B7280", fontSize: 12 }} />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 12 }}
              label={{ value: "Precipitación (mm)", angle: -90, position: "insideLeft", style: { fill: "#6B7280" } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#111827", fontWeight: "600", marginBottom: "4px" }}
              formatter={(value: number, name: string, props: any) => [
                `${value.toFixed(1)} mm`,
                props.payload.mesCompleto,
              ]}
            />
            <Bar dataKey="total" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.total)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap items-center gap-4 text-sm bg-gray-50 p-4 rounded-lg">
        <span className="font-medium text-gray-700">Leyenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span className="text-gray-600">0 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-gray-600">1-50 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <span className="text-gray-600">51-100 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-600">101-150 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-800 rounded"></div>
          <span className="text-gray-600">150+ mm</span>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Análisis:</strong> Este gráfico muestra la distribución de precipitaciones a lo largo del año{" "}
          {year}. Las barras más altas indican los meses con mayor cantidad de lluvia, lo que puede ayudar en la
          planificación de actividades agrícolas y ganaderas.
        </p>
      </div>
    </div>
  )
}
