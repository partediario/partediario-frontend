"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle, Edit } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { useLotesQuery } from "@/hooks/queries/use-lotes-query"
import { useKeyboardAwareDrawer } from "@/hooks/drawer-optimization/use-keyboard-aware-drawer-v2"
import { useDebounceInput } from "@/hooks/drawer-optimization/use-debounce-input"

interface EntradaAnimalesDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface DetalleItem {
  id: string
  tipo_movimiento_id: string
  tipo_movimiento_nombre: string
  categoria_id: string
  categoria_nombre: string
  cantidad: number
  peso: number
  tipo_peso: "TOTAL" | "PROMEDIO"
}

interface Lote {
  id: string
  nombre: string
}

interface Categoria {
  id: string
  nombre: string
  sexo?: string
  edad?: string
}

interface TipoMovimiento {
  id: string
  nombre: string
  direccion?: string
}

export default function EntradaAnimalesDrawer({ isOpen, onClose, onSuccess }: EntradaAnimalesDrawerProps) {
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const [loading, setLoading] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])

  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])
  const [mostrarExito, setMostrarExito] = useState(false)

  const [loteSeleccionado, setLoteSeleccionado] = useState("")
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(new Date())
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | undefined>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  const [detalles, setDetalles] = useState<DetalleItem[]>([])
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<string | null>(null)

  const [nuevoDetalle, setNuevoDetalle] = useState({
    tipo_movimiento_id: "",
    categoria_id: "",
    tipo_peso: "PROMEDIO" as "TOTAL" | "PROMEDIO",
  })

  const { data: lotes = [] } = useLotesQuery(establecimientoSeleccionado ? Number(establecimientoSeleccionado) : null)

  const {
    value: cantidad,
    debouncedValue: cantidadDebounced,
    handleChange: setCantidad,
    reset: resetCantidad,
  } = useDebounceInput("")

  const {
    value: peso,
    debouncedValue: pesoDebounced,
    handleChange: setPeso,
    reset: resetPeso,
  } = useDebounceInput("")

  const { handleInteractOutside, handlePointerDownOutside } = useKeyboardAwareDrawer({ isOpen })

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      const ahora = new Date()
      setFechaSeleccionada(ahora)
      setHoraSeleccionada(ahora.toTimeString().slice(0, 5))

      cargarCategorias()
      cargarTiposMovimiento()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  useEffect(() => {
    if (!isOpen) {
      setLoteSeleccionado("")
      setNota("")
      setDetalles([])
      setMostrarFormDetalle(false)
      setEditandoDetalle(null)
      setErroresValidacion([])
      setErroresDetalle([])
      setMostrarExito(false)
      setNuevoDetalle({
        tipo_movimiento_id: "",
        categoria_id: "",
        tipo_peso: "PROMEDIO",
      })
      resetCantidad()
      resetPeso()
    }
  }, [isOpen, resetCantidad, resetPeso])

  // Filtrar categorías cuando cambia el tipo de movimiento
  useEffect(() => {
    if (nuevoDetalle.tipo_movimiento_id && categorias.length > 0) {
      const tipoSeleccionado = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)

      console.log("Tipo seleccionado:", tipoSeleccionado)
      console.log("Todas las categorías:", categorias)

      if (tipoSeleccionado?.nombre === "Nacimiento") {
        // Solo mostrar TERNEROS MACHOS (id=21) y TERNEROS HEMBRAS (id=22)
        const categoriasTerneros = categorias
          .filter((cat) => {
            const esTermero =
              cat.id === "21" || cat.id === "22" || Number.parseInt(cat.id) === 21 || Number.parseInt(cat.id) === 22
            console.log(`Categoría ${cat.nombre} (ID: ${cat.id}) es ternero:`, esTermero)
            return esTermero
          })
          .sort((a, b) => Number.parseInt(a.id) - Number.parseInt(b.id))

        console.log("Categorías terneros filtradas:", categoriasTerneros)
        setCategoriasFiltradas(categoriasTerneros)

        // Si la categoría actual no es ternero, limpiar selección
        if (
          nuevoDetalle.categoria_id &&
          !["21", "22"].includes(nuevoDetalle.categoria_id) &&
          ![21, 22].includes(Number.parseInt(nuevoDetalle.categoria_id))
        ) {
          setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
        }
      } else {
        // Mostrar todas las categorías para otros tipos de movimiento
        setCategoriasFiltradas(categorias)
      }
    } else {
      setCategoriasFiltradas(categorias)
    }
  }, [nuevoDetalle.tipo_movimiento_id, categorias, tiposMovimiento])

  const cargarCategorias = async () => {
    if (!empresaSeleccionada) return

    setLoadingCategorias(true)
    try {
      const response = await fetch(`/api/categorias-animales?empresa_id=${empresaSeleccionada}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setCategorias(data.categorias || [])
      setCategoriasFiltradas(data.categorias || [])
    } catch (error) {
      console.error("Error cargando categorías:", error)
      setCategorias([])
      setCategoriasFiltradas([])
    } finally {
      setLoadingCategorias(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    if (!empresaSeleccionada) return

    setLoadingTipos(true)
    try {
      const response = await fetch(`/api/tipos-movimiento?empresa_id=${empresaSeleccionada}&direccion=ENTRADA`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setTiposMovimiento(data.tipos || [])
    } catch (error) {
      console.error("Error cargando tipos de movimiento:", error)
      setTiposMovimiento([])
    } finally {
      setLoadingTipos(false)
    }
  }

  const limpiarFormularioDetalle = useCallback(() => {
    setNuevoDetalle({
      tipo_movimiento_id: "",
      categoria_id: "",
      tipo_peso: "PROMEDIO",
    })
    resetCantidad()
    resetPeso()
    setMostrarFormDetalle(false)
    setEditandoDetalle(null)
    setErroresDetalle([])
  }, [resetCantidad, resetPeso])

  const editarDetalle = useCallback((detalle: DetalleItem) => {
    console.log("🖊️ Editando detalle:", detalle)
    setEditandoDetalle(detalle.id)
    setNuevoDetalle({
      tipo_movimiento_id: detalle.tipo_movimiento_id,
      categoria_id: detalle.categoria_id,
      tipo_peso: detalle.tipo_peso,
    })
    setCantidad(detalle.cantidad.toString())
    setPeso(detalle.peso.toString())
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }, [setCantidad, setPeso])

  const agregarDetalle = useCallback(() => {
    const errores: string[] = []

    if (!nuevoDetalle.tipo_movimiento_id) errores.push("Debe seleccionar un tipo de movimiento")
    if (!nuevoDetalle.categoria_id) errores.push("Debe seleccionar una categoría animal")
    if (!cantidadDebounced || Number.parseInt(cantidadDebounced) <= 0) errores.push("La cantidad debe ser mayor a 0")

    const tipoMovimientoId = Number.parseInt(nuevoDetalle.tipo_movimiento_id)
    const esNacimiento = tipoMovimientoId === 2

    if (!esNacimiento && (!pesoDebounced || Number.parseInt(pesoDebounced) <= 0)) {
      errores.push("El peso debe ser mayor a 0")
    }

    if (errores.length > 0) {
      setErroresDetalle(errores)
      return
    }

    setErroresDetalle([])

    const tipoMov = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)
    const categoria = categoriasFiltradas.find((c) => c.id === nuevoDetalle.categoria_id)

    if (editandoDetalle) {
      const detallesActualizados = detalles.map((d) =>
        d.id === editandoDetalle
          ? {
              ...d,
              tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
              tipo_movimiento_nombre: tipoMov?.nombre || "",
              categoria_id: nuevoDetalle.categoria_id,
              categoria_nombre: categoria?.nombre || "",
              cantidad: Number.parseInt(cantidadDebounced),
              peso: Number.parseInt(pesoDebounced),
              tipo_peso: nuevoDetalle.tipo_peso,
            }
          : d,
      )
      setDetalles(detallesActualizados)
      console.log("✅ Detalle actualizado")
    } else {
      const detalle: DetalleItem = {
        id: Date.now().toString(),
        tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
        tipo_movimiento_nombre: tipoMov?.nombre || "",
        categoria_id: nuevoDetalle.categoria_id,
        categoria_nombre: categoria?.nombre || "",
        cantidad: Number.parseInt(cantidadDebounced),
        peso: Number.parseInt(pesoDebounced),
        tipo_peso: nuevoDetalle.tipo_peso,
      }
      setDetalles([...detalles, detalle])
      console.log("✅ Detalle agregado")
    }

    limpiarFormularioDetalle()
  }, [nuevoDetalle, cantidadDebounced, pesoDebounced, tiposMovimiento, categoriasFiltradas, editandoDetalle, detalles, limpiarFormularioDetalle])

  const cancelarEdicion = useCallback(() => {
    limpiarFormularioDetalle()
  }, [limpiarFormularioDetalle])

  const eliminarDetalle = useCallback((id: string) => {
    setDetalles((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const validarFormulario = useCallback(() => {
    const errores: string[] = []

    if (!loteSeleccionado) errores.push("Debe seleccionar un lote")
    if (!fechaSeleccionada) errores.push("Debe seleccionar una fecha")
    if (detalles.length === 0) {
      errores.push(
        "Debe agregar al menos un detalle. Por favor, complete el formulario y presione 'Agregar' antes de guardar.",
      )
    }
    if (!usuario?.id) errores.push("Error del sistema: No se pudo obtener el ID del usuario")
    if (!establecimientoSeleccionado) errores.push("Error del sistema: No se pudo obtener el ID del establecimiento")

    return errores
  }, [loteSeleccionado, fechaSeleccionada, detalles.length, usuario?.id, establecimientoSeleccionado])

  const guardar = useCallback(async () => {
    const errores = validarFormulario()
    if (errores.length > 0) {
      setErroresValidacion(errores)
      setMostrarModalErrores(true)
      return
    }

    setErroresValidacion([])
    setLoading(true)

    try {
      const datosMovimiento = {
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        nota: nota.trim() || null,
        fecha: fechaSeleccionada?.toISOString().split("T")[0] || "",
        hora: horaSeleccionada || "",
        lote_id: Number.parseInt(loteSeleccionado),
        user_id: usuario!.id,
        detalles: detalles.map((detalle) => ({
          categoria_id: Number.parseInt(detalle.categoria_id),
          cantidad: detalle.cantidad,
          peso: detalle.peso,
          tipo_peso: detalle.tipo_peso,
          tipo_movimiento_id: Number.parseInt(detalle.tipo_movimiento_id),
        })),
      }

      const response = await fetch("/api/movimientos-animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosMovimiento),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || `Error HTTP ${response.status}`)
      }

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Parte Diario Guardado",
          description: `Se registraron ${detalles.length} detalles con ${detalles.reduce((sum, d) => sum + d.cantidad, 0)} animales`,
          duration: 4000,
        })
      }, 500)

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error guardando movimiento:", error)
      toast({
        title: "Error",
        description: `No se pudo guardar la entrada de animales: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }, [validarFormulario, establecimientoSeleccionado, nota, fechaSeleccionada, horaSeleccionada, loteSeleccionado, usuario, detalles, onSuccess, onClose])

  const opcionesLotes = useMemo(
    () => lotes.map((lote) => ({ value: lote.id.toString(), label: lote.nombre })),
    [lotes]
  )

  const opcionesTiposMovimiento = useMemo(
    () => tiposMovimiento.map((tipo) => ({ value: tipo.id, label: tipo.nombre })),
    [tiposMovimiento]
  )

  const opcionesCategorias = useMemo(
    () => categoriasFiltradas.map((categoria) => ({ value: categoria.id, label: categoria.nombre })),
    [categoriasFiltradas]
  )

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent
        className="h-full"
        onInteractOutside={handleInteractOutside}
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-lg md:text-xl font-bold text-gray-900">Entrada de Animales</DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50 sticky top-0 z-10 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">¡Entrada guardada exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se registraron {detalles.length} detalles con {detalles.reduce((sum, d) => sum + d.cantidad, 0)}{" "}
                  animales
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-base md:text-base md:text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lote" className="text-sm font-medium text-gray-700">
                  Lote *
                </Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={opcionesLotes}
                    value={loteSeleccionado}
                    onValueChange={setLoteSeleccionado}
                    placeholder="Selecciona un lote..."
                    searchPlaceholder="Buscar lote..."
                    emptyMessage="No se encontraron lotes."
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                <div className="mt-1">
                  <CustomDatePicker
                    date={fechaSeleccionada}
                    onDateChange={setFechaSeleccionada}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Detalles *</h3>
              <Button onClick={() => setMostrarFormDetalle(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar línea
              </Button>
            </div>

            {/* Formulario de nuevo detalle */}
            {mostrarFormDetalle && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="font-medium text-gray-900">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                {erroresDetalle.length > 0 && (
                  <Alert variant="destructive">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de movimiento *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesTiposMovimiento}
                        value={nuevoDetalle.tipo_movimiento_id}
                        onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, tipo_movimiento_id: value })}
                        placeholder="Selecciona tipo..."
                        searchPlaceholder="Buscar tipo de movimiento..."
                        emptyMessage="No se encontraron tipos de movimiento."
                        loading={loadingTipos}
                        disabled={loadingTipos}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Categoría Animal *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesCategorias}
                        value={nuevoDetalle.categoria_id}
                        onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, categoria_id: value })}
                        placeholder="Selecciona categoría..."
                        searchPlaceholder="Buscar categoría..."
                        emptyMessage="No se encontraron categorías."
                        loading={loadingCategorias}
                        disabled={loadingCategorias}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className="mt-1"
                      placeholder="Ej: 10"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Peso (kg){" "}
                      {nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) !== 2 && "*"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="mt-1"
                      placeholder={
                        nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) === 2
                          ? "Dejar vacío para usar promedio"
                          : "Ej: 250"
                      }
                    />
                    {nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) === 2 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Si no ingresa un peso, se calculará automáticamente el promedio del lote
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de peso</Label>
                  <RadioGroup
                    value={nuevoDetalle.tipo_peso}
                    onValueChange={(value: "TOTAL" | "PROMEDIO") =>
                      setNuevoDetalle({ ...nuevoDetalle, tipo_peso: value })
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TOTAL" id="total" />
                      <Label htmlFor="total" className="text-sm">
                        Total
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PROMEDIO" id="promedio" />
                      <Label htmlFor="promedio" className="text-sm">
                        Promedio
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2">
                  <Button onClick={agregarDetalle} size="sm" className="bg-green-600 hover:bg-green-700">
                    {editandoDetalle ? "Actualizar" : "Agregar"}
                  </Button>
                  <Button onClick={cancelarEdicion} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de detalles */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de movimiento</TableHead>
                    <TableHead>Categoría Animal</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No hay detalles agregados
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((detalle) => (
                      <TableRow key={detalle.id}>
                        <TableCell>{detalle.tipo_movimiento_nombre}</TableCell>
                        <TableCell>{detalle.categoria_nombre}</TableCell>
                        <TableCell>{detalle.cantidad}</TableCell>
                        <TableCell>{detalle.peso} kg</TableCell>
                        <TableCell>{detalle.tipo_peso}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => editarDetalle(detalle)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => eliminarDetalle(detalle.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Nota */}
          <div>
            <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
              Nota
            </Label>
            <Textarea
              id="nota"
              placeholder="Notas adicionales sobre el movimiento..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-red-600 mb-3">
                    Se encontraron {erroresValidacion.length} errores:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {erroresValidacion.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setMostrarModalErrores(false)} className="bg-red-600 hover:bg-red-700">
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
