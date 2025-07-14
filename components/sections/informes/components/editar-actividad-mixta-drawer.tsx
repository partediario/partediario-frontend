"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Package, Users, AlertCircle, X } from "lucide-react"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface EditarActividadMixtaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

interface Lote {
  id: number
  nombre: string
}

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
}

interface Insumo {
  id: number
  nombre: string
  pd_unidad_medida_insumos?: {
    nombre: string
  }
}

interface DetalleAnimal {
  lote_id: number
  lote_nombre: string
  categoria_animal_id: number
  categoria_animal_nombre: string
  cantidad: number
  peso: number
  tipo: string
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
}

export default function EditarActividadMixtaDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarActividadMixtaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Datos para formularios
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [insumos, setInsumos] = useState<Insumo[]>([])

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Detalles
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleAnimal[]>([])
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  // Formularios de detalle
  const [mostrarFormAnimales, setMostrarFormAnimales] = useState(false)
  const [mostrarFormInsumos, setMostrarFormInsumos] = useState(false)
  const [editandoAnimal, setEditandoAnimal] = useState<number | null>(null)
  const [editandoInsumo, setEditandoInsumo] = useState<number | null>(null)

  // Formulario animales
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaAnimalId, setCategoriaAnimalId] = useState<string>("")
  const [cantidadAnimal, setCantidadAnimal] = useState<string>("")
  const [peso, setPeso] = useState<string>("")
  const [tipoAnimal, setTipoAnimal] = useState<string>("TOTAL")

  // Formulario insumos
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidadInsumo, setCantidadInsumo] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")

  // Errores
  const [errores, setErrores] = useState<string[]>([])

  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  useEffect(() => {
    if (isOpen && parte) {
      console.log("🔄 Cargando datos para editar actividad mixta:", parte)
      cargarDatosIniciales()
    }
  }, [isOpen, parte])

  // Cargar categorías cuando se selecciona lote
  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaAnimalId("")
    }
  }, [loteId])

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

  const cargarDatosIniciales = async () => {
    setLoading(true)
    try {
      // Cargar datos del parte
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora.slice(0, 5))
      setNota(parte.pd_nota || "")

      // Cargar datos para formularios primero
      await Promise.all([fetchLotes(), fetchInsumos()])

      // Luego cargar detalles existentes desde la vista
      const animales = (parte.pd_detalles?.detalles_animales || []).map((animal: any) => {
        // Intentar obtener los IDs correctos desde diferentes fuentes
        let loteId = animal.detalle_lote_id || animal.lote_id || 0
        const categoriaId = animal.detalle_categoria_animal_id || animal.categoria_animal_id || 0

        // Si no tenemos IDs, intentar buscar por nombre
        if (!loteId && animal.lote) {
          const loteEncontrado = lotes.find((l) => l.nombre === animal.lote)
          if (loteEncontrado) loteId = loteEncontrado.id
        }

        return {
          lote_id: loteId,
          lote_nombre: animal.detalle_lote || animal.lote || "",
          categoria_animal_id: categoriaId,
          categoria_animal_nombre: animal.detalle_categoria_animal || animal.categoria_animal || "",
          cantidad: animal.detalle_cantidad || animal.cantidad || 0,
          peso: animal.detalle_peso || animal.peso || 0,
          tipo: animal.detalle_tipo_peso || animal.tipo || "TOTAL",
        }
      })

      const insumos = (parte.pd_detalles?.detalles_insumos || []).map((insumo: any) => ({
        insumo_id: insumo.insumo_id || 0,
        insumo_nombre: insumo.insumo || "",
        cantidad: insumo.cantidad || 0,
        unidad_medida: insumo.unidad_medida || "",
      }))

      setDetallesAnimales(animales)
      setDetallesInsumos(insumos)

      console.log("✅ Datos cargados para edición:", {
        animales: animales.length,
        insumos: insumos.length,
        lotesCargados: lotes.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLotes = async () => {
    if (!establecimientoSeleccionado) {
      console.log("❌ No hay establecimiento seleccionado para cargar lotes")
      return
    }

    try {
      console.log("🔄 Fetching lotes para establecimiento:", establecimientoSeleccionado)
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar lotes")
      const data = await response.json()
      setLotes(data.lotes || [])
      console.log("✅ Lotes cargados:", data.lotes?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching lotes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los lotes",
        variant: "destructive",
      })
    }
  }

  const fetchCategoriasExistentes = async () => {
    if (!loteId) return

    setLoadingCategorias(true)
    try {
      console.log("🔄 Fetching categorías para lote:", loteId)
      const response = await fetch(`/api/categorias-existentes-lote?lote_id=${loteId}`)
      if (!response.ok) throw new Error("Error al cargar categorías")

      const data = await response.json()
      setCategorias(data.categorias || [])
      console.log("✅ Categorías cargadas:", data.categorias?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching categorias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoadingCategorias(false)
    }
  }

  const fetchInsumos = async () => {
    if (!empresaSeleccionada) {
      console.log("❌ No hay empresa seleccionada para cargar insumos")
      return
    }

    try {
      console.log("🔄 Fetching insumos para empresa:", empresaSeleccionada)
      const response = await fetch(`/api/insumos?empresa_id=${empresaSeleccionada}`)
      if (!response.ok) throw new Error("Error al cargar insumos")
      const data = await response.json()
      setInsumos(data.insumos || [])
      console.log("✅ Insumos cargados:", data.insumos?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching insumos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos",
        variant: "destructive",
      })
    }
  }

  const agregarAnimal = () => {
    if (!loteId || !categoriaAnimalId || !cantidadAnimal || !peso) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      })
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find(
      (c) => c.categoria_animal_id.toString() === categoriaAnimalId,
    )

    if (!loteSeleccionado || !categoriaSeleccionada) return

    const nuevoDetalle: DetalleAnimal = {
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
      categoria_animal_id: Number.parseInt(categoriaAnimalId),
      categoria_animal_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidadAnimal),
      peso: Number.parseFloat(peso),
      tipo: tipoAnimal,
    }

    if (editandoAnimal !== null) {
      const nuevosDetalles = [...detallesAnimales]
      nuevosDetalles[editandoAnimal] = nuevoDetalle
      setDetallesAnimales(nuevosDetalles)
      setEditandoAnimal(null)
    } else {
      setDetallesAnimales([...detallesAnimales, nuevoDetalle])
    }

    limpiarFormularioAnimal()
  }

  const agregarInsumo = () => {
    if (!insumoId || !cantidadInsumo) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      })
      return
    }

    const insumoSeleccionado = insumos.find((i) => i.id.toString() === insumoId)
    if (!insumoSeleccionado) return

    const nuevoDetalle: DetalleInsumo = {
      insumo_id: Number.parseInt(insumoId),
      insumo_nombre: insumoSeleccionado.nombre,
      cantidad: Number.parseInt(cantidadInsumo),
      unidad_medida: insumoSeleccionado.pd_unidad_medida_insumos?.nombre || "",
    }

    if (editandoInsumo !== null) {
      const nuevosDetalles = [...detallesInsumos]
      nuevosDetalles[editandoInsumo] = nuevoDetalle
      setDetallesInsumos(nuevosDetalles)
      setEditandoInsumo(null)
    } else {
      setDetallesInsumos([...detallesInsumos, nuevoDetalle])
    }

    limpiarFormularioInsumo()
  }

  const limpiarFormularioAnimal = () => {
    setLoteId("")
    setCategoriaAnimalId("")
    setCantidadAnimal("")
    setPeso("")
    setTipoAnimal("TOTAL")
    setMostrarFormAnimales(false)
    setEditandoAnimal(null)
  }

  const limpiarFormularioInsumo = () => {
    setInsumoId("")
    setCantidadInsumo("")
    setUnidadMedidaActual("")
    setMostrarFormInsumos(false)
    setEditandoInsumo(null)
  }

  const editarAnimal = (index: number) => {
    const detalle = detallesAnimales[index]
    console.log("🔄 Editando animal:", detalle)

    // Buscar el lote correcto en la lista de lotes disponibles
    const loteEncontrado = lotes.find((l) => l.id === detalle.lote_id || l.nombre === detalle.lote_nombre)

    if (loteEncontrado) {
      setLoteId(loteEncontrado.id.toString())
    } else {
      console.warn("⚠️ No se encontró el lote:", detalle.lote_nombre)
      setLoteId(detalle.lote_id.toString())
    }

    setCantidadAnimal(detalle.cantidad.toString())
    setPeso(detalle.peso.toString())
    setTipoAnimal(detalle.tipo)
    setEditandoAnimal(index)
    setMostrarFormAnimales(true)

    // Cargar categorías para el lote y luego establecer la categoría
    if (detalle.lote_id || loteEncontrado) {
      const loteIdParaCategorias = loteEncontrado ? loteEncontrado.id : detalle.lote_id

      setLoadingCategorias(true)
      fetch(`/api/categorias-existentes-lote?lote_id=${loteIdParaCategorias}`)
        .then((response) => response.json())
        .then((data) => {
          setCategorias(data.categorias || [])

          // Buscar la categoría correcta
          const categoriaEncontrada = data.categorias?.find(
            (cat: any) =>
              cat.categoria_animal_id === detalle.categoria_animal_id ||
              cat.nombre_categoria_animal === detalle.categoria_animal_nombre,
          )

          if (categoriaEncontrada) {
            setCategoriaAnimalId(categoriaEncontrada.categoria_animal_id.toString())
          } else {
            console.warn("⚠️ No se encontró la categoría:", detalle.categoria_animal_nombre)
            setCategoriaAnimalId(detalle.categoria_animal_id.toString())
          }
        })
        .catch((error) => {
          console.error("❌ Error cargando categorías:", error)
        })
        .finally(() => {
          setLoadingCategorias(false)
        })
    }
  }

  const editarInsumo = (index: number) => {
    const detalle = detallesInsumos[index]
    console.log("🔄 Editando insumo:", detalle)

    setInsumoId(detalle.insumo_id.toString())
    setCantidadInsumo(detalle.cantidad.toString())
    setEditandoInsumo(index)
    setMostrarFormInsumos(true)
  }

  const handleSubmit = async () => {
    const erroresValidacion: string[] = []

    if (!fecha) erroresValidacion.push("La fecha es requerida")
    if (!hora) erroresValidacion.push("La hora es requerida")
    if (detallesAnimales.length === 0 && detallesInsumos.length === 0) {
      erroresValidacion.push("Debe agregar al menos un detalle de animal o insumo")
    }

    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/actividades-mixtas/${parte.pd_detalles?.detalle_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          detalles_animales: detallesAnimales,
          detalles_insumos: detallesInsumos,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar actividad")
      }

      toast({
        title: "✅ Actividad Actualizada",
        description: `Se actualizó la actividad mixta con ${detallesAnimales.length} animales y ${detallesInsumos.length} insumos`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating actividad mixta:", error)
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
    limpiarFormularioAnimal()
    limpiarFormularioInsumo()
    setErrores([])
  }

  const nombreCompleto = `${parte.pd_usuario_nombres || ""} ${parte.pd_usuario_apellidos || ""}`.trim()

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  const opcionesInsumos = insumos.map((insumo) => ({
    value: insumo.id.toString(),
    label: insumo.nombre,
  }))

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            <Package className="w-6 h-6 text-blue-600" />
            Editar Actividad Mixta (Animales + Insumos)
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando actividad...</div>
            </div>
          ) : (
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
                    <Label className="text-sm font-medium text-gray-700">Tipo de Actividad *</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {parte.pd_detalles?.detalle_tipo || ""}
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

              {/* Detalles con Pestañas */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detalles *</h3>

                <Tabs defaultValue="animales" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="animales" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Animales ({detallesAnimales.length})
                    </TabsTrigger>
                    <TabsTrigger value="insumos" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Insumos ({detallesInsumos.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Pestaña Animales */}
                  <TabsContent value="animales" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button onClick={() => setMostrarFormAnimales(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar línea
                        </Button>
                      </div>

                      {/* Formulario de animal expandido */}
                      {mostrarFormAnimales && (
                        <div className="bg-gray-50 border rounded-lg p-6">
                          <h4 className="font-medium mb-4">
                            {editandoAnimal !== null ? "Editar Animal" : "Nuevo Detalle Animal"}
                          </h4>

                          <div className="space-y-4">
                            {/* Primera fila: Lote y Categoría Animal */}
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
                                  value={categoriaAnimalId}
                                  onValueChange={setCategoriaAnimalId}
                                  placeholder={loteId ? "Selecciona categoría..." : "Primero selecciona un lote"}
                                  searchPlaceholder="Buscar categoría..."
                                  emptyMessage="No se encontraron categorías con stock."
                                  disabled={!loteId}
                                  loading={loadingCategorias}
                                />
                              </div>
                            </div>

                            {/* Segunda fila: Cantidad y Peso */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Cantidad *</Label>
                                <Input
                                  type="number"
                                  value={cantidadAnimal}
                                  onChange={(e) => setCantidadAnimal(e.target.value)}
                                  placeholder="Ej: 10"
                                  min="1"
                                />
                              </div>

                              <div>
                                <Label>Peso (kg) *</Label>
                                <Input
                                  type="number"
                                  value={peso}
                                  onChange={(e) => setPeso(e.target.value)}
                                  placeholder="Ej: 250"
                                  min="0"
                                  step="0.1"
                                />
                              </div>
                            </div>

                            {/* Tercera fila: Tipo de peso con radio buttons */}
                            <div>
                              <Label>Tipo de peso</Label>
                              <RadioGroup
                                value={tipoAnimal}
                                onValueChange={setTipoAnimal}
                                className="flex items-center space-x-6 mt-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="TOTAL" id="total" />
                                  <Label htmlFor="total">Total</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="PROMEDIO" id="promedio" />
                                  <Label htmlFor="promedio">Promedio</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Button onClick={agregarAnimal} className="bg-green-600 hover:bg-green-700">
                              {editandoAnimal !== null ? "Actualizar" : "Agregar"}
                            </Button>
                            <Button variant="outline" onClick={limpiarFormularioAnimal}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de animales */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b">
                          <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                            <div className="col-span-2">Lote</div>
                            <div className="col-span-3">Categoría Animal</div>
                            <div className="col-span-2 text-center">Cantidad</div>
                            <div className="col-span-2 text-center">Peso</div>
                            <div className="col-span-2 text-center">Tipo</div>
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
                                  className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                                >
                                  <div className="col-span-2 font-medium truncate">{detalle.lote_nombre}</div>
                                  <div className="col-span-3 truncate">{detalle.categoria_animal_nombre}</div>
                                  <div className="col-span-2 text-center">{detalle.cantidad}</div>
                                  <div className="col-span-2 text-center">{detalle.peso} kg</div>
                                  <div className="col-span-2 text-center">{detalle.tipo}</div>
                                  <div className="col-span-1 flex justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editarAnimal(index)}
                                      className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setDetallesAnimales(detallesAnimales.filter((_, i) => i !== index))
                                      }
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pestaña Insumos */}
                  <TabsContent value="insumos" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button onClick={() => setMostrarFormInsumos(true)} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar línea
                        </Button>
                      </div>

                      {/* Formulario de insumo expandido */}
                      {mostrarFormInsumos && (
                        <div className="bg-gray-50 border rounded-lg p-6">
                          <h4 className="font-medium mb-4">
                            {editandoInsumo !== null ? "Editar Insumo" : "Nuevo Insumo"}
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
                                />
                              </div>

                              <div>
                                <Label>Cantidad *</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={cantidadInsumo}
                                    onChange={(e) => setCantidadInsumo(e.target.value)}
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
                            <Button onClick={agregarInsumo} className="bg-blue-600 hover:bg-blue-700">
                              {editandoInsumo !== null ? "Actualizar" : "Agregar"}
                            </Button>
                            <Button variant="outline" onClick={limpiarFormularioInsumo}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tabla de insumos */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 border-b">
                          <div className="grid grid-cols-4 gap-4 p-4 text-sm font-medium text-gray-700">
                            <div>Insumo</div>
                            <div>Cantidad</div>
                            <div>Unidad Medida</div>
                            <div className="text-center">Acciones</div>
                          </div>
                        </div>
                        <div className="min-h-[100px]">
                          {detallesInsumos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No hay detalles de insumos agregados</div>
                          ) : (
                            <div className="divide-y">
                              {detallesInsumos.map((detalle, index) => (
                                <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm hover:bg-gray-50">
                                  <div className="font-medium">{detalle.insumo_nombre}</div>
                                  <div>{detalle.cantidad}</div>
                                  <div className="text-gray-600">{detalle.unidad_medida}</div>
                                  <div className="flex justify-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editarInsumo(index)}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))}
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
