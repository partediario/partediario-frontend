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
import { Plus, Trash2, Edit, Syringe, AlertCircle, X, Check, Search, ChevronDown } from "lucide-react"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface Lote {
  id: number
  nombre: string
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_disponible: number
  es_original?: boolean
  cantidad_original?: number
}

interface EditarSanitacionDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

export default function EditarSanitacionDrawer({ isOpen, onClose, parte, onSuccess }: EditarSanitacionDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [lotes, setLotes] = useState<Lote[]>([])
  const [lotesSeleccionados, setLotesSeleccionados] = useState<number[]>([])
  const [mostrarSelectorLotes, setMostrarSelectorLotes] = useState(false)
  const [busquedaLotes, setBusquedaLotes] = useState<string>("")
  const [loadingLotes, setLoadingLotes] = useState(false)

  // Datos para insumos (vacunas - clase_insumo_id = 2)
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle insumos
  const [mostrarFormDetalleInsumos, setMostrarFormDetalleInsumos] = useState(false)
  const [editandoDetalleInsumos, setEditandoDetalleInsumos] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidadInsumos, setCantidadInsumos] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Detalles agregados
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalleInsumos, setErroresDetalleInsumos] = useState<string[]>([])

  const { currentEstablishment } = useCurrentEstablishment()
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const nombreCompleto = parte ? `${parte.pd_usuario_nombres || ""} ${parte.pd_usuario_apellidos || ""}`.trim() : ""

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada && parte.pd_detalles?.detalle_id) {
      cargarDatosIniciales()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada, parte.pd_detalles?.detalle_id])

  // Actualizar unidad de medida y stock cuando cambia el insumo seleccionado
  useEffect(() => {
    if (insumoId) {
      const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
      if (insumoSeleccionado) {
        setUnidadMedidaActual(insumoSeleccionado.unidad_medida)
        const stockCalculado = calcularStockDisponibleInsumos(insumoId, editandoDetalleInsumos)
        setStockDisponible(stockCalculado)
      }
    } else {
      setUnidadMedidaActual("")
      setStockDisponible(0)
    }
  }, [insumoId, insumosExistentes, editandoDetalleInsumos, detallesInsumos])

  const cargarDatosIniciales = async () => {
    setLoading(true)
    try {
      // Set initial form data from parte
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora.slice(0, 5))
      setNota(parte.pd_nota || "")

      await Promise.all([fetchLotes(), fetchInsumosExistentes()])

      const response = await fetch(`/api/actividades-mixtas/${parte.pd_id}`)

      if (response.ok) {
        const actividadData = await response.json()

        const loteIds = (actividadData.pd_actividades_animales_detalle || [])
          .map((animal: any) => animal.lote_id)
          .filter(Boolean)
        const loteIdsUnicos = Array.from(new Set(loteIds))
        setLotesSeleccionados(loteIdsUnicos)

        let insumosData = []

        if (parte.pd_detalles?.detalles_insumos && parte.pd_detalles.detalles_insumos.length > 0) {
          insumosData = parte.pd_detalles.detalles_insumos.map((insumo: any) => ({
            insumo_id: insumo.insumo_id || 0,
            insumo_nombre: insumo.insumo || "",
            cantidad: insumo.cantidad || 0,
            unidad_medida: insumo.unidad_medida || "",
            cantidad_disponible: 0,
            es_original: true,
            cantidad_original: insumo.cantidad || 0,
          }))
        } else {
          insumosData = (actividadData.pd_actividades_insumos_detalle || []).map((insumo: any) => ({
            insumo_id: insumo.insumo_id || 0,
            insumo_nombre: insumo.pd_insumos?.nombre || "",
            cantidad: insumo.cantidad || 0,
            unidad_medida: insumo.pd_insumos?.pd_unidad_medida_insumos?.nombre || "",
            cantidad_disponible: 0,
            es_original: true,
            cantidad_original: insumo.cantidad || 0,
          }))
        }

        setDetallesInsumos(insumosData)

        console.log("Datos cargados desde API:", {
          lotes: loteIdsUnicos.length,
          insumos: insumosData.length,
        })
      } else {
        const loteIds = (parte.pd_detalles?.detalles_animales || [])
          .map((animal: any) => animal.lote_id)
          .filter(Boolean)
        const loteIdsUnicos = Array.from(new Set(loteIds))
        setLotesSeleccionados(loteIdsUnicos)

        const vacunas = (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
          insumo_id: insumo.insumo_id || 0,
          insumo_nombre: insumo.insumo || "",
          cantidad: insumo.cantidad || 0,
          unidad_medida: insumo.unidad_medida || "",
          cantidad_disponible: 0,
          es_original: true,
          cantidad_original: insumo.cantidad || 0,
        }))
        setDetallesInsumos(vacunas)

        console.log("Datos cargados desde pd_detalles (fallback):", {
          lotes: loteIdsUnicos.length,
          insumos: vacunas.length,
        })
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar datos iniciales",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLotes = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingLotes(true)
    try {
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar lotes")

      const data = await response.json()
      setLotes(data.lotes || [])
    } catch (error) {
      console.error("Error fetching lotes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar lotes",
        variant: "destructive",
      })
    } finally {
      setLoadingLotes(false)
    }
  }

  const fetchInsumosExistentes = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingInsumos(true)
    try {
      const response = await fetch(
        `/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}&clase_insumo_id=2`,
      )
      if (!response.ok) throw new Error("Error al cargar vacunas")

      const data = await response.json()
      setInsumosExistentes(data.insumos || [])
    } catch (error) {
      console.error("Error fetching insumos existentes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar vacunas disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const toggleLoteSeleccion = (loteId: number) => {
    setLotesSeleccionados((prev) => (prev.includes(loteId) ? prev.filter((id) => id !== loteId) : [...prev, loteId]))
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")

    const tieneLotesSeleccionados = lotesSeleccionados.length > 0
    const tieneDetalles = detallesInsumos.length > 0
    const tieneNota = nota.trim().length > 0

    if (!tieneLotesSeleccionados && !tieneDetalles && !tieneNota) {
      errores.push("Debe seleccionar lotes, agregar vacunas, o escribir una nota")
    }

    return errores
  }

  const validarDetalleInsumos = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar una vacuna")
    if (!cantidadInsumos || Number.parseInt(cantidadInsumos) <= 0) errores.push("La cantidad debe ser mayor a 0")

    const cantidadNumerica = Number.parseInt(cantidadInsumos) || 0
    const stockDisponibleCalculado = calcularStockDisponibleInsumos(insumoId, editandoDetalleInsumos)

    if (cantidadNumerica > stockDisponibleCalculado) {
      errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponibleCalculado})`)
    }

    return errores
  }

  const agregarDetalleInsumos = () => {
    const erroresValidacion = validarDetalleInsumos()
    if (erroresValidacion.length > 0) {
      setErroresDetalleInsumos(erroresValidacion)
      return
    }

    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)

    if (!insumoSeleccionado) return

    const nuevoDetalle: DetalleInsumo = {
      insumo_id: Number.parseInt(insumoId),
      insumo_nombre: insumoSeleccionado.nombre_insumo,
      cantidad: Number.parseInt(cantidadInsumos),
      unidad_medida: insumoSeleccionado.unidad_medida,
      cantidad_disponible: insumoSeleccionado.cantidad_disponible,
      es_original: false,
    }

    if (editandoDetalleInsumos !== null) {
      const nuevosDetalles = [...detallesInsumos]
      nuevosDetalles[editandoDetalleInsumos] = nuevoDetalle
      setDetallesInsumos(nuevosDetalles)
      setEditandoDetalleInsumos(null)
    } else {
      setDetallesInsumos([...detallesInsumos, nuevoDetalle])
    }

    limpiarFormularioDetalleInsumos()
  }

  const editarDetalleInsumos = (index: number) => {
    const detalle = detallesInsumos[index]
    setInsumoId(detalle.insumo_id.toString())
    setCantidadInsumos(detalle.cantidad.toString())
    setEditandoDetalleInsumos(index)
    setMostrarFormDetalleInsumos(true)
    setErroresDetalleInsumos([])
  }

  const eliminarDetalleInsumos = (index: number) => {
    setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalleInsumos = () => {
    setInsumoId("")
    setCantidadInsumos("")
    setUnidadMedidaActual("")
    setStockDisponible(0)
    setMostrarFormDetalleInsumos(false)
    setEditandoDetalleInsumos(null)
    setErroresDetalleInsumos([])
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/actividades-mixtas/${parte.pd_detalles?.detalle_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          lotes_seleccionados: lotesSeleccionados,
          detalles: detallesInsumos.map((d) => ({
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar sanitación")
      }

      const totalVacunas = detallesInsumos.length

      toast({
        title: "✅ Sanitación Actualizada",
        description: `Se actualizaron ${lotesSeleccionados.length} lotes y ${totalVacunas} vacunas`,
        duration: 4000,
      })

      console.log("Disparando evento reloadPartesDiarios después de actualizar sanitación")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating sanitación:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar sanitación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose?.()
    // Reset form
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setLotesSeleccionados([])
    setDetallesInsumos([])
    limpiarFormularioDetalleInsumos()
    setErrores([])
  }

  const eliminarActividad = async () => {
    if (!parte?.pd_id || !usuario?.id) {
      toast({
        title: "❌ Error",
        description: "No se pudo identificar la actividad o el usuario",
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/actividades-mixtas/${parte.pd_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_user_id: usuario.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar sanitación")
      }

      toast({
        title: "✅ Sanitación Eliminada",
        description: "La sanitación ha sido eliminada correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting sanitación:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al eliminar sanitación",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
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

  const calcularStockDisponibleInsumos = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoSeleccionado) return 0

    const stockBase = insumoSeleccionado.cantidad_disponible

    if (indexEditando !== null && detallesInsumos[indexEditando]?.es_original) {
      const detalleEditado = detallesInsumos[indexEditando]
      if (detalleEditado.insumo_id.toString() === insumoIdSeleccionado) {
        const cantidadOriginal = detalleEditado.cantidad_original || detalleEditado.cantidad
        const stockDisponible = stockBase + cantidadOriginal
        return Math.max(0, stockDisponible)
      }
    }

    const detallesOriginalesIniciales = parte.pd_detalles?.detalles_insumos || []

    const cantidadDescontadaOriginalmente = detallesOriginalesIniciales
      .filter((detalle: any) => detalle.insumo_id?.toString() === insumoIdSeleccionado)
      .reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0)

    const cantidadOriginalPresente = detallesInsumos
      .filter(
        (detalle, index) =>
          detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + (detalle.cantidad_original || detalle.cantidad), 0)

    const cantidadLiberada = cantidadDescontadaOriginalmente - cantidadOriginalPresente

    const cantidadNuevosUsada = detallesInsumos
      .filter(
        (detalle, index) =>
          !detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + detalle.cantidad, 0)

    const stockDisponible = stockBase + cantidadLiberada - cantidadNuevosUsada

    return Math.max(0, stockDisponible)
  }

  const stockDisponibleRealInsumos = insumoId ? calcularStockDisponibleInsumos(insumoId, editandoDetalleInsumos) : 0

  const lotesSeleccionadosNombres = (lotes: Lote[], lotesSeleccionados: number[]): string[] => {
    return lotes.filter((lote) => lotesSeleccionados.includes(lote.id)).map((lote) => lote.nombre)
  }

  const lotesFiltrados = (lotes: Lote[], busquedaLotes: string): Lote[] => {
    return lotes.filter((lote) => lote.nombre.toLowerCase().includes(busquedaLotes.toLowerCase()))
  }

  const limpiarSeleccionLotes = () => {
    setLotesSeleccionados([])
  }

  const cerrarSelectorLotes = () => {
    setMostrarSelectorLotes(false)
    setBusquedaLotes("")
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Syringe className="w-6 h-6 text-green-600" />
            Editar Sanitación
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando datos...</div>
            </div>
          ) : (
            <>
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
              <div className="space-y-6">
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
                      <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                        Sanitación
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
                    <h3 className="text-lg font-semibold">Lotes</h3>
                    <Button
                      onClick={() => setMostrarSelectorLotes(!mostrarSelectorLotes)}
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50 flex items-center gap-2"
                    >
                      {mostrarSelectorLotes ? "Ocultar Selector" : "Seleccionar Lotes"}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${mostrarSelectorLotes ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </div>

                  {/* Lotes seleccionados */}
                  {lotesSeleccionados.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Lotes seleccionados ({lotesSeleccionados.length}):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lotesSeleccionadosNombres(lotes, lotesSeleccionados).map((nombre, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            <Check className="w-3 h-3" />
                            {nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {mostrarSelectorLotes && (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg mb-4">
                      {/* Search bar */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Buscar opciones..."
                            value={busquedaLotes}
                            onChange={(e) => setBusquedaLotes(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="max-h-60 overflow-y-auto">
                        {loadingLotes ? (
                          <div className="text-center py-8 text-gray-500">Cargando lotes...</div>
                        ) : lotesFiltrados(lotes, busquedaLotes).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            {busquedaLotes
                              ? "No se encontraron lotes que coincidan con la búsqueda"
                              : "No se encontraron lotes"}
                          </div>
                        ) : (
                          <div className="py-2">
                            {lotesFiltrados(lotes, busquedaLotes).map((lote) => (
                              <label
                                key={lote.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={lotesSeleccionados.includes(lote.id)}
                                  onChange={() => toggleLoteSeleccion(lote.id)}
                                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <span className="text-sm text-gray-900 flex-1">{lote.nombre}</span>
                                {lotesSeleccionados.includes(lote.id) && <Check className="w-4 h-4 text-green-600" />}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="p-4 border-t border-gray-200 flex justify-between">
                        <Button
                          variant="ghost"
                          onClick={limpiarSeleccionLotes}
                          className="text-gray-600 hover:text-gray-800"
                          disabled={lotesSeleccionados.length === 0}
                        >
                          Limpiar
                        </Button>
                        <Button onClick={cerrarSelectorLotes} className="bg-green-600 hover:bg-green-700 text-white">
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalle Vacunas</h3>
                    <Button
                      onClick={() => setMostrarFormDetalleInsumos(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {/* Formulario de detalle insumos */}
                  {mostrarFormDetalleInsumos && (
                    <div className="bg-gray-50 border rounded-lg p-6 mb-4">
                      {/* Errores de detalle insumos */}
                      {erroresDetalleInsumos.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Errores encontrados:
                          </div>
                          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {erroresDetalleInsumos.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-medium mb-4">
                        {editandoDetalleInsumos !== null ? "Editar Detalle Vacuna" : "Nuevo Detalle Vacuna"}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Vacuna *</Label>
                            <CustomCombobox
                              options={opcionesInsumos}
                              value={insumoId}
                              onValueChange={setInsumoId}
                              placeholder="Selecciona vacuna..."
                              searchPlaceholder="Buscar vacuna..."
                              emptyMessage="No se encontraron vacunas disponibles."
                              loading={loadingInsumos}
                            />
                          </div>

                          <div>
                            <Label>
                              Cantidad *{" "}
                              {insumoId &&
                                stockDisponibleRealInsumos >= 0 &&
                                `(Disponible: ${stockDisponibleRealInsumos})`}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={cantidadInsumos}
                                onChange={(e) => setCantidadInsumos(e.target.value)}
                                placeholder="Ej: 5"
                                min="1"
                                max={stockDisponibleRealInsumos}
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
                        <Button onClick={agregarDetalleInsumos} className="bg-blue-600 hover:bg-blue-700">
                          {editandoDetalleInsumos !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalleInsumos}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de detalles insumos */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-10 gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                        <div className="col-span-4">Vacuna</div>
                        <div className="col-span-2">Cantidad</div>
                        <div className="col-span-2">Unidad Medida</div>
                        <div className="col-span-2 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detallesInsumos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay vacunas agregadas</div>
                      ) : (
                        <div className="divide-y">
                          {detallesInsumos.map((detalle, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-10 gap-3 px-4 py-3 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                            >
                              <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                              <div className="col-span-2 font-medium">{detalle.cantidad}</div>
                              <div className="col-span-2 text-gray-600">{detalle.unidad_medida}</div>
                              <div className="col-span-2 flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalleInsumos(index)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalleInsumos(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                  <Label htmlFor="nota">
                    Nota
                    {lotesSeleccionados.length === 0 && detallesInsumos.length === 0 && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Textarea
                    id="nota"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder={
                      lotesSeleccionados.length === 0 && detallesInsumos.length === 0
                        ? "La nota es obligatoria si no selecciona lotes ni agrega vacunas..."
                        : "Observaciones adicionales..."
                    }
                    rows={3}
                    className={
                      lotesSeleccionados.length === 0 && detallesInsumos.length === 0 && !nota.trim()
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar esta sanitación? Esta acción no se puede deshacer.
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

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          {/* Botón Eliminar en el lado izquierdo */}
          {puedeEliminar() ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={loading || deleting}>
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
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Actualizando..." : "Actualizar Actividad"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
