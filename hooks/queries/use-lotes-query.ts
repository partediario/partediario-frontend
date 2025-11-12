"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

interface Lote {
  id: number
  nombre: string
}

export function useLotesQuery(establecimientoId: number | null) {
  return useQuery<Lote[], Error>({
    queryKey: ["lotes", establecimientoId],
    queryFn: async () => {
      if (!establecimientoId) throw new Error("No establecimiento ID")

      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoId}`)
      if (!response.ok) throw new Error("Error al cargar lotes")

      const data = await response.json()
      return (data.lotes || []) as Lote[]
    },
    enabled: !!establecimientoId,
    staleTime: 5 * 60 * 1000,
  })
}
