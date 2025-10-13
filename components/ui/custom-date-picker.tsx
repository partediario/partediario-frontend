"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, X, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface CustomDatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function CustomDatePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha",
  className,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(date?.getMonth() ?? new Date().getMonth())
  const [currentYear, setCurrentYear] = React.useState(date?.getFullYear() ?? new Date().getFullYear())
  const containerRef = React.useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const months = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."]

  const monthsFull = [
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

  const daysOfWeek = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

  const currentYearActual = new Date().getFullYear()
  const years = Array.from({ length: 15 }, (_, i) => currentYearActual - 9 + i)

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Verificar si el click es en un portal de Select (que se renderiza fuera del contenedor)
        const target = event.target as Element
        const isSelectPortal =
          target.closest("[data-radix-popper-content-wrapper]") ||
          target.closest("[data-radix-select-content]") ||
          target.closest("[data-radix-select-viewport]")

        if (!isSelectPortal) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleMonthChange = (value: string) => {
    setCurrentMonth(Number(value))
    // No cerrar el calendario
  }

  const handleYearChange = (value: string) => {
    setCurrentYear(Number(value))
    // No cerrar el calendario
  }

  // Obtener días del mes
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Obtener el primer día de la semana del mes
  const getFirstDayOfMonth = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1
  }

  // Generar calendario con días del mes anterior y siguiente
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days = []

    // Días del mes anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear)

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        isPrevMonth: true,
        month: prevMonth,
        year: prevYear,
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isPrevMonth: false,
        month: currentMonth,
        year: currentYear,
      })
    }

    // Días del mes siguiente para completar la cuadrícula
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    const remainingDays = 42 - days.length // 6 semanas * 7 días

    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isPrevMonth: false,
        month: nextMonth,
        year: nextYear,
      })
    }

    return days
  }

  const isDateDisabled = (day: number, month: number, year: number) => {
    const checkDate = new Date(year, month, day)
    return checkDate > todayDateOnly
  }

  const isDateSelected = (day: number, month: number, year: number) => {
    if (!date) return false
    return day === date.getDate() && month === date.getMonth() && year === date.getFullYear()
  }

  const handleDateSelect = (day: number, month: number, year: number) => {
    if (isDateDisabled(day, month, year)) return

    const selectedDate = new Date(year, month, day)
    onDateChange?.(selectedDate)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange?.(undefined)
  }

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const toggleCalendar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className={cn("flex gap-2 relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn("justify-between text-left font-normal flex-1 h-10", !date && "text-muted-foreground")}
        onClick={toggleCalendar}
        type="button"
      >
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          {date ? formatDate(date) : placeholder}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* Clear Button */}
      {date && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          className="h-10 w-10 shrink-0 bg-transparent"
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header con navegación y selectors */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100"
              onClick={handlePrevMonth}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[85px] h-8 border-0 bg-transparent hover:bg-gray-100 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthsFull.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {months[index]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[75px] h-8 border-0 bg-transparent hover:bg-gray-100 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100"
              onClick={handleNextMonth}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendario */}
          <div className="p-4">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {daysOfWeek.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar().map((dayObj, index) => {
                const isDisabled = isDateDisabled(dayObj.day, dayObj.month, dayObj.year)
                const isSelected = isDateSelected(dayObj.day, dayObj.month, dayObj.year)
                const isToday =
                  dayObj.day === today.getDate() &&
                  dayObj.month === today.getMonth() &&
                  dayObj.year === today.getFullYear()

                return (
                  <div key={index} className="h-8 flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0 font-normal hover:bg-blue-50",
                        !dayObj.isCurrentMonth && "text-gray-300",
                        isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent",
                        isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                        isToday && !isSelected && "bg-blue-100 text-blue-600 font-semibold",
                      )}
                      onClick={() => handleDateSelect(dayObj.day, dayObj.month, dayObj.year)}
                      disabled={isDisabled}
                      type="button"
                    >
                      {dayObj.day}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
