"use client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePluviometriaData } from "@/hooks/use-pluviometria-data"

interface PluviometriaTableProps {
  year: number
}

export function PluviometriaTable({ year }: PluviometriaTableProps) {
  const { datosAnuales, loading, error } = usePluviometriaData(year)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const dias = Array.from({ length: 31 }, (_, i) => i + 1)

  // Organizar datos por mes
  const datosPorMes = datosAnuales.reduce(
    (acc, dato) => {
      const mes = dato.mes - 1
      if (!acc[mes]) {
        acc[mes] = {}
      }
      acc[mes][dato.dia] = dato.total_caidos
      return acc
    },
    {} as Record<number, Record<number, number>>,
  )

  // Calcular totales por mes
  const totalesPorMes = meses.map((_, mesIndex) => {
    const datosMes = datosPorMes[mesIndex] || {}
    return Object.values(datosMes).reduce((sum, valor) => sum + (valor || 0), 0)
  })

  // Calcular totales por día
  const totalesPorDia = dias.map((dia) => {
    return meses.reduce((sum, _, mesIndex) => {
      const valor = datosPorMes[mesIndex]?.[dia] || 0
      return sum + valor
    }, 0)
  })

  const totalGeneral = totalesPorMes.reduce((sum, total) => sum + total, 0)

  const getRainColorClass = (valor: number | undefined) => {
    if (!valor || valor === 0) return ""
    if (valor <= 9) return "bg-blue-100 text-blue-800"
    if (valor <= 24) return "bg-blue-200 text-blue-900"
    if (valor <= 49) return "bg-blue-400 text-white"
    return "bg-blue-600 text-white"
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
        <span className="font-medium">Leyenda:</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 border rounded"></div>
          <span>0 mm</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded"></div>
          <span>1-9 mm</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-200 rounded"></div>
          <span>10-24 mm</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-400 rounded"></div>
          <span>25-49 mm</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
          <span>50+ mm</span>
        </div>
      </div>

      {/* Tabla simplificada con scroll horizontal */}
      <div className="relative w-full border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 h-9 sm:h-12">
                <th className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-4 text-left text-xs sm:text-sm font-semibold text-gray-900 border-r min-w-[85px] sm:min-w-[120px]">
                  MES
                </th>
                {dias.map((dia) => (
                  <th key={dia} className="min-w-[34px] sm:min-w-[40px] text-center text-xs font-medium text-gray-700 border-r">
                    {dia}
                  </th>
                ))}
                <th className="sticky right-0 z-10 bg-green-50 min-w-[65px] sm:min-w-[80px] text-center text-xs font-semibold text-gray-900">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {meses.map((mes, mesIndex) => (
                <tr key={mes} className="border-b hover:bg-gray-50 h-9 sm:h-10">
                  <td className="sticky left-0 z-10 bg-gray-50 px-2 sm:px-4 font-medium text-gray-900 text-xs sm:text-sm border-r">
                    {mes}
                  </td>
                  {dias.map((dia) => {
                    const valor = datosPorMes[mesIndex]?.[dia]
                    return (
                      <td key={dia} className="text-center border-r">
                        {valor ? (
                          <Badge
                            variant="secondary"
                            className={`${getRainColorClass(valor)} font-medium text-xs px-0.5 sm:px-1 py-0.5`}
                          >
                            {valor}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="sticky right-0 z-10 bg-green-50 text-center">
                    <span className="text-xs font-medium">
                      {totalesPorMes[mesIndex] > 0 ? `${totalesPorMes[mesIndex]}` : "0"}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-800 text-white h-10">
                <td className="sticky left-0 z-10 bg-gray-800 px-4 font-bold text-sm">TOTAL</td>
                {dias.map((dia) => (
                  <td key={dia} className="text-center border-r border-gray-600">
                    {totalesPorDia[dia - 1] > 0 ? (
                      <span className="text-xs font-medium">{totalesPorDia[dia - 1]}</span>
                    ) : (
                      <span className="text-xs opacity-50">-</span>
                    )}
                  </td>
                ))}
                <td className="sticky right-0 z-10 bg-green-600 text-center">
                  <span className="text-xs font-medium text-white">
                    {totalGeneral > 0 ? `${totalGeneral} mm` : "0 mm"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional para pantallas pequeñas */}
      <div className="block md:hidden bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-xs sm:text-sm text-blue-800">
          💡 <strong>Tip:</strong> Desliza horizontalmente para ver todos los días del mes.
        </p>
      </div>

      {/* Vista resumida para móviles (opcional - totales por mes) */}
      <div className="block sm:hidden space-y-2 mt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Resumen Mensual</h3>
        <div className="grid grid-cols-2 gap-2">
          {meses.map((mes, mesIndex) => (
            <div key={mes} className="bg-gray-50 p-2 rounded border">
              <div className="text-xs text-gray-600">{mes}</div>
              <div className="text-sm font-semibold text-gray-900">
                {totalesPorMes[mesIndex] > 0 ? `${totalesPorMes[mesIndex]} mm` : "0 mm"}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-green-600 text-white p-3 rounded font-semibold text-center">
          Total Anual: {totalGeneral > 0 ? `${totalGeneral} mm` : "0 mm"}
        </div>
      </div>
    </div>
  )
}
