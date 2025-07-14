"use client"

import { useState, useEffect } from "react"
import { useEstablishment } from "@/contexts/establishment-context"

interface ClimaData {
  lluvia_mes_actual: number
  mes_actual_nombre: string
  lluvia_anho_total: number
  periodo_anho: string
}

export function useClimaData() {
  const [climaData, setClimaData] = useState<ClimaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { establecimientoSeleccionado } = useEstablishment()

  useEffect(() => {
    async function fetchClimaData() {
      console.log("🌤️ useClimaData - establecimiento:", establecimientoSeleccionado)

      if (!establecimientoSeleccionado) {
        console.log("⚠️ No hay establecimiento seleccionado para clima")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log("🌤️ Fetching clima data para establecimiento:", establecimientoSeleccionado)

        // Obtener fecha actual
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1

        // Fetch lluvia mes actual
        const responseMes = await fetch(
          `/api/clima/lluvia-mes-actual?establecimiento_id=${establecimientoSeleccionado}&anho=${currentYear}&mes=${currentMonth}`,
        )

        console.log("📡 Response mes status:", responseMes.status)

        let dataMes = null
        if (responseMes.ok) {
          dataMes = await responseMes.json()
          console.log("📊 Data mes recibida:", dataMes)
        }

        // Fetch lluvia año total
        const responseAnho = await fetch(
          `/api/clima/lluvia-anho-total?establecimiento_id=${establecimientoSeleccionado}&anho=${currentYear}`,
        )

        console.log("📡 Response año status:", responseAnho.status)

        let dataAnho = null
        if (responseAnho.ok) {
          dataAnho = await responseAnho.json()
          console.log("📊 Data año recibida:", dataAnho)
        }

        setClimaData({
          lluvia_mes_actual: dataMes?.data?.total_lluvia_mes || 0,
          mes_actual_nombre: dataMes?.data?.nombre_mes || "Mes actual",
          lluvia_anho_total: dataAnho?.data?.total_lluvia_anho || 0,
          periodo_anho: `Enero - ${new Date().toLocaleDateString("es-ES", { month: "long" })}`,
        })
      } catch (err) {
        console.error("❌ Error fetching clima data:", err)
        setError(err instanceof Error ? err.message : "Error al cargar datos del clima")
      } finally {
        setLoading(false)
      }
    }

    fetchClimaData()
  }, [establecimientoSeleccionado])

  return {
    climaData,
    loading,
    error,
    // Mantener compatibilidad con el código anterior
    lluviaMesActual: climaData
      ? {
          total_lluvia_mes: climaData.lluvia_mes_actual,
          nombre_mes: climaData.mes_actual_nombre,
        }
      : null,
    lluviaAnhoTotal: climaData
      ? {
          total_lluvia_anho: climaData.lluvia_anho_total,
        }
      : null,
  }
}
