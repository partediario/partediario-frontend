"use client"

import { useState } from "react"
import { GestionInsumoEspecifico } from "./gestion-insumo-especifico"
import { categoriasConfig } from "@/lib/data"

export default function InsumosDashboard() {
  const [categoriaActiva, setCategoriaActiva] = useState("combustibles")

  const handleCategoriaChange = (nuevaCategoria: string) => {
    setCategoriaActiva(nuevaCategoria)
  }

  const categoriaConfig = categoriasConfig[categoriaActiva as keyof typeof categoriasConfig]

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock de Insumos</h2>
          <p className="text-gray-600">Gestión completa de inventario agropecuario</p>
        </div>
      </div>

      {/* Componente principal */}
      <GestionInsumoEspecifico
        categoria={categoriaActiva}
        categoriaNombre={categoriaConfig?.nombre || "Categoría"}
        categoriaEmoji={categoriaConfig?.emoji || "📦"}
        onCategoriaChange={handleCategoriaChange}
      />
    </div>
  )
}
