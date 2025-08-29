"use client"

import { useState, useEffect } from "react"
import { X, Home } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import type { ParteDiario } from "@/lib/types"

interface VerActividadVariasCorralDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface ActividadVariasCorralData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    detalle_tipo: string
    detalle_ubicacion: string
  }
  detalles_animales: Array<{
    id: number
    lote_id: number
    lote_nombre: string
    categoria_animal_id: number | null
    categoria_animal: string | null
    categoria_animal_id_anterior: number | null
    categoria_animal_anterior: string | null
    cantidad: number
    peso: number | null
    tipo_peso: string | null
    meses_destete: string | null
  }>
  detalles_insumos: Array<{
    id: number
    insumo_id: number
    insumo: string
    cantidad: number
    unidad_medida: string
  }>
}

export default function VerActividadVariasCorralDrawer({
  isOpen,
  onClose,
  parte,
}: VerActividadVariasCorralDrawerProps) {
  const [actividadData, setActividadData] = useState<ActividadVariasCorralData | null>(null)
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
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Actividad Varias de Corral desde pd_detalles:", detalles)

      // Crear estructura de datos
      const actividadData: ActividadVariasCorralData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Actividad Varias de Corral",
          detalle_ubicacion: detalles.detalle_ubicacion || "CORRAL",
        },
        detalles_animales: detalles.detalles_animales || [],
        detalles_insumos: detalles.detalles_insumos || [],
      }

      console.log("✅ Datos de actividad varias de corral procesados:", actividadData)
      setActividadData(actividadData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Actividad Varias de Corral:", err)
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
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-orange-600" />
            Ver Actividad Varias de Corral
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
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
            <div className="space-y-6">
              {/* Datos Generales */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos Generales</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                      <Input value="Actividad" disabled className="bg-gray-50" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                      <Input value={getUserDisplayName()} disabled className="bg-gray-50" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo-actividad">Tipo de Actividad</Label>
                    <Input value="Actividad Varias de Corral" disabled className="bg-gray-50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha</Label>
                      <Input
                        value={formatDate(actividadData?.actividad?.fecha || parte.pd_fecha)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>Hora</Label>
                      <Input
                        value={formatTime(actividadData?.actividad?.hora || parte.pd_hora)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lotes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Lotes</h3>
                </div>

                {/* Lotes seleccionados */}
                {actividadData?.detalles_animales && actividadData.detalles_animales.length > 0 ? (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm font-medium text-orange-800 mb-2">
                      Lotes seleccionados ({actividadData.detalles_animales.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {actividadData.detalles_animales.map((detalle, index) => (
                        <span
                          key={detalle.id || index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                        >
                          {detalle.lote_nombre || `Lote ${detalle.lote_id}`}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border">
                    No se seleccionaron lotes
                  </div>
                )}
              </div>

              {/* Detalles Insumos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalles Insumos</h3>
                </div>

                {/* Tabla de detalles */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-4">Insumo</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-2">Unidad Medida</div>
                      <div className="col-span-2"></div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!actividadData?.detalles_insumos || actividadData.detalles_insumos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                    ) : (
                      <div className="divide-y">
                        {actividadData.detalles_insumos.map((detalle, index) => (
                          <div
                            key={detalle.id || index}
                            className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50"
                          >
                            <div className="col-span-4 font-medium">{detalle.insumo}</div>
                            <div className="col-span-2">{detalle.cantidad}</div>
                            <div className="col-span-2 text-gray-600">{detalle.unidad_medida}</div>
                            <div className="col-span-2"></div>
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
                  value={actividadData?.actividad?.nota || parte.pd_nota || ""}
                  disabled
                  className="bg-gray-50"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Solo botón de cerrar */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
