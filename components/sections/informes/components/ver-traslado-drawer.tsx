"use client"

import { useState } from "react"
import { X, ArrowRightLeft, Undo2 } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import type { ParteDiario } from "@/lib/types"

interface VerTrasladoDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

interface DetalleAnimal {
  id: number
  categoria_animal: string
  categoria_animal_id: number
  cantidad: number
  peso: number
  tipo_peso: string
}

interface DetallesTraslado {
  detalle_id: number
  detalle_tipo_id: number
  detalle_tipo: string
  detalle_deshacible: boolean
  potrero_origen_id: number
  potrero_origen_nombre: string
  potrero_destino_id: number
  potrero_destino_nombre: string
  lote_origen_id: number
  lote_origen_nombre: string
  lote_destino_id: number
  lote_destino_nombre: string
  detalles_animales: DetalleAnimal[]
  detalles_insumos: any[]
}

export default function VerTrasladoDrawer({ isOpen, onClose, parte, onSuccess }: VerTrasladoDrawerProps) {
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const { usuario } = useUser()

  if (!parte || parte.pd_tipo !== "TRASLADO") return null

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

  const parseDetalles = (): DetallesTraslado | null => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles as DetallesTraslado
    } catch {
      return null
    }
  }

  const detalles = parseDetalles()
  const detallesAnimales: DetalleAnimal[] = detalles?.detalles_animales || []

  const puedeDeshacerse = (): boolean => {
    return detalles?.detalle_deshacible === true
  }

  const deshacerTraslado = async () => {
    if (!parte.pd_id || !usuario?.id || !detalles) {
      console.error("Faltan datos necesarios para deshacer el traslado")
      return
    }

    setUndoing(true)
    try {
      const response = await fetch("/api/deshacer-traslado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actividad_id: parte.pd_id,
          user_id: usuario.id,
          detalles_animales: detallesAnimales,
          lote_origen_id: detalles.lote_origen_id,
          lote_destino_id: detalles.lote_destino_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al deshacer el traslado")
      }

      toast({
        title: "Traslado Deshecho",
        description: "El traslado ha sido revertido correctamente",
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error("Error deshaciendo traslado:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo deshacer el traslado",
        variant: "destructive",
      })
    } finally {
      setUndoing(false)
      setShowUndoConfirm(false)
    }
  }

  const handleClose = () => {
    onClose()
    setShowUndoConfirm(false)
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-600" />
            Ver Traslado de Potrero
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Datos Generales */}
            <div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {formatDate(parte.pd_fecha)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Potrero Origen</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {detalles?.potrero_origen_nombre || detalles?.lote_origen_nombre
                        ? `${detalles?.potrero_origen_nombre || "Potrero"} - ${detalles?.lote_origen_nombre || "Lote"}`
                        : "No disponible"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Potrero Destino</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {detalles?.potrero_destino_nombre || detalles?.lote_destino_nombre
                        ? `${detalles?.potrero_destino_nombre || "Potrero"} - ${detalles?.lote_destino_nombre || "Lote"}`
                        : "No disponible"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animales Trasladados */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Animales Trasladados</h3>

              {detallesAnimales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay detalles de traslado disponibles</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detallesAnimales.map((detalle, index) => (
                        <TableRow key={detalle.id || index}>
                          <TableCell>
                            <div className="font-medium">{detalle.categoria_animal}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {detalle.cantidad}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {detallesAnimales.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📋 Resumen del Traslado</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Categorías trasladadas:</span>
                    <div className="font-medium text-lg text-gray-900">{detallesAnimales.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total de animales:</span>
                    <div className="font-medium text-lg text-gray-900">
                      {detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nota */}
            {parte.pd_nota && (
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
        <div className="border-t p-4 flex justify-between">
          <div>
            {puedeDeshacerse() ? (
              <Button onClick={() => setShowUndoConfirm(true)} variant="destructive" disabled={undoing}>
                <Undo2 className="w-4 h-4 mr-2" />
                {undoing ? "Deshaciendo..." : "Deshacer"}
              </Button>
            ) : (
              <div className="flex flex-col">
                <Button variant="outline" disabled className="text-gray-400 cursor-not-allowed bg-transparent">
                  <Undo2 className="w-4 h-4 mr-2" />
                  Deshacer
                </Button>
                <span className="text-xs text-gray-500 mt-1">Este traslado no puede ser deshecho</span>
              </div>
            )}
          </div>

          <Button
            onClick={handleClose}
            variant="outline"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cerrar
          </Button>
        </div>

        {/* Modal de confirmación */}
        {showUndoConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Deshacer Traslado</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea deshacer este traslado? Los animales volverán al lote origen.
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowUndoConfirm(false)} variant="outline" disabled={undoing}>
                  No
                </Button>
                <Button onClick={deshacerTraslado} variant="destructive" disabled={undoing}>
                  {undoing ? "Deshaciendo..." : "Sí, Deshacer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
