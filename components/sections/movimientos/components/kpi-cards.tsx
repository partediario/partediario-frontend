"use client"

import type React from "react"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, TrendingUp, Baby, TrendingDown, DollarSign, HelpCircle, X } from "lucide-react"

// Función para obtener descripciones detalladas y profesionales
const getKpiDescription = (label: string): { title: string; description: string; example: string } => {
  const descriptions: Record<string, { title: string; description: string; example: string }> = {
    Compras: {
      title: "Compras de Animales",
      description:
        "Registra el total de animales adquiridos mediante transacciones comerciales durante el período seleccionado.",
      example:
        "Ejemplo: Si muestra 30 (32.3%), significa que se compraron 30 animales y estas compras representan el 32.3% del total de movimientos de entrada al establecimiento.",
    },
    Entradas: {
      title: "Entradas Totales de Animales",
      description:
        "Contabiliza todos los animales que ingresan al establecimiento, incluyendo compras, traslados desde otros campos, devoluciones y nacimientos.",
      example:
        "Ejemplo: Si muestra 88 (94.6%), significa que ingresaron 88 animales en total y estas entradas representan el 94.6% del total de movimientos registrados (entradas + salidas).",
    },
    Nacimientos: {
      title: "Nacimientos Registrados",
      description:
        "Cuantifica los animales nacidos dentro del establecimiento durante el período de análisis, indicador clave de la productividad reproductiva.",
      example:
        "Ejemplo: Si muestra 58 (62.4%), significa que nacieron 58 animales y estos nacimientos representan el 62.4% del total de entradas al establecimiento.",
    },
    Mortandad: {
      title: "Mortandad Animal",
      description:
        "Registra el número de animales fallecidos en el establecimiento, indicador crítico para el control sanitario y gestión de riesgos.",
      example:
        "Ejemplo: Si muestra 1 (1.1%), significa que murió 1 animal y esta pérdida representa el 1.1% del total de movimientos de salida del establecimiento.",
    },
    Ventas: {
      title: "Ventas de Animales",
      description:
        "Contabiliza los animales comercializados y vendidos del establecimiento, indicador fundamental de la actividad comercial.",
      example:
        "Ejemplo: Si muestra 4 (4.3%), significa que se vendieron 4 animales y estas ventas representan el 4.3% del total de movimientos de salida del establecimiento.",
    },
    Salidas: {
      title: "Salidas Totales de Animales",
      description:
        "Registra todos los animales que salen del establecimiento, incluyendo ventas, traslados a otros campos, mortandad y otros movimientos de egreso.",
      example:
        "Ejemplo: Si muestra 5 (5.4%), significa que salieron 5 animales en total y estas salidas representan el 5.4% del total de movimientos registrados (entradas + salidas).",
    },
  }

  return (
    descriptions[label] || {
      title: `Información sobre ${label}`,
      description:
        "Este indicador muestra datos importantes para el seguimiento y control de su establecimiento ganadero.",
      example: "Consulte con su administrador para obtener más detalles sobre este indicador específico.",
    }
  )
}

/* ────────────────────────
   Tipos
   ──────────────────────── */
export interface KpiData {
  id: string
  label: string
  value: number | string
  previousValue?: number | string
  description?: string
  color: string
  bgColor?: string
  borderColor?: string
  icon: string
  period?: string
  tipo?: "ENTRADA" | "SALIDA"
}

export interface MetricasData {
  totalMovimientos: number
  saldoNeto: number
  tasaNatalidad: number
  tasaMortandad: number
}

interface KpiCardsProps {
  data?: KpiData[]
  isLoading?: boolean
  metricas?: MetricasData
  totalMovimientos?: number
}

/* ────────────────────────
   Iconos dinámicos
   ──────────────────────── */
const iconMap: Record<string, React.ElementType> = {
  shoppingCart: ShoppingCart,
  trendingUp: TrendingUp,
  baby: Baby,
  trendingDown: TrendingDown,
  dollarSign: DollarSign,
}

/* ────────────────────────
   Componente principal
   ──────────────────────── */
export default function KpiCards({ data = [], isLoading = false, metricas, totalMovimientos = 0 }: KpiCardsProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  /* utilidades */
  const calculatePercentage = (value: number) =>
    totalMovimientos === 0 ? "0%" : `${((value / totalMovimientos) * 100).toFixed(1)}%`

  /* ordenar ENTRADAS antes que SALIDAS */
  const sortedData = [...data].sort((a, b) => {
    if (a.tipo === "ENTRADA" && b.tipo === "SALIDA") return -1
    if (a.tipo === "SALIDA" && b.tipo === "ENTRADA") return 1
    return 0
  })

  const handleTooltipToggle = (kpiId: string, event: React.MouseEvent) => {
    if (activeTooltip === kpiId) {
      setActiveTooltip(null)
      setTooltipPosition(null)
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left,
        y: rect.top - 10,
      })
      setActiveTooltip(kpiId)
    }
  }

  /* loading skeletons */
  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Indicadores Clave de Gestión</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-28" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {/* título más profesional */}
      <h2 className="text-xl font-semibold text-gray-800">Indicadores Clave de Gestión</h2>

      {/* grid responsive */}
      <div className="overflow-visible pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 min-w-fit">
          {sortedData.map((kpi, index) => {
            const IconComp = iconMap[kpi.icon] ?? ShoppingCart
            const percent = typeof kpi.value === "number" ? calculatePercentage(kpi.value) : "0%"
            const isTooltipActive = activeTooltip === kpi.id
            const kpiInfo = getKpiDescription(kpi.label)

            return (
              <Card
                key={kpi.id}
                className={`border-l-4 ${kpi.borderColor ?? "border-l-gray-300"} shadow-sm hover:shadow-md transition relative`}
              >
                <CardContent className="p-3 lg:p-4">
                  {/* encabezado de la tarjeta */}
                  <div className="flex justify-between items-start mb-3">
                    {/* icono grande */}
                    <div
                      className={`p-2 rounded-full ${kpi.bgColor ?? "bg-gray-100"} transition-transform group-hover:scale-110`}
                    >
                      <IconComp className="h-4 w-4" style={{ color: kpi.color }} />
                    </div>

                    {/* solo ayuda, sin porcentaje */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
                        aria-label={`Información sobre ${kpi.label}`}
                        onClick={(e) => handleTooltipToggle(kpi.id, e)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>

                      {/* Tooltip personalizado mejorado */}
                      {isTooltipActive && tooltipPosition && (
                        <div
                          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
                          style={{
                            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
                            top: Math.max(10, tooltipPosition.y - 200),
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-base text-gray-900 pr-2">{kpiInfo.title}</h4>
                            <button
                              onClick={() => setActiveTooltip(null)}
                              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <p className="text-sm text-gray-700 leading-relaxed">{kpiInfo.description}</p>

                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                              <p className="text-sm text-blue-800 font-medium mb-1">Interpretación:</p>
                              <p className="text-sm text-blue-700 leading-relaxed">{kpiInfo.example}</p>
                            </div>

                            <div className="text-xs text-gray-500 pt-2 border-t">
                              <strong>Período actual:</strong> {kpi.period || "Total acumulado hasta la fecha"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* cuerpo */}
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">{kpi.label}</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: kpi.color }}>
                      {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{kpi.period || "Total Acumulado"}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Overlay para cerrar tooltip al hacer clic fuera */}
      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}

      {/* resumen inferior - OCULTO */}
      {/* {metricas && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <ResumenItem label="Total de Movimientos" value={metricas.totalMovimientos} />
              <ResumenItem
                label="Saldo Neto"
                value={metricas.saldoNeto}
                color={metricas.saldoNeto >= 0 ? "#34A853" : "#EA4335"}
                prefix={metricas.saldoNeto >= 0 ? "+" : ""}
              />
              <ResumenItem label="Tasa de Natalidad" value={`${metricas.tasaNatalidad}%`} color="#4285F4" />
              <ResumenItem label="Tasa de Mortandad" value={`${metricas.tasaMortandad}%`} color="#EA4335" />
            </div>
          </CardContent>
        </Card>
      )} */}
    </section>
  )
}

/* ────────────────────────
   Item del resumen inferior
   ──────────────────────── */
interface ResumenItemProps {
  label: string
  value: number | string
  color?: string
  prefix?: string
}

const ResumenItem = ({ label, value, color = "#000", prefix = "" }: ResumenItemProps) => (
  <div>
    <p className="text-sm text-gray-600 font-medium">{label}</p>
    <p className="text-lg font-bold" style={{ color }}>
      {prefix}
      {typeof value === "number" ? value.toLocaleString() : value}
    </p>
  </div>
)
