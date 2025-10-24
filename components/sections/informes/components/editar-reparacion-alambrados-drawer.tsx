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
import { Plus, Trash2, Edit, Wrench, AlertCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import type { ParteDiario } from "@/lib/types"

interface EditarReparacionAlambradosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

interface ReparacionAlambrados {
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
  pd_actividades_potreros_detalle: Array<{
    id: number
    potrero_id: number
    pd_potreros: {
      id: number
      nombre: string
    }
  }>
  pd_usuarios: {
    nombres: string
    apellidos: string
  }
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

interface Potrero {
  id: number
  nombre: string
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_disponible: number
  es_original: boolean
  cantidad_original?: number
}

export default function EditarReparacionAlambradosDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarReparacionAlambradosDrawerProps) {
  const [actividad, setActividad] = useState<ReparacionAlambrados | null>(null)
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")
  const [potreroId, setPotreroId] = useState<string>("")

  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  const [detalles, setDetalles] = useState<DetalleInsumo[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  const { establecimientoSeleccionado } = useEstablishment()
  const { usuario } = useUser()

  useEffect(() => {
    if (isOpen && parte.pd_detalles?.detalle_id) {
      console.log("🔄 Cargando datos de reparación de alambrados para edición, parte ID:", parte.pd_detalles.detalle_id)
      fetchReparacionAlambrados()
    }
  }, [isOpen, parte.pd_detalles?.detalle_id])

  useEffect(() => {
    if (insumoId) {
      const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
      if (insumoSeleccionado) {
        setUnidadMedidaActual(insumoSeleccionado.unidad_medida)

        const stockCalculado = calcularStockDisponible(insumoId, editandoDetalle)
        setStockDisponible(stockCalculado)

        console.log(`📊 Stock calculado para insumo ${insumoId}:`, {
          stockBase: insumoSeleccionado.cantidad_disponible,
          stockCalculado,
          editandoDetalle,
          detallesActuales: detalles.length,
        })
      }
    } else {
      setUnidadMedidaActual("")
      setStockDisponible(0)
    }
  }, [insumoId, insumosExistentes, editandoDetalle, detalles])

  const calcularStockDisponible = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoSeleccionado) return 0

    const stockBase = insumoSeleccionado.cantidad_disponible

    if (indexEditando !== null && detalles[indexEditando]?.es_original) {
      const detalleEditado = detalles[indexEditando]
      if (detalleEditado.insumo_id.toString() === insumoIdSeleccionado) {
        const cantidadOriginal = detalleEditado.cantidad_original || detalleEditado.cantidad
        const stockDisponible = stockBase + cantidadOriginal

        console.log(`📊 Editando línea original - insumo ${insumoIdSeleccionado}:`, {
          stockBase,
          cantidadOriginal,
          stockDisponible,
        })

        return Math.max(0, stockDisponible)
      }
    }

    const detallesOriginalesIniciales = parte.pd_detalles?.detalles_insumos || []

    const cantidadDescontadaOriginalmente = detallesOriginalesIniciales
      .filter((detalle: any) => detalle.insumo_id?.toString() === insumoIdSeleccionado)
      .reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0)

    const cantidadOriginalPresente = detalles
      .filter(
        (detalle, index) =>
          detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + (detalle.cantidad_original || detalle.cantidad), 0)

    const cantidadLiberada = cantidadDescontadaOriginalmente - cantidadOriginalPresente

    const cantidadNuevosUsada = detalles
      .filter(
        (detalle, index) =>
          !detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + detalle.cantidad, 0)

    const stockDisponible = stockBase + cantidadLiberada - cantidadNuevosUsada

    console.log(`📊 Cálculo para nueva línea - insumo ${insumoIdSeleccionado}:`, {
      stockBase,
      cantidadDescontadaOriginalmente,
      cantidadOriginalPresente,
      cantidadLiberada,
      cantidadNuevosUsada,
      stockDisponible,
    })

    return Math.max(0, stockDisponible)
  }

  const fetchReparacionAlambrados = async () => {
    if (!parte.pd_detalles?.detalle_id) return

    setLoading(true)
    try {
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
          insumos: "OPCIONAL",
        },
        pd_usuarios: {
          nombres: parte.pd_usuario_nombres || "",
          apellidos: parte.pd_usuario_apellidos || "",
        },
        pd_actividades_insumos_detalle: (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
          id: insumo.id,
          insumo_id: insumo.insumo_id,
          cantidad: insumo.cantidad,
          pd_insumos: {
            id: insumo.insumo_id,
            nombre: insumo.insumo,
            pd_unidad_medida_insumos: {
              nombre: insumo.unidad_medida || "",
            },
          },
        })),
        pd_actividades_potreros_detalle: (parte.pd_detalles?.detalles_potreros || []).map((potrero: any) => ({
          id: potrero.id,
          potrero_id: potrero.potrero_id,
          pd_potreros: {
            id: potrero.potrero_id,
            nombre: potrero.potrero_nombre,
          },
        })),
      }

      console.log("✅ Datos de reparación de alambrados cargados para edición:", actividadData)
      setActividad(actividadData)

      setFecha(new Date(actividadData.fecha + "T00:00:00"))
      setHora(actividadData.hora.slice(0, 5))
      setNota(actividadData.nota || "")

      if (actividadData.pd_actividades_potreros_detalle.length > 0) {
        setPotreroId(actividadData.pd_actividades_potreros_detalle[0].potrero_id.toString())
      }

      await Promise.all([fetchInsumosExistentes(), fetchPotreros()])

      const detallesMap = actividadData.pd_actividades_insumos_detalle.map((detalle: any) => ({
        insumo_id: detalle.insumo_id,
        cantidad: detalle.cantidad,
        insumo_nombre: detalle.pd_insumos.nombre,
        unidad_medida: detalle.pd_insumos.pd_unidad_medida_insumos?.nombre || "",
        cantidad_disponible: 0,
        es_original: true,
        cantidad_original: detalle.cantidad,
      }))
      setDetalles(detallesMap)

      console.log("✅ Datos cargados para edición:", {
        insumos: detallesMap.length,
        detallesOriginales: detallesMap.filter((d) => d.es_original).length,
      })
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

  const fetchInsumosExistentes = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingInsumos(true)
    try {
      const response = await fetch(
        `/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}&clase_insumo_id=4`,
      )
      if (!response.ok) throw new Error("Error al cargar insumos")

      const data = await response.json()
      const insumosConUnidadCorrecta = (data.insumos || []).map((insumo: any) => ({
        ...insumo,
        unidad_medida: insumo.unidad_medida_uso || insumo.unidad_medida || "",
      }))
      setInsumosExistentes(insumosConUnidadCorrecta)

      setDetalles((prevDetalles) =>
        prevDetalles.map((detalle) => {
          const insumoExistente = insumosConUnidadCorrecta.find(
            (i: InsumoExistente) => i.insumo_id === detalle.insumo_id.toString(),
          )
          return {
            ...detalle,
            cantidad_disponible: insumoExistente ? insumoExistente.cantidad_disponible : 0,
            unidad_medida: detalle.unidad_medida || (insumoExistente ? insumoExistente.unidad_medida : ""),
          }
        }),
      )
    } catch (error) {
      console.error("Error fetching insumos existentes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar insumos disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const fetchPotreros = async () => {
    if (!establecimientoSeleccionado) return

    try {
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar potreros")

      const data = await response.json()
      setPotreros(data.potreros || [])
    } catch (error) {
      console.error("Error fetching potreros:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar potreros",
        variant: "destructive",
      })
    }
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!actividad) errores.push("Debe seleccionar un tipo de actividad")
    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (!potreroId) errores.push("Debe seleccionar un potrero")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")

    const cantidadNumerica = Number.parseInt(cantidad) || 0
    const stockDisponibleCalculado = calcularStockDisponible(insumoId, editandoDetalle)

    if (cantidadNumerica > stockDisponibleCalculado) {
      errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponibleCalculado})`)
    }

    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)
      return
    }

    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)

    if (!insumoSeleccionado) return

    const nuevoDetalle: DetalleInsumo = {
      insumo_id: Number.parseInt(insumoId),
      insumo_nombre: insumoSeleccionado.nombre_insumo,
      cantidad: Number.parseInt(cantidad),
      unidad_medida: insumoSeleccionado.unidad_medida,
      cantidad_disponible: insumoSeleccionado.cantidad_disponible,
      es_original: false,
    }

    if (editandoDetalle !== null) {
      const nuevosDetalles = [...detalles]
      const detalleAnterior = nuevosDetalles[editandoDetalle]

      if (detalleAnterior.es_original) {
        nuevoDetalle.es_original = true
        nuevoDetalle.cantidad_original = detalleAnterior.cantidad_original
      }

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
    setStockDisponible(0)
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
      const response = await fetch(`/api/reparacion-alambrados/${actividad?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          potrero_id: Number.parseInt(potreroId),
          detalles: detalles,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar reparación de alambrados")
      }

      toast({
        title: "✅ Reparación Actualizada",
        description: `Se actualizó la reparación con ${detalles.length} insumos`,
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating reparacion alambrados:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar reparación de alambrados",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const eliminarActividad = async () => {
    if (!actividad?.id || !usuario?.id) {
      toast({
        title: "❌ Error",
        description: "No se pudo identificar la actividad o el usuario",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/reparacion-alambrados/${actividad.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_user_id: usuario.id,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar reparación de alambrados")
      }

      toast({
        title: "✅ Reparación Eliminada",
        description: "La reparación de alambrados ha sido eliminada correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting reparacion alambrados:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al eliminar reparación de alambrados",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    onClose?.()
    limpiarFormularioDetalle()
    setErrores([])
  }

  const puedeEliminar = () => {
    if (!parte) return false

    try {
      let detalles
      if (typeof parte.pd_detalles === "string") {
        detalles = JSON.parse(parte.pd_detalles)
      } else {
        detalles = parte.pd_detalles
      }

      return detalles?.detalle_deleteable === true
    } catch {
      return false
    }
  }

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const opcionesPotreros = potreros.map((potrero) => ({
    value: potrero.id.toString(),
    label: potrero.nombre,
  }))

  const nombreCompleto = actividad ? `${actividad.pd_usuarios.nombres} ${actividad.pd_usuarios.apellidos}`.trim() : ""

  const stockDisponibleReal = insumoId ? calcularStockDisponible(insumoId, editandoDetalle) : 0

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="editar-reparacion-alambrados-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-600" />
            Editar Reparación de Alambrados
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="editar-reparacion-alambrados-description" className="sr-only">
          Editar los detalles de una reparación de alambrados registrada
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando reparación de alambrados...</div>
            </div>
          ) : actividad ? (
            <div className="space-y-6">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                      <Input value={actividad.pd_tipo_actividades?.nombre || ""} disabled className="bg-gray-50" />
                      <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Potrero *</Label>
                      <CustomCombobox
                        options={opcionesPotreros}
                        value={potreroId}
                        onValueChange={setPotreroId}
                        placeholder="Selecciona potrero..."
                        searchPlaceholder="Buscar potrero..."
                        emptyMessage="No se encontraron potreros."
                      />
                    </div>
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

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalles</h3>
                  <Button
                    onClick={() => setMostrarFormDetalle(true)}
                    disabled={!actividad}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar línea
                  </Button>
                </div>

                {mostrarFormDetalle && (
                  <div className="bg-gray-50 border rounded-lg p-6 mb-4">
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
                            emptyMessage="No se encontraron insumos disponibles."
                            loading={loadingInsumos}
                          />
                        </div>

                        <div>
                          <Label>
                            Cantidad * {insumoId && stockDisponibleReal >= 0 && `(Disponible: ${stockDisponibleReal})`}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={cantidad}
                              onChange={(e) => setCantidad(e.target.value)}
                              placeholder="Ej: 5"
                              min="1"
                              max={stockDisponibleReal}
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

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                      <div className="col-span-4">Insumo</div>
                      <div className="col-span-2">Cantidad</div>
                      <div className="col-span-2">Unidad Medida</div>
                      <div className="col-span-2 text-center">Acciones</div>
                    </div>
                  </div>

                  <div className="min-h-[100px]">
                    {detalles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                    ) : (
                      <div className="divide-y">
                        {detalles.map((detalle, index) => (
                          <div key={index} className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50">
                            <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                            <div className="col-span-2">{detalle.cantidad}</div>
                            <div className="col-span-2 text-gray-600">{detalle.unidad_medida}</div>
                            <div className="col-span-2 flex justify-center gap-2">
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
            <div className="text-center py-8 text-gray-500">No se pudo cargar la información de la reparación</div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar esta reparación de alambrados? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={eliminarActividad} disabled={deleting}>
                  {deleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t p-4 flex justify-between">
          {puedeEliminar() ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={saving || deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          ) : (
            <div className="flex flex-col">
              <Button variant="outline" disabled className="text-gray-400 cursor-not-allowed bg-transparent">
                Eliminar
              </Button>
              <span className="text-xs text-gray-500 mt-1">Esta actividad no puede ser eliminada</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? "Guardando..." : "Actualizar Actividad"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
