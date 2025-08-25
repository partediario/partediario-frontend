"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Scissors, Users } from "lucide-react"
import type { ParteDiario } from "@/lib/types"

interface DetalleAnimal {
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  lote_id: number
  lote_nombre: string
}

interface VerCastracionDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
}

export default function VerCastracionDrawer({ isOpen, onClose, parte }: VerCastracionDrawerProps) {
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleAnimal[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && parte.pd_id) {
      cargarDatosDesdeVista()
    }
  }, [isOpen, parte.pd_id])

  const cargarDatosDesdeVista = async () => {
    setLoading(true)
    try {
      console.log("🔄 Cargando datos de castración desde la vista:", parte)

      if (parte.pd_detalles) {
        let detalles = parte.pd_detalles
        if (typeof detalles === "string") {
          detalles = JSON.parse(detalles)
        }

        console.log("🔍 Datos de animales desde la vista:", detalles.detalles_animales)

        const animales = (detalles.detalles_animales || []).map((animal: any) => ({
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_nombre: animal.categoria_animal || animal.categoria_animal_nombre || "",
          cantidad: animal.cantidad || 0,
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.lote_nombre || animal.lote || "",
        }))

        setDetallesAnimales(animales)
        console.log("✅ Datos de castración cargados:", { animales: animales.length })
      }
    } catch (error) {
      console.error("❌ Error al cargar datos de castración:", error)
    } finally {
      setLoading(false)
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

  const totalAnimales = detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-blue-600" />
            Ver Castración
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
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
                      {getUserDisplayName()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad *</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">Castración</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {parte?.pd_fecha ? formatDate(parte.pd_fecha) : ""}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora *</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {parte?.pd_hora ? formatTime(parte.pd_hora) : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de Animales */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Animales ({totalAnimales}) *
              </h3>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="grid grid-cols-10 gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                    <div className="col-span-3">Lote</div>
                    <div className="col-span-5">Categoría Animal</div>
                    <div className="col-span-2 text-center">Cantidad</div>
                  </div>
                </div>

                <div className="min-h-[100px]">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Cargando detalles...</div>
                  ) : detallesAnimales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay detalles de animales agregados</div>
                  ) : (
                    <div className="divide-y">
                      {detallesAnimales.map((detalle, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-10 gap-3 px-4 py-3 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                        >
                          <div className="col-span-3 font-medium truncate">{detalle.lote_nombre}</div>
                          <div className="col-span-5 truncate">{detalle.categoria_nombre}</div>
                          <div className="col-span-2 text-center font-medium">{detalle.cantidad}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nota */}
            {parte?.pd_nota && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Nota</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[80px]">
                  {parte.pd_nota}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
