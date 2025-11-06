"use client"

import { useState, useEffect } from "react"
import { X, Users } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import type { ParteDiario } from "@/lib/types"

interface VerSenaladaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
}

interface SenaladaData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    detalle_tipo: string
    detalle_ubicacion: string
  }
  detalles: Array<{
    id: number
    lote_id: number
    categoria_animal: string
    cantidad: number
    peso: number
    tipo_peso: string
  }>
  lotes: { [key: number]: string }
}

export default function VerSenaladaDrawer({ isOpen, onClose, parte }: VerSenaladaDrawerProps) {
  const [senaladaData, setSenaladaData] = useState<SenaladaData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && parte && parte.pd_tipo === "ACTIVIDAD") {
      cargarDatosSeñalada()
    }
  }, [isOpen, parte])

  const cargarDatosSeñalada = async () => {
    if (!parte?.pd_detalles) return

    setLoading(true)
    setError(null)

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos de Señalada desde pd_detalles:", detalles)

      // Obtener nombres de lotes si hay detalles de animales
      const lotesMap: { [key: number]: string } = {}
      if (detalles.detalles_animales && detalles.detalles_animales.length > 0) {
        const loteIds = [...new Set(detalles.detalles_animales.map((d: any) => d.lote_id).filter(Boolean))]
        console.log("🔍 IDs de lotes a buscar:", loteIds)

        if (loteIds.length > 0) {
          try {
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
      const senaladaData: SenaladaData = {
        actividad: {
          id: parte.pd_id || 0,
          tipo_actividad_id: detalles.detalle_tipo_id || 0,
          fecha: parte.pd_fecha || "",
          hora: parte.pd_hora || "",
          nota: parte.pd_nota || null,
          detalle_tipo: detalles.detalle_tipo || "Señalada",
          detalle_ubicacion: detalles.detalle_ubicacion || "No especificada",
        },
        detalles: detalles.detalles_animales || [],
        lotes: lotesMap,
      }

      console.log("✅ Datos de señalada procesados:", senaladaData)
      setSenaladaData(senaladaData)
    } catch (err) {
      console.error("❌ Error parseando detalles de Señalada:", err)
      setError("Error al cargar los datos de la señalada")
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
    const nombreLote = senaladaData?.lotes[loteId]
    if (nombreLote) {
      return nombreLote
    }
    return `Lote ${loteId}`
  }

  // Agrupar detalles por lote para mostrar machos y hembras juntos
  const detallesAgrupados = senaladaData?.detalles
    ? Object.values(
        senaladaData.detalles.reduce((acc: any, detalle) => {
          const key = detalle.lote_id
          if (!acc[key]) {
            acc[key] = {
              lote_id: detalle.lote_id,
              lote_nombre: getLoteNombre(detalle.lote_id),
              machos: { cantidad: 0, peso: 0 },
              hembras: { cantidad: 0, peso: 0 },
            }
          }

          if (detalle.categoria_animal === "Terneros Macho") {
            acc[key].machos = { cantidad: detalle.cantidad, peso: detalle.peso }
          } else if (detalle.categoria_animal === "Terneros Hembra") {
            acc[key].hembras = { cantidad: detalle.cantidad, peso: detalle.peso }
          }

          return acc
        }, {}),
      )
    : []

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Ver Señalada
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la señalada...</div>
            </div>
          )}

          {error && !senaladaData && (
            <div className="text-center py-8">
              <div className="text-red-600">Error: {error}</div>
            </div>
          )}

          {(!loading || senaladaData) && (
            <>
              {/* Datos Generales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

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
                      {getUserDisplayName()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                    {senaladaData?.actividad?.detalle_tipo || "Señalada"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatDate(senaladaData?.actividad?.fecha || parte.pd_fecha)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {formatTime(senaladaData?.actividad?.hora || parte.pd_hora)}
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
                    <div className="grid grid-cols-10 gap-2 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-2">Lote</div>
                      <div className="col-span-2 text-center">Cant. Machos</div>
                      <div className="col-span-2 text-center">Cant. Hembras</div>
                      <div className="col-span-2 text-center">Peso Machos</div>
                      <div className="col-span-2 text-center whitespace-nowrap">Peso Hembras</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {!senaladaData?.detalles || senaladaData.detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles de animales disponibles</div>
                    ) : (
                      <div className="divide-y">
                        {detallesAgrupados.map((detalle: any, index) => (
                          <div key={index} className="grid grid-cols-10 gap-2 p-4 text-sm hover:bg-gray-50">
                            <div className="col-span-2 font-medium">{detalle.lote_nombre}</div>
                            <div className="col-span-2 text-center">{detalle.machos.cantidad}</div>
                            <div className="col-span-2 text-center">{detalle.hembras.cantidad}</div>
                            <div className="col-span-2 text-center">{detalle.machos.peso} kg</div>
                            <div className="col-span-2 text-center">{detalle.hembras.peso} kg</div>
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
                  {senaladaData?.actividad?.nota || parte.pd_nota || ""}
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
