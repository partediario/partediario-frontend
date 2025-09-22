"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Plus, Trash2, Edit, MapPin, AlertCircle, X, CheckCircle, AlertTriangle } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface Potrero {
  id: number
  nombre: string
  superficie_total: number
  superfice_util: number
  recurso_forrajero: string
  receptividad: number
  receptividad_unidad: string
}

interface DetalleRecorrida {
  id: string
  potrero_id: number
  potrero_nombre: string
  incidente: boolean
  incidente_detalle: string | null
  es_original: boolean
}

interface IncidenteItem {
  id: string
  descripcion: string
}

interface EditarRecorridaDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  parte: ParteDiario | null
}

export default function EditarRecorridaDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  parte,
}: EditarRecorridaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [loadingPotreros, setLoadingPotreros] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [potreroId, setPotreroId] = useState<string>("")
  const [tieneIncidente, setTieneIncidente] = useState<boolean>(false)
  const [incidentes, setIncidentes] = useState<IncidenteItem[]>([])

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleRecorrida[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado } = useEstablishment()

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  const fetchPotreros = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingPotreros(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const response = await fetch(`${baseUrl}/api/potreros-crud?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Potreros loaded successfully:", data)
      setPotreros(data.potreros || [])
    } catch (error) {
      console.error("[v0] Error fetching potreros:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar potreros disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingPotreros(false)
    }
  }

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado) {
      fetchPotreros()
      cargarDatosRecorrida()
    }
  }, [isOpen, establecimientoSeleccionado])

  useEffect(() => {
    if (isOpen) {
      limpiarFormularioDetalle()
      setErrores([])
    }
  }, [isOpen])

  const cargarDatosRecorrida = async () => {
    if (!parte?.pd_detalles) return

    setLoadingData(true)
    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      // Aplicar datos básicos
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora?.slice(0, 5) || "")
      setNota(parte.pd_nota || "")

      // Cargar detalles de potreros
      if (detalles?.detalles_potreros) {
        const detallesFormateados = detalles.detalles_potreros.map((detalle: any, index: number) => ({
          id: `existing_${index}`,
          potrero_id: detalle.potrero_id || 0,
          potrero_nombre: detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`,
          incidente: detalle.incidente || false,
          incidente_detalle: detalle.incidente_detalle || null,
          es_original: true,
        }))
        setDetalles(detallesFormateados)
      }
    } catch (err) {
      console.error("Error cargando datos de recorrida:", err)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos de la recorrida",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detalles.length === 0) errores.push("Debe agregar al menos un potrero")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!potreroId) errores.push("Debe seleccionar un potrero")

    // Verificar que el potrero no esté ya agregado (excluyendo el que se está editando)
    const potreroYaAgregado = detalles.some(
      (d, index) => d.potrero_id.toString() === potreroId && index !== editandoDetalle,
    )

    if (potreroYaAgregado) {
      errores.push("Este potrero ya está agregado a la lista")
    }

    // Si tiene incidentes, debe tener al menos uno
    if (tieneIncidente && incidentes.length === 0) {
      errores.push("Debe agregar al menos un incidente")
    }

    return errores
  }

  const agregarIncidente = () => {
    const nuevoIncidente: IncidenteItem = {
      id: Date.now().toString(),
      descripcion: "",
    }
    setIncidentes([...incidentes, nuevoIncidente])
  }

  const actualizarIncidente = (id: string, descripcion: string) => {
    setIncidentes(incidentes.map((inc) => (inc.id === id ? { ...inc, descripcion } : inc)))
  }

  const eliminarIncidente = (id: string) => {
    setIncidentes(incidentes.filter((inc) => inc.id !== id))
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)
      return
    }

    const potreroSeleccionado = potreros.find((p) => p.id.toString() === potreroId)

    if (!potreroSeleccionado) return

    // Construir detalle de incidentes
    let incidenteDetalle = ""
    if (tieneIncidente && incidentes.length > 0) {
      incidenteDetalle = incidentes
        .filter((inc) => inc.descripcion.trim())
        .map((inc) => inc.descripcion.trim())
        .join("; ")
    }

    const nuevoDetalle: DetalleRecorrida = {
      id: editandoDetalle !== null ? detalles[editandoDetalle].id : Date.now().toString(),
      potrero_id: potreroSeleccionado.id,
      potrero_nombre: potreroSeleccionado.nombre,
      incidente: tieneIncidente,
      incidente_detalle: incidenteDetalle,
      es_original: editandoDetalle !== null ? detalles[editandoDetalle].es_original : false,
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
    setPotreroId(detalle.potrero_id.toString())
    setTieneIncidente(detalle.incidente)

    // Cargar incidentes existentes
    if (detalle.incidente && detalle.incidente_detalle) {
      const incidentesExistentes = detalle.incidente_detalle.split("; ").map((desc, idx) => ({
        id: `existing-${idx}`,
        descripcion: desc,
      }))
      setIncidentes(incidentesExistentes)
    } else {
      setIncidentes([])
    }

    setEditandoDetalle(index)
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalle = () => {
    setPotreroId("")
    setTieneIncidente(false)
    setIncidentes([])
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
      const response = await fetch(`/api/recorrida/${parte?.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimiento_id: establecimientoSeleccionado,
          tipo_actividad_id: 6, // ID fijo para recorrida
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          detalles: detalles.map((d) => ({
            potrero_id: d.potrero_id,
            incidente: d.incidente,
            incidente_detalle: d.incidente_detalle || null,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar recorrida")
      }

      // Calcular totales para el mensaje
      const potrerosConIncidentes = detalles.filter((d) => d.incidente).length
      const potrerosOk = detalles.length - potrerosConIncidentes

      toast({
        title: "✅ Recorrida Actualizada",
        description: `Se actualizaron ${detalles.length} potreros: ${potrerosOk} OK, ${potrerosConIncidentes} con incidentes`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating recorrida:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar recorrida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const eliminarRecorrida = async () => {
    console.log("[v0] eliminarRecorrida iniciado")
    console.log("[v0] parte:", parte)
    console.log("[v0] usuario:", usuario)

    if (!parte?.pd_id || !usuario?.id) {
      console.log("[v0] Validación fallida - parte o usuario faltante")
      return
    }

    console.log("[v0] Iniciando eliminación...")
    setDeleting(true)
    try {
      console.log("[v0] Haciendo PATCH a:", `/api/recorrida/${parte.pd_id}`)
      const response = await fetch(`/api/recorrida/${parte.pd_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_user_id: usuario.id,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] Error data:", errorData)
        throw new Error("Error al eliminar la recorrida")
      }

      console.log("[v0] Eliminación exitosa")
      toast({
        title: "Recorrida Eliminada",
        description: "La recorrida ha sido eliminada correctamente",
      })

      console.log("[v0] Disparando evento reloadPartesDiarios")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error("[v0] Error eliminando recorrida:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la recorrida",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] Finalizando eliminación")
      setDeleting(false)
      setShowDeleteConfirm(false)
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
    setShowDeleteConfirm(false)
  }

  // Filtrar potreros que ya están agregados
  const potrerosDisponibles = potreros.filter((potrero) => {
    // Si estamos editando, permitir el potrero actual
    if (editandoDetalle !== null) {
      const detalleEditando = detalles[editandoDetalle]
      if (detalleEditando && detalleEditando.potrero_id === potrero.id) {
        return true
      }
    }
    // Excluir potreros ya agregados
    return !detalles.some((d) => d.potrero_id === potrero.id)
  })

  const opcionesPotreros = potrerosDisponibles.map((potrero) => ({
    value: potrero.id.toString(),
    label: potrero.nombre,
  }))

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            Editar Recorrida
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingData && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la recorrida...</div>
            </div>
          )}

          {!loadingData && (
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
                      <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">Recorrida</div>
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
                    <h3 className="text-lg font-semibold">Detalles *</h3>
                    <Button
                      onClick={() => setMostrarFormDetalle(true)}
                      disabled={potrerosDisponibles.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

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

                      <h4 className="font-medium mb-4">
                        {editandoDetalle !== null ? "Editar Detalle" : "Nuevo Detalle"}
                      </h4>

                      <div className="space-y-4">
                        {/* Selector de Potrero */}
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
                          {potrerosDisponibles.length === 0 && detalles.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              Todos los potreros disponibles ya han sido agregados.
                            </p>
                          )}
                        </div>

                        {/* Toggle Todo OK / Reporte Incidente */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Estado del Potrero</Label>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant={!tieneIncidente ? "default" : "outline"}
                              onClick={() => {
                                setTieneIncidente(false)
                                setIncidentes([])
                              }}
                              className={`flex items-center gap-2 ${
                                !tieneIncidente
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Todo OK
                            </Button>
                            <Button
                              type="button"
                              variant={tieneIncidente ? "default" : "outline"}
                              onClick={() => setTieneIncidente(true)}
                              className={`flex items-center gap-2 ${
                                tieneIncidente
                                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                                  : "border-orange-600 text-orange-600 hover:bg-orange-50"
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Reporte Incidente
                            </Button>
                          </div>
                        </div>

                        {/* Lista de Incidentes */}
                        {tieneIncidente && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-700">Detalles de Incidentes</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={agregarIncidente}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50 bg-transparent"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Agregar Incidente
                              </Button>
                            </div>

                            {incidentes.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                                No hay incidentes agregados. Haz clic en "Agregar Incidente" para añadir uno.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {incidentes.map((incidente, index) => (
                                  <div key={incidente.id} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                      <Textarea
                                        value={incidente.descripcion}
                                        onChange={(e) => actualizarIncidente(incidente.id, e.target.value)}
                                        placeholder={`Descripción del incidente ${index + 1}...`}
                                        rows={2}
                                        className="text-sm"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => eliminarIncidente(incidente.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
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

                  <div className="border rounded-lg overflow-hidden">
                    {/* Headers de la tabla */}
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-3">Potrero</div>
                        <div className="col-span-2 text-center">Estado</div>
                        <div className="col-span-5">Incidentes</div>
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
                            <div
                              key={detalle.id}
                              className="grid grid-cols-12 gap-4 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="col-span-3 font-medium truncate">{detalle.potrero_nombre}</div>
                              <div className="col-span-2 text-center">
                                {detalle.incidente ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <AlertTriangle className="w-3 h-3" />
                                    Con Incidentes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3" />
                                    Todo OK
                                  </span>
                                )}
                              </div>
                              <div className="col-span-5 text-xs text-gray-600">
                                {detalle.incidente_detalle || "Sin incidentes"}
                              </div>
                              <div className="col-span-2 flex justify-center gap-1">
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
        <div className="border-t p-6 flex gap-3 justify-between">
          <div>
            <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" disabled={deleting}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || loadingData}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Actualizando..." : "Actualizar Recorrida"}
            </Button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">¿Seguro que quiere eliminar esta recorrida?</p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
                  No
                </Button>
                <Button onClick={eliminarRecorrida} variant="destructive" disabled={deleting}>
                  {deleting ? "Eliminando..." : "Sí"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
