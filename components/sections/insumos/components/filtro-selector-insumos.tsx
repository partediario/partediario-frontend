"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Insumo {
  id: string
  tipo: string
  nombre: string
  clase?: string
  tipoNombre?: string
  subtipoNombre?: string
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
  placeholder = "Buscar o seleccionar insumo…",
  className,
  selectedInsumoId,
}: FiltroSelectorInsumosProps) {
  const [open, setOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [searchValue, setSearchValue] = useState("")

  const insumosAgrupados = insumos.reduce((grupos, insumo) => {
    const groupKey = insumo.subtipoNombre || insumo.tipoNombre || "Sin subtipo"
    if (!grupos[groupKey]) grupos[groupKey] = []
    grupos[groupKey].push(insumo)
    return grupos
  }, {} as Record<string, Insumo[]>)

  useEffect(() => {
    if (selectedInsumoId) {
      const insumo = insumos.find((i) => Number.parseInt(i.id) === selectedInsumoId)
      if (insumo) setSelectedInsumo(insumo)
    } else {
      setSelectedInsumo(null)
    }
  }, [selectedInsumoId, insumos])

  const handleSelect = (insumoId: string) => {
    const insumo = insumos.find((i) => i.id === insumoId)
    if (insumo) {
      setSelectedInsumo(insumo)
      onSelectionChange(insumo)
      setOpen(false)
      setSearchValue("")
    }
  }

  const handleClear = (e?: React.SyntheticEvent) => {
    // ya prevenimos el pointerdown, pero por si acaso:
    e?.preventDefault?.()
    e?.stopPropagation?.()
    setSelectedInsumo(null)
    onSelectionChange(null)
    setSearchValue("")
    setOpen(false) // evita reabrir o quedar abierto
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal bg-transparent relative pr-10"
          >
            {selectedInsumo ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="font-medium truncate text-sm">
                    {selectedInsumo.subtipoNombre || selectedInsumo.tipoNombre}
                  </span>
                  <span className="text-xs text-gray-500 truncate">{selectedInsumo.nombre}</span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}

            {/* ❌ dentro del trigger, a la izquierda del chevron */}
            {selectedInsumo && (
              <button
                type="button"
                // Bloquea la apertura del Popover en pointerdown del trigger
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear(e)
                }}
                onKeyDown={(e) => {
                  // por accesibilidad: evitar que Enter/Espacio activen el trigger
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClear(e)
                  }
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4
                           text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-200
                           flex items-center justify-center z-10 transition-all duration-150"
                aria-label="Borrar selección"
                title="Borrar selección"
                tabIndex={0}
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Chevron colocado de forma absoluta para no moverse */}
            <ChevronDown className="absolute right-2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-10"
            />
            <CommandList>
              <CommandEmpty>No se encontraron insumos.</CommandEmpty>
              {Object.entries(insumosAgrupados)
                .filter(([subtipo, insumosDelSubtipo]) => {
                  if (!searchValue) return true
                  const searchLower = searchValue.toLowerCase()
                  return (
                    subtipo.toLowerCase().includes(searchLower) ||
                    insumosDelSubtipo.some((insumo) => insumo.nombre.toLowerCase().includes(searchLower))
                  )
                })
                .map(([subtipo, insumosDelSubtipo]) => {
                  const filteredInsumos = insumosDelSubtipo.filter((insumo) => {
                    if (!searchValue) return true
                    return insumo.nombre.toLowerCase().includes(searchValue.toLowerCase())
                  })
                  if (filteredInsumos.length === 0) return null

                  return (
                    <CommandGroup key={subtipo} heading={subtipo}>
                      {filteredInsumos.map((insumo) => (
                        <CommandItem
                          key={insumo.id}
                          value={insumo.id}
                          onSelect={() => handleSelect(insumo.id)}
                          className="pl-6 cursor-pointer hover:bg-[#F3F4F6]"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedInsumo?.id === insumo.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="text-sm">{insumo.nombre}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
