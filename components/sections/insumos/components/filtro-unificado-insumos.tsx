"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Datos de ejemplo para los filtros
const tiposInsumos = {
  combustibles: {
    emoji: "⛽",
    nombre: "Combustibles",
    subtipos: [
      { id: "gasoil", nombre: "Gasoil", emoji: "🛢️" },
      { id: "nafta", nombre: "Nafta", emoji: "⛽" },
      { id: "diesel", nombre: "Diesel", emoji: "🚛" },
    ],
  },
  lubricantes: {
    emoji: "🛢️",
    nombre: "Lubricantes",
    subtipos: [
      { id: "motor-15w40", nombre: "Motor 15W40", emoji: "🔧" },
      { id: "hidraulico", nombre: "Hidráulico", emoji: "⚙️" },
      { id: "transmision", nombre: "Transmisión", emoji: "🔩" },
    ],
  },
  balanceados: {
    emoji: "🌾",
    nombre: "Balanceados",
    subtipos: [
      { id: "terneros", nombre: "Terneros", emoji: "🐄" },
      { id: "vacas", nombre: "Vacas", emoji: "🐮" },
      { id: "toros", nombre: "Toros", emoji: "🐂" },
    ],
  },
  sales: {
    emoji: "🧂",
    nombre: "Sales",
    subtipos: [
      { id: "sal-comun", nombre: "Sal Común", emoji: "🧂" },
      { id: "sal-mineral", nombre: "Sal Mineral", emoji: "💎" },
      { id: "sal-proteica", nombre: "Sal Proteica", emoji: "🥩" },
    ],
  },
}

interface FiltroUnificadoInsumosProps {
  categoria: string
  onSelectionChange: (selection: any) => void
  placeholder?: string
  className?: string
}

export function FiltroUnificadoInsumos({
  categoria,
  onSelectionChange,
  placeholder = "Buscar tipo de insumo...",
  className,
}: FiltroUnificadoInsumosProps) {
  const [value, setValue] = React.useState("")

  // Obtener tipos relevantes para la categoría
  const tiposRelevantes = React.useMemo(() => {
    if (categoria === "combustibles") {
      return [tiposInsumos.combustibles, tiposInsumos.lubricantes]
    } else if (categoria === "balanceados") {
      return [tiposInsumos.balanceados, tiposInsumos.sales]
    }
    return Object.values(tiposInsumos)
  }, [categoria])

  const handleSelect = (currentValue: string) => {
    setValue(currentValue)

    // Encontrar el item seleccionado
    let selectedItem = null
    for (const tipo of tiposRelevantes) {
      const subtipo = tipo.subtipos.find((sub) => sub.id === currentValue)
      if (subtipo) {
        selectedItem = {
          tipo: tipo.nombre,
          subtipo: subtipo.nombre,
          emoji: subtipo.emoji,
          id: currentValue,
        }
        break
      }
    }

    onSelectionChange(selectedItem)
  }

  const getSelectedLabel = () => {
    if (!value) return placeholder

    for (const tipo of tiposRelevantes) {
      const subtipo = tipo.subtipos.find((sub) => sub.id === value)
      if (subtipo) {
        return `${subtipo.emoji} ${subtipo.nombre}`
      }
    }
    return placeholder
  }

  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>{value ? getSelectedLabel() : placeholder}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {tiposRelevantes.map((tipo) => (
          <SelectGroup key={tipo.nombre}>
            <SelectLabel className="text-xs font-semibold">
              {tipo.emoji} {tipo.nombre}
            </SelectLabel>
            {tipo.subtipos.map((subtipo) => (
              <SelectItem key={subtipo.id} value={subtipo.id}>
                <span className="mr-2">{subtipo.emoji}</span>
                {subtipo.nombre}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
