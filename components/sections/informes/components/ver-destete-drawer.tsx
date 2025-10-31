"use client"

import { useState } from "react"
import { X, Calendar, Undo2 } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import type { ParteDiario } from "@/lib/types"

interface VerDesteteDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

interface DetalleAnimal {
  id: number
  lote_id: number
  lote_nombre: string
  categoria_animal_id: number
  categoria_animal: string
  categoria_animal_id_anterior: number | null
  categoria_animal_anterior: string | null
  cantidad: number
  peso: number
  tipo_peso: string
  meses_destete: string
}

interface DetallesDestete {
  detalle_id: number
  detalle_tipo_id: number
  detalle_tipo: string
  detalle_ubicacion: string
  detalle_deshacible: boolean
  detalles_animales: DetalleAnimal[]
  detalles_insumos: any[]
  detalles_potreros: any[]
}

export default function VerDesteteDrawer({ isOpen, onClose, parte, onSuccess }: VerDesteteDrawerProps) {
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const { usuario } = useUser()

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

  const parseDetalles = (): DetallesDestete | null => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles as DetallesDestete
    } catch {
      return null
    }
  }

  const detalles = parseDetalles()
  const detallesAnimales: DetalleAnimal[] = detalles?.detalles_animales || []

  const puedeDeshacerse = (): boolean => {
    return detalles?.detalle_deshacible === true
  }

  const deshacerDestete = async () => {
    if (!parte.pd_id || !usuario?.id || !detalles) {
      console.error("Faltan datos necesarios para deshacer el destete")
      return
    }

    setUndoing(true)
    try {
      const response = await fetch("/api/deshacer-destete-marcacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actividad_id: parte.pd_id,
          user_id: usuario.id,
          detalles_animales: detallesAnimales,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al deshacer el destete")
      }

      toast({
        title: "Destete Deshecho",
        description: "El destete ha sido revertido correctamente",
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error("Error deshaciendo destete:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo deshacer el destete",
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

  const animalesPorLote = detallesAnimales.reduce(
    (acc, detalle) => {
      const key = detalle.lote_nombre || `Lote ${detalle.lote_id}`
      if (!acc[key]) {
        acc[key] = {
          lote_nombre: key,
          animales: [],
        }
      }
      acc[key].animales.push(detalle)
      return acc
    },
    {} as Record<string, { lote_nombre: string; animales: DetalleAnimal[] }>,
  )

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Ver Destete - Marcación
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">Fecha</Label>
              <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                {formatDate(parte.pd_fecha)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Animales Destetados</h3>

              {detallesAnimales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay detalles de destete disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(animalesPorLote).map(([loteNombre, data], index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-green-50 px-4 py-3 border-b">
                        <h4 className="font-medium text-green-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {data.lote_nombre}
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <Table className="w-full table-fixed">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left w-[23%]">Categoría Anterior</TableHead>
                              <TableHead className="text-left w-[23%]">Categoría Actual</TableHead>
                              <TableHead className="text-center w-[14%]">Cantidad</TableHead>
                              <TableHead className="text-center w-[18%] whitespace-nowrap">Peso Promedio</TableHead>
                              <TableHead className="text-center w-[22%]">Mes de Destete</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.animales.map((detalle, animalIndex) => (
                              <TableRow key={detalle.id || animalIndex}>
                                <TableCell className="text-left w-[23%]">
                                  <div className="font-medium truncate">
                                    {detalle.categoria_animal_anterior || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-left w-[23%]">
                                  <div className="font-medium truncate text-green-700">{detalle.categoria_animal}</div>
                                </TableCell>
                                <TableCell className="text-center w-[14%]">
                                  <div className="flex items-center justify-center">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {detalle.cantidad}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center w-[18%]">
                                  <div className="text-sm text-gray-900 font-medium">{detalle.peso} kg</div>
                                </TableCell>
                                <TableCell className="text-center w-[22%]">
                                  <div className="text-sm text-gray-600">
                                    {detalle.meses_destete} mes{detalle.meses_destete !== "1" ? "es" : ""}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detallesAnimales.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📋 Resumen del Destete</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Lotes procesados:</span>
                    <div className="font-medium text-lg text-gray-900">{Object.keys(animalesPorLote).length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Categorías destetadas:</span>
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
                <span className="text-xs text-gray-500 mt-1">Este destete no puede ser deshecho</span>
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

        {showUndoConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Deshacer Destete</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea deshacer este destete? Los animales volverán a sus categorías originales.
              </p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowUndoConfirm(false)} variant="outline" disabled={undoing}>
                  No
                </Button>
                <Button onClick={deshacerDestete} variant="destructive" disabled={undoing}>
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
