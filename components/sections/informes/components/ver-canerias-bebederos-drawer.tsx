"use client"

import { useState, useEffect } from "react"
import { X, Wrench, Package } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { ParteDiario } from "@/lib/types"

interface VerCaneriasBebederosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface CaneriasBebederosData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    detalle_tipo: string
  }
  detalles_potreros: Array<{
    id: number
    potrero_id: number
    potrero_nombre: string
    tipo_trabajo: "Reparación" | "Instalación"
    incidente_detalle: string | null
  }>
  detalles_insumos: Array<{
    id: number
    insumo_id: number
    insumo: string
    cantidad: number
    unidad_medida: string
  }>
}

export default function VerCaneriasBebederosDrawer({ isOpen, onClose, parte }: VerCaneriasBebederosDrawerProps) {
  const [caneriasData, setCaneriasData] = useState<CaneriasBebederosData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"potreros" | "insumos">("potreros")

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosCanerias()
    }
  }, [isOpen, parte])

  const cargarDatosCanerias = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Cañerías y Bebederos desde pd_detalles:", detalles)

      const caneriasData: CaneriasBebederosData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Cañerías y Bebederos",
        },
        detalles_potreros: detalles.detalles_potreros || [],
        detalles_insumos: detalles.detalles_insumos || [],
      }

      console.log("✅ Datos de cañerías y bebederos procesados:", caneriasData)
      setCaneriasData(caneriasData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Cañerías y Bebederos:", err)
      setError("Error al cargar los datos de cañerías y bebederos")
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
            <Wrench className="w-6 h-6 text-orange-600" />
            <Package className="w-6 h-6 text-blue-600" />
            Ver Cañerías y Bebederos
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de cañerías y bebederos...</div>
            </div>
          )}

          {error && !caneriasData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || caneriasData) && (
            <>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {formatDate(caneriasData?.actividad?.fecha || parte.pd_fecha)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles</h3>

                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("potreros")}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-center rounded-md transition-colors ${
                      activeTab === "potreros"
                        ? "bg-white shadow-sm border text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Wrench className="w-4 h-4 inline mr-2" />
                    Potreros ({caneriasData?.detalles_potreros?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("insumos")}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-center rounded-md transition-colors ${
                      activeTab === "insumos"
                        ? "bg-white shadow-sm border text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    Insumos ({caneriasData?.detalles_insumos?.length || 0})
                  </button>
                </div>

                {activeTab === "potreros" && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-3">Potrero</div>
                        <div className="col-span-2 text-center">Tipo Trabajo</div>
                        <div className="col-span-7">Observaciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {!caneriasData?.detalles_potreros || caneriasData.detalles_potreros.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de potreros agregados</div>
                      ) : (
                        <div className="divide-y">
                          {caneriasData?.detalles_potreros?.map((detalle, index) => (
                            <div
                              key={detalle.id || index}
                              className="grid grid-cols-12 gap-3 p-3 text-sm hover:bg-gray-50"
                            >
                              <div className="col-span-3 font-medium">
                                {detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`}
                              </div>
                              <div className="col-span-2 text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    detalle.tipo_trabajo === "Reparación"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {detalle.tipo_trabajo}
                                </Badge>
                              </div>
                              <div className="col-span-7 text-gray-600">{detalle.incidente_detalle || "-"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "insumos" && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-3 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-5">Insumo</div>
                        <div className="col-span-3 text-center">Cantidad</div>
                        <div className="col-span-4 text-center">Unidad Medida</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {!caneriasData?.detalles_insumos || caneriasData.detalles_insumos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de insumos agregados</div>
                      ) : (
                        <div className="divide-y">
                          {caneriasData.detalles_insumos.map((detalle, index) => (
                            <div
                              key={detalle.id || index}
                              className="grid grid-cols-12 gap-3 p-3 text-sm hover:bg-gray-50"
                            >
                              <div className="col-span-5 font-medium">
                                {detalle.insumo || `Insumo ${detalle.insumo_id}`}
                              </div>
                              <div className="col-span-3 text-center">{detalle.cantidad}</div>
                              <div className="col-span-4 text-center">{detalle.unidad_medida || "-"}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Nota</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[100px]">
                  {caneriasData?.actividad?.nota || parte.pd_nota || ""}
                </div>
              </div>
            </>
          )}
        </div>

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
