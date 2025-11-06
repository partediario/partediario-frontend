"use client"

import { X, Users, ArrowRight } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ParteDiario } from "@/lib/types"

interface VerReclasificacionDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface DetalleReclasificacion {
  id: number
  lote: string
  categoria_animal: string
  cantidad: number
  peso: number
  tipo_peso: string
  categoria_animal_anterior: string
  peso_anterior: number
  tipo_peso_anterior: string
}

export default function VerReclasificacionDrawer({ isOpen, onClose, parte }: VerReclasificacionDrawerProps) {
  if (!parte || parte.pd_tipo !== "RECLASIFICACION") return null

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
  const parseDetalles = () => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles || {}
    } catch {
      return {}
    }
  }

  const detalles = parseDetalles()
  const detallesAnimales: DetalleReclasificacion[] = detalles.detalles_animales || []

  // Determinar si es reclasificación por categoría o por lote
  const esReclasificacionPorLote = detalles.detalle_tipo?.includes("Lote") || false
  const tipoReclasificacion = esReclasificacionPorLote ? "Reclasificación por Lote" : "Reclasificación por Categoría"

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[900px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Ver {tipoReclasificacion}
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                  RECLASIFICACIÓN
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
                {detalles.detalle_tipo || "Reclasificación de animales"}
              </div>
            </div>

            {detalles.detalle_ubicacion && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {detalles.detalle_ubicacion}
                </div>
              </div>
            )}

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

          {/* Detalles de Reclasificaciones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Detalles de Reclasificaciones ({detallesAnimales.length})
            </h3>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {esReclasificacionPorLote && <TableHead className="w-[120px]">Lote</TableHead>}
                    <TableHead>Categoría Anterior</TableHead>
                    <TableHead className="w-[60px] text-center"></TableHead>
                    <TableHead>Categoría Nueva</TableHead>
                    <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                    <TableHead className="w-[120px] text-center">Peso Anterior</TableHead>
                    <TableHead className="w-[120px] text-center">Peso Nuevo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detallesAnimales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={esReclasificacionPorLote ? 7 : 6} className="text-center text-gray-500 py-8">
                        No hay detalles de reclasificaciones disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    detallesAnimales.map((detalle, index) => (
                      <TableRow key={detalle.id || index} className="hover:bg-gray-50">
                        {esReclasificacionPorLote && (
                          <TableCell className="font-medium">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {detalle.lote}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="font-medium text-gray-900">{detalle.categoria_animal_anterior}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="h-4 w-4 text-orange-500 mx-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{detalle.categoria_animal}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {detalle.cantidad}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <div className="font-medium">{detalle.peso_anterior} kg</div>
                            <div className="text-gray-500 text-xs">{detalle.tipo_peso_anterior}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <div className="font-medium">{detalle.peso} kg</div>
                            <div className="text-gray-500 text-xs">{detalle.tipo_peso}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Resumen */}
            {detallesAnimales.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total de reclasificaciones:</span>
                    <div className="font-medium text-lg text-gray-900">{detallesAnimales.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total de animales:</span>
                    <div className="font-medium text-lg text-gray-900">
                      {detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Peso total procesado:</span>
                    <div className="font-medium text-lg text-gray-900">
                      {detallesAnimales.reduce((sum, detalle) => sum + detalle.peso, 0).toLocaleString()} kg
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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

        {/* Footer */}
        <div className="border-t p-6 flex justify-end">
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
