"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Search } from "lucide-react"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import type { SearchAndFiltersProps as Props } from "@/types"

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedType,
  onTypeChange,
  onRefresh,
  isLoading = false,
}: Props) {
  /* Opciones de tipo con texto formateado en Título */
  const tiposOptions = [
    { value: "todos", label: "Todos los tipos" },
    { value: "ENTRADA", label: "Entrada" },
    { value: "SALIDA", label: "Salida" },
    { value: "CLIMA", label: "Clima" },
    { value: "ACTIVIDAD", label: "Actividad" },
    { value: "RECLASIFICACION", label: "Reclasificación" },
    { value: "INSUMOS", label: "Insumos" },
    { value: "TRASLADO", label: "Traslado" }, // Added TRASLADO filter option for daily reports
    { value: "RELOTEO", label: "Reloteo" }, // Added RELOTEO filter option for daily reports
  ]

  return (
    <div className="space-y-3">
      {/* Campo de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por descripción, nota o usuario..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-gray-50 border-gray-200"
        />
      </div>

      {/* Filtros en fila */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Filtro por tipo */}
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:flex-1 h-11 bg-gray-50 border-gray-200">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            {tiposOptions.map((tipo) => (
              <SelectItem key={tipo.value} value={tipo.value}>
                {tipo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selector de fecha */}
        <CustomDatePicker
          date={selectedDate}
          onDateChange={onDateChange}
          placeholder="Seleccionar fecha"
          className="w-full sm:flex-1"
        />

        {/* Botón de recarga */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-11 w-11 shrink-0 bg-gray-50 border-gray-200 hover:bg-gray-100"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  )
}
