"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, Info, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

interface SmartDateRangeSelectorProps {
  onRangeChange: (desde: Date | undefined, hasta: Date | undefined, periodo: string) => void
  className?: string
}

const mesesAbreviados = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const mesesCompletos = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export function SmartDateRangeSelector({ onRangeChange, className = "" }: SmartDateRangeSelectorProps) {
  const [periodo, setPeriodo] = useState<string>("all")
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined)
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined)
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const formatearRangoInteligente = (desde: Date | undefined, hasta: Date | undefined): string => {
    if (!desde || !hasta) {
      return "Seleccionar rango"
    }

    const inicioMes = desde.getDate() === 1
    const finMes = hasta.getDate() === new Date(hasta.getFullYear(), hasta.getMonth() + 1, 0).getDate()

    const mismoMes = desde.getMonth() === hasta.getMonth() && desde.getFullYear() === hasta.getFullYear()
    const mismoAño = desde.getFullYear() === hasta.getFullYear()

    // Full calendar year
    if (inicioMes && finMes && desde.getMonth() === 0 && hasta.getMonth() === 11 && mismoAño) {
      return `${desde.getFullYear()}`
    }

    // Multiple full calendar years
    if (inicioMes && finMes && desde.getMonth() === 0 && hasta.getMonth() === 11 && !mismoAño) {
      const diffYears = hasta.getFullYear() - desde.getFullYear()
      if (diffYears > 1) {
        return `${desde.getFullYear()} – ${hasta.getFullYear()}`
      }
    }

    // Full month
    if (inicioMes && finMes && mismoMes) {
      return `${mesesCompletos[desde.getMonth()]} ${desde.getFullYear()}`
    }

    // Multiple full months
    if (inicioMes && finMes && !mismoMes) {
      const diffMonths = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth())

      if (diffMonths > 12) {
        // More than 12 months
        return `${mesesAbreviados[desde.getMonth()]} ${desde.getFullYear()} – ${mesesAbreviados[hasta.getMonth()]} ${hasta.getFullYear()}`
      } else if (mismoAño) {
        // Multiple full months in same year
        return `${mesesAbreviados[desde.getMonth()]} – ${mesesAbreviados[hasta.getMonth()]} ${desde.getFullYear()}`
      } else {
        // Multiple full months across years
        return `${mesesAbreviados[desde.getMonth()]} ${desde.getFullYear()} – ${mesesAbreviados[hasta.getMonth()]} ${hasta.getFullYear()}`
      }
    }

    // Partial month (same month)
    if (mismoMes) {
      return `${desde.getDate().toString().padStart(2, "0")}–${hasta.getDate().toString().padStart(2, "0")} ${mesesAbreviados[desde.getMonth()]} ${desde.getFullYear()}`
    }

    // Partial multi-month range
    if (mismoAño) {
      return `${desde.getDate()} ${mesesAbreviados[desde.getMonth()]} – ${hasta.getDate()} ${mesesAbreviados[hasta.getMonth()]} ${desde.getFullYear()}`
    } else {
      return `${desde.getDate()} ${mesesAbreviados[desde.getMonth()]} ${desde.getFullYear()} – ${hasta.getDate()} ${mesesAbreviados[hasta.getMonth()]} ${hasta.getFullYear()}`
    }
  }

  const formatearTooltip = (desde: Date | undefined, hasta: Date | undefined): string => {
    if (!desde || !hasta) {
      return ""
    }
    const formatearFecha = (fecha: Date) => {
      return `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()}`
    }
    return `Del ${formatearFecha(desde)} al ${formatearFecha(hasta)}`
  }

  const handlePeriodoChange = (value: string) => {
    if (value === "custom") {
      setPeriodo(value)
      setMostrarDatePicker(true)
    } else {
      setPeriodo(value)
      setMostrarDatePicker(false)
    }
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (periodo === "custom") {
      e.preventDefault()
      e.stopPropagation()
      setMostrarDatePicker(true)
    }
  }

  const handleClearFilter = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsClearing(true)

    setTimeout(() => {
      setPeriodo("all")
      setFechaDesde(undefined)
      setFechaHasta(undefined)
      setMostrarDatePicker(false)

      onRangeChange(undefined, undefined, "all")

      setIsClearing(false)
    }, 150)
  }

  useEffect(() => {
    if (periodo !== "all" && periodo !== "custom") {
      const now = new Date()
      const desde = new Date()
      const hasta = new Date()

      switch (periodo) {
        case "week":
          desde.setDate(now.getDate() - 7)
          break
        case "month":
          desde.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          desde.setMonth(now.getMonth() - 3)
          break
        case "year":
          desde.setFullYear(now.getFullYear() - 1)
          break
      }

      setFechaDesde(desde)
      setFechaHasta(hasta)
      onRangeChange(desde, hasta, periodo)
      setMostrarDatePicker(false)
    } else if (periodo === "all") {
      setFechaDesde(undefined)
      setFechaHasta(undefined)
      onRangeChange(undefined, undefined, periodo)
      setMostrarDatePicker(false)
    }
  }, [periodo])

  useEffect(() => {
    if (fechaDesde && fechaHasta && periodo === "custom") {
      onRangeChange(fechaDesde, fechaHasta, "custom")
    }
  }, [fechaDesde, fechaHasta])

  const displayValue = periodo === "all" ? "Seleccionar período…" : formatearRangoInteligente(fechaDesde, fechaHasta)
  const hasActiveFilter = periodo !== "all"

  return (
    <div className={`flex-1 min-w-[240px] max-w-[320px] ${className}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm font-medium text-gray-700">📅 Período</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-[#6B7280] cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-[#1F2937] text-white max-w-[280px] rounded-lg">
              <p className="text-xs">
                Los filtros de fecha afectan únicamente el detalle de movimientos e insumos. El resumen de stock actual
                no se filtra por fecha.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Popover open={mostrarDatePicker} onOpenChange={setMostrarDatePicker}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Select value={periodo} onValueChange={handlePeriodoChange}>
              <SelectTrigger
                className="h-9 bg-white border-[#E5E7EB] rounded-md transition-all duration-200"
                onClick={handleTriggerClick}
              >
                <div className="flex items-center gap-2 w-full">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span
                    className={`text-[13px] font-semibold text-[#111827] flex-1 text-left transition-opacity duration-150 ${
                      isClearing ? "opacity-0" : "opacity-100"
                    }`}
                    title={formatearTooltip(fechaDesde, fechaHasta)}
                  >
                    {displayValue}
                  </span>
                  {hasActiveFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilter}
                      className={`h-5 w-5 p-0 hover:bg-gray-200 rounded-full ml-auto transition-all duration-150 ${
                        isClearing ? "opacity-0 scale-90" : "opacity-100 scale-100"
                      }`}
                      title="Limpiar filtro de período"
                    >
                      <X className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-[#4B5563]" />
                    </Button>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
                <SelectItem value="custom">Personalizado…</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverTrigger>
        {periodo === "custom" && (
          <PopoverContent className="w-auto p-4 animate-in fade-in-0 duration-250" align="start">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Desde</label>
                <CustomDatePicker
                  date={fechaDesde}
                  onDateChange={setFechaDesde}
                  placeholder="Fecha desde"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Hasta</label>
                <CustomDatePicker
                  date={fechaHasta}
                  onDateChange={setFechaHasta}
                  placeholder="Fecha hasta"
                  className="w-full"
                />
              </div>
            </div>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}
