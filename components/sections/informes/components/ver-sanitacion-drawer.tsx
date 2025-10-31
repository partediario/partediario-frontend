"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Syringe, X } from "lucide-react"
import type { ParteDiario } from "@/lib/types"

interface DetalleVacuna {
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
}

interface VerSanitacionDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  parte: ParteDiario | null
}

export default function VerSanitacionDrawer({ isOpen = false, onClose, parte }: VerSanitacionDrawerProps) {
  const [detallesVacunas, setDetallesVacunas] = useState<DetalleVacuna[]>([])
  const [lotesSeleccionados, setLotesSeleccionados] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && parte) {
      console.log("🔄 Cargando datos de sanitación desde la vista:", parte)
      cargarDatosDesdeVista()
    }
  }, [isOpen, parte])

  const cargarDatosDesdeVista = async () => {
    if (!parte?.pd_detalles) return

    try {
      console.log("🔍 Datos desde la vista:", parte.pd_detalles)

      const lotes = (parte.pd_detalles.detalles_animales || [])
        .map((animal: any) => animal.lote_nombre || animal.lote || "")
        .filter(Boolean)

      // Remove duplicates
      const lotesUnicos = Array.from(new Set(lotes))
      setLotesSeleccionados(lotesUnicos)

      // Cargar detalles de vacunas desde la vista
      const vacunas = (parte.pd_detalles.detalles_insumos || []).map((insumo: any) => ({
        insumo_nombre: insumo.insumo || insumo.insumo_nombre || "",
        cantidad: insumo.cantidad || 0,
        unidad_medida: insumo.unidad_medida || "",
      }))

      setDetallesVacunas(vacunas)

      console.log("✅ Datos de sanitación cargados:", {
        lotes: lotesUnicos.length,
        vacunas: vacunas.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar datos de sanitación:", error)
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
            <Syringe className="w-6 h-6 text-green-600" />
            Ver Sanitación
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Datos Generales */}
          <div className="space-y-6">
            <div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {parte?.pd_fecha ? formatDate(parte.pd_fecha) : ""}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Lotes</h3>
              </div>

              {/* Lotes seleccionados */}
              {lotesSeleccionados.length > 0 ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-2">
                    Lotes seleccionados ({lotesSeleccionados.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lotesSeleccionados.map((lote, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {lote}
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalle Vacunas</h3>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                    <div className="col-span-4">Vacuna</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-2">Unidad Medida</div>
                    <div className="col-span-2"></div>
                  </div>
                </div>
                <div className="min-h-[100px]">
                  {detallesVacunas.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay vacunas agregadas</div>
                  ) : (
                    <div className="divide-y">
                      {detallesVacunas.map((detalle, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                        >
                          <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
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
