"use client"

import { useState, useEffect } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Package, X } from "lucide-react"
import type { ParteDiario } from "@/lib/types"

interface VerSalidaInsumosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
}

interface MovimientoInsumo {
  id: number
  fecha: string
  hora: string
  nota?: string
  cantidad: number
  pd_insumos: {
    id: number
    nombre: string
    pd_unidad_medida_insumos?: {
      nombre: string
    }
  }
  pd_tipo_movimientos_insumos: {
    id: number
    nombre: string
  }
  pd_usuarios: {
    nombres: string
    apellidos: string
  }
}

export default function VerSalidaInsumosDrawer({ isOpen, onClose, parte }: VerSalidaInsumosDrawerProps) {
  const [movimiento, setMovimiento] = useState<MovimientoInsumo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && parte.pd_detalles?.detalle_id) {
      cargarMovimientoInsumo()
    }
  }, [isOpen, parte.pd_detalles?.detalle_id])

  const cargarMovimientoInsumo = async () => {
    if (!parte.pd_detalles?.detalle_id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/movimientos-insumos/${parte.pd_detalles.detalle_id}`)
      if (!response.ok) throw new Error("Error al cargar movimiento")

      const data = await response.json()
      setMovimiento(data.movimiento)
    } catch (error) {
      console.error("Error cargando movimiento:", error)
      // Si falla la API, usar datos del parte diario
      const movimientoData = {
        id: parte.pd_detalles?.detalle_id || 0,
        fecha: parte.pd_fecha,
        hora: parte.pd_hora,
        nota: parte.pd_nota,
        cantidad: parte.pd_detalles?.detalle_cantidad || 0,
        pd_insumos: {
          id: 0,
          nombre: parte.pd_detalles?.detalle_insumo || "",
          pd_unidad_medida_insumos: {
            nombre: parte.pd_detalles?.detalle_unidad_medida || "",
          },
        },
        pd_tipo_movimientos_insumos: {
          id: 0,
          nombre: parte.pd_detalles?.detalle_tipo || "",
        },
        pd_usuarios: {
          nombres: parte.pd_usuario_nombres || "",
          apellidos: parte.pd_usuario_apellidos || "",
        },
      }
      setMovimiento(movimientoData)
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

  const handleClose = () => {
    onClose?.()
  }

  const nombreCompleto = movimiento
    ? `${movimiento.pd_usuarios.nombres} ${movimiento.pd_usuarios.apellidos}`.trim()
    : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="ver-salida-insumos-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Ver Salida de Insumos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="ver-salida-insumos-description" className="sr-only">
          Visualizar los detalles de una salida de insumos registrada
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando movimiento...</div>
            </div>
          ) : movimiento ? (
            <div className="space-y-6">
              {/* Datos Generales */}
              {/* Solo mostrar Fecha */}
              <div>
                <Label>Fecha *</Label>
                <Input value={formatDate(movimiento.fecha)} readOnly className="cursor-default" />
              </div>

              {/* Datos del Movimiento */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos del Movimiento</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Insumo *</Label>
                      <Input value={movimiento.pd_insumos.nombre} readOnly className="cursor-default" />
                    </div>
                    <div>
                      <Label>Tipo de movimiento *</Label>
                      <Input
                        value={movimiento.pd_tipo_movimientos_insumos.nombre}
                        readOnly
                        className="cursor-default"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Cantidad *</Label>
                    <div className="flex items-center gap-2">
                      <Input value={movimiento.cantidad} readOnly className="cursor-default flex-1" />
                      {movimiento.pd_insumos.pd_unidad_medida_insumos?.nombre && (
                        <div className="px-3 py-2 bg-gray-100 border rounded-md text-sm font-medium text-gray-700 min-w-[80px] text-center">
                          {movimiento.pd_insumos.pd_unidad_medida_insumos.nombre.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div>
                <Label htmlFor="nota">Nota</Label>
                <Textarea
                  id="nota"
                  value={movimiento.nota || ""}
                  readOnly
                  className="cursor-default resize-none"
                  placeholder="Sin observaciones"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se pudo cargar la información del movimiento</div>
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
