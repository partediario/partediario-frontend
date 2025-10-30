"use client"

import { X } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface ViewParteDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

export default function ViewParteDrawer({ isOpen, onClose, parte }: ViewParteDrawerProps) {
  if (!parte) return null

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

  // Parse details from JSON string if needed
  const parseDetalles = () => {
    try {
      if (typeof parte.pd_detalles === "string") {
        return JSON.parse(parte.pd_detalles)
      }
      return parte.pd_detalles || []
    } catch {
      return []
    }
  }

  const detalles = parseDetalles()

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">
            {parte.pd_tipo === "ENTRADA"
              ? "Entrada de Animales"
              : parte.pd_tipo === "SALIDA"
                ? "Salida de Animales"
                : parte.pd_tipo === "CLIMA"
                  ? "Registro de Clima"
                  : parte.pd_tipo === "ACTIVIDAD"
                    ? "Actividad"
                    : parte.pd_tipo === "RECLASIFICACION"
                      ? "Reclasificación"
                      : "Parte Diario"}
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

            {/* Solo mostrar Lote y Fecha para tipos de movimiento de animales */}
            {(parte.pd_tipo === "ENTRADA" || parte.pd_tipo === "SALIDA") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Lote</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {detalles.length > 0 && detalles[0]?.detalle_lote
                      ? detalles[0].detalle_lote
                      : "Sin lote especificado"}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {formatDate(parte.pd_fecha)}
                  </div>
                </div>
              </div>
            )}

            {/* Para otros tipos, solo mostrar Fecha */}
            {parte.pd_tipo !== "ENTRADA" && parte.pd_tipo !== "SALIDA" && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {formatDate(parte.pd_fecha)}
                </div>
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Detalles</h3>

            {/* Tabla de detalles para movimientos de animales */}
            {(parte.pd_tipo === "ENTRADA" || parte.pd_tipo === "SALIDA") && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de movimiento</TableHead>
                      <TableHead>Categoría Animal</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(detalles) || detalles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No hay detalles disponibles
                        </TableCell>
                      </TableRow>
                    ) : (
                      detalles.map((detalle: any, index: number) => (
                        <TableRow key={detalle.detalle_id || index}>
                          <TableCell>{detalle.detalle_tipo_movimiento || "No especificado"}</TableCell>
                          <TableCell>{detalle.detalle_categoria_animal || "Sin categoría"}</TableCell>
                          <TableCell>{detalle.detalle_cantidad || 0}</TableCell>
                          <TableCell>{detalle.detalle_peso || 0} kg</TableCell>
                          <TableCell>{detalle.detalle_tipo_peso || "No especificado"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Detalles para CLIMA */}
            {parte.pd_tipo === "CLIMA" && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Indicador</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_indicador_nombre) || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Medida</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_medida) || "0"}{" "}
                      {(typeof detalles === "object" && detalles?.detalle_unidad_medida) || ""}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles para ACTIVIDAD/RECLASIFICACION */}
            {(parte.pd_tipo === "ACTIVIDAD" || parte.pd_tipo === "RECLASIFICACION") && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_tipo) || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Ubicación</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_ubicacion) || "No especificada"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detalles para INSUMOS */}
            {parte.pd_tipo === "INSUMOS" && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Insumo</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_insumo) || "No especificado"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cantidad</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_cantidad) || "0"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Unidad</Label>
                    <div className="mt-1 text-sm text-gray-900">
                      {(typeof detalles === "object" && detalles?.detalle_unidad_medida) || "No especificada"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nota */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Nota</Label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[100px]">
              {parte.pd_nota || "Sin notas adicionales"}
            </div>
          </div>
        </div>

        {/* Footer - Solo botón de cerrar */}
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
