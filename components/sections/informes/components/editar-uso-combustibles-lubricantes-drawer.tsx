"use client"

import { useState, useEffect } from "react"
import { X, Fuel, AlertCircle, Plus, Edit, Trash2, Check, Search, ChevronDown } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import type { ParteDiario } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"

interface EditarUsoCombustiblesLubricantesDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  parte: ParteDiario | null
}

interface Maquinaria {
  id: number
  nombre: string
  categoria: string
  marca: string
  modelo: string
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

interface DetalleInsumo {
  id?: number
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_disponible: number
  es_original?: boolean
}

export default function EditarUsoCombustiblesLubricantesDrawer({
  isOpen,
  onClose,
  onSuccess,
  parte,
}: EditarUsoCombustiblesLubricantesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([])
  const [maquinariasSeleccionadas, setMaquinariasSeleccionadas] = useState<number[]>([])
  const [maquinariasOriginales, setMaquinariasOriginales] = useState<number[]>([])
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [loadingMaquinarias, setLoadingMaquinarias] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [mostrarSelectorMaquinarias, setMostrarSelectorMaquinarias] = useState(false)
  const [busquedaMaquinarias, setBusquedaMaquinarias] = useState<string>("")

  const [fecha, setFecha] = useState<Date>(new Date())
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleInsumo[]>([])
  const [detallesOriginales, setDetallesOriginales] = useState<DetalleInsumo[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && empresaSeleccionada && parte) {
      fetchMaquinarias()
      fetchInsumosExistentes()
      cargarDatosActividad()
    }
  }, [isOpen, empresaSeleccionada, parte])

  // Actualizar unidad de medida y stock cuando cambia el insumo seleccionado
  useEffect(() => {
    if (insumoId) {
      const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
      if (insumoSeleccionado) {
        setUnidadMedidaActual(insumoSeleccionado.unidad_medida)
        setStockDisponible(insumoSeleccionado.cantidad_disponible)
      }
    } else {
      setUnidadMedidaActual("")
      setStockDisponible(0)
    }
  }, [insumoId, insumosExistentes])

  const cargarDatosActividad = async () => {
    if (!parte?.pd_detalles) return

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos para editar Uso de Combustibles y Lubricantes:", detalles)

      if (parte.pd_fecha) {
        const [year, month, day] = parte.pd_fecha.split("-")
        setFecha(new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day)))
      }
      setNota(parte.pd_nota || "")

      // Cargar maquinarias seleccionadas
      const maquinariasIds = (detalles.detalles_maquinarias || []).map((m: any) => m.maquinaria_id)
      setMaquinariasSeleccionadas(maquinariasIds)
      setMaquinariasOriginales(maquinariasIds)

      // Cargar detalles de insumos
      const insumosData = (detalles.detalles_insumos || []).map((d: any) => ({
        id: d.id,
        insumo_id: d.insumo_id,
        insumo_nombre: d.insumo,
        cantidad: d.cantidad,
        unidad_medida: d.unidad_medida,
        cantidad_disponible: 0,
        es_original: true,
      }))
      setDetalles(insumosData)
      setDetallesOriginales(JSON.parse(JSON.stringify(insumosData)))
    } catch (err) {
      console.error("❌ Error cargando datos de actividad:", err)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos de la actividad",
        variant: "destructive",
      })
    }
  }

  const fetchMaquinarias = async () => {
    if (!empresaSeleccionada) return

    setLoadingMaquinarias(true)
    try {
      const response = await fetch(`/api/maquinarias-crud?empresa_id=${empresaSeleccionada}`)
      if (!response.ok) throw new Error("Error al cargar maquinarias")

      const data = await response.json()
      setMaquinarias(data.maquinarias || [])
    } catch (error) {
      console.error("Error fetching maquinarias:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar maquinarias",
        variant: "destructive",
      })
    } finally {
      setLoadingMaquinarias(false)
    }
  }

  const fetchInsumosExistentes = async () => {
    if (!establecimientoSeleccionado || !empresaSeleccionada) return

    setLoadingInsumos(true)
    try {
      const response = await fetch(
        `/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}&empresa_id=${empresaSeleccionada}&clase_insumo_id=5`,
      )
      if (!response.ok) throw new Error("Error al cargar insumos")

      const data = await response.json()
      setInsumosExistentes(data.insumos || [])
    } catch (error) {
      console.error("Error fetching insumos existentes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar combustibles y lubricantes disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const toggleMaquinariaSeleccion = (maquinariaId: number) => {
    setMaquinariasSeleccionadas((prev) =>
      prev.includes(maquinariaId) ? prev.filter((id) => id !== maquinariaId) : [...prev, maquinariaId],
    )
  }

  const calcularStockDisponible = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoBase = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoBase) return 0

    let stockBase = insumoBase.cantidad_disponible

    // Si estamos editando una línea original, sumar su cantidad original al stock
    if (indexEditando !== null && detalles[indexEditando]?.es_original) {
      const detalleOriginal = detallesOriginales.find((d) => d.insumo_id.toString() === insumoIdSeleccionado)
      if (detalleOriginal) {
        stockBase += detalleOriginal.cantidad
      }
    }

    // Restar cantidades de otras líneas del mismo insumo (excluyendo la que se está editando)
    const cantidadYaUsada = detalles
      .filter((d, index) => d.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando)
      .reduce((sum, d) => {
        // Si es una línea original, no restar porque ya está en el stock base
        if (d.es_original) return sum
        return sum + d.cantidad
      }, 0)

    return stockBase - cantidadYaUsada
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")

    const tieneMaquinariasSeleccionadas = maquinariasSeleccionadas.length > 0
    const tieneDetalles = detalles.length > 0
    const tieneNota = nota.trim().length > 0

    if (!tieneMaquinariasSeleccionadas && !tieneDetalles && !tieneNota) {
      errores.push("Debe seleccionar maquinarias, agregar detalles de insumos, o escribir una nota")
    }

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")

    const stockDisponibleReal = calcularStockDisponible(insumoId, editandoDetalle)
    const cantidadNumerica = Number.parseInt(cantidad) || 0

    if (cantidadNumerica > stockDisponibleReal) {
      errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponibleReal})`)
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
      // Mantener el ID original si existe
      if (nuevosDetalles[editandoDetalle].id) {
        nuevoDetalle.id = nuevosDetalles[editandoDetalle].id
      }
      // Mantener el flag es_original
      nuevoDetalle.es_original = nuevosDetalles[editandoDetalle].es_original
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

  const handleClose = () => {
    onClose?.()
    // Reset form
    setFecha(new Date())
    setNota("")
    setMaquinariasSeleccionadas([])
    setDetalles([])
    limpiarFormularioDetalle()
    setErrores([])
  }

  const handleEliminar = async () => {
    if (!parte?.pd_id) return

    const confirmar = window.confirm("¿Está seguro que desea eliminar esta actividad?")
    if (!confirmar) return

    setLoading(true)
    try {
      const response = await fetch(`/api/uso-combustibles-lubricantes/${parte.pd_id}`, {
        method: "PATCH",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar actividad")
      }

      toast({
        title: "✅ Actividad Eliminada",
        description: "La actividad de uso de combustibles y lubricantes ha sido eliminada correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error eliminando actividad:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al eliminar actividad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    if (!parte?.pd_id) return

    setLoading(true)
    try {
      const horaActual = new Date().toTimeString().slice(0, 5)

      const response = await fetch(`/api/uso-combustibles-lubricantes/${parte.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora: horaActual,
          nota: nota || null,
          maquinarias_seleccionadas: maquinariasSeleccionadas,
          detalles: detalles.map((d) => ({
            id: d.id,
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar actividad")
      }

      toast({
        title: "✅ Actividad Actualizada",
        description: "La actividad de uso de combustibles y lubricantes ha sido actualizada correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating uso combustibles lubricantes:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar actividad",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const stockDisponibleReal = calcularStockDisponible(insumoId, editandoDetalle)

  const maquinariasSeleccionadasNombres = maquinarias
    .filter((maquinaria) => maquinariasSeleccionadas.includes(maquinaria.id))
    .map((maquinaria) => maquinaria.nombre)

  const maquinariasFiltradas = maquinarias.filter((maquinaria) =>
    maquinaria.nombre.toLowerCase().includes(busquedaMaquinarias.toLowerCase()),
  )

  const limpiarSeleccionMaquinarias = () => {
    setMaquinariasSeleccionadas([])
  }

  const cerrarSelectorMaquinarias = () => {
    setMostrarSelectorMaquinarias(false)
    setBusquedaMaquinarias("")
  }

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Fuel className="w-6 h-6 text-orange-600" />
            Editar Uso de Combustibles y Lubricantes
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Errores principales */}
          {errores.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg sticky top-0 z-50 shadow-md">
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
              <Label>Fecha *</Label>
              <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
            </div>

            {/* Selector de Maquinarias */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Maquinarias</h3>
                <Button
                  onClick={() => setMostrarSelectorMaquinarias(!mostrarSelectorMaquinarias)}
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 flex items-center gap-2"
                >
                  {mostrarSelectorMaquinarias ? "Ocultar Selector" : "Seleccionar Maquinarias"}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${mostrarSelectorMaquinarias ? "rotate-180" : ""}`}
                  />
                </Button>
              </div>

              {/* Maquinarias seleccionadas */}
              {maquinariasSeleccionadas.length > 0 && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-medium text-orange-800 mb-2">
                    Maquinarias seleccionadas ({maquinariasSeleccionadas.length}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {maquinariasSeleccionadasNombres.map((nombre, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                      >
                        <Check className="w-3 h-3" />
                        {nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {mostrarSelectorMaquinarias && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg mb-4">
                  {/* Search bar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Buscar maquinarias..."
                        value={busquedaMaquinarias}
                        onChange={(e) => setBusquedaMaquinarias(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="max-h-60 overflow-y-auto">
                    {loadingMaquinarias ? (
                      <div className="text-center py-8 text-gray-500">Cargando maquinarias...</div>
                    ) : maquinariasFiltradas.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {busquedaMaquinarias
                          ? "No se encontraron maquinarias que coincidan con la búsqueda"
                          : "No se encontraron maquinarias"}
                      </div>
                    ) : (
                      <div className="py-2">
                        {maquinariasFiltradas.map((maquinaria) => (
                          <label
                            key={maquinaria.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={maquinariasSeleccionadas.includes(maquinaria.id)}
                              onChange={() => toggleMaquinariaSeleccion(maquinaria.id)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-900 flex-1">{maquinaria.nombre}</span>
                            {maquinariasSeleccionadas.includes(maquinaria.id) && (
                              <Check className="w-4 h-4 text-orange-600" />
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 border-t border-gray-200 flex justify-between">
                    <Button
                      variant="ghost"
                      onClick={limpiarSeleccionMaquinarias}
                      className="text-gray-600 hover:text-gray-800"
                      disabled={maquinariasSeleccionadas.length === 0}
                    >
                      Limpiar
                    </Button>
                    <Button
                      onClick={cerrarSelectorMaquinarias}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Detalles Insumos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles Insumos</h3>
                <Button onClick={() => setMostrarFormDetalle(true)} className="bg-orange-600 hover:bg-orange-700">
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

                  <h4 className="font-medium mb-4">{editandoDetalle !== null ? "Editar Detalle" : "Nuevo Detalle"}</h4>

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
                          emptyMessage="No se encontraron combustibles o lubricantes disponibles."
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
                    <Button onClick={agregarDetalle} className="bg-orange-600 hover:bg-orange-700">
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
                  <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                    <div className="col-span-4">Insumo</div>
                    <div className="col-span-2">Cantidad</div>
                    <div className="col-span-2">Unidad Medida</div>
                    <div className="col-span-2 text-center">Acciones</div>
                  </div>
                </div>

                {/* Contenido de la tabla */}
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

            {/* Nota */}
            <div>
              <Label htmlFor="nota">
                Nota
                {maquinariasSeleccionadas.length === 0 && detalles.length === 0 && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              <Textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder={
                  maquinariasSeleccionadas.length === 0 && detalles.length === 0
                    ? "La nota es obligatoria si no selecciona maquinarias ni agrega insumos..."
                    : "Observaciones adicionales..."
                }
                rows={3}
                className={
                  maquinariasSeleccionadas.length === 0 && detalles.length === 0 && !nota.trim()
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <Button variant="destructive" onClick={handleEliminar} disabled={loading}>
            Eliminar
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? "Actualizando..." : "Actualizar Actividad"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
