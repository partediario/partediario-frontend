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
import { Plus, Trash2, Edit, Wrench, Package, AlertCircle, X } from "lucide-react"
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

interface Potrero {
  id: number
  nombre: string
  superficie_total: number
  superfice_util: number
  recurso_forrajero: string
  receptividad: number
  receptividad_unidad: string
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

interface DetallePotrero {
  potrero_id: number
  potrero_nombre: string
  tipo_trabajo: "Reparación" | "Instalación"
  observaciones: string
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_disponible: number
}

interface CaneriasBebederosDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  actividadSeleccionada?: TipoActividad | null
}

export default function CaneriasBebederosDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  actividadSeleccionada = null,
}: CaneriasBebederosDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("potreros")

  // Datos para potreros
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [loadingPotreros, setLoadingPotreros] = useState(false)

  // Datos para insumos
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle potreros
  const [mostrarFormDetallePotreros, setMostrarFormDetallePotreros] = useState(false)
  const [editandoDetallePotreros, setEditandoDetallePotreros] = useState<number | null>(null)
  const [potreroId, setPotreroId] = useState<string>("")
  const [tipoTrabajo, setTipoTrabajo] = useState<"Reparación" | "Instalación">("Reparación")
  const [observaciones, setObservaciones] = useState<string>("")

  // Formulario de detalle insumos
  const [mostrarFormDetalleInsumos, setMostrarFormDetalleInsumos] = useState(false)
  const [editandoDetalleInsumos, setEditandoDetalleInsumos] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidadInsumos, setCantidadInsumos] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Detalles agregados
  const [detallesPotreros, setDetallesPotreros] = useState<DetallePotrero[]>([])
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetallePotreros, setErroresDetallePotreros] = useState<string[]>([])
  const [erroresDetalleInsumos, setErroresDetalleInsumos] = useState<string[]>([])

  const { currentEstablishment } = useCurrentEstablishment()
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      fetchPotreros()
      fetchInsumosExistentes()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setDetallesPotreros([])
      setDetallesInsumos([])
      limpiarFormularioDetallePotreros()
      limpiarFormularioDetalleInsumos()
      setErrores([])
      setActiveTab("potreros")
    }
  }, [isOpen])

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

  const fetchPotreros = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingPotreros(true)
    try {
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar potreros")

      const data = await response.json()
      setPotreros(data.potreros || [])
    } catch (error) {
      console.error("Error fetching potreros:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar potreros disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingPotreros(false)
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
      setInsumosExistentes(data.insumos || [])
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

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!actividadSeleccionada) errores.push("Debe seleccionar un tipo de actividad")
    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detallesPotreros.length === 0) {
      errores.push("Debe agregar al menos un potrero")
    }

    return errores
  }

  const validarDetallePotreros = (): string[] => {
    const errores: string[] = []

    if (!potreroId) errores.push("Debe seleccionar un potrero")
    if (!tipoTrabajo) errores.push("Debe seleccionar un tipo de trabajo")

    // Verificar que el potrero no esté ya agregado (excluyendo el que se está editando)
    const potreroYaAgregado = detallesPotreros.some(
      (d, index) => d.potrero_id.toString() === potreroId && index !== editandoDetallePotreros,
    )

    if (potreroYaAgregado) {
      errores.push("Este potrero ya está agregado a la lista")
    }

    return errores
  }

  const validarDetalleInsumos = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidadInsumos || Number.parseInt(cantidadInsumos) <= 0) errores.push("La cantidad debe ser mayor a 0")

    // Calcular cantidad ya usada del mismo insumo (excluyendo el que se está editando)
    const cantidadYaUsada = detallesInsumos
      .filter((d, index) => d.insumo_id.toString() === insumoId && index !== editandoDetalleInsumos)
      .reduce((sum, d) => sum + d.cantidad, 0)

    // Calcular stock disponible real considerando lo ya usado
    const stockDisponibleReal = stockDisponible - cantidadYaUsada

    // Validar cantidad ingresada
    const cantidadNumerica = Number.parseInt(cantidadInsumos) || 0
    if (cantidadNumerica > stockDisponibleReal) {
      if (cantidadYaUsada > 0) {
        errores.push(
          `La cantidad no puede ser mayor a ${stockDisponibleReal} (ya se usaron ${cantidadYaUsada} de ${stockDisponible} disponibles)`,
        )
      } else {
        errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponible})`)
      }
    }

    return errores
  }

  const agregarDetallePotrero = () => {
    const erroresValidacion = validarDetallePotreros()
    if (erroresValidacion.length > 0) {
      setErroresDetallePotreros(erroresValidacion)
      return
    }

    const potreroSeleccionado = potreros.find((p) => p.id.toString() === potreroId)

    if (!potreroSeleccionado) return

    const nuevoDetalle: DetallePotrero = {
      potrero_id: potreroSeleccionado.id,
      potrero_nombre: potreroSeleccionado.nombre,
      tipo_trabajo: tipoTrabajo,
      observaciones: observaciones.trim(),
    }

    if (editandoDetallePotreros !== null) {
      const nuevosDetalles = [...detallesPotreros]
      nuevosDetalles[editandoDetallePotreros] = nuevoDetalle
      setDetallesPotreros(nuevosDetalles)
      setEditandoDetallePotreros(null)
    } else {
      setDetallesPotreros([...detallesPotreros, nuevoDetalle])
    }

    limpiarFormularioDetallePotreros()
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

  const editarDetallePotrero = (index: number) => {
    const detalle = detallesPotreros[index]
    setPotreroId(detalle.potrero_id.toString())
    setTipoTrabajo(detalle.tipo_trabajo)
    setObservaciones(detalle.observaciones)
    setEditandoDetallePotreros(index)
    setMostrarFormDetallePotreros(true)
    setErroresDetallePotreros([])
    setActiveTab("potreros")
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

  const eliminarDetallePotrero = (index: number) => {
    setDetallesPotreros(detallesPotreros.filter((_, i) => i !== index))
  }

  const eliminarDetalleInsumos = (index: number) => {
    setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetallePotreros = () => {
    setPotreroId("")
    setTipoTrabajo("Reparación")
    setObservaciones("")
    setMostrarFormDetallePotreros(false)
    setEditandoDetallePotreros(null)
    setErroresDetallePotreros([])
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
      const response = await fetch("/api/canerias-bebederos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimiento_id: establecimientoSeleccionado,
          tipo_actividad_id: 4, // ID fijo para cañerías y bebederos
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          detalles_potreros: detallesPotreros.map((d) => ({
            potrero_id: d.potrero_id,
            tipo_trabajo: d.tipo_trabajo,
            incidente_detalle: d.observaciones,
          })),
          detalles_insumos: detallesInsumos.map((d) => ({
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar actividad")
      }

      // Calcular totales
      const totalPotreros = detallesPotreros.length
      const totalInsumos = detallesInsumos.length

      toast({
        title: "✅ Parte Diario Guardado",
        description: `Se registraron ${totalPotreros} potrero${totalPotreros > 1 ? "s" : ""} y ${totalInsumos} insumo${totalInsumos > 1 ? "s" : ""}`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      console.log("Disparando evento reloadPartesDiarios después de guardar cañerías y bebederos")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error saving cañerías y bebederos:", error)
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
    setDetallesPotreros([])
    setDetallesInsumos([])
    limpiarFormularioDetallePotreros()
    limpiarFormularioDetalleInsumos()
    setErrores([])
    setActiveTab("potreros")
  }

  // Filtrar potreros que ya están agregados
  const potrerosDisponibles = potreros.filter((potrero) => {
    // Si estamos editando, permitir el potrero actual
    if (editandoDetallePotreros !== null) {
      const detalleEditando = detallesPotreros[editandoDetallePotreros]
      if (detalleEditando && detalleEditando.potrero_id === potrero.id) {
        return true
      }
    }
    // Excluir potreros ya agregados
    return !detallesPotreros.some((d) => d.potrero_id === potrero.id)
  })

  const opcionesPotreros = potrerosDisponibles.map((potrero) => ({
    value: potrero.id.toString(),
    label: potrero.nombre,
  }))

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const opcionesTipoTrabajo = [
    { value: "Reparación", label: "Reparación" },
    { value: "Instalación", label: "Instalación" },
  ]

  // Calcular stock disponible real para mostrar en insumos
  const cantidadYaUsadaEnFormularioInsumos = detallesInsumos
    .filter((d, index) => d.insumo_id.toString() === insumoId && index !== editandoDetalleInsumos)
    .reduce((sum, d) => sum + d.cantidad, 0)

  const stockDisponibleRealInsumos = stockDisponible - cantidadYaUsadaEnFormularioInsumos

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Wrench className="w-6 h-6 text-orange-600" />
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            Cañerías y Bebederos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
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
                  <Input value={actividadSeleccionada?.nombre || ""} disabled className="bg-gray-50" />
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
                  <TabsTrigger value="potreros" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Potreros ({detallesPotreros.length})
                  </TabsTrigger>
                  <TabsTrigger value="insumos" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Insumos ({detallesInsumos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="potreros" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setMostrarFormDetallePotreros(true)}
                      disabled={!actividadSeleccionada || potrerosDisponibles.length === 0}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {/* Formulario de detalle potreros */}
                  {mostrarFormDetallePotreros && (
                    <div className="bg-gray-50 border rounded-lg p-6">
                      {/* Errores de detalle potreros */}
                      {erroresDetallePotreros.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Errores encontrados:
                          </div>
                          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {erroresDetallePotreros.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-medium mb-4">
                        {editandoDetallePotreros !== null ? "Editar Detalle Potrero" : "Nuevo Detalle Potrero"}
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Potrero *</Label>
                            <CustomCombobox
                              options={opcionesPotreros}
                              value={potreroId}
                              onValueChange={setPotreroId}
                              placeholder="Selecciona potrero..."
                              searchPlaceholder="Buscar potrero..."
                              emptyMessage="No se encontraron potreros disponibles."
                              loading={loadingPotreros}
                            />
                            {potrerosDisponibles.length === 0 && detallesPotreros.length > 0 && (
                              <p className="text-sm text-gray-500 mt-1">
                                Todos los potreros disponibles ya han sido agregados.
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Tipo de Trabajo *</Label>
                            <CustomCombobox
                              options={opcionesTipoTrabajo}
                              value={tipoTrabajo}
                              onValueChange={(value) => setTipoTrabajo(value as "Reparación" | "Instalación")}
                              placeholder="Selecciona tipo de trabajo..."
                              searchPlaceholder="Buscar tipo de trabajo..."
                              emptyMessage="No se encontraron opciones."
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Observaciones</Label>
                          <Textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Detalles del trabajo realizado..."
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={agregarDetallePotrero} className="bg-green-600 hover:bg-green-700">
                          {editandoDetallePotreros !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetallePotreros}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de detalles potreros */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-3">Potrero</div>
                        <div className="col-span-2 text-center">Tipo Trabajo</div>
                        <div className="col-span-5">Observaciones</div>
                        <div className="col-span-2 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detallesPotreros.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de potreros agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesPotreros.map((detalle, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="col-span-3 font-medium truncate">{detalle.potrero_nombre}</div>
                              <div className="col-span-2 text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    detalle.tipo_trabajo === "Reparación"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {detalle.tipo_trabajo}
                                </span>
                              </div>
                              <div className="col-span-5 truncate text-gray-600">{detalle.observaciones || "-"}</div>
                              <div className="col-span-2 flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetallePotrero(index)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetallePotrero(index)}
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
                </TabsContent>

                <TabsContent value="insumos" className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setMostrarFormDetalleInsumos(true)}
                      disabled={!actividadSeleccionada}
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
                        {editandoDetalleInsumos !== null ? "Editar Detalle Insumo" : "Nuevo Detalle Insumo"}
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
                      <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                        <div className="col-span-4">Insumo</div>
                        <div className="col-span-2">Cantidad</div>
                        <div className="col-span-2">Unidad Medida</div>
                        <div className="col-span-2 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detallesInsumos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles de insumos agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detallesInsumos.map((detalle, index) => (
                            <div key={index} className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50">
                              <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                              <div className="col-span-2">{detalle.cantidad}</div>
                              <div className="col-span-2 text-gray-600">{detalle.unidad_medida}</div>
                              <div className="col-span-2 flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalleInsumos(index)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalleInsumos(index)}
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
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Guardando..." : "Guardar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
