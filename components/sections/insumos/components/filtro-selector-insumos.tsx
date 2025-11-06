"use client"

import { useState } from "react"

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Insumo {
  id: string
  tipo: string
  nombre: string
}

interface FiltroSelectorInsumosProps {
  insumos: Insumo[]
  onSelectionChange: (insumo: Insumo | null) => void
  placeholder?: string
  className?: string
  selectedInsumoId?: number
}

export function FiltroSelectorInsumos({
  insumos,
  onSelectionChange,
  placeholder = "Filtrar insumo...",
  className,
  selectedInsumoId,
}: FiltroSelectorInsumosProps) {
  const [open, setOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)

  // Agrupar insumos por tipo
  const insumosAgrupados = insumos.reduce(
    (grupos, insumo) => {
      if (!grupos[insumo.tipo]) {
        grupos[insumo.tipo] = []
      }
      grupos[insumo.tipo].push(insumo)
      return grupos
    },
    {} as Record<string, Insumo[]>,
  )

  useEffect(() => {
    if (selectedInsumoId) {
      const insumo = insumos.find((i) => Number.parseInt(i.id) === selectedInsumoId)
      if (insumo) {
        setSelectedInsumo(insumo)
      }
    } else {
      setSelectedInsumo(null)
    }
  }, [selectedInsumoId, insumos])

  const handleSelect = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setOpen(false)
    onSelectionChange(insumo)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedInsumo(null)
    onSelectionChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          {selectedInsumo ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="secondary" className="text-xs">
                {selectedInsumo.tipo}
              </Badge>
              <span className="truncate">{selectedInsumo.nombre}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2">
            {selectedInsumo && (
              <button
                type="button"
                onClick={handleClear}
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 rounded-sm hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar insumo..." />
          <CommandList>
            <CommandEmpty>No se encontraron insumos.</CommandEmpty>
            {Object.entries(insumosAgrupados).map(([tipo, insumosDelTipo]) => (
              <CommandGroup key={tipo} heading={tipo}>
                {insumosDelTipo.map((insumo) => (
                  <CommandItem
                    key={insumo.id}
                    value={`${insumo.tipo} ${insumo.nombre}`}
                    onSelect={() => handleSelect(insumo)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedInsumo?.id === insumo.id ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="text-xs">
                        {insumo.tipo}
                      </Badge>
                      <span>{insumo.nombre}</span>
                    </div>
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
