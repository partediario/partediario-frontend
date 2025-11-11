"use client"

import { useState, useEffect } from "react"
import { X, Droplets } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerLimpiezaBebederosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface LimpiezaData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    detalle_tipo: string
    detalle_ubicacion: string
  }
  detalles: Array<{
    id: number
    potrero_id: number
    potrero_nombre: string
  }>
}

export default function VerLimpiezaBebederosDrawer({ isOpen, onClose, parte }: VerLimpiezaBebederosDrawerProps) {
  const [limpiezaData, setLimpiezaData] = useState<LimpiezaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosLimpieza()
    }
  }, [isOpen, parte])

  const cargarDatosLimpieza = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Limpieza de Bebederos desde pd_detalles:", detalles)

      // Crear estructura de datos
      const limpiezaData: LimpiezaData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Limpieza de Bebederos",
          detalle_ubicacion: detalles.detalle_ubicacion || "No especificada",
        },
        detalles: detalles.detalles_potreros || [],
      }

      console.log("✅ Datos de limpieza procesados:", limpiezaData)
      setLimpiezaData(limpiezaData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Limpieza de Bebederos:", err)
      setError("Error al cargar los datos de la limpieza")
    } finally {
      setLoading(false)
    }
  }

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

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

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            Ver Limpieza de Bebederos
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la limpieza...</div>
            </div>
          )}

          {error && !limpiezaData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || limpiezaData) && (
            <>
              {/* Datos Generales */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {formatDate(limpiezaData?.actividad?.fecha || parte.pd_fecha)}
                  </div>
                </div>
              </div>

              {/* Detalles de Potreros */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Detalles</h3>

                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div>Potrero</div>
                      <div>Acciones</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!limpiezaData?.detalles || limpiezaData.detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles de potreros disponibles</div>
                    ) : (
                      <div className="divide-y">
                        {limpiezaData?.detalles?.map((detalle, index) => (
                          <div
                            key={detalle.id || index}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-sm hover:bg-gray-50"
                          >
                            <div className="font-medium">
                              {detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`}
                            </div>
                            <div className="text-gray-500">Limpiado</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Nota</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[100px]">
                  {limpiezaData?.actividad?.nota || parte.pd_nota || ""}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Solo botón de cerrar */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cerrar
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
