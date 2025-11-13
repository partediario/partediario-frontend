"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Search, Filter, ChevronDown, X } from "lucide-react"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Badge } from "@/components/ui/badge"
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
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const tiposOptions = [
    { value: "todos", label: "Todos los tipos" },
    { value: "ENTRADA", label: "Entrada" },
    { value: "SALIDA", label: "Salida" },
    { value: "CLIMA", label: "Clima" },
    { value: "ACTIVIDAD", label: "Actividad" },
    { value: "RECLASIFICACION", label: "Reclasificación" },
    { value: "INSUMOS", label: "Insumos" },
    { value: "TRASLADO", label: "Traslado" },
    { value: "RELOTEO", label: "Reloteo" },
  ]

  const contarFiltrosActivos = () => {
    let count = 0
    if (selectedType !== "todos") count++
    if (selectedDate) count++
    return count
  }

  const filtrosActivos = contarFiltrosActivos()

  const limpiarFiltros = () => {
    onSearchChange("")
    onTypeChange("todos")
    onDateChange(undefined)
    setShowFilterMenu(false)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Campo de búsqueda - Siempre visible */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por descripción, nota o usuario..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Contenedor de botones Filtros y Recargar */}
        <div className="flex flex-row gap-3">
          {/* Botón Filtros - Visible en todos los breakpoints */}
          <div className="relative">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${filtrosActivos > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Filter className="w-4 h-4" />
              {filtrosActivos > 0 ? `${filtrosActivos} filtros activos` : "Filtros"}
              {filtrosActivos > 0 && (
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 text-xs">
                  {filtrosActivos}
                </Badge>
              )}
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showFilterMenu && (
              <>
                {/* Overlay para cerrar al hacer clic fuera */}
                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)} />
                
                {/* Menú de filtros */}
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-80">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filtros Combinados</h4>
                      {filtrosActivos > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={limpiarFiltros}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Limpiar todo
                        </Button>
                      )}
                    </div>

                    {/* Filtro por Tipo */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de Movimiento</label>
                      <Select value={selectedType} onValueChange={onTypeChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposOptions.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro por Fecha */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Fecha</label>
                      <CustomDatePicker
                        date={selectedDate}
                        onDateChange={onDateChange}
                        placeholder="Seleccionar fecha"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botón de recarga */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-transparent"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </>
  )
}
