"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const [open, setOpen] = React.useState(false)
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
    setValue(currentValue === value ? "" : currentValue)
    setOpen(false)

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          {getSelectedLabel()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar tipo..." />
          <CommandList>
            <CommandEmpty>No se encontraron tipos.</CommandEmpty>
            {tiposRelevantes.map((tipo) => (
              <CommandGroup key={tipo.nombre} heading={`${tipo.emoji} ${tipo.nombre}`}>
                {tipo.subtipos.map((subtipo) => (
                  <CommandItem key={subtipo.id} value={subtipo.id} onSelect={handleSelect}>
                    <Check className={cn("mr-2 h-4 w-4", value === subtipo.id ? "opacity-100" : "opacity-0")} />
                    <span className="mr-2">{subtipo.emoji}</span>
                    {subtipo.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
