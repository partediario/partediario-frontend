"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Plus, Trash2, Edit, Package, AlertCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface EditarActividadInsumosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

interface ActividadInsumos {
  id: number
  fecha: string
  hora: string
  nota?: string
  pd_tipo_actividades: {
    id: number
    nombre: string
    descripcion?: string
    ubicacion?: string
    animales: string
    insumos: string
  }
  pd_actividades_insumos_detalle: Array<{
    id: number
    insumo_id: number
    cantidad: number
    pd_insumos: {
      id: number
      nombre: string
      pd_unidad_medida_insumos?: {
        nombre: string
      }
    }
  }>
  pd_usuarios: {
    nombres: string
    apellidos: string
  }
}

interface Insumo {
  id: number
  nombre: string
  pd_unidad_medida_insumos?: {
    nombre: string
  }
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
}

export default function EditarActividadInsumosDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarActividadInsumosDrawerProps) {
  const [actividad, setActividad] = useState<ActividadInsumos | null>(null)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [saving, setSaving] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleInsumo[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  useEffect(() => {
    if (isOpen && parte.pd_detalles?.detalle_id) {
      console.log("🔄 Cargando datos de actividad para edición, parte ID:", parte.pd_detalles.detalle_id)
      fetchActividadInsumos()
    }
  }, [isOpen, parte.pd_detalles?.detalle_id])

  const fetchActividadInsumos = async () => {
    if (!parte.pd_detalles?.detalle_id) return

    setLoading(true)
    try {
      // Primero cargar los datos básicos desde el parte diario
      const actividadData = {
        id: parte.pd_detalles.detalle_id,
        fecha: parte.pd_fecha,
        hora: parte.pd_hora,
        nota: parte.pd_nota,
        pd_tipo_actividades: {
          id: parte.pd_detalles.detalle_tipo_id || 0,
          nombre: parte.pd_detalles.detalle_tipo || "",
          ubicacion: parte.pd_detalles.detalle_ubicacion || "",
          animales: "NO APLICA",
          insumos: "OBLIGATORIO",
        },
        pd_usuarios: {
          nombres: parte.pd_usuario_nombres || "",
          apellidos: parte.pd_usuario_apellidos || "",
        },
        // Mapear los insumos desde pd_detalles.detalles_insumos
        pd_actividades_insumos_detalle: (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
          id: insumo.id,
          insumo_id: insumo.insumo_id, // ✅ Usar insumo_id correcto
          cantidad: insumo.cantidad,
          pd_insumos: {
            id: insumo.insumo_id, // ✅ Usar insumo_id correcto
            nombre: insumo.insumo,
            pd_unidad_medida_insumos: {
              nombre: insumo.unidad_medida || "",
            },
          },
        })),
      }

      console.log("✅ Datos de actividad cargados para edición:", actividadData)
      setActividad(actividadData)

      // Llenar formulario con los datos
      setFecha(new Date(actividadData.fecha + "T00:00:00"))
      setHora(actividadData.hora.slice(0, 5))
      setNota(actividadData.nota || "")

      // Mapear los detalles de insumos
      const detallesMap = actividadData.pd_actividades_insumos_detalle.map((detalle: any) => ({
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
        insumo_nombre: detalle.pd_insumos.nombre,
        unidad_medida: detalle.pd_insumos.pd_unidad_medida_insumos?.nombre || "",
      }))
      setDetalles(detallesMap)

      // Cargar lista de insumos disponibles
      await fetchInsumos()
    } catch (error) {
      console.error("❌ Error:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Actualizar unidad de medida cuando cambia el insumo seleccionado
  useEffect(() => {
    if (insumoId) {
      const insumoSeleccionado = insumos.find((i) => i.id.toString() === insumoId)
      if (insumoSeleccionado?.pd_unidad_medida_insumos) {
        setUnidadMedidaActual(insumoSeleccionado.pd_unidad_medida_insumos.nombre)
      }
    } else {
      setUnidadMedidaActual("")
    }
  }, [insumoId, insumos])

  const fetchInsumos = async () => {
    setLoadingInsumos(true)
    try {
      const response = await fetch("/api/insumos")
      if (!response.ok) throw new Error("Error al cargar insumos")

      const data = await response.json()
      setInsumos(data.insumos || [])
    } catch (error) {
      console.error("Error fetching insumos:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar insumos",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!actividad) errores.push("Debe seleccionar un tipo de actividad")
    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detalles.length === 0) errores.push("Debe agregar al menos un detalle")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")

    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)
      return
    }

    const insumoSeleccionado = insumos.find((i) => i.id.toString() === insumoId)

    if (!insumoSeleccionado) return

    const nuevoDetalle: DetalleInsumo = {
      insumo_id: Number.parseInt(insumoId),
      insumo_nombre: insumoSeleccionado.nombre,
      cantidad: Number.parseInt(cantidad),
      unidad_medida: insumoSeleccionado.pd_unidad_medida_insumos?.nombre || "",
    }

    if (editandoDetalle !== null) {
      const nuevosDetalles = [...detalles]
      nuevosDetalles[editandoDetalle] = nuevoDetalle
      setDetalles(nuevosDetalles)
      setEditandoDetalle(null)
    } else {
      setDetalles([...detalles, nuevoDetalle])
    }

    limpiarFormularioDetalle()
  }

  const editarDetalle = (index: number) => {
    const detalle = detalles[index]
    setInsumoId(detalle.insumo_id.toString())
    setCantidad(detalle.cantidad.toString())
    setEditandoDetalle(index)
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalle = () => {
    setInsumoId("")
    setCantidad("")
    setUnidadMedidaActual("")
    setMostrarFormDetalle(false)
    setEditandoDetalle(null)
    setErroresDetalle([])
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/actividades-insumos/${actividad?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          detalles: detalles,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar actividad")
      }

      toast({
        title: "✅ Actividad Actualizada",
        description: `Se actualizaron ${detalles.length} insumos utilizados`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating actividad insumos:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar actividad",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    onClose?.()
    limpiarFormularioDetalle()
    setErrores([])
  }

  const opcionesInsumos = insumos.map((insumo) => ({
    value: insumo.id.toString(),
    label: insumo.nombre,
  }))

  const nombreCompleto = actividad ? `${actividad.pd_usuarios.nombres} ${actividad.pd_usuarios.apellidos}`.trim() : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="editar-actividad-insumos-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Editar Actividad con Insumos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="editar-actividad-insumos-description" className="sr-only">
          Editar los detalles de una actividad con insumos registrada
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando actividad...</div>
            </div>
          ) : actividad ? (
            <div className="space-y-6">
              {/* Errores principales */}
              {errores.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Se encontraron {errores.length} errores:
                  </div>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {errores.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Datos Generales */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos Generales</h3>
                <div className="space-y-4">
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
                        {nombreCompleto}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipo-actividad">Tipo de Actividad *</Label>
                    <Input value={actividad.pd_tipo_actividades?.nombre || ""} disabled className="bg-gray-50" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha *</Label>
                      <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                    </div>
                    <div>
                      <Label>Hora *</Label>
                      <CustomTimePicker time={hora} onTimeChange={setHora} placeholder="Seleccionar hora" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalles *</h3>
                  <Button
                    onClick={() => setMostrarFormDetalle(true)}
                    disabled={!actividad}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar línea
                  </Button>
                </div>

                {/* Formulario de detalle expandido */}
                {mostrarFormDetalle && (
                  <div className="bg-gray-50 border rounded-lg p-6 mb-4">
                    {/* Errores de detalle */}
                    {erroresDetalle.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                          <AlertCircle className="w-4 h-4" />
                          Errores encontrados:
                        </div>
                        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                          {erroresDetalle.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <h4 className="font-medium mb-4">
                      {editandoDetalle !== null ? "Editar Detalle" : "Nuevo Detalle"}
                    </h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Insumo *</Label>
                          <CustomCombobox
                            options={opcionesInsumos}
                            value={insumoId}
                            onValueChange={setInsumoId}
                            placeholder="Selecciona insumo..."
                            searchPlaceholder="Buscar insumo..."
                            emptyMessage="No se encontraron insumos."
                            loading={loadingInsumos}
                          />
                        </div>

                        <div>
                          <Label>Cantidad *</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={cantidad}
                              onChange={(e) => setCantidad(e.target.value)}
                              placeholder="Ej: 5"
                              min="1"
                              className="flex-1"
                            />
                            {unidadMedidaActual && (
                              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded border min-w-[80px] text-center">
                                {unidadMedidaActual}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button onClick={agregarDetalle} className="bg-blue-600 hover:bg-blue-700">
                        {editandoDetalle !== null ? "Actualizar" : "Agregar"}
                      </Button>
                      <Button variant="outline" onClick={limpiarFormularioDetalle}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tabla de detalles */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Headers de la tabla */}
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-4">Insumo</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-3">Unidad Medida</div>
                      <div className="col-span-3 text-center">Acciones</div>
                    </div>
                  </div>

                  {/* Contenido de la tabla */}
                  <div className="min-h-[100px]">
                    {detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                    ) : (
                      <div className="divide-y">
                        {detalles.map((detalle, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-gray-50">
                            <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                            <div className="col-span-2">{detalle.cantidad}</div>
                            <div className="col-span-3 text-gray-600">{detalle.unidad_medida}</div>
                            <div className="col-span-3 flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editarDetalle(index)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarDetalle(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nota */}
              <div>
                <Label htmlFor="nota">Nota</Label>
                <Textarea
                  id="nota"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se pudo cargar la información de la actividad</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Guardando..." : "Actualizar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
