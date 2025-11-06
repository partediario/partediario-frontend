"use client"

import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ComboboxOption {
  value: string
  label: string
}

interface CustomComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function CustomCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecciona una opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron opciones.",
  disabled = false,
  loading = false,
  className,
}: CustomComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter((option) => option.label.toLowerCase().includes(searchValue.toLowerCase()))
  }, [options, searchValue])

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
    setSearchValue("")
  }

  const toggleOpen = () => {
    if (!disabled && !loading) {
      setOpen(!open)
    }
  }

  // Cerrar dropdown cuando se hace click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setSearchValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        variant="outline"
        className="w-full justify-between"
        disabled={disabled || loading}
        onClick={toggleOpen}
        type="button"
      >
        <span className="truncate text-left">
          {loading ? "Cargando..." : selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-8 h-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                    value === option.value && "bg-blue-50 text-blue-600",
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
