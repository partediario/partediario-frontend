"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { ParteDiario } from "@/lib/types"
import { fetchPartesDiarios } from "@/lib/api"
import { TrendingUp, TrendingDown, Activity, Cloud } from "lucide-react"

interface StatsCardsProps {
  establecimientoId?: string
}

export default function StatsCards({ establecimientoId }: StatsCardsProps) {
  const [stats, setStats] = useState({
    entradas: 0,
    salidas: 0,
    actividades: 0,
    clima: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!establecimientoId) {
        setStats({ entradas: 0, salidas: 0, actividades: 0, clima: 0 })
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const partes = await fetchPartesDiarios({ establecimientoId })
        
        const entradas = partes.filter(p => p.pd_tipo === "ENTRADA").length
        const salidas = partes.filter(p => p.pd_tipo === "SALIDA").length
        const actividades = partes.filter(p => p.pd_tipo === "ACTIVIDAD").length
        const clima = partes.filter(p => p.pd_tipo === "CLIMA").length

        setStats({ entradas, salidas, actividades, clima })
      } catch (error) {
        console.error("Error cargando estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()

    const handleReload = () => {
      loadStats()
    }

    window.addEventListener("reloadPartesDiarios", handleReload)
    return () => window.removeEventListener("reloadPartesDiarios", handleReload)
  }, [establecimientoId])

  if (!establecimientoId) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-green-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-green-600 mb-1">
            {loading ? "..." : stats.entradas}
          </div>
          <div className="text-sm text-gray-600 font-medium">Entradas</div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-red-50 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-red-600 mb-1">
            {loading ? "..." : stats.salidas}
          </div>
          <div className="text-sm text-gray-600 font-medium">Salidas</div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-purple-50 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-purple-600 mb-1">
            {loading ? "..." : stats.actividades}
          </div>
          <div className="text-sm text-gray-600 font-medium">Actividades</div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-blue-50 rounded-full">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {loading ? "..." : stats.clima}
          </div>
          <div className="text-sm text-gray-600 font-medium">Clima</div>
        </CardContent>
      </Card>
    </div>
  )
}
