"use client"

import { X } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerLluviaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

export default function VerLluviaDrawer({ isOpen, onClose, parte }: VerLluviaDrawerProps) {
  if (!parte) return null

  const formatDate = (dateStr: string) => {
    try {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateStr.split("-")
        return `${day}/${month}/${year}`
      }
      const date = new Date(dateStr + "T00:00:00")
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.slice(0, 5) // HH:MM format
    } catch {
      return timeStr || ""
    }
  }

  const getUserDisplayName = () => {
    if (parte.pd_usuario_nombres && parte.pd_usuario_apellidos) {
      return `${parte.pd_usuario_nombres} ${parte.pd_usuario_apellidos}`
    }
    if (parte.pd_usuario_nombres) {
      return parte.pd_usuario_nombres
    }
    if (parte.pd_usuario) {
      return parte.pd_usuario
    }
    return "Usuario desconocido"
  }

  // Parse details from JSON string if needed
  const parseDetalles = () => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles || {}
    } catch {
      return {}
    }
  }

  const detalles = parseDetalles()
  const medida = detalles?.detalle_medida || "0"

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Ver Registro de Lluvia</DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                  Lluvia
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {getUserDisplayName()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {formatDate(parte.pd_fecha)}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Hora</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {formatTime(parte.pd_hora)}
                </div>
              </div>
            </div>
          </div>

          {/* Medición */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Medición</h3>

            <div>
              <Label className="text-sm font-medium text-gray-700">Cantidad de lluvia (mm)</Label>
              <div className="relative mt-1">
                <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 pr-12">{medida}</div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">mm</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Cantidad de lluvia registrada en milímetros</p>
            </div>
          </div>

          {/* Nota */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Nota</Label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[100px] whitespace-pre-wrap">
              {parte.pd_nota || "Sin notas adicionales"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
