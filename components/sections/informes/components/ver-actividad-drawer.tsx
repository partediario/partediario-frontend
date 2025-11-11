"use client"

import { useState, useEffect } from "react"
import { X, Users } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerActividadDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface ActividadDetalles {
  detalle_id: number
  detalle_tipo: string
  detalle_ubicacion: string
  detalles_animales: Array<{
    id: number
    lote: string
    categoria_animal: string
    cantidad: number
    peso: number
    tipo_peso: string
  }>
  detalles_insumos: Array<any>
}

interface ActividadData {
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
    lote: string
    categoria_animal: string
    cantidad: number
    peso: number
    tipo_peso: string
  }>
}

export default function VerActividadDrawer({ isOpen, onClose, parte }: VerActividadDrawerProps) {
  const [actividadData, setActividadData] = useState<ActividadData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosActividad()
    }
  }, [isOpen, parte])

  const cargarDatosActividad = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Usando datos del parte diario:", detalles)

      // Crear estructura de datos desde el JSON del parte diario
      const actividadData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "No especificado",
          detalle_ubicacion: detalles.detalle_ubicacion || "No especificada",
        },
        detalles: detalles.detalles_animales || [],
      }

      setActividadData(actividadData)
    } catch (err) {
      console.error("❌ Error parseando detalles:", err)
      setError("Error al cargar los datos de la actividad")
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
            <Users className="w-6 h-6 text-green-600" />
            Ver Actividad con Animales
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la actividad...</div>
            </div>
          )}

          {error && !actividadData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || actividadData) && (
            <>
              {/* Datos Generales */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Datos Generales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                      Actividad
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {getUserDisplayName()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {actividadData?.actividad?.detalle_tipo || "No especificado"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatDate(actividadData?.actividad?.fecha || parte.pd_fecha)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatTime(actividadData?.actividad?.hora || parte.pd_hora)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de Animales */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Detalles de Animales</h3>

                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-2">Lote</div>
                      <div className="col-span-3">Categoría Animal</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-2">Peso</div>
                      <div className="col-span-3">Tipo</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!actividadData?.detalles || actividadData.detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles de animales disponibles</div>
                    ) : (
                      <div className="divide-y">
                        {actividadData?.detalles?.map((detalle, index) => (
                          <div
                            key={detalle.id || index}
                            className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-gray-50"
                          >
                            <div className="col-span-2 font-medium">{detalle.lote || "Sin lote"}</div>
                            <div className="col-span-3">{detalle.categoria_animal || "Sin categoría"}</div>
                            <div className="col-span-2">{detalle.cantidad || 0}</div>
                            <div className="col-span-2">{detalle.peso || 0} kg</div>
                            <div className="col-span-3">{detalle.tipo_peso || "No especificado"}</div>
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
                  {actividadData?.actividad?.nota || parte.pd_nota || "Sin notas adicionales"}
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
