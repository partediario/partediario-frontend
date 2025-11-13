"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RotateCcw, Search, Filter, ChevronDown } from "lucide-react"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
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
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)

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
    if (searchTerm.trim()) count++
    if (selectedType !== "todos") count++
    if (selectedDate) count++
    return count
  }

  const filtrosActivos = contarFiltrosActivos()

  return (
    <>
      <div className="flex gap-2 mb-6">
        {/* Versión móvil: Botón Filtros con Drawer */}
        <div className="md:hidden flex-1">
          <Button
            variant="outline"
            className={`w-full flex items-center justify-center gap-2 h-10 ${
              filtrosActivos > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : ""
            }`}
            onClick={() => setShowFilterDrawer(true)}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {filtrosActivos > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                {filtrosActivos}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>

          <Drawer open={showFilterDrawer} onOpenChange={setShowFilterDrawer}>
            <DrawerContent size="narrow">
              <DrawerHeader className="relative">
                <DrawerTitle>Filtros Combinados</DrawerTitle>
                <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span className="sr-only">Cerrar</span>
                </DrawerClose>
              </DrawerHeader>
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Búsqueda */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Búsqueda</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tipo de Movimiento</label>
                  <Select value={selectedType} onValueChange={onTypeChange}>
                    <SelectTrigger className="w-full h-10">
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
                </div>

                {/* Fecha */}
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
            </DrawerContent>
          </Drawer>
        </div>

        {/* Versión desktop: Filtros expandidos (ocultos en móvil) */}
        <div className="hidden md:flex md:flex-row gap-4 flex-1">
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
            <SelectTrigger className="w-[180px] h-10">
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
            className="w-[250px]"
          />
        </div>

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
    </>
  )
}
