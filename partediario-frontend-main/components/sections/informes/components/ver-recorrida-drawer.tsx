"use client"

import { useState, useEffect } from "react"
import { X, MapPin, AlertTriangle, CheckCircle } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerRecorridaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface RecorridaData {
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
    incidente: boolean
    incidente_detalle: string | null
  }>
}

export default function VerRecorridaDrawer({ isOpen, onClose, parte }: VerRecorridaDrawerProps) {
  const [recorridaData, setRecorridaData] = useState<RecorridaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosRecorrida()
    }
  }, [isOpen, parte])

  const cargarDatosRecorrida = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Recorrida desde pd_detalles:", detalles)

      // Crear estructura de datos
      const recorridaData: RecorridaData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Recorrida",
          detalle_ubicacion: detalles.detalle_ubicacion || "No especificada",
        },
        detalles: detalles.detalles_potreros || [],
      }

      console.log("✅ Datos de recorrida procesados:", recorridaData)
      setRecorridaData(recorridaData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Recorrida:", err)
      setError("Error al cargar los datos de la recorrida")
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
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            Ver Recorrida
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la recorrida...</div>
            </div>
          )}

          {error && !recorridaData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || recorridaData) && (
            <>
              {/* Datos Generales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {recorridaData?.actividad?.detalle_tipo || "Recorrida"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatDate(recorridaData?.actividad?.fecha || parte.pd_fecha)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatTime(recorridaData?.actividad?.hora || parte.pd_hora)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles</h3>

                <div className="border rounded-lg overflow-hidden">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-10 gap-4 p-3 text-sm font-medium text-gray-700">
                      <div className="col-span-3">Potrero</div>
                      <div className="col-span-2 text-center">Estado</div>
                      <div className="col-span-5">Incidentes</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!recorridaData?.detalles || recorridaData.detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                    ) : (
                      <div className="divide-y">
                        {recorridaData?.detalles?.map((detalle, index) => (
                          <div
                            key={detalle.id || index}
                            className="grid grid-cols-10 gap-4 p-3 text-sm hover:bg-gray-50 items-center"
                          >
                            <div className="col-span-3 font-medium truncate">
                              {detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`}
                            </div>
                            <div className="col-span-2 text-center">
                              {detalle.incidente ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <AlertTriangle className="w-3 h-3" />
                                  Con Incidentes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />
                                  Todo OK
                                </span>
                              )}
                            </div>
                            <div className="col-span-5 text-xs text-gray-600">
                              {detalle.incidente_detalle || "Sin incidentes"}
                            </div>
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
                  {recorridaData?.actividad?.nota || parte.pd_nota || ""}
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
