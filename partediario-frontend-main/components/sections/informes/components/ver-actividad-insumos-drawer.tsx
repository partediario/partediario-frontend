"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Package, X } from "lucide-react"
import type { ParteDiario } from "@/lib/types"

interface VerActividadInsumosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
}

interface ActividadInsumos {
  id: number
  fecha: string
  hora: string
  nota?: string
  pd_tipo_actividades: {
    id: number
    nombre: string
    descripcion?: string
    ubicacion?: string
    animales: string
    insumos: string
  }
  pd_actividades_insumos_detalle: Array<{
    id: number
    insumo_id: number
    cantidad: number
    pd_insumos: {
      id: number
      nombre: string
      pd_unidad_medida_insumos?: {
        nombre: string
      }
    }
  }>
  pd_usuarios: {
    nombres: string
    apellidos: string
  }
}

export default function VerActividadInsumosDrawer({ isOpen, onClose, parte }: VerActividadInsumosDrawerProps) {
  const [actividad, setActividad] = useState<ActividadInsumos | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && parte.pd_detalles) {
      console.log("✅ Usando datos del parte diario:", parte.pd_detalles)
      cargarDatosDesdeParteDiario()
    }
  }, [isOpen, parte])

  const cargarDatosDesdeParteDiario = () => {
    try {
      // Usar los datos directamente del parte diario
      const actividadData = {
        id: parte.pd_detalles?.detalle_id || 0,
        fecha: parte.pd_fecha,
        hora: parte.pd_hora,
        nota: parte.pd_nota,
        pd_tipo_actividades: {
          id: parte.pd_detalles?.detalle_tipo_id || 0,
          nombre: parte.pd_detalles?.detalle_tipo || "",
          ubicacion: parte.pd_detalles?.detalle_ubicacion || "",
          animales: "NO APLICA",
          insumos: "OBLIGATORIO",
        },
        pd_usuarios: {
          nombres: parte.pd_usuario_nombres || "",
          apellidos: parte.pd_usuario_apellidos || "",
        },
        // Mapear los insumos desde pd_detalles.detalles_insumos
        pd_actividades_insumos_detalle: (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
          id: insumo.id,
          insumo_id: insumo.id,
          cantidad: insumo.cantidad,
          pd_insumos: {
            id: insumo.id,
            nombre: insumo.insumo,
            pd_unidad_medida_insumos: {
              nombre: insumo.unidad_medida || "",
            },
          },
        })),
      }

      setActividad(actividadData)
      console.log("✅ Datos de actividad cargados:", actividadData)
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
    }
  }

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
      return timeStr.slice(0, 5)
    } catch {
      return timeStr || ""
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  const nombreCompleto = actividad ? `${actividad.pd_usuarios.nombres} ${actividad.pd_usuarios.apellidos}`.trim() : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="ver-actividad-insumos-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Ver Actividad con Insumos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="ver-actividad-insumos-description" className="sr-only">
          Visualizar los detalles de una actividad con insumos registrada
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando actividad...</div>
            </div>
          ) : actividad ? (
            <div className="space-y-6">
              {/* Datos Generales */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos Generales</h3>
                <div className="space-y-4">
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
                        {nombreCompleto}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo-actividad">Tipo de Actividad *</Label>
                    <Input value={actividad.pd_tipo_actividades?.nombre || ""} readOnly className="cursor-default" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha *</Label>
                      <Input value={formatDate(actividad.fecha)} readOnly className="cursor-default" />
                    </div>
                    <div>
                      <Label>Hora *</Label>
                      <Input value={formatTime(actividad.hora)} readOnly className="cursor-default" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalles *</h3>
                </div>

                {/* Tabla de detalles */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-9 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-4">Insumo</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-3">Unidad Medida</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!actividad.pd_actividades_insumos_detalle ||
                    actividad.pd_actividades_insumos_detalle.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles registrados</div>
                    ) : (
                      <div className="divide-y">
                        {actividad.pd_actividades_insumos_detalle.map((detalle, index) => (
                          <div key={index} className="grid grid-cols-9 gap-4 p-4 text-sm hover:bg-gray-50">
                            <div className="col-span-4 font-medium">{detalle.pd_insumos.nombre}</div>
                            <div className="col-span-2">{detalle.cantidad}</div>
                            <div className="col-span-3 text-gray-600">
                              {detalle.pd_insumos.pd_unidad_medida_insumos?.nombre || "N/A"}
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
                <Label htmlFor="nota">Nota</Label>
                <Textarea
                  id="nota"
                  value={actividad.nota || ""}
                  readOnly
                  className="cursor-default resize-none"
                  placeholder="Sin observaciones"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se pudo cargar la información de la actividad</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
