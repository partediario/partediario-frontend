"use client"

import * as React from "react"
import { Clock, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomTimePickerProps {
  time?: string
  onTimeChange?: (time: string | undefined) => void
  placeholder?: string
  className?: string
}

export function CustomTimePicker({
  time,
  onTimeChange,
  placeholder = "Seleccionar hora",
  className,
}: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState(14)
  const [selectedMinute, setSelectedMinute] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const hourScrollRef = React.useRef<HTMLDivElement>(null)
  const minuteScrollRef = React.useRef<HTMLDivElement>(null)

  // Inicializar con la hora actual o la hora proporcionada
  React.useEffect(() => {
    if (time) {
      const [hour, minute] = time.split(":").map(Number)
      if (!isNaN(hour) && !isNaN(minute)) {
        setSelectedHour(hour)
        setSelectedMinute(minute)
      }
    } else {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      setSelectedHour(hour)
      setSelectedMinute(minute)
    }
  }, [time])

  // Auto-scroll a la hora seleccionada cuando se abre el dropdown
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToSelected()
      }, 100)
    }
  }, [isOpen])

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  const scrollToSelected = () => {
    // Scroll a la hora seleccionada
    if (hourScrollRef.current) {
      const hourElement = hourScrollRef.current.querySelector(`[data-hour="${selectedHour}"]`) as HTMLElement
      if (hourElement) {
        hourElement.scrollIntoView({ block: "center", behavior: "smooth" })
      }
    }

    // Scroll al minuto seleccionado
    if (minuteScrollRef.current) {
      const minuteElement = minuteScrollRef.current.querySelector(`[data-minute="${selectedMinute}"]`) as HTMLElement
      if (minuteElement) {
        minuteElement.scrollIntoView({ block: "center", behavior: "smooth" })
      }
    }
  }

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour)
  }

  const handleMinuteSelect = (minute: number) => {
    setSelectedMinute(minute)
  }

  const handleAccept = () => {
    const timeString = formatTime(selectedHour, selectedMinute)
    onTimeChange?.(timeString)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setIsOpen(false)
    // Restaurar el tiempo original
    if (time) {
      const [hour, minute] = time.split(":").map(Number)
      setSelectedHour(hour)
      setSelectedMinute(minute)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTimeChange?.(undefined)
  }

  const toggleTimePicker = () => {
    setIsOpen(!isOpen)
  }

  // Generar arrays de horas y minutos
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i) // Todos los minutos 0-59

  return (
    <div className={cn("flex gap-2 relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn("justify-between text-left font-normal flex-1 h-10", !time && "text-muted-foreground")}
        onClick={toggleTimePicker}
        type="button"
      >
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          {time || placeholder}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* Clear Button */}
      {time && (
        <Button variant="outline" size="icon" onClick={handleClear} className="h-10 w-10 shrink-0" type="button">
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Time Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 text-center">Seleccionar hora</h3>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Time Display - Editable */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900">{formatTime(selectedHour, selectedMinute)}</div>
            </div>

            {/* Time Selectors */}
            <div className="grid grid-cols-2 gap-6">
              {/* Hours Column */}
              <div>
                <div ref={hourScrollRef} className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      data-hour={hour}
                      onClick={() => handleHourSelect(hour)}
                      className={cn(
                        "w-full px-3 py-2 text-center text-sm hover:bg-gray-50 transition-colors",
                        selectedHour === hour ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700",
                      )}
                    >
                      {hour.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes Column */}
              <div>
                <div ref={minuteScrollRef} className="max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      data-minute={minute}
                      onClick={() => handleMinuteSelect(minute)}
                      className={cn(
                        "w-full px-3 py-2 text-center text-sm hover:bg-gray-50 transition-colors",
                        selectedMinute === minute ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700",
                      )}
                    >
                      {minute.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-100">
            <Button variant="outline" onClick={handleCancel} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleAccept} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
