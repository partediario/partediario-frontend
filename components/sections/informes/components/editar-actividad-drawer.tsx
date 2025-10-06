"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Plus, Trash2, Edit, Users, AlertCircle, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface TipoActividad {
  id: number
  nombre: string
  ubicacion: string
  animales: string
}

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
  cantidad: number
}

interface Lote {
  id: number
  nombre: string
}

interface DetalleActividad {
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  peso: number
  tipo_peso: "TOTAL" | "PROMEDIO"
  lote_id: number
  lote_nombre: string
}

interface ActividadData {
  actividad: {
    id: number
    tipo_actividad_id: number
    fecha: string
    hora: string
    nota: string | null
    pd_tipo_actividades: {
      id: number
      nombre: string
      ubicacion: string
      animales: string
    }
  }
  detalles: Array<{
    id: number
    cantidad: number
    peso: number
    tipo_peso: string
    pd_categoria_animales: {
      id: number
      nombre: string
    }
    pd_lotes: {
      id: number
      nombre: string
    }
  }>
}

interface EditarActividadDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  parte: ParteDiario | null
}

export default function EditarActividadDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  parte,
}: EditarActividadDrawerProps) {
  const [tipoActividadNombre, setTipoActividadNombre] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [actividadData, setActividadData] = useState<ActividadData | null>(null)

  const [tipoActividadId, setTipoActividadId] = useState<string>("")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [peso, setPeso] = useState<string>("")
  const [tipoPeso, setTipoPeso] = useState<"TOTAL" | "PROMEDIO">("TOTAL")

  const [detalles, setDetalles] = useState<DetalleActividad[]>([])

  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  const cargarDatosActividad = useCallback(async () => {
    if (!parte?.pd_id) return

    setLoadingData(true)
    try {
      console.log("🔄 Cargando datos de actividad para edición, parte ID:", parte.pd_id)

      const response = await fetch(`/api/actividades-animales/${parte.pd_id}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.warn("⚠️ Error en API, usando datos del parte diario:", errorData.error)

        cargarDatosDesdeParteDiario()
        return
      }

      const data = await response.json()
      console.log("✅ Datos de actividad cargados para edición:", data)
      setActividadData(data)

      // Establecer el nombre del tipo de actividad desde la API
      if (data.actividad && data.actividad.pd_tipo_actividades) {
        setTipoActividadNombre(data.actividad.pd_tipo_actividades.nombre)
        setTipoActividadId(data.actividad.pd_tipo_actividades.id.toString())
      }

      if (data.actividad) {
        // El tipo de actividad ya se estableció arriba desde pd_tipo_actividades
        setFecha(new Date(data.actividad.fecha + "T00:00:00"))
        setHora(data.actividad.hora.slice(0, 5))
        setNota(data.actividad.nota || "")
      }

      if (data.detalles && data.detalles.length > 0) {
        const detallesFormateados = data.detalles.map((detalle: any) => ({
          categoria_animal_id: detalle.pd_categoria_animales.id,
          categoria_nombre: detalle.pd_categoria_animales.nombre,
          cantidad: detalle.cantidad,
          peso: detalle.peso,
          tipo_peso: detalle.tipo_peso as "TOTAL" | "PROMEDIO",
          lote_id: detalle.pd_lotes.id,
          lote_nombre: detalle.pd_lotes.nombre,
        }))
        setDetalles(detallesFormateados)
      }
    } catch (err) {
      console.error("❌ Error cargando datos de actividad:", err)
      cargarDatosDesdeParteDiario()
    } finally {
      setLoadingData(false)
    }
  }, [parte])

  const cargarDatosDesdeParteDiario = () => {
    if (!parte) return

    console.log("🔄 Cargando datos desde parte diario")

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("📋 Detalles del parte diario:", detalles)
      console.log("🏷️ Tipo de actividad encontrado:", detalles.detalle_tipo)

      setTipoActividadNombre(detalles.detalle_tipo || "No especificado")

      setTipoActividadId(detalles.detalle_tipo_id?.toString() || "")

      const fecha = new Date(parte.pd_fecha + "T00:00:00")
      setFecha(fecha)
      setHora(parte.pd_hora?.slice(0, 5) || "")
      setNota(parte.pd_nota || "")

      if (detalles.detalles_animales && detalles.detalles_animales.length > 0) {
        const detallesFormateados = detalles.detalles_animales.map((detalle: any) => ({
          categoria_animal_id: 0,
          categoria_nombre: detalle.categoria_animal,
          cantidad: detalle.cantidad,
          peso: detalle.peso,
          tipo_peso: detalle.tipo_peso as "TOTAL" | "PROMEDIO",
          lote_id: 0,
          lote_nombre: detalle.lote,
        }))
        setDetalles(detallesFormateados)
      }
    } catch (err) {
      console.error("❌ Error parseando datos del parte diario:", err)
    }
  }

  const fetchInitialData = useCallback(async () => {
    if (establecimientoSeleccionado && empresaSeleccionada && parte) {
      await fetchLotes()
      await cargarDatosActividad()
    }
  }, [establecimientoSeleccionado, empresaSeleccionada, parte, cargarDatosActividad])

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen, fetchInitialData])

  useEffect(() => {
    if (!isOpen) {
      setTipoActividadId("")
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setDetalles([])
      limpiarFormularioDetalle()
      setErrores([])
      setActividadData(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaId("")
    }
  }, [loteId])

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

  const fetchTiposActividad = async () => {
    if (!empresaSeleccionada) return

    try {
      const response = await fetch(`/api/tipos-actividades?empresa_id=${empresaSeleccionada}`)
      if (!response.ok) throw new Error("Error al cargar tipos de actividad")

      const data = await response.json()
      setTiposActividad(data.tipos || [])
    } catch (error) {
      console.error("Error fetching tipos actividad:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar tipos de actividad",
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

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (!tipoActividadId) errores.push("Debe tener un tipo de actividad válido")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!loteId) errores.push("Debe seleccionar un lote")
    if (!categoriaId) errores.push("Debe seleccionar una categoría")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")
    if (!peso || Number.parseInt(peso) <= 0) errores.push("El peso debe ser mayor a 0")

    if (categoriaId && cantidad && Number.parseInt(cantidad) > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK EN EDICIÓN")
      console.log("   Categoría seleccionada ID:", categoriaId)
      console.log("   Cantidad solicitada:", cantidad)

      const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

      if (categoriaSeleccionada) {
        // Calcular cantidad ya utilizada en otros detalles de la misma categoría
        const cantidadYaUtilizada = detalles
          .filter((d, index) => d.categoria_animal_id.toString() === categoriaId && index !== editandoDetalle)
          .reduce((sum, d) => sum + d.cantidad, 0)

        const stockDisponible = Number(categoriaSeleccionada.cantidad) - cantidadYaUtilizada
        const cantidadSolicitada = Number.parseInt(cantidad)

        console.log(`📊 Validación de stock para ${categoriaSeleccionada.nombre_categoria_animal}:`)
        console.log(`   Stock disponible: ${stockDisponible}`)
        console.log(`   Cantidad solicitada: ${cantidadSolicitada}`)

        if (cantidadSolicitada > stockDisponible) {
          const errorMsg =
            `Stock insuficiente para ${categoriaSeleccionada.nombre_categoria_animal}. ` +
            `Disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}`
          console.log("❌ ERROR DE STOCK:", errorMsg)
          errores.push(errorMsg)
        } else {
          console.log("✅ Stock suficiente")
        }
      }
    }
    // </CHANGE>

    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

    if (!loteSeleccionado || !categoriaSeleccionada) return

    const nuevoDetalle: DetalleActividad = {
      categoria_animal_id: Number.parseInt(categoriaId),
      categoria_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidad),
      peso: Number.parseInt(peso),
      tipo_peso: tipoPeso,
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
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
    setLoteId(detalle.lote_id.toString())
    setCategoriaId(detalle.categoria_animal_id.toString())
    setCantidad(detalle.cantidad.toString())
    setPeso(detalle.peso.toString())
    setTipoPeso(detalle.tipo_peso)
    setEditandoDetalle(index)
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalle = () => {
    setLoteId("")
    setCategoriaId("")
    setCantidad("")
    setPeso("")
    setTipoPeso("TOTAL")
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

    setLoading(true)
    try {
      const response = await fetch(`/api/actividades-animales/${parte.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_actividad_id: Number.parseInt(tipoActividadId),
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          detalles: detalles.map((d) => ({
            categoria_animal_id: d.categoria_animal_id,
            cantidad: d.cantidad,
            peso: d.peso,
            tipo_peso: d.tipo_peso,
            lote_id: d.lote_id,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar actividad")
      }

      const totalAnimales = detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      toast({
        title: "✅ Actividad Actualizada",
        description: `Se actualizaron ${detalles.length} detalles con ${totalAnimales} animales`,
        duration: 4000,
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      onClose?.()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating actividad:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar actividad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesTiposActividad = tiposActividad.map((tipo) => ({
    value: tipo.id.toString(),
    label: tipo.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Editar Actividad con Animales
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingData && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la actividad...</div>
            </div>
          )}

          {!loadingData && (
            <>
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
                      <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                      <div className="mt-1 px-3 py-2 bg-gray-100 border rounded-md text-sm text-gray-900 font-medium">
                        {tipoActividadNombre || "No especificado"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
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
                    <Button onClick={() => setMostrarFormDetalle(true)} className="bg-green-600 hover:bg-green-700">
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
                            {categoriaId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Stock disponible:{" "}
                                {categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)
                                  ?.cantidad || 0}
                              </p>
                            )}
                            {/* </CHANGE> */}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              value={cantidad}
                              onChange={(e) => setCantidad(e.target.value)}
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
                              min="1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Tipo de peso</Label>
                          <RadioGroup
                            value={tipoPeso}
                            onValueChange={(value) => setTipoPeso(value as "TOTAL" | "PROMEDIO")}
                            className="flex gap-6 mt-2"
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
                        <Button onClick={agregarDetalle} className="bg-green-600 hover:bg-green-700">
                          {editandoDetalle !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalle}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de detalles mejorada */}
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
                      {detalles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detalles.map((detalle, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="col-span-2 font-medium truncate">{detalle.lote_nombre}</div>
                              <div className="col-span-3 truncate">{detalle.categoria_nombre}</div>
                              <div className="col-span-2 text-center">{detalle.cantidad}</div>
                              <div className="col-span-2 text-center">{detalle.peso} kg</div>
                              <div className="col-span-2 text-center">{detalle.tipo_peso}</div>
                              <div className="col-span-1 flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalle(index)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalle(index)}
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

        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingData} className="bg-green-600 hover:bg-green-700">
            {loading ? "Actualizando..." : "Actualizar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
