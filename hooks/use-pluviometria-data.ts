"use client"

import { useState, useEffect } from "react"
import { useEstablishment } from "@/contexts/establishment-context"

interface PluviometriaAnualData {
  empresa_id: number
  establecimiento_id: number
  anho: number
  mes: number
  nombre_mes: string
  dia: number
  total_caidos: number
  unidad_medida: string
}

interface PluviometriaMensualData {
  empresa_id: number
  establecimiento_id: number
  anho: number
  mes: number
  nombre_mes: string
  total_lluvia_mes: number
  unidad_medida: string
}

export function usePluviometriaData(year: number) {
  const [datosAnuales, setDatosAnuales] = useState<PluviometriaAnualData[]>([])
  const [datosMensuales, setDatosMensuales] = useState<PluviometriaMensualData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { establecimientoSeleccionado } = useEstablishment()

  useEffect(() => {
    async function fetchPluviometriaData() {
      console.log("🌧️ usePluviometriaData - establecimiento:", establecimientoSeleccionado, "year:", year)

      if (!establecimientoSeleccionado) {
        console.log("⚠️ No hay establecimiento seleccionado para pluviometría")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log("🌧️ Fetching pluviometria data para:", {
          establecimiento: establecimientoSeleccionado,
          year,
        })

        // Fetch datos anuales (diarios)
        const responseAnual = await fetch(
          `/api/clima/pluviometria-anual?establecimiento_id=${establecimientoSeleccionado}&anho=${year}`,
        )

        console.log("📡 Response anual status:", responseAnual.status)

        if (!responseAnual.ok) {
          const errorText = await responseAnual.text()
          console.error("❌ Error response anual:", errorText)
          throw new Error(`Error ${responseAnual.status}: ${errorText}`)
        }

        const datosAnuales = await responseAnual.json()
        console.log("📊 Datos anuales recibidos:", datosAnuales)
        setDatosAnuales(datosAnuales.pluviometria_anual || [])

        // Fetch datos mensuales (totales)
        const responseMensual = await fetch(
          `/api/clima/pluviometria-mensual-total?establecimiento_id=${establecimientoSeleccionado}&anho=${year}`,
        )

        console.log("📡 Response mensual status:", responseMensual.status)

        if (!responseMensual.ok) {
          const errorText = await responseMensual.text()
          console.error("❌ Error response mensual:", errorText)
          throw new Error(`Error ${responseMensual.status}: ${errorText}`)
        }

        const datosMensuales = await responseMensual.json()
        console.log("📊 Datos mensuales recibidos:", datosMensuales)
        setDatosMensuales(datosMensuales.pluviometria_mensual || [])
      } catch (err) {
        console.error("❌ Error fetching pluviometria data:", err)
        setError(err instanceof Error ? err.message : "Error al cargar datos de pluviometría")
      } finally {
        setLoading(false)
      }
    }

    fetchPluviometriaData()
  }, [establecimientoSeleccionado, year])

  return {
    datosAnuales,
    datosMensuales,
    loading,
    error,
  }
}
