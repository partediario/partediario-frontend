"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronDown, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PeriodoFilterProps {
  onPeriodChange: (period: string | null, range: { start: Date | null; end: Date | null }) => void
  className?: string
}

type PeriodOption = "week" | "month" | "quarter" | "semester" | "year" | "custom"

export function PeriodoFilter({ onPeriodChange, className }: PeriodoFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null)
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  })
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeField, setActiveField] = useState<"start" | "end" | null>(null)
  const [forceUpdateKey, setForceUpdateKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isCustom = selectedPeriod === "custom"
  const isCustomIncomplete =
    isCustom && ((customRange.start && !customRange.end) || (!customRange.start && customRange.end))
  // ✅ Mostrar alerta SOLO cuando el popover NO está abierto
  const showCustomWarning = isCustom && isCustomIncomplete && !isPickerOpen

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false)
        setActiveField(null)
      }
    }
    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside, true)
      return () => document.removeEventListener("mousedown", handleClickOutside, true)
    }
  }, [isPickerOpen])

  const calculateDateRange = (period: PeriodOption): { start: Date; end: Date } => {
    const now = new Date()
    const start = new Date()
    const end = new Date()
    switch (period) {
      case "week": start.setDate(now.getDate() - 7); break
      case "month": start.setMonth(now.getMonth() - 1); break
      case "quarter": start.setMonth(now.getMonth() - 3); break
      case "semester": start.setMonth(now.getMonth() - 6); break
      case "year": start.setFullYear(now.getFullYear() - 1); break
    }
    return { start, end }
  }

  const getShortMonth = (date: Date): string => {
    const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    return months[date.getMonth()]
  }

  const getDisplayText = (): string => {
    if (selectedPeriod === "custom" && (customRange.start || customRange.end)) {
      const s = customRange.start, e = customRange.end
      if (s && e) {
        const isFullYear =
          s.getDate() === 1 && s.getMonth() === 0 &&
          e.getDate() === 31 && e.getMonth() === 11 &&
          s.getFullYear() === e.getFullYear()
        if (isFullYear) return `${s.getFullYear()}`
        if (s.getFullYear() === e.getFullYear()) {
          const isStartFullMonth = s.getDate() === 1
          const isEndFullMonth = e.getDate() === new Date(e.getFullYear(), e.getMonth() + 1, 0).getDate()
          if (isStartFullMonth && isEndFullMonth) return `${getShortMonth(s)} – ${getShortMonth(e)} ${e.getFullYear()}`
          return `${s.getDate()} ${getShortMonth(s)} – ${e.getDate()} ${getShortMonth(e)} ${e.getFullYear()}`
        }
        return `${getShortMonth(s)} ${s.getFullYear()} – ${getShortMonth(e)} ${e.getFullYear()}`
      }
      if (s && !e) return `Desde ${format(s, "dd/MM/yyyy")}`
      if (!s && e) return `Hasta ${format(e, "dd/MM/yyyy")}`
      return "Personalizado"
    }

    const labels: Record<PeriodOption, string> = {
      week: "Última Semana",
      month: "Último Mes",
      quarter: "Último Trimestre",
      semester: "Último Semestre",
      year: "Último Año",
      custom: "Personalizado",
    }
    return labels[selectedPeriod as PeriodOption] ?? "Seleccionar período…"
  }

  const openCustomPickerPreserving = (opts?: { focus?: "start" | "end" | null }) => {
    setIsPickerOpen(true)
    setActiveField(opts?.focus ?? null)
  }

  const handlePeriodSelect = (value: string) => {
    const period = value as PeriodOption
    if (period === "custom") {
      setSelectedPeriod("custom")
      // 👉 misma lógica que funcionaba: abrimos nuestro picker (no el dropdown)
      if (!customRange.start || !customRange.end) {
        openCustomPickerPreserving({ focus: "start" })
      } else if (isCustomIncomplete) {
        openCustomPickerPreserving({ focus: customRange.start ? "end" : "start" })
      } else {
        openCustomPickerPreserving({ focus: null })
      }
    } else {
      setSelectedPeriod(period)
      setIsPickerOpen(false)
      setActiveField(null)
      const range = calculateDateRange(period)
      onPeriodChange(period, { start: range.start, end: range.end })
    }
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return
    if (activeField === "start") {
      setCustomRange(prev => ({ ...prev, start: date }))
      setActiveField("end")
    } else if (activeField === "end") {
      const newRange = { ...customRange, end: date }
      setCustomRange(newRange)
      if (newRange.start && newRange.end) {
        if (newRange.start > newRange.end) {
          const corrected = { start: newRange.end, end: newRange.start }
          setCustomRange(corrected)
          onPeriodChange("custom", corrected)
        } else {
          onPeriodChange("custom", newRange)
        }
        setIsPickerOpen(false)
        setActiveField(null)
      }
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setSelectedPeriod(null)
    setCustomRange({ start: null, end: null })
    setIsPickerOpen(false)
    setActiveField(null)
    setForceUpdateKey(prev => prev + 1)
    onPeriodChange(null, { start: null, end: null })
  }

  const handleClearStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomRange({ ...customRange, start: null })
  }
  const handleClearEnd = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomRange({ ...customRange, end: null })
  }

  return (
    <div className={className} ref={containerRef}>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Período</label>

      {/* Wrapper relativo (como Insumos) */}
      <div className="relative w-[240px]">
        <Select
          value={selectedPeriod || ""} // "" => placeholder
          onValueChange={handlePeriodSelect}
          // ⚠️ No tocamos onOpenChange: mantenemos el comportamiento que te funcionaba
          key={forceUpdateKey}
        >
          {/* Ocultamos chevron interno de shadcn y ponemos el nuestro */}
          <SelectTrigger
            aria-invalid={showCustomWarning || undefined}
            className={
              "h-10 w-full pr-12 transition-colors hover:bg-[#F3F4F6] data-[state=open]:bg-[#F3F4F6] [&>svg:last-child]:hidden " +
              (showCustomWarning ? "border-red-400 focus:ring-red-400" : "")
            }
            onMouseDown={(e) => {
              // Si YA estás en custom, abrimos NUESTRO picker (no el dropdown)
              if (selectedPeriod === "custom") {
                e.preventDefault()
                const focusSide = isCustomIncomplete ? (customRange.start ? "end" : "start") : null
                openCustomPickerPreserving({ focus: focusSide })
              }
            }}
            onKeyDown={(e) => {
              if (selectedPeriod === "custom" && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                const focusSide = isCustomIncomplete ? (customRange.start ? "end" : "start") : null
                openCustomPickerPreserving({ focus: focusSide })
              }
              if (e.key === "Escape" && isPickerOpen) {
                e.preventDefault()
                setIsPickerOpen(false)
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CalendarIcon className="w-4 h-4 text-gray-500 shrink-0" />
              <SelectValue
                placeholder="Seleccionar período…"
                className={`text-sm truncate text-left ${showCustomWarning ? "text-red-600" : ""}`}
              >
                {selectedPeriod ? getDisplayText() : null}
              </SelectValue>
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mes</SelectItem>
            <SelectItem value="quarter">Último Trimestre</SelectItem>
            <SelectItem value="semester">Último Semestre</SelectItem>
            <SelectItem value="year">Último Año</SelectItem>
            {/* Re-seleccionar Personalizado sin borrar (igual que antes) */}
            <SelectItem
              value="custom"
              onMouseDown={(e) => {
                if (selectedPeriod === "custom") {
                  e.preventDefault()
                  e.stopPropagation()
                  const focusSide = isCustomIncomplete ? (customRange.start ? "end" : "start") : null
                  openCustomPickerPreserving({ focus: focusSide })
                }
              }}
              onKeyDown={(e) => {
                if (selectedPeriod === "custom" && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault()
                  e.stopPropagation()
                  const focusSide = isCustomIncomplete ? (customRange.start ? "end" : "start") : null
                  openCustomPickerPreserving({ focus: focusSide })
                }
              }}
            >
              Personalizado
            </SelectItem>
          </SelectContent>
        </Select>

        {/* ❌ como Insumos: fuera del trigger y bloqueando apertura */}
        {selectedPeriod && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClear(e) }}
            className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0
                       text-gray-400 hover:text-gray-600 rounded-sm hover:bg-gray-200
                       flex items-center justify-center z-20 transition-all duration-150"
            aria-label="Borrar período"
            title="Borrar período"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Chevron custom al extremo derecho */}
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50"
          aria-hidden="true"
        />

        {/* Popover personalizado (nuestro picker) */}
        {selectedPeriod === "custom" && isPickerOpen && (
          <div
            className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] animate-in fade-in-0 slide-in-from-top-2 duration-150 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-3 min-w-[320px]">
              {/* Desde */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Desde</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveField("start")}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-all duration-150 ${
                      activeField === "start"
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {customRange.start ? format(customRange.start, "dd/MM/yyyy") : "Seleccionar"}
                    </span>
                  </button>
                  {customRange.start && (
                    <button
                      type="button"
                      onClick={handleClearStart}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label="Limpiar fecha de inicio"
                      title="Limpiar fecha de inicio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hasta */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Hasta</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveField("end")}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-all duration-150 ${
                      activeField === "end"
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {customRange.end ? format(customRange.end, "dd/MM/yyyy") : "Seleccionar"}
                    </span>
                  </button>
                  {customRange.end && (
                    <button
                      type="button"
                      onClick={handleClearEnd}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                      aria-label="Limpiar fecha de fin"
                      title="Limpiar fecha de fin"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {activeField && (
              <div className="border-t border-gray-200 p-3">
                <Calendar
                  mode="single"
                  selected={activeField === "start" ? customRange.start || undefined : customRange.end || undefined}
                  onSelect={handleCustomDateSelect}
                  locale={es}
                  initialFocus
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ Mensaje solo cuando saliste con rango incompleto */}
      {showCustomWarning && (
        <p className="mt-1 text-xs text-red-600">
          Falta seleccionar {customRange.start ? "hasta" : "desde"} para establecer el rango personalizado.
        </p>
      )}
    </div>
  )
}
