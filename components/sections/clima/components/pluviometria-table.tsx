"use client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { usePluviometriaData } from "@/hooks/use-pluviometria-data"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"

interface PluviometriaTableProps {
  year: number
}

export function PluviometriaTable({ year }: PluviometriaTableProps) {
  const { currentEstablishment } = useCurrentEstablishment()
  const { datosAnuales, loading, error } = usePluviometriaData(year, currentEstablishment?.id)

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
      const mes = dato.mes - 1 // Convertir a índice 0-based
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

  // Calcular promedios por mes (solo días con lluvia)
  const promediosPorMes = meses.map((_, mesIndex) => {
    const datosMes = datosPorMes[mesIndex] || {}
    const valoresConLluvia = Object.values(datosMes).filter((valor) => valor && valor > 0)
    if (valoresConLluvia.length === 0) return 0
    return valoresConLluvia.reduce((sum, valor) => sum + valor, 0) / valoresConLluvia.length
  })

  // Calcular totales por día (columna)
  const totalesPorDia = dias.map((dia) => {
    return meses.reduce((sum, _, mesIndex) => {
      const valor = datosPorMes[mesIndex]?.[dia] || 0
      return sum + valor
    }, 0)
  })

  const totalGeneral = totalesPorMes.reduce((sum, total) => sum + total, 0)
  const promedioGeneral =
    promediosPorMes.reduce((sum, prom) => sum + prom, 0) / promediosPorMes.filter((p) => p > 0).length || 0

  const getRainColorClass = (valor: number | undefined) => {
    if (!valor || valor === 0) return ""
    if (valor <= 9) return "bg-blue-100 text-blue-800"
    if (valor <= 24) return "bg-blue-200 text-blue-900"
    if (valor <= 49) return "bg-blue-400 text-white"
    return "bg-blue-600 text-white"
  }

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="font-medium">Leyenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border rounded"></div>
          <span>0 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span>1-9 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <span>10-24 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <span>25-49 mm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>50+ mm</span>
        </div>
      </div>

      {/* Tabla con scroll horizontal solo en fechas */}
      <div className="w-full border rounded-lg overflow-hidden bg-white">
        <div className="flex">
          {/* Columna fija de meses */}
          <div className="flex-shrink-0 border-r bg-gray-50">
            <div className="h-12 flex items-center px-4 border-b bg-gray-50">
              <span className="font-semibold text-gray-900">MES</span>
            </div>
            {meses.map((mes, mesIndex) => (
              <div key={mes} className="h-10 flex items-center px-4 border-b hover:bg-gray-100">
                <span className="font-medium text-gray-900 text-sm">{mes}</span>
              </div>
            ))}
            <div className="h-10 flex items-center px-4 bg-gray-800">
              <span className="font-bold text-white text-sm">TOTAL</span>
            </div>
          </div>

          {/* Área con scroll horizontal para fechas */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-max">
              <div className="flex">
                {/* Columnas de días */}
                <div className="flex">
                  {/* Header de días */}
                  <div className="flex border-b bg-gray-50 h-12">
                    {dias.map((dia) => (
                      <div key={dia} className="w-10 flex items-center justify-center border-r">
                        <span className="text-xs font-medium text-gray-700">{dia}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filas de datos */}
              <div>
                {meses.map((mes, mesIndex) => (
                  <div key={mes} className="flex border-b hover:bg-gray-50 h-10">
                    {dias.map((dia) => {
                      const valor = datosPorMes[mesIndex]?.[dia]
                      return (
                        <div key={dia} className="w-10 flex items-center justify-center border-r">
                          {valor ? (
                            <Badge
                              variant="secondary"
                              className={`${getRainColorClass(valor)} font-medium text-xs px-1 py-0.5`}
                            >
                              {valor}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}

                {/* Fila TOTAL */}
                <div className="flex bg-gray-800 text-white h-10">
                  {dias.map((dia) => (
                    <div key={dia} className="w-10 flex items-center justify-center border-r border-gray-600">
                      {totalesPorDia[dia - 1] > 0 ? (
                        <span className="text-xs font-medium">{totalesPorDia[dia - 1]}</span>
                      ) : (
                        <span className="text-xs opacity-50">-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Columnas fijas de totales */}
          <div className="flex-shrink-0 border-l">
            <div className="flex">
              <div className="w-24 border-r bg-blue-50">
                <div className="h-12 flex items-center justify-center border-b bg-blue-50">
                  <span className="font-semibold text-gray-900 text-xs">PROMEDIO</span>
                </div>
                {meses.map((mes, mesIndex) => (
                  <div key={mes} className="h-10 flex items-center justify-center border-b">
                    <span className="text-xs font-medium">
                      {promediosPorMes[mesIndex] > 0 ? `${Math.round(promediosPorMes[mesIndex])} mm` : "0 mm"}
                    </span>
                  </div>
                ))}
                <div className="h-10 flex items-center justify-center bg-blue-600">
                  <span className="text-xs font-medium text-white">
                    {promedioGeneral > 0 ? `${Math.round(promedioGeneral)} mm` : "0 mm"}
                  </span>
                </div>
              </div>

              <div className="w-24 bg-green-50">
                <div className="h-12 flex items-center justify-center border-b bg-green-50">
                  <span className="font-semibold text-gray-900 text-xs">TOTAL</span>
                </div>
                {meses.map((mes, mesIndex) => (
                  <div key={mes} className="h-10 flex items-center justify-center border-b">
                    <span className="text-xs font-medium">
                      {totalesPorMes[mesIndex] > 0 ? `${totalesPorMes[mesIndex]} mm` : "0 mm"}
                    </span>
                  </div>
                ))}
                <div className="h-10 flex items-center justify-center bg-green-600">
                  <span className="text-xs font-medium text-white">
                    {totalGeneral > 0 ? `${totalGeneral} mm` : "0 mm"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información adicional para pantallas pequeñas */}
      <div className="block lg:hidden bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Desliza horizontalmente en la sección central para ver todos los días del mes.
        </p>
      </div>
    </div>
  )
}
