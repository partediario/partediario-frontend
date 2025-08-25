"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Plus, Trash2, Edit, Users, Syringe, AlertCircle, X } from "lucide-react"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
}

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

interface DetalleActividad {
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  lote_id: number
  lote_nombre: string
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
  const [activeTab, setActiveTab] = useState("animales")

  // Datos para animales
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Datos para insumos (vacunas - clase_insumo_id = 2)
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle animales
  const [mostrarFormDetalleAnimales, setMostrarFormDetalleAnimales] = useState(false)
  const [editandoDetalleAnimales, setEditandoDetalleAnimales] = useState<number | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cantidadAnimales, setCantidadAnimales] = useState<string>("")

  // Formulario de detalle insumos
  const [mostrarFormDetalleInsumos, setMostrarFormDetalleInsumos] = useState(false)
  const [editandoDetalleInsumos, setEditandoDetalleInsumos] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidadInsumos, setCantidadInsumos] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Detalles agregados
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleActividad[]>([])
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalleAnimales, setErroresDetalleAnimales] = useState<string[]>([])
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

  // Cargar categorías cuando se selecciona lote
  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaId("")
    }
  }, [loteId])

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

        // Map animal details with lot names
        const animales = (actividadData.pd_actividades_animales_detalle || []).map((animal: any) => ({
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_nombre: animal.pd_categoria_animales?.nombre || "",
          cantidad: animal.cantidad || 0,
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.pd_lotes?.nombre || "",
        }))
        setDetallesAnimales(animales)

        const vacunas = (actividadData.pd_actividades_insumos_detalle || []).map((insumo: any) => ({
          insumo_id: insumo.insumo_id || 0,
          insumo_nombre: insumo.pd_insumos?.nombre || "",
          cantidad: insumo.cantidad || 0,
          unidad_medida:
            insumo.pd_insumos?.pd_unidad_medida_insumos?.nombre ||
            insumo.pd_insumos?.unidad_medida ||
            insumo.unidad_medida ||
            "",
          cantidad_disponible: 0,
          es_original: true,
          cantidad_original: insumo.cantidad || 0,
        }))
        setDetallesInsumos(vacunas)
      } else {
        const animales = (parte.pd_detalles?.detalles_animales || []).map((animal: any) => ({
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_nombre: animal.categoria_animal || "",
          cantidad: animal.cantidad || 0,
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.lote_nombre || "",
        }))
        setDetallesAnimales(animales)

        const vacunas = (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
          insumo_id: insumo.insumo_id || 0,
          insumo_nombre: insumo.insumo || "",
          cantidad: insumo.cantidad || 0,
          unidad_medida: insumo.unidad_medida || insumo.unidad_medida_nombre || "",
          cantidad_disponible: 0,
          es_original: true,
          cantidad_original: insumo.cantidad || 0,
        }))
        setDetallesInsumos(vacunas)
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
    }
  }

  const fetchCategoriasExistentes = async () => {
    if (!loteId) return

    setLoadingCategorias(true)
    try {
      const response = await fetch(`/api/categorias-existentes-lote?lote_id=${loteId}`)
      if (!response.ok) throw new Error("Error al cargar categorías")

      const data = await response.json()
      setCategorias(data.categorias || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar categorías",
        variant: "destructive",
      })
    } finally {
      setLoadingCategorias(false)
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

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detallesAnimales.length === 0) {
      errores.push("Debe agregar al menos un detalle de animales")
    }

    return errores
  }

  const validarDetalleAnimales = (): string[] => {
    const errores: string[] = []

    if (!loteId) errores.push("Debe seleccionar un lote")
    if (!categoriaId) errores.push("Debe seleccionar una categoría")
    if (!cantidadAnimales || Number.parseInt(cantidadAnimales) <= 0) errores.push("La cantidad debe ser mayor a 0")

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

  const agregarDetalleAnimales = () => {
    const erroresValidacion = validarDetalleAnimales()
    if (erroresValidacion.length > 0) {
      setErroresDetalleAnimales(erroresValidacion)
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

    if (!loteSeleccionado || !categoriaSeleccionada) return

    const nuevoDetalle: DetalleActividad = {
      categoria_animal_id: Number.parseInt(categoriaId),
      categoria_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidadAnimales),
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
    }

    if (editandoDetalleAnimales !== null) {
      const nuevosDetalles = [...detallesAnimales]
      nuevosDetalles[editandoDetalleAnimales] = nuevoDetalle
      setDetallesAnimales(nuevosDetalles)
      setEditandoDetalleAnimales(null)
    } else {
      setDetallesAnimales([...detallesAnimales, nuevoDetalle])
    }

    limpiarFormularioDetalleAnimales()
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

  const editarDetalleAnimales = (index: number) => {
    const detalle = detallesAnimales[index]
    setLoteId(detalle.lote_id.toString())
    setCategoriaId(detalle.categoria_animal_id.toString())
    setCantidadAnimales(detalle.cantidad.toString())
    setEditandoDetalleAnimales(index)
    setMostrarFormDetalleAnimales(true)
    setErroresDetalleAnimales([])
    setActiveTab("animales")
  }

  const editarDetalleInsumos = (index: number) => {
    const detalle = detallesInsumos[index]
    setInsumoId(detalle.insumo_id.toString())
    setCantidadInsumos(detalle.cantidad.toString())
    setEditandoDetalleInsumos(index)
    setMostrarFormDetalleInsumos(true)
    setErroresDetalleInsumos([])
    setActiveTab("insumos")
  }

  const eliminarDetalleAnimales = (index: number) => {
    setDetallesAnimales(detallesAnimales.filter((_, i) => i !== index))
  }

  const eliminarDetalleInsumos = (index: number) => {
    setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalleAnimales = () => {
    setLoteId("")
    setCategoriaId("")
    setCantidadAnimales("")
    setMostrarFormDetalleAnimales(false)
    setEditandoDetalleAnimales(null)
    setErroresDetalleAnimales([])
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
          detalles_animales: detallesAnimales.map((d) => ({
            categoria_animal_id: d.categoria_animal_id,
            cantidad: d.cantidad,
            lote_id: d.lote_id,
          })),
          detalles_insumos: detallesInsumos.map((d) => ({
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar sanitación")
      }

      // Calcular totales
      const totalAnimales = detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)
      const totalVacunas = detallesInsumos.length

      toast({
        title: "✅ Sanitación Actualizada",
        description: `Se actualizaron ${totalAnimales} animales y ${totalVacunas} vacunas`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
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
    setDetallesAnimales([])
    setDetallesInsumos([])
    limpiarFormularioDetalleAnimales()
    limpiarFormularioDetalleInsumos()
    setErrores([])
    setActiveTab("animales")
  }

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const calcularStockDisponibleInsumos = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoSeleccionado) return 0

    const stockBase = insumoSeleccionado.cantidad_disponible

    // Si estamos editando una línea original, devolver stock base + cantidad original de esa línea
    if (indexEditando !== null && detallesInsumos[indexEditando]?.es_original) {
      const detalleEditado = detallesInsumos[indexEditando]
      if (detalleEditado.insumo_id.toString() === insumoIdSeleccionado) {
        const cantidadOriginal = detalleEditado.cantidad_original || detalleEditado.cantidad
        const stockDisponible = stockBase + cantidadOriginal
        return Math.max(0, stockDisponible)
      }
    }

    // Para agregar nueva línea o editar línea nueva: calcular stock considerando uso actual
    const detallesOriginalesIniciales = parte.pd_detalles?.detalles_insumos || []

    // Calcular cantidad total descontada originalmente para este insumo
    const cantidadDescontadaOriginalmente = detallesOriginalesIniciales
      .filter((detalle: any) => detalle.insumo_id?.toString() === insumoIdSeleccionado)
      .reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0)

    // Calcular cantidad original aún presente en detalles actuales
    const cantidadOriginalPresente = detallesInsumos
      .filter(
        (detalle, index) =>
          detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + (detalle.cantidad_original || detalle.cantidad), 0)

    // Calcular cantidad liberada (descontada originalmente - aún presente)
    const cantidadLiberada = cantidadDescontadaOriginalmente - cantidadOriginalPresente

    // Calcular cantidad usada por líneas nuevas (no originales)
    const cantidadNuevosUsada = detallesInsumos
      .filter(
        (detalle, index) =>
          !detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + detalle.cantidad, 0)

    // Stock disponible = stock base + cantidad liberada - cantidad usada por nuevos
    const stockDisponible = stockBase + cantidadLiberada - cantidadNuevosUsada

    return Math.max(0, stockDisponible)
  }

  const stockDisponibleRealInsumos = insumoId ? calcularStockDisponibleInsumos(insumoId, editandoDetalleInsumos) : 0

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

                {/* Detalles con Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalles *</h3>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="animales" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Animales ({detallesAnimales.length})
                      </TabsTrigger>
                      <TabsTrigger value="insumos" className="flex items-center gap-2">
                        <Syringe className="w-4 h-4" />
                        Vacunas ({detallesInsumos.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="animales" className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setMostrarFormDetalleAnimales(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar línea
                        </Button>
                      </div>

                      {/* Formulario de detalle animales */}
                      {mostrarFormDetalleAnimales && (
                        <div className="bg-gray-50 border rounded-lg p-6">
                          {/* Errores de detalle animales */}
                          {erroresDetalleAnimales.length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                              <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                                <AlertCircle className="w-4 h-4" />
                                Errores encontrados:
                              </div>
                              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                                {erroresDetalleAnimales.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <h4 className="font-medium mb-4">
                            {editandoDetalleAnimales !== null ? "Editar Detalle Animal" : "Nuevo Detalle Animal"}
                          </h4>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Lote *</Label>
                                <CustomCombobox
                                  options={opcionesLotes}
                                  value={loteId}
                                  onValueChange={setLoteId}
                                  placeholder="Selecciona lote..."
                                  searchPlaceholder="Buscar lote..."
                                  emptyMessage="No se encontraron lotes."
                                />
                              </div>

                              <div>
                                <Label>Categoría Animal *</Label>
                                <CustomCombobox
                                  options={opcionesCategorias}
                                  value={categoriaId}
                                  onValueChange={setCategoriaId}
                                  placeholder={loteId ? "Selecciona categoría..." : "Primero selecciona un lote"}
                                  searchPlaceholder="Buscar categoría..."
                                  emptyMessage="No se encontraron categorías con stock."
                                  disabled={!loteId}
                                  loading={loadingCategorias}
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Cantidad *</Label>
                              <Input
                                type="number"
                                value={cantidadAnimales}
                                onChange={(e) => setCantidadAnimales(e.target.value)}
                                placeholder="Ej: 10"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Button onClick={agregarDetalleAnimales} className="bg-green-600 hover:bg-green-700">
                              {editandoDetalleAnimales !== null ? "Actualizar" : "Agregar"}
                            </Button>
                            <Button variant="outline" onClick={limpiarFormularioDetalleAnimales}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de detalles animales */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b">
                          <div className="grid grid-cols-10 gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                            <div className="col-span-3">Lote</div>
                            <div className="col-span-4">Categoría Animal</div>
                            <div className="col-span-2 text-center">Cantidad</div>
                            <div className="col-span-1 text-center">Acciones</div>
                          </div>
                        </div>

                        <div className="min-h-[100px]">
                          {detallesAnimales.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No hay detalles de animales agregados</div>
                          ) : (
                            <div className="divide-y">
                              {detallesAnimales.map((detalle, index) => (
                                <div
                                  key={index}
                                  className="grid grid-cols-10 gap-3 px-4 py-3 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                                >
                                  <div className="col-span-3 font-medium truncate">{detalle.lote_nombre}</div>
                                  <div className="col-span-4 truncate">{detalle.categoria_nombre}</div>
                                  <div className="col-span-2 text-center font-medium">{detalle.cantidad}</div>
                                  <div className="col-span-1 flex justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editarDetalleAnimales(index)}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => eliminarDetalleAnimales(index)}
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
                    </TabsContent>

                    <TabsContent value="insumos" className="space-y-4">
                      <div className="flex justify-end">
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
                        <div className="bg-gray-50 border rounded-lg p-6">
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
                    </TabsContent>
                  </Tabs>
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Actualizando..." : "Actualizar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
