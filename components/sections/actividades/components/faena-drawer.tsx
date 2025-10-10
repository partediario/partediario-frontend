"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Edit, Users, AlertCircle, X } from "lucide-react"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"

interface TipoActividad {
  id: number
  nombre: string
  ubicacion: string
  descripcion: string
}

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
  cantidad: number
  sexo?: string
  edad?: string
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

interface TipoMovimiento {
  id: number
  nombre: string
}

interface FaenaDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  actividadSeleccionada?: TipoActividad | null
}

export default function FaenaDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  actividadSeleccionada = null,
}: FaenaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("11") // ID 11 por defecto
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [peso, setPeso] = useState<string>("")
  const [tipoPeso, setTipoPeso] = useState<"TOTAL" | "PROMEDIO">("TOTAL")

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleActividad[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  const { currentEstablishment } = useCurrentEstablishment()
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      fetchLotes()
      fetchTiposMovimiento()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setDetalles([])
      limpiarFormularioDetalle()
      setErrores([])
    }
  }, [isOpen])

  // Cargar categorías cuando se selecciona lote
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

  const fetchCategoriasExistentes = async () => {
    if (!loteId) return

    setLoadingCategorias(true)
    try {
      console.log("🔄 Cargando categorías existentes para lote_id:", loteId)
      const response = await fetch(`/api/categorias-animales-existentes?lote_id=${loteId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Datos de categorías existentes recibidos:", data)
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

  const fetchTiposMovimiento = async () => {
    try {
      const response = await fetch(`/api/tipos-movimiento?empresa_id=${empresaSeleccionada}&direccion=SALIDA`)
      if (!response.ok) throw new Error("Error al cargar tipos de movimiento")

      const data = await response.json()
      // Filtrar para solo incluir los IDs 11 y 7
      const tiposFiltrados = data.tipos.filter((tipo: TipoMovimiento) => tipo.id === 11 || tipo.id === 7)
      setTiposMovimiento(tiposFiltrados || [])
    } catch (error) {
      console.error("Error fetching tipos de movimiento:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar tipos de movimiento",
        variant: "destructive",
      })
    }
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!actividadSeleccionada) errores.push("Debe seleccionar un tipo de actividad")
    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detalles.length === 0) errores.push("Debe agregar al menos un detalle")
    if (!tipoMovimiento) errores.push("Debe seleccionar un tipo de movimiento")

    return errores
  }

  const validarDetalle = (): string[] => {
    console.log("🔍 Iniciando validación de detalle...")
    console.log("Datos del detalle:", { loteId, categoriaId, cantidad, peso })

    const errores: string[] = []

    // Validar campos obligatorios
    if (!loteId) errores.push("Debe seleccionar un lote")
    if (!categoriaId) errores.push("Debe seleccionar una categoría")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")
    if (!peso || Number.parseInt(peso) <= 0) errores.push("El peso debe ser mayor a 0")

    if (categoriaId && cantidad && Number.parseInt(cantidad) > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK")
      console.log("   Categoría seleccionada ID:", categoriaId)
      console.log("   Cantidad solicitada:", cantidad)
      console.log("   Categorías disponibles:", categoriasExistentes.length)

      const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

      console.log("   Categoría encontrada:", categoriaSeleccionada)

      if (categoriaSeleccionada) {
        // Calcular cantidad ya utilizada en otros detalles de la misma categoría
        const cantidadYaUtilizada = detalles
          .filter((d) => d.categoria_animal_id.toString() === categoriaId && editandoDetalle !== detalles.indexOf(d))
          .reduce((sum, d) => sum + d.cantidad, 0)

        const stockDisponible = Number(categoriaSeleccionada.cantidad) - cantidadYaUtilizada
        const cantidadSolicitada = Number.parseInt(cantidad)

        console.log(`📊 Validación de stock para ${categoriaSeleccionada.nombre_categoria_animal}:`)
        console.log(`   Stock total: ${categoriaSeleccionada.cantidad}`)
        console.log(`   Ya utilizado en otros detalles: ${cantidadYaUtilizada}`)
        console.log(`   Stock disponible: ${stockDisponible}`)
        console.log(`   Cantidad solicitada: ${cantidadSolicitada}`)
        console.log(`   ¿Supera el stock?: ${cantidadSolicitada > stockDisponible}`)

        if (cantidadSolicitada > stockDisponible) {
          const errorMsg =
            `Stock insuficiente para ${categoriaSeleccionada.nombre_categoria_animal}. ` +
            `Disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}`
          console.log("❌ ERROR DE STOCK:", errorMsg)
          errores.push(errorMsg)
        } else {
          console.log("✅ Stock suficiente")
        }
      } else {
        console.log("❌ No se encontró la categoría seleccionada en las categorías existentes")
        errores.push("No se pudo validar el stock para la categoría seleccionada")
      }
    }

    console.log("Errores encontrados en detalle:", errores)
    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      console.log("❌ Mostrando errores de validación de detalle")
      setErroresDetalle(erroresValidacion)

      // También mostrar toast
      toast({
        title: "Error en validación",
        description: erroresValidacion.join(", "),
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validación de detalle exitosa, agregando...")
    setErroresDetalle([])

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
      console.log("✅ Detalle actualizado")
    } else {
      setDetalles([...detalles, nuevoDetalle])
      console.log("✅ Detalle agregado")
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
      const response = await fetch("/api/actividades-animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimiento_id: establecimientoSeleccionado,
          tipo_actividad_id: actividadSeleccionada?.id,
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          tipo_movimiento_animal_id: Number.parseInt(tipoMovimiento), // Guardar el tipo de movimiento
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
        throw new Error(errorData.error || "Error al guardar actividad")
      }

      // Calcular total de animales
      const totalAnimales = detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      // Mostrar alerta de éxito igual que entrada
      toast({
        title: "✅ Parte Diario Guardado",
        description: `Se registraron ${detalles.length} detalles con ${totalAnimales} animales`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios (igual que entrada)
      console.log("Disparando evento reloadPartesDiarios después de guardar actividad")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error saving actividad:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al guardar actividad",
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
    setDetalles([])
    limpiarFormularioDetalle()
    setErrores([])
  }

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  const opcionesTiposMovimiento = tiposMovimiento.map((tipo) => ({
    value: tipo.id.toString(),
    label: tipo.nombre,
  }))

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Faena
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {errores.length > 0 && (
            <Alert variant="destructive" className="sticky top-0 z-50 bg-red-50 mb-6 shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Se encontraron {errores.length} errores:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errores.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Actividad *</Label>
                    <div className="mt-1">
                      <Input value={actividadSeleccionada?.nombre || ""} disabled className="bg-gray-50" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Movimiento *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesTiposMovimiento}
                        value={tipoMovimiento}
                        onValueChange={setTipoMovimiento}
                        placeholder="Selecciona tipo de movimiento..."
                        searchPlaceholder="Buscar tipo de movimiento..."
                        emptyMessage="No se encontraron tipos de movimiento."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                    <div className="mt-1">
                      <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Hora *</Label>
                    <div className="mt-1">
                      <CustomTimePicker time={hora} onTimeChange={setHora} placeholder="Seleccionar hora" />
                    </div>
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
                  disabled={!actividadSeleccionada}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar línea
                </Button>
              </div>

              {/* Formulario de detalle expandido - ARRIBA de la tabla */}
              {mostrarFormDetalle && (
                <div className="bg-gray-50 border rounded-lg p-6 mb-4">
                  {/* Mostrar errores de validación del detalle */}
                  {erroresDetalle.length > 0 && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-2">Campos faltantes:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {erroresDetalle.map((error, index) => (
                            <li key={index} className="text-sm">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <h4 className="font-medium mb-4">{editandoDetalle !== null ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Lote *</Label>
                        <div className="mt-1">
                          <CustomCombobox
                            options={opcionesLotes}
                            value={loteId}
                            onValueChange={setLoteId}
                            placeholder="Selecciona lote..."
                            searchPlaceholder="Buscar lote..."
                            emptyMessage="No se encontraron lotes."
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Categoría Animal *
                          {categoriaId && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Stock:{" "}
                              {categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)
                                ?.cantidad || 0}
                              )
                            </span>
                          )}
                        </Label>
                        <div className="mt-1">
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
                        {loadingCategorias && (
                          <p className="text-xs text-gray-500 mt-1">Cargando categorías disponibles...</p>
                        )}
                        {!loadingCategorias && categoriasExistentes.length === 0 && loteId && (
                          <p className="text-xs text-amber-600 mt-1">
                            No hay animales disponibles en el lote seleccionado
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            placeholder="Ej: 10"
                            min="1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Peso (kg) *</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            placeholder="Ej: 250"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipo de peso</Label>
                      <RadioGroup
                        value={tipoPeso}
                        onValueChange={(value) => setTipoPeso(value as "TOTAL" | "PROMEDIO")}
                        className="flex gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="TOTAL" id="total" />
                          <Label htmlFor="total" className="text-sm font-normal text-gray-700">
                            Total
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="PROMEDIO" id="promedio" />
                          <Label htmlFor="promedio" className="text-sm font-normal text-gray-700">
                            Promedio
                          </Label>
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
                {/* Headers de la tabla */}
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

                {/* Contenido de la tabla */}
                <div className="min-h-[100px]">
                  {detalles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                  ) : (
                    <div className="divide-y">
                      {detalles.map((detalle, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center">
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

            {/* Nota */}
            <div>
              <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
                Nota
              </Label>
              <div className="mt-1">
                <Textarea
                  id="nota"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Guardando..." : "Guardar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
