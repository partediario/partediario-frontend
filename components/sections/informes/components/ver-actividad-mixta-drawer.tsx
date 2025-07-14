"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Users, X } from "lucide-react"
import type { ParteDiario } from "@/lib/types"

interface DetalleAnimal {
  lote_nombre: string
  categoria_animal_nombre: string
  cantidad: number
  peso: number
  tipo: string
}

interface DetalleInsumo {
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
}

interface VerActividadMixtaDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  parte: ParteDiario | null
}

export default function VerActividadMixtaDrawer({ isOpen = false, onClose, parte }: VerActividadMixtaDrawerProps) {
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleAnimal[]>([])
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  useEffect(() => {
    if (isOpen && parte) {
      console.log("🔄 Cargando datos de actividad mixta desde la vista:", parte)
      cargarDatosDesdeVista()
    }
  }, [isOpen, parte])

  const cargarDatosDesdeVista = () => {
    if (!parte?.pd_detalles) return

    try {
      // Cargar detalles de animales desde la vista
      console.log("🔍 Datos de animales desde la vista:", parte.pd_detalles.detalles_animales)
      const animales = (parte.pd_detalles.detalles_animales || []).map((animal: any) => ({
        lote_nombre: animal.lote || "",
        categoria_animal_nombre: animal.categoria_animal || "",
        cantidad: animal.cantidad || 0,
        peso: animal.peso || 0,
        tipo: animal.tipo || "TOTAL", // Asegurar que siempre tenga un valor por defecto
      }))

      // Cargar detalles de insumos desde la vista
      const insumos = (parte.pd_detalles.detalles_insumos || []).map((insumo: any) => ({
        insumo_nombre: insumo.insumo || "",
        cantidad: insumo.cantidad || 0,
        unidad_medida: insumo.unidad_medida || "",
      }))

      setDetallesAnimales(animales)
      setDetallesInsumos(insumos)

      console.log("✅ Datos de actividad mixta cargados:", {
        animales: animales.length,
        insumos: insumos.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar datos de actividad mixta:", error)
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

  const nombreCompleto = parte ? `${parte.pd_usuario_nombres || ""} ${parte.pd_usuario_apellidos || ""}`.trim() : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            <Package className="w-6 h-6 text-blue-600" />
            Ver Actividad Mixta (Animales + Insumos)
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Datos Generales */}
          <div className="space-y-6">
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
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad *</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {parte?.pd_detalles?.detalle_tipo || ""}
                  </div>
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

            {/* Detalles con Pestañas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detalles *</h3>

              <Tabs defaultValue="animales" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="animales" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Animales ({detallesAnimales.length})
                  </TabsTrigger>
                  <TabsTrigger value="insumos" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Insumos ({detallesInsumos.length})
                  </TabsTrigger>
                </TabsList>

                {/* Pestaña Animales */}
                <TabsContent value="animales" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
                        <div className="col-span-2">Lote</div>
                        <div className="col-span-3">Categoría Animal</div>
                        <div className="col-span-2">Cantidad</div>
                        <div className="col-span-2">Peso</div>
                        <div className="col-span-3">Tipo</div>
                      </div>
                    </div>
                    <div className="min-h-[100px]">
                      {detallesAnimales.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de animales agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesAnimales.map((detalle, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 p-4 text-sm">
                              <div className="col-span-2 font-medium">{detalle.lote_nombre}</div>
                              <div className="col-span-3">{detalle.categoria_animal_nombre}</div>
                              <div className="col-span-2">{detalle.cantidad}</div>
                              <div className="col-span-2">{detalle.peso} kg</div>
                              <div className="col-span-3">{detalle.tipo}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Pestaña Insumos */}
                <TabsContent value="insumos" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
                        <div className="col-span-5">Insumo</div>
                        <div className="col-span-3">Cantidad</div>
                        <div className="col-span-4">Unidad Medida</div>
                      </div>
                    </div>
                    <div className="min-h-[100px]">
                      {detallesInsumos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de insumos agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesInsumos.map((detalle, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 p-4 text-sm">
                              <div className="col-span-5 font-medium">{detalle.insumo_nombre}</div>
                              <div className="col-span-3">{detalle.cantidad}</div>
                              <div className="col-span-4 text-gray-600">{detalle.unidad_medida}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
