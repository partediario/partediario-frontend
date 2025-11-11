"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import AddParteDiarioDrawer from "./add-parte-drawer"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"

interface DashboardHeaderProps {
  onAddClick?: () => void
  onDateChange?: (date: Date | undefined) => void
}

export default function DashboardHeader({ onAddClick, onDateChange }: DashboardHeaderProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddParteDiarioOpen, setIsAddParteDiarioOpen] = useState(false)

  const { usuario } = useUser()
  const permissions = usePermissions()

  const handleAddClick = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    // Disparar evento personalizado para recargar los partes diarios
    window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
  }

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    onDateChange?.(selectedDate)
    setIsCalendarOpen(false)
  }

  const handleResetDate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDate(undefined)
    onDateChange?.(undefined)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Ajustar para que lunes sea 0

    const days = []

    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const calendarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCalendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])

  const days = getDaysInMonth(currentMonth)
  const dayNames = ["lu", "ma", "mi", "ju", "vi", "sa", "do"]

  return (
    <div className="w-full bg-white p-4 shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between">
        {/* Selector de fecha a la izquierda */}
        <div className="flex items-center gap-2 relative">
          {/* Botón del selector de fecha */}

          {/* Calendario emergente personalizado */}
          {isCalendarOpen && (
            <div
              ref={calendarRef}
              className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3 w-72"
            >
              {/* Header del calendario */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigateMonth("prev")} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-medium text-gray-900">{formatMonthYear(currentMonth)}</h3>
                <button onClick={() => navigateMonth("next")} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Nombres de los días */}
              <div className="grid grid-cols-7 gap-0.5 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <button
                        onClick={() => handleDateSelect(day)}
                        className={cn(
                          "w-full h-full flex items-center justify-center text-xs rounded hover:bg-gray-100",
                          date && day.toDateString() === date.toDateString()
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "text-gray-900",
                        )}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <div className="w-full h-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón X separado */}
          {date && (
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={handleResetDate}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Botón de agregar a la derecha - Solo mostrar si NO es consultor */}
        {permissions.canAddParteDiario() && (
         <Button
          onClick={() => setIsAddParteDiarioOpen(true)}
          style={{ backgroundColor: "#8C9C78" }}
          className="hover:brightness-90 text-white px-4 py-2 rounded flex items-center"
         >
         <Plus className="mr-2 h-4 w-4" />
         Agregar Parte Diario
         </Button>
        )}
      </div>
      
      <AddParteDiarioDrawer isOpen={isAddParteDiarioOpen} onClose={() => setIsAddParteDiarioOpen(false)} />
    </div>
  )
}
