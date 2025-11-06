"use client"

import { X, RefreshCw } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ParteDiario } from "@/lib/types"

interface VerReloteoDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface DetalleAnimal {
  id: number
  categoria_animal: string
  cantidad: number
  peso: number
  tipo_peso: string
  lote_origen_id: number
  lote_origen_nombre: string
  lote_destino_id: number
  lote_destino_nombre: string
}

interface DetallesReloteo {
  detalle_id: number
  detalle_tipo_id: number
  detalle_tipo: string
  detalles_animales: DetalleAnimal[]
  detalles_insumos: any[]
}

export default function VerReloteoDrawer({ isOpen, onClose, parte }: VerReloteoDrawerProps) {
  if (!parte || parte.pd_tipo !== "RELOTEO") return null

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

  // Parse detalles from JSON string if needed
  const parseDetalles = (): DetallesReloteo | null => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles as DetallesReloteo
    } catch {
      return null
    }
  }

  const detalles = parseDetalles()
  const detallesAnimales: DetalleAnimal[] = detalles?.detalles_animales || []

  // Group animals by origin lot instead of movement pairs
  const animalesPorLoteOrigen = detallesAnimales.reduce(
    (acc, detalle) => {
      const key = detalle.lote_origen_nombre
      if (!acc[key]) {
        acc[key] = {
          lote_origen: detalle.lote_origen_nombre,
          animales: [],
        }
      }
      acc[key].animales.push(detalle)
      return acc
    },
    {} as Record<string, { lote_origen: string; animales: DetalleAnimal[] }>,
  )

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Ver Reloteo
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
                      Reloteo
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
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {detalles?.detalle_tipo || "Reloteo"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatDate(parte.pd_fecha)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatTime(parte.pd_hora)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Animales Reloteados */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Animales Reloteados</h3>

              {detallesAnimales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay detalles de reloteo disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(animalesPorLoteOrigen).map(([loteOrigen, data], index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 border-b">
                        <h4 className="font-medium text-blue-900 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          {data.lote_origen}
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <Table className="w-full table-fixed">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left w-[40%]">Categoría</TableHead>
                              <TableHead className="text-center w-[20%]">Cantidad</TableHead>
                              <TableHead className="text-left w-[40%]">Lote Destino</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.animales.map((detalle, animalIndex) => (
                              <TableRow key={detalle.id || animalIndex}>
                                <TableCell className="text-left w-[40%]">
                                  <div className="font-medium truncate">{detalle.categoria_animal}</div>
                                </TableCell>
                                <TableCell className="text-center w-[20%]">
                                  <div className="flex items-center justify-center">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {detalle.cantidad}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-left w-[40%]">
                                  <div className="text-sm text-gray-900 font-medium truncate">
                                    {detalle.lote_destino_nombre}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📋 Resumen del Reloteo</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Lotes origen:</span>
                    <div className="font-medium text-lg text-gray-900">{Object.keys(animalesPorLoteOrigen).length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Categorías reloteadas:</span>
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
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
