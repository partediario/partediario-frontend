"use client"

import { useState, useEffect, useMemo } from "react"
import { useEstablishment } from "@/contexts/establishment-context"

interface MovimientoInsumo {
  movimiento_insumo_id: number
  cantidad: number
  precio: number | null
  fecha: string
  hora: string
  nota: string | null
  tipo_movimiento_insumo_id: number
  tipo_movimiento_insumo_nombre: string
  tipo_movimiento: "ENTRADA" | "SALIDA"
  usuario: string
}

interface InsumoData {
  pd_id: number
  pd_tipo: string
  pd_nombre: string
  unidad_medida_nombre: string
  insumo_clase_id: number
  insumo_clase_nombre: string
  insumo_tipo_id: number
  insumo_tipo_nombre: string
  insumo_subtipo_id: number
  insumo_subtipo_nombre: string
  unidad_medida_producto_nombre: string
  unidad_medida_uso_nombre: string
  contenido: number
  stock_total: number
  stock_total_contenido: number
  establecimiento_id: number
  pd_detalles: {
    tipo_registro_principal: string
    movimientos_asociados: MovimientoInsumo[]
  }
}

const parsePdDetalles = (pdDetalles: any) => {
  try {
    if (typeof pdDetalles === 'string') {
      return JSON.parse(pdDetalles || '{"tipo_registro_principal":"","movimientos_asociados":[]}')
    }
    return pdDetalles || { tipo_registro_principal: "", movimientos_asociados: [] }
  } catch (error) {
    console.warn('[useInsumosData] Error parsing pd_detalles:', error)
    return { tipo_registro_principal: "", movimientos_asociados: [] }
  }
}

export function useInsumosData(claseInsumoId?: number, insumoId?: number) {
  const { establecimientoSeleccionado } = useEstablishment()
  const [data, setData] = useState<InsumoData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allData, setAllData] = useState<InsumoData[]>([])

  useEffect(() => {
    if (!establecimientoSeleccionado) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          establecimiento_id: establecimientoSeleccionado,
        })

        if (claseInsumoId) {
          params.append("insumo_clase_id", claseInsumoId.toString())
        }

        if (insumoId) {
          params.append("insumo_id", insumoId.toString())
        }

        const response = await fetch(`/api/pd-movimientos-insumos-view?${params}`)

        if (!response.ok) {
          throw new Error("Error al cargar datos de insumos")
        }

        const result = await response.json()
        
        const parsedData = result.map((item: any) => ({
          ...item,
          pd_detalles: parsePdDetalles(item.pd_detalles)
        }))
        
        setData(parsedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [establecimientoSeleccionado, claseInsumoId, insumoId])

  useEffect(() => {
    if (!establecimientoSeleccionado) return

    const fetchAllData = async () => {
      try {
        const params = new URLSearchParams({
          establecimiento_id: establecimientoSeleccionado,
        })

        const response = await fetch(`/api/pd-movimientos-insumos-view?${params}`)

        if (!response.ok) {
          throw new Error("Error al cargar todos los datos de insumos")
        }

        const result = await response.json()
        
        const parsedData = result.map((item: any) => ({
          ...item,
          pd_detalles: parsePdDetalles(item.pd_detalles)
        }))
        
        setAllData(parsedData)
      } catch (err) {
        console.error("Error fetching all data:", err)
      }
    }

    fetchAllData()
  }, [establecimientoSeleccionado])

  const top3InsumosMes = useMemo(() => {
    const mesActual = new Date().getMonth() + 1
    const añoActual = new Date().getFullYear()

    const consumoPorInsumo = new Map<
      number,
      {
        pd_id: number
        pd_nombre: string
        insumo_clase_id: number
        total_usado: number
        unidad_medida: string
      }
    >()

    if (!allData || !Array.isArray(allData)) {
      return []
    }

    allData.forEach((insumo) => {
      if (!insumo?.pd_detalles?.movimientos_asociados || !Array.isArray(insumo.pd_detalles.movimientos_asociados)) {
        return
      }

      const movimientosDelMes = insumo.pd_detalles.movimientos_asociados.filter((mov) => {
        const fechaMov = new Date(mov.fecha)
        return (
          fechaMov.getMonth() + 1 === mesActual &&
          fechaMov.getFullYear() === añoActual &&
          mov.tipo_movimiento === "SALIDA"
        )
      })

      if (movimientosDelMes.length > 0) {
        const totalUsado = movimientosDelMes.reduce((sum, mov) => sum + mov.cantidad, 0)

        if (totalUsado > 0) {
          consumoPorInsumo.set(insumo.pd_id, {
            pd_id: insumo.pd_id,
            pd_nombre: insumo.pd_nombre,
            insumo_clase_id: insumo.insumo_clase_id,
            total_usado: totalUsado,
            unidad_medida: insumo.unidad_medida_nombre,
          })
        }
      }
    })

    return Array.from(consumoPorInsumo.values())
      .sort((a, b) => b.total_usado - a.total_usado)
      .slice(0, 3)
  }, [allData])

  return {
    data,
    loading,
    error,
    top3InsumosMes,
  }
}
