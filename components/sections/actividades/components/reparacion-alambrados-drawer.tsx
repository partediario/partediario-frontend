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

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  cantidad_disponible: number
}

interface ReparacionAlambradosDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  actividadSeleccionada?: TipoActividad | null
}

export default function ReparacionAlambradosDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  actividadSeleccionada = null,
}: ReparacionAlambradosDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [loadingPotreros, setLoadingPotreros] = useState(false)
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
  const [loadingInsumos, setLoadingInsumos] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")
  const [potreroSeleccionado, setPotreroSeleccionado] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleInsumo[]>([])

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
    if (isOpen && establecimientoSeleccionado) {
      fetchPotreros()
      fetchInsumosAlambrados()
    }
  }, [isOpen, establecimientoSeleccionado])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setPotreroSeleccionado("")
      setDetalles([])
      limpiarFormularioDetalle()
      setErrores([])
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

  const fetchInsumosAlambrados = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingInsumos(true)
    try {
      // Filtrar por clase_insumo_id = 4 para materiales de alambrado
      const response = await fetch(
        `/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}&clase_insumo_id=4`,
      )
      if (!response.ok) throw new Error("Error al cargar insumos de alambrado")

      const data = await response.json()
      setInsumosExistentes(data.insumos || [])
    } catch (error) {
      console.error("Error fetching insumos alambrados:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar insumos de alambrado disponibles",
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
    if (!potreroSeleccionado) errores.push("Debe seleccionar un potrero")
    // Los detalles son opcionales para reparación de alambrados

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")

    // Calcular cantidad ya usada del mismo insumo (excluyendo el que se está editando)
    const cantidadYaUsada = detalles
      .filter((d, index) => d.insumo_id.toString() === insumoId && index !== editandoDetalle)
      .reduce((sum, d) => sum + d.cantidad, 0)

    // Calcular stock disponible real considerando lo ya usado
    const stockDisponibleReal = stockDisponible - cantidadYaUsada

    // Validar cantidad ingresada
    const cantidadNumerica = Number.parseInt(cantidad) || 0
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

    setLoading(true)
    try {
      const response = await fetch("/api/reparacion-alambrados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimiento_id: establecimientoSeleccionado,
          tipo_actividad_id: actividadSeleccionada?.id,
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          potrero_id: potreroSeleccionado ? Number.parseInt(potreroSeleccionado) : null,
          detalles: detalles.map((d) => ({
            insumo_id: d.insumo_id,
            cantidad: d.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar actividad")
      }

      // Mostrar alerta de éxito
      const mensajeDetalles =
        detalles.length > 0 ? ` con ${detalles.length} insumo${detalles.length > 1 ? "s" : ""}` : ""
      toast({
        title: "✅ Parte Diario Guardado",
        description: `Se registró la reparación de alambrados${mensajeDetalles}`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      console.log("Disparando evento reloadPartesDiarios después de guardar reparación de alambrados")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error saving reparacion alambrados:", error)
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
    setPotreroSeleccionado("")
    setDetalles([])
    limpiarFormularioDetalle()
    setErrores([])
  }

  const opcionesPotreros = potreros.map((potrero) => ({
    value: potrero.id.toString(),
    label: potrero.nombre,
  }))

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  // Calcular stock disponible real para mostrar
  const cantidadYaUsadaEnFormulario = detalles
    .filter((d, index) => d.insumo_id.toString() === insumoId && index !== editandoDetalle)
    .reduce((sum, d) => sum + d.cantidad, 0)

  const stockDisponibleReal = stockDisponible - cantidadYaUsadaEnFormulario

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Reparación de Alambrados
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
                    <Label htmlFor="tipo-actividad">Tipo de Actividad *</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      Reparación de Alambrados
                    </div>
                  </div>

                  <div>
                    <Label>Potrero *</Label>
                    <CustomCombobox
                      options={opcionesPotreros}
                      value={potreroSeleccionado}
                      onValueChange={setPotreroSeleccionado}
                      placeholder="Selecciona potrero..."
                      searchPlaceholder="Buscar potrero..."
                      emptyMessage="No se encontraron potreros disponibles."
                      loading={loadingPotreros}
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

            {/* Detalles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles</h3>
                <Button
                  onClick={() => setMostrarFormDetalle(true)}
                  disabled={!actividadSeleccionada}
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
                          emptyMessage="No se encontraron insumos de alambrado disponibles."
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
