"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Edit, Droplets, AlertCircle, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface Potrero {
  id: number
  nombre: string
}

interface DetallePotrero {
  id: string
  potrero_id: number
  potrero_nombre: string
  es_original: boolean
}

interface EditarLimpiezaBebederosDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  parte: ParteDiario | null
}

export default function EditarLimpiezaBebederosDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  parte,
}: EditarLimpiezaBebederosDrawerProps) {
  // Estados principales
  const [tipoActividadNombre, setTipoActividadNombre] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Estados de opciones
  const [potreros, setPotreros] = useState<Potrero[]>([])

  // Estados del formulario principal
  const [tipoActividadId, setTipoActividadId] = useState<string>("")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Estados del formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<DetallePotrero | null>(null)
  const [potreroId, setPotreroId] = useState<string>("")

  // Estados de datos
  const [detalles, setDetalles] = useState<DetallePotrero[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  // Contextos
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Función para limpiar todos los estados
  const limpiarEstados = useCallback(() => {
    setTipoActividadId("")
    setTipoActividadNombre("")
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setDetalles([])
    setPotreros([])
    limpiarFormularioDetalle()
    setErrores([])
    setLoadingData(false)
  }, [])

  // Función para cargar potreros
  const fetchPotreros = useCallback(async () => {
    if (!establecimientoSeleccionado) return []

    try {
      console.log("🔄 Cargando potreros...")
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar potreros")

      const data = await response.json()
      const potrerosData = data.potreros || []
      setPotreros(potrerosData)
      console.log("✅ Potreros cargados:", potrerosData.length)
      return potrerosData
    } catch (error) {
      console.error("❌ Error fetching potreros:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar potreros",
        variant: "destructive",
      })
      return []
    }
  }, [establecimientoSeleccionado])

  // Función para extraer datos del parte diario
  const extraerDatosParteDiario = useCallback(() => {
    if (!parte) {
      console.log("❌ No hay parte diario disponible")
      return null
    }

    try {
      console.log("🔄 Extrayendo datos del parte diario...")
      console.log("📋 Parte completo:", parte)

      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("📋 Detalles parseados:", detalles)

      const datosExtraidos = {
        tipoActividadNombre: detalles?.detalle_tipo || "Limpieza de Bebederos",
        tipoActividadId: detalles?.detalle_tipo_id?.toString() || "",
        fecha: new Date(parte.pd_fecha + "T00:00:00"),
        hora: parte.pd_hora?.slice(0, 5) || "",
        nota: parte.pd_nota || "",
        detalles:
          detalles?.detalles_potreros?.map((detalle: any, index: number) => ({
            id: detalle.id?.toString() || `existing_${index}`,
            potrero_id: detalle.potrero_id || 0,
            potrero_nombre: detalle.potrero_nombre || `Potrero ${detalle.potrero_id}`,
            es_original: true, // Marcar como original
          })) || [],
      }

      console.log("✅ Datos extraídos exitosamente:", datosExtraidos)
      return datosExtraidos
    } catch (err) {
      console.error("❌ Error extrayendo datos del parte diario:", err)
      return null
    }
  }, [parte])

  // Función para aplicar los datos extraídos
  const aplicarDatosExtraidos = useCallback((datos: any, potrerosDisponibles: Potrero[] = []) => {
    if (!datos) {
      console.log("❌ No hay datos para aplicar")
      return
    }

    console.log("🔄 Aplicando datos extraídos...")
    console.log("📋 Datos a aplicar:", datos)
    console.log("🏷️ Potreros disponibles:", potrerosDisponibles)

    // Aplicar datos básicos
    setTipoActividadNombre(datos.tipoActividadNombre)
    setTipoActividadId(datos.tipoActividadId)
    setFecha(datos.fecha)
    setHora(datos.hora)
    setNota(datos.nota)

    // Actualizar nombres de potreros en los detalles usando los potreros disponibles
    if (datos.detalles && datos.detalles.length > 0) {
      const detallesConNombres = datos.detalles.map((detalle: any) => {
        const potreroEncontrado = potrerosDisponibles.find((p) => p.id === detalle.potrero_id)
        console.log(`�� Buscando potrero ${detalle.potrero_id}:`, potreroEncontrado)
        return {
          ...detalle,
          potrero_nombre: potreroEncontrado ? potreroEncontrado.nombre : `Potrero ${detalle.potrero_id}`,
        }
      })
      console.log("✅ Detalles con nombres actualizados:", detallesConNombres)
      setDetalles(detallesConNombres)
    } else {
      setDetalles(datos.detalles)
    }

    console.log("✅ Datos aplicados exitosamente")
  }, [])

  // Función principal de inicialización
  const inicializarDrawer = useCallback(async () => {
    if (!establecimientoSeleccionado || !empresaSeleccionada || !parte) {
      console.log("❌ Faltan datos para inicializar:", {
        establecimiento: !!establecimientoSeleccionado,
        empresa: !!empresaSeleccionada,
        parte: !!parte,
      })
      return
    }

    console.log("🚀 Iniciando inicialización del drawer...")
    setLoadingData(true)

    try {
      // 1. Cargar potreros
      console.log("📡 Cargando potreros...")
      const potrerosData = await fetchPotreros()

      console.log("✅ Potreros cargados:", potrerosData.length)

      // 2. Extraer datos del parte diario
      console.log("📋 Extrayendo datos...")
      const datosExtraidos = extraerDatosParteDiario()

      if (!datosExtraidos) {
        console.log("❌ No se pudieron extraer los datos")
        return
      }

      // 3. Pequeña pausa para asegurar que React haya actualizado los estados
      await new Promise((resolve) => setTimeout(resolve, 200))

      // 4. Aplicar los datos extraídos CON los potreros cargados
      console.log("🔧 Aplicando datos con potreros...")
      aplicarDatosExtraidos(datosExtraidos, potrerosData)

      console.log("✅ Inicialización completada exitosamente")
    } catch (error) {
      console.error("❌ Error durante la inicialización:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos de la limpieza",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }, [
    establecimientoSeleccionado,
    empresaSeleccionada,
    parte,
    fetchPotreros,
    extraerDatosParteDiario,
    aplicarDatosExtraidos,
  ])

  // Effect principal - se ejecuta cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      console.log("🔓 Drawer abierto - iniciando carga...")
      inicializarDrawer()
    } else {
      limpiarEstados()
    }
  }, [isOpen, inicializarDrawer, limpiarEstados])

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (!tipoActividadId) errores.push("Debe tener un tipo de actividad válido")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!potreroId) errores.push("Debe seleccionar un potrero")

    // Validar que el potrero no esté ya agregado (excepto si estamos editando)
    if (potreroId) {
      const yaExiste = detalles.some(
        (detalle) => detalle.potrero_id.toString() === potreroId && detalle.id !== editandoDetalle?.id,
      )
      if (yaExiste) {
        errores.push("Este potrero ya está agregado")
      }
    }

    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)
      toast({
        title: "Error en validación",
        description: erroresValidacion.join(", "),
        variant: "destructive",
      })
      return
    }

    const potreroSeleccionado = potreros.find((p) => p.id.toString() === potreroId)

    if (!potreroSeleccionado) return

    const nuevoDetalle: DetallePotrero = {
      id: editandoDetalle ? editandoDetalle.id : Date.now().toString(),
      potrero_id: Number.parseInt(potreroId),
      potrero_nombre: potreroSeleccionado.nombre,
      es_original: editandoDetalle ? editandoDetalle.es_original : false,
    }

    if (editandoDetalle) {
      // Actualizar detalle existente
      const detallesActualizados = detalles.map((detalle) =>
        detalle.id === editandoDetalle.id ? nuevoDetalle : detalle,
      )
      setDetalles(detallesActualizados)
      setEditandoDetalle(null)
    } else {
      // Agregar nuevo detalle
      setDetalles([...detalles, nuevoDetalle])
    }

    limpiarFormularioDetalle()
  }

  const editarDetalle = (detalle: DetallePotrero) => {
    console.log("✏️ Iniciando edición de detalle:", detalle)
    setEditandoDetalle(detalle)
    setPotreroId(detalle.potrero_id.toString())
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (id: string) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  const limpiarFormularioDetalle = () => {
    setPotreroId("")
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
      const response = await fetch(`/api/limpieza-bebederos/${parte.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_actividad_id: Number.parseInt(tipoActividadId),
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          detalles: detalles.map((d) => ({
            potrero_id: d.potrero_id,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar limpieza de bebederos")
      }

      toast({
        title: "✅ Limpieza Actualizada",
        description: `Se actualizaron ${detalles.length} potreros`,
        duration: 4000,
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      onClose?.()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating limpieza bebederos:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar limpieza de bebederos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/limpieza-bebederos/${parte.pd_id}`, {
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
        throw new Error(errorData.error || "Error al eliminar limpieza de bebederos")
      }

      toast({
        title: "✅ Limpieza Eliminada",
        description: "La limpieza de bebederos ha sido eliminada correctamente",
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting limpieza bebederos:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al eliminar limpieza de bebederos",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  // Opciones para el combobox - filtrar potreros ya seleccionados
  const opcionesPotreros = potreros
    .filter((potrero) => {
      // Si estamos editando, permitir el potrero actual
      if (editandoDetalle && potrero.id === editandoDetalle.potrero_id) {
        return true
      }
      // Filtrar potreros ya seleccionados
      return !detalles.some((detalle) => detalle.potrero_id === potrero.id)
    })
    .map((potrero) => ({
      value: potrero.id.toString(),
      label: potrero.nombre,
    }))

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-blue-600" />
            Editar Limpieza de Bebederos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingData && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la limpieza...</div>
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
                        {tipoActividadNombre || "Limpieza de Bebederos"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
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

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalles</h3>
                    <Button onClick={() => setMostrarFormDetalle(true)} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {mostrarFormDetalle && (
                    <div className="bg-gray-50 border rounded-lg p-6 mb-4">
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

                      <h4 className="font-medium mb-4">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Potrero *</Label>
                          <div className="mt-1">
                            <CustomCombobox
                              options={opcionesPotreros}
                              value={potreroId}
                              onValueChange={setPotreroId}
                              placeholder="Selecciona potrero..."
                              searchPlaceholder="Buscar potrero..."
                              emptyMessage="No se encontraron potreros disponibles."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={agregarDetalle} className="bg-blue-600 hover:bg-blue-700">
                          {editandoDetalle ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalle}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-2 gap-4 p-3 text-sm font-medium text-gray-700">
                        <div>Potrero</div>
                        <div>Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detalles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detalles.map((detalle, index) => (
                            <div
                              key={detalle.id}
                              className="grid grid-cols-2 gap-4 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="font-medium truncate">{detalle.potrero_nombre}</div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalle(detalle)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalle(detalle.id)}
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
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea eliminar esta limpieza de bebederos? Esta acción no se puede deshacer.
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

        <div className="border-t p-4 flex justify-between">
          {/* Botón Eliminar en el lado izquierdo */}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading || deleting || loadingData}
          >
            Eliminar
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || loadingData} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Actualizando..." : "Actualizar Limpieza"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
