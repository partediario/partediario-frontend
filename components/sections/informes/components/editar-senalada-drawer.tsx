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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Edit, Users, AlertCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface EditarSenaladaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

interface Lote {
  id: number
  nombre: string
}

interface DetalleSeñalada {
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  peso: number
  tipo_peso: "TOTAL" | "PROMEDIO"
  lote_id: number
  lote_nombre: string
}

export default function EditarSenaladaDrawer({ isOpen, onClose, parte, onSuccess }: EditarSenaladaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>("")
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<number | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [cantidadMachos, setCantidadMachos] = useState<string>("0")
  const [cantidadHembras, setCantidadHembras] = useState<string>("0")
  const [pesoMachos, setPesoMachos] = useState<string>("0")
  const [pesoHembras, setPesoHembras] = useState<string>("0")

  // Detalles agregados
  const [detalles, setDetalles] = useState<DetalleSeñalada[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && parte) {
      cargarDatosExistentes()
      fetchLotes()
    }
  }, [isOpen, parte])

  const cargarDatosExistentes = async () => {
    if (!parte?.pd_detalles) return

    try {
      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("✅ Cargando datos existentes de Señalada:", detalles)

      // Cargar datos básicos
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora || "")
      setNota(parte.pd_nota || "")

      // Cargar detalles de animales si existen
      if (detalles.detalles_animales && detalles.detalles_animales.length > 0) {
        const detallesFormateados: DetalleSeñalada[] = detalles.detalles_animales.map((detalle: any) => ({
          categoria_animal_id: detalle.categoria_animal_id || (detalle.categoria_animal === "Terneros Macho" ? 21 : 22),
          categoria_nombre: detalle.categoria_animal || "Sin categoría",
          cantidad: detalle.cantidad || 0,
          peso: detalle.peso || 0,
          tipo_peso: detalle.tipo_peso || "TOTAL",
          lote_id: detalle.lote_id || 0,
          lote_nombre: detalle.lote_nombre || `Lote ${detalle.lote_id}`,
        }))

        setDetalles(detallesFormateados)
        console.log("✅ Detalles cargados:", detallesFormateados)
      }
    } catch (error) {
      console.error("❌ Error cargando datos existentes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos existentes",
        variant: "destructive",
      })
    }
  }

  const fetchLotes = async () => {
    if (!parte?.pd_establecimiento_id) return

    try {
      const response = await fetch(`/api/lotes?establecimiento_id=${parte.pd_establecimiento_id}`)
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

  const validarFormularioPrincipal = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (detalles.length === 0) errores.push("Debe agregar al menos un detalle")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!loteId) errores.push("Debe seleccionar un lote")

    const cantMachos = Number.parseInt(cantidadMachos) || 0
    const cantHembras = Number.parseInt(cantidadHembras) || 0

    if (cantMachos < 0) errores.push("La cantidad de machos no puede ser negativa")
    if (cantHembras < 0) errores.push("La cantidad de hembras no puede ser negativa")
    if (cantMachos === 0 && cantHembras === 0) errores.push("Debe ingresar al menos una cantidad (machos o hembras)")

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

    setErroresDetalle([])

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    if (!loteSeleccionado) return

    const cantMachos = Number.parseInt(cantidadMachos) || 0
    const cantHembras = Number.parseInt(cantidadHembras) || 0
    const pesoMachosNum = Number.parseInt(pesoMachos) || 0
    const pesoHembrasNum = Number.parseInt(pesoHembras) || 0

    const nuevosDetalles: DetalleSeñalada[] = []

    if (cantMachos > 0) {
      nuevosDetalles.push({
        categoria_animal_id: 21, // Ternero Macho
        categoria_nombre: "Terneros Macho",
        cantidad: cantMachos,
        peso: pesoMachosNum,
        tipo_peso: "TOTAL",
        lote_id: Number.parseInt(loteId),
        lote_nombre: loteSeleccionado.nombre,
      })
    }

    if (cantHembras > 0) {
      nuevosDetalles.push({
        categoria_animal_id: 22, // Ternero Hembra
        categoria_nombre: "Terneros Hembra",
        cantidad: cantHembras,
        peso: pesoHembrasNum,
        tipo_peso: "TOTAL",
        lote_id: Number.parseInt(loteId),
        lote_nombre: loteSeleccionado.nombre,
      })
    }

    if (editandoDetalle !== null) {
      const detallesFiltrados = detalles.filter((d) => d.lote_id !== Number.parseInt(loteId))
      setDetalles([...detallesFiltrados, ...nuevosDetalles])
      setEditandoDetalle(null)
    } else {
      setDetalles([...detalles, ...nuevosDetalles])
    }

    limpiarFormularioDetalle()
  }

  const editarDetalle = (loteId: number) => {
    const detallesDelLote = detalles.filter((d) => d.lote_id === loteId)
    const lote = lotes.find((l) => l.id === loteId)

    if (!lote) return

    setLoteId(loteId.toString())

    const detallesMachos = detallesDelLote.find((d) => d.categoria_animal_id === 21)
    const detallesHembras = detallesDelLote.find((d) => d.categoria_animal_id === 22)

    setCantidadMachos(detallesMachos?.cantidad.toString() || "0")
    setCantidadHembras(detallesHembras?.cantidad.toString() || "0")
    setPesoMachos(detallesMachos?.peso.toString() || "0")
    setPesoHembras(detallesHembras?.peso.toString() || "0")

    setEditandoDetalle(loteId)
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (loteId: number) => {
    setDetalles(detalles.filter((d) => d.lote_id !== loteId))
  }

  const limpiarFormularioDetalle = () => {
    setLoteId("")
    setCantidadMachos("0")
    setCantidadHembras("0")
    setPesoMachos("0")
    setPesoHembras("0")
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
      const response = await fetch(`/api/senalada/${parte?.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
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
        throw new Error(errorData.error || "Error al actualizar señalada")
      }

      const totalAnimales = detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      toast({
        title: "✅ Señalada Actualizada",
        description: `Se actualizó la señalada con ${detalles.length} detalles y ${totalAnimales} animales`,
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating señalada:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar señalada",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setDetalles([])
    limpiarFormularioDetalle()
    setErrores([])
  }

  const getUserDisplayName = () => {
    if (parte?.pd_usuario_nombres && parte?.pd_usuario_apellidos) {
      return `${parte.pd_usuario_nombres} ${parte.pd_usuario_apellidos}`
    }
    if (parte?.pd_usuario_nombres) {
      return parte.pd_usuario_nombres
    }
    if (parte?.pd_usuario) {
      return parte.pd_usuario
    }
    return "Usuario desconocido"
  }

  const opcionesLotes = lotes
    .filter((lote) => {
      if (editandoDetalle !== null && lote.id === editandoDetalle) {
        return true
      }
      return !detalles.some((detalle) => detalle.lote_id === lote.id)
    })
    .map((lote) => ({
      value: lote.id.toString(),
      label: lote.nombre,
    }))

  const detallesAgrupados = lotes
    .map((lote) => {
      const detallesDelLote = detalles.filter((d) => d.lote_id === lote.id)
      if (detallesDelLote.length === 0) return null

      const machos = detallesDelLote.find((d) => d.categoria_animal_id === 21)
      const hembras = detallesDelLote.find((d) => d.categoria_animal_id === 22)

      return {
        lote_id: lote.id,
        lote_nombre: lote.nombre,
        cantidad_machos: machos?.cantidad || 0,
        cantidad_hembras: hembras?.cantidad || 0,
        peso_machos: machos?.peso || 0,
        peso_hembras: hembras?.peso || 0,
      }
    })
    .filter(Boolean)

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Editar Señalada
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {errores.length > 0 && (
            <Alert variant="destructive" className="mb-6">
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
                      {getUserDisplayName()}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">Señalada</div>
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
                <h3 className="text-lg font-semibold">Detalles *</h3>
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

                  <h4 className="font-medium mb-4">{editandoDetalle !== null ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                  <div className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Cantidad Machos</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={cantidadMachos}
                            onChange={(e) => setCantidadMachos(e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Peso Machos (kg) - Opcional</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={pesoMachos}
                            onChange={(e) => setPesoMachos(e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Cantidad Hembras</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={cantidadHembras}
                            onChange={(e) => setCantidadHembras(e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Peso Hembras (kg) - Opcional</Label>
                        <div className="mt-1">
                          <Input
                            type="number"
                            value={pesoHembras}
                            onChange={(e) => setPesoHembras(e.target.value)}
                            placeholder="0"
                            min="0"
                          />
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

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b">
                  <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                    <div className="col-span-2">Lote</div>
                    <div className="col-span-2 text-center">Cant. Machos</div>
                    <div className="col-span-2 text-center">Cant. Hembras</div>
                    <div className="col-span-2 text-center">Peso Machos</div>
                    <div className="col-span-2 text-center whitespace-nowrap">Peso Hembras</div>
                    <div className="col-span-2 text-center">Acciones</div>
                  </div>
                </div>

                <div className="min-h-[100px]">
                  {detallesAgrupados.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                  ) : (
                    <div className="divide-y">
                      {detallesAgrupados.map((detalle, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center">
                          <div className="col-span-2 font-medium truncate">{detalle.lote_nombre}</div>
                          <div className="col-span-2 text-center">{detalle.cantidad_machos}</div>
                          <div className="col-span-2 text-center">{detalle.cantidad_hembras}</div>
                          <div className="col-span-2 text-center">{detalle.peso_machos} kg</div>
                          <div className="col-span-2 text-center">{detalle.peso_hembras} kg</div>
                          <div className="col-span-2 flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editarDetalle(detalle.lote_id)}
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarDetalle(detalle.lote_id)}
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
                Observaciones
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
