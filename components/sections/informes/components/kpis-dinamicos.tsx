"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KpisDinamicosProps {
  establecimientoId: string | null
}

interface KpiData {
  nacimientos: number
  compras: number
  ventas: number
  lluviaTotal: number
  anhoLluvia: string
}

export default function KpisDinamicos({ establecimientoId }: KpisDinamicosProps) {
  const [kpis, setKpis] = useState<KpiData>({
    nacimientos: 0,
    compras: 0,
    ventas: 0,
    lluviaTotal: 0,
    anhoLluvia: new Date().getFullYear().toString(),
  })
  const [loading, setLoading] = useState(false)

  const cargarKpis = async () => {
    if (!establecimientoId) {
      console.log("⚠️ No hay establecimiento seleccionado")
      return
    }

    setLoading(true)
    console.log(`🔄 Cargando KPIs para establecimiento: ${establecimientoId}`)

    try {
      // Cargar todos los KPIs en paralelo
      const [nacimientosRes, comprasRes, ventasRes, lluviaRes] = await Promise.all([
        fetch(`/api/kpis/nacimientos?establecimiento_id=${establecimientoId}`),
        fetch(`/api/kpis/compras?establecimiento_id=${establecimientoId}`),
        fetch(`/api/kpis/ventas?establecimiento_id=${establecimientoId}`),
        fetch(`/api/kpis/lluvia-total?establecimiento_id=${establecimientoId}`),
      ])

      const [nacimientosData, comprasData, ventasData, lluviaData] = await Promise.all([
        nacimientosRes.json(),
        comprasRes.json(),
        ventasRes.json(),
        lluviaRes.json(),
      ])

      console.log("📊 KPIs cargados:", {
        nacimientos: nacimientosData,
        compras: comprasData,
        ventas: ventasData,
        lluvia: lluviaData,
      })

      setKpis({
        nacimientos: nacimientosData.total || 0,
        compras: comprasData.total || 0,
        ventas: ventasData.total || 0,
        lluviaTotal: lluviaData.total || 0,
        anhoLluvia: lluviaData.anho || new Date().getFullYear().toString(),
      })
    } catch (error) {
      console.error("❌ Error cargando KPIs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarKpis()
  }, [establecimientoId])

  useEffect(() => {
    // Escuchar evento de recarga de KPIs
    const handleReloadKpis = () => {
      console.log("🔄 Evento reloadKpis recibido, recargando KPIs...")
      cargarKpis()
    }

    window.addEventListener("reloadKpis", handleReloadKpis as EventListener)

    return () => {
      window.removeEventListener("reloadKpis", handleReloadKpis as EventListener)
    }
  }, [establecimientoId])

  const formatearNumero = (numero: number) => {
    return numero.toLocaleString("es-ES")
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-50">
            <CardContent className="p-6 text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Nacimientos */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{formatearNumero(kpis.nacimientos)}</div>
          <div className="text-sm text-gray-600 font-medium">Nacimientos</div>
        </CardContent>
      </Card>

      {/* Compras */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{formatearNumero(kpis.compras)}</div>
          <div className="text-sm text-gray-600 font-medium">Compra</div>
        </CardContent>
      </Card>

      {/* Ventas */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{formatearNumero(kpis.ventas)}</div>
          <div className="text-sm text-gray-600 font-medium">Venta</div>
        </CardContent>
      </Card>

      {/* Lluvia Total */}
      <Card className="bg-gray-50">
        <CardContent className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">{formatearNumero(kpis.lluviaTotal)} mm</div>
          <div className="text-sm text-gray-600 font-medium">Lluvia Total {kpis.anhoLluvia}</div>
        </CardContent>
      </Card>
    </div>
  )
}
