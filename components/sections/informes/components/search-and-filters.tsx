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
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Campo de búsqueda */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por descripción, nota o usuario..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Filtro por tipo */}
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-10">
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
        className="w-full sm:w-[250px]"
      />

      {/* Botón de recarga */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-10 w-10 bg-transparent"
      >
        <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
