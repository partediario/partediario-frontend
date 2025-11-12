"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

interface InsumoExistente {
  insumo_id: string
  insumo_nombre: string
  clase_insumo_nombre: string
  stock_actual: number
  unidad_medida_nombre: string
}

export function useInsumosQuery(establecimientoId: number | null, claseInsumoId?: number) {
  return useQuery<InsumoExistente[], Error>({
    queryKey: ["insumos-existentes", establecimientoId, claseInsumoId],
    queryFn: async () => {
      if (!establecimientoId) throw new Error("No establecimiento ID")

      let url = `/api/insumos-existentes?establecimiento_id=${establecimientoId}`
      if (claseInsumoId) {
        url += `&clase_insumo_id=${claseInsumoId}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Error al cargar insumos")

      const data = await response.json()
      return (data.insumos || []) as InsumoExistente[]
    },
    enabled: !!establecimientoId,
    staleTime: 5 * 60 * 1000,
  })
}
