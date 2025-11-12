"use client"

import { useQuery } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
  cantidad: number
  sexo?: string
  edad?: string
}

export function useCategoriasQuery(loteId: string | null) {
  return useQuery<CategoriaExistente[], Error>({
    queryKey: ["categorias-existentes", loteId],
    queryFn: async () => {
      if (!loteId) throw new Error("No lote ID")

      const response = await fetch(`/api/categorias-animales-existentes?lote_id=${loteId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return (data.categorias || []) as CategoriaExistente[]
    },
    enabled: !!loteId,
    staleTime: 5 * 60 * 1000,
  })
}
