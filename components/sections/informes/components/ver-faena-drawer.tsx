"use client"

import { useState, useEffect } from "react"
import { X, Users } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerFaenaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface FaenaData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    detalle_tipo: string
    detalle_ubicacion: string
    tipo_movimiento_animal_id: number | null
  }
  detalles: Array<{
    id: number
    lote_id: number
    categoria_animal: string
    cantidad: number
    peso: number
    tipo_peso: string
  }>
  tipoMovimiento: string | null
  lotes: { [key: number]: string }
}

export default function VerFaenaDrawer({ isOpen, onClose, parte }: VerFaenaDrawerProps) {
  const [faenaData, setFaenaData] = useState<FaenaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosFaena()
    }
  }, [isOpen, parte])

  const cargarDatosFaena = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Faena desde pd_detalles:", detalles)

      // Obtener nombre del tipo de movimiento
      let tipoMovimientoNombre = null
      if (detalles.tipo_movimiento_animal_id) {
        try {
          console.log("🔍 Buscando tipo de movimiento con ID:", detalles.tipo_movimiento_animal_id)
          const response = await fetch(`/api/tipos-movimiento?empresa_id=1&direccion=SALIDA`)
          if (response.ok) {
            const data = await response.json()
            console.log("📋 Tipos de movimiento disponibles:", data.tipos)
            const tipoMovimiento = data.tipos?.find((tipo: any) => tipo.id === detalles.tipo_movimiento_animal_id)
            tipoMovimientoNombre = tipoMovimiento?.nombre || null
            console.log("✅ Tipo de movimiento encontrado:", tipoMovimientoNombre)
          } else {
            console.error("❌ Error al obtener tipos de movimiento:", response.status)
          }
        } catch (err) {
          console.error("❌ Error cargando tipo de movimiento:", err)
        }
      } else {
        console.log("⚠️ No hay tipo_movimiento_animal_id en los detalles")
      }

      // Obtener nombres de lotes si hay detalles de animales
      const lotesMap: { [key: number]: string } = {}
      if (detalles.detalles_animales && detalles.detalles_animales.length > 0) {
        const loteIds = [...new Set(detalles.detalles_animales.map((d: any) => d.lote_id).filter(Boolean))]
        console.log("🔍 IDs de lotes a buscar:", loteIds)

        if (loteIds.length > 0) {
          try {
            // Necesitamos el establecimiento_id para obtener los lotes
            const establecimientoId = parte.pd_establecimiento_id || 1
            const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoId}`)
            if (response.ok) {
              const data = await response.json()
              console.log("📋 Lotes disponibles:", data.lotes)
              data.lotes?.forEach((lote: any) => {
                if (loteIds.includes(lote.id)) {
                  lotesMap[lote.id] = lote.nombre
                }
              })
              console.log("✅ Mapa de lotes creado:", lotesMap)
            } else {
              console.error("❌ Error al obtener lotes:", response.status)
            }
          } catch (err) {
            console.error("❌ Error cargando nombres de lotes:", err)
          }
        }
      }

      // Crear estructura de datos
      const faenaData: FaenaData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Faena",
          detalle_ubicacion: detalles.detalle_ubicacion || "No especificada",
          tipo_movimiento_animal_id: detalles.tipo_movimiento_animal_id || null,
        },
        detalles: detalles.detalles_animales || [],
        tipoMovimiento: tipoMovimientoNombre,
        lotes: lotesMap,
      }

      console.log("✅ Datos de faena procesados:", faenaData)
      setFaenaData(faenaData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Faena:", err)
      setError("Error al cargar los datos de la faena")
    } finally {
      setLoading(false)
    }
  }

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

  const getLoteNombre = (loteId: number) => {
    if (!loteId) return "Sin lote"
    const nombreLote = faenaData?.lotes[loteId]
    if (nombreLote) {
      return nombreLote
    }
    return `Lote ${loteId}`
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Ver Faena
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la faena...</div>
            </div>
          )}

          {error && !faenaData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || faenaData) && (
            <>
              {/* Datos Generales */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatDate(faenaData?.actividad?.fecha || parte.pd_fecha)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Movimiento</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {faenaData?.tipoMovimiento || "No especificado"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles de Animales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles de Animales</h3>

                <div className="border rounded-lg overflow-hidden">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-2">Lote</div>
                      <div className="col-span-3">Categoría Animal</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-2">Peso</div>
                      <div className="col-span-3">Tipo</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!faenaData?.detalles || faenaData.detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles de animales disponibles</div>
                    ) : (
                      <div className="divide-y">
                        {faenaData?.detalles?.map((detalle, index) => (
                          <div
                            key={detalle.id || index}
                            className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-gray-50"
                          >
                            <div className="col-span-2 font-medium">{getLoteNombre(detalle.lote_id)}</div>
                            <div className="col-span-3">{detalle.categoria_animal || "Sin categoría"}</div>
                            <div className="col-span-2">{detalle.cantidad || 0}</div>
                            <div className="col-span-2">{detalle.peso || 0} kg</div>
                            <div className="col-span-3">{detalle.tipo_peso || "No especificado"}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Nota</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 min-h-[100px]">
                  {faenaData?.actividad?.nota || parte.pd_nota || ""}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer - Solo botón de cerrar */}
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
