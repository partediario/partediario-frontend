"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import KpiCards from "./components/kpi-cards"
import CargaCampo from "./components/carga-campo"
import CargaPotrero from "./components/carga-potrero"
import StockActual from "./components/stock-actual"
import MovimientosRecientes from "./components/movimientos-recientes"

interface MovimientosData {
  kpis: {
    compras: number
    entradas: number
    nacimientos: number
    mortandad: number
    ventas: number
    salidas: number
  }
  metricas: {
    totalMovimientos: number
    saldoNeto: number
    tasaNatalidad: number
    tasaMortandad: number
  }
  ultimaActualizacion: string
}

export default function MovimientosView() {
  // Estados para manejar detalles y modales
  const [selectedStockItem, setSelectedStockItem] = useState<string | null>(null)
  const [selectedMovimiento, setSelectedMovimiento] = useState<string | null>(null)
  const [movimientosData, setMovimientosData] = useState<MovimientosData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Contexto de establecimiento
  const { establecimientoSeleccionado, getEstablecimientoNombre } = useEstablishment()

  // Cargar datos de movimientos
  useEffect(() => {
    if (!establecimientoSeleccionado) {
      setLoading(false)
      return
    }

    const fetchMovimientosData = async () => {
      try {
        setLoading(true)
        console.log("🔄 Cargando datos de movimientos para establecimiento:", establecimientoSeleccionado)

        const response = await fetch(`/api/movimientos-agregados?establecimiento_id=${establecimientoSeleccionado}`)

        if (!response.ok) {
          throw new Error("Error al cargar datos de movimientos")
        }

        const data = await response.json()
        console.log("📊 Datos de movimientos cargados:", data)
        setMovimientosData(data)
      } catch (error) {
        console.error("❌ Error cargando movimientos:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de movimientos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMovimientosData()
  }, [establecimientoSeleccionado, toast])

  // Función para manejar exportación
  const handleExport = (format: "csv" | "pdf") => {
    toast({
      title: `Exportando en formato ${format.toUpperCase()}`,
      description: "La descarga comenzará en breve...",
    })
    // Aquí iría la lógica real de exportación
  }

  // Formatear fecha de última actualización
  const formatearUltimaActualizacion = (fecha: string) => {
    try {
      const fechaObj = new Date(fecha)
      const ahora = new Date()
      const diffMs = ahora.getTime() - fechaObj.getTime()
      const diffMinutos = Math.floor(diffMs / (1000 * 60))

      if (diffMinutos < 1) return "Hace menos de 1 min"
      if (diffMinutos < 60) return `Hace ${diffMinutos} min`
      if (diffMinutos < 1440) return `Hace ${Math.floor(diffMinutos / 60)} horas`
      return fechaObj.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha no disponible"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34A853] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de movimientos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header - SIN BADGE "En línea" */}
      <div className="bg-white border-b border-gray-200 px-0 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Ganadero</h1>
            <p className="text-sm text-gray-600">
              {establecimientoSeleccionado
                ? `${getEstablecimientoNombre(establecimientoSeleccionado)} - Última actualización: ${
                    movimientosData
                      ? formatearUltimaActualizacion(movimientosData.ultimaActualizacion)
                      : "No disponible"
                  }`
                : "Seleccione un establecimiento"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-0 py-6 md:p-6 space-y-6">
        {/* KPIs Principales */}
        {movimientosData ? (
          <KpiCards
            data={[
              // ENTRADAS (lado izquierdo)
              {
                id: "compras",
                label: "Compras",
                value: movimientosData.kpis.compras,
                previousValue: 0,
                description: "Total de animales comprados en el período seleccionado",
                color: "#34A853",
                bgColor: "bg-[#34A853]/10",
                borderColor: "border-l-[#34A853]",
                icon: "shoppingCart",
                period: "total actual",
                tipo: "ENTRADA",
              },
              {
                id: "entradas",
                label: "Entradas",
                value: movimientosData.kpis.entradas,
                previousValue: 0,
                description: "Total de animales que ingresaron al establecimiento",
                color: "#34A853",
                bgColor: "bg-[#34A853]/10",
                borderColor: "border-l-[#34A853]",
                icon: "trendingUp",
                period: "total actual",
                tipo: "ENTRADA",
              },
              {
                id: "nacimientos",
                label: "Nacimientos",
                value: movimientosData.kpis.nacimientos,
                previousValue: 0,
                description: "Total de animales nacidos en el establecimiento",
                color: "#4285F4",
                bgColor: "bg-[#4285F4]/10",
                borderColor: "border-l-[#4285F4]",
                icon: "baby",
                period: "total actual",
                tipo: "ENTRADA",
              },
              // SALIDAS (lado derecho)
              {
                id: "mortandad",
                label: "Mortandad",
                value: movimientosData.kpis.mortandad,
                previousValue: 0,
                description: "Total de animales muertos en el período",
                color: "#EA4335",
                bgColor: "bg-[#EA4335]/10",
                borderColor: "border-l-[#EA4335]",
                icon: "trendingDown",
                period: "total actual",
                tipo: "SALIDA",
              },
              {
                id: "ventas",
                label: "Ventas",
                value: movimientosData.kpis.ventas,
                previousValue: 0,
                description: "Total de animales vendidos en el período",
                color: "#FF9800",
                bgColor: "bg-[#FF9800]/10",
                borderColor: "border-l-[#FF9800]",
                icon: "dollarSign",
                period: "total actual",
                tipo: "SALIDA",
              },
              {
                id: "salidas",
                label: "Salidas",
                value: movimientosData.kpis.salidas,
                previousValue: 0,
                description: "Total de animales que salieron del establecimiento",
                color: "#EA4335",
                bgColor: "bg-[#EA4335]/10",
                borderColor: "border-l-[#EA4335]",
                icon: "trendingDown",
                period: "total actual",
                tipo: "SALIDA",
              },
            ]}
            lastUpdated={formatearUltimaActualizacion(movimientosData.ultimaActualizacion)}
            metricas={movimientosData.metricas}
            totalMovimientos={movimientosData.metricas.totalMovimientos}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay datos disponibles para mostrar</p>
          </div>
        )}

        {/* Stock Actual - MOVIDO AQUÍ DESPUÉS DE LOS KPIs */}
        <StockActual onRowClick={setSelectedStockItem} />

        {/* Carga Total del Campo */}
        <CargaCampo />

        {/* Carga por Potrero */}
        <CargaPotrero />

        {/* Movimientos Recientes */}
        <MovimientosRecientes onRowClick={setSelectedMovimiento} onExport={handleExport} />
      </div>

      {/* Modal para detalles de Stock */}
      <Dialog open={!!selectedStockItem} onOpenChange={() => setSelectedStockItem(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle de Categoría</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Aquí se mostraría el detalle completo de la categoría seleccionada, incluyendo lotes, fecha de entrada,
              edad promedio, etc.
            </p>
            <p className="text-sm text-gray-400 mt-2">ID: {selectedStockItem}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para detalles de Movimiento */}
      <Dialog open={!!selectedMovimiento} onOpenChange={() => setSelectedMovimiento(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle de Movimiento</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-500">
              Aquí se mostraría el detalle completo del movimiento seleccionado, incluyendo imagen adjunta, notas,
              usuario que cargó, etc.
            </p>
            <p className="text-sm text-gray-400 mt-2">ID: {selectedMovimiento}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
