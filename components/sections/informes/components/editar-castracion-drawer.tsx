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
import { Plus, Trash2, Edit, Users, AlertCircle, X, Scissors } from "lucide-react"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
}

interface Lote {
  id: number
  nombre: string
}

interface DetalleActividad {
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  lote_id: number
  lote_nombre: string
}

interface EditarCastracionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  parte: ParteDiario
}

export default function EditarCastracionDrawer({ isOpen, onClose, onSuccess, parte }: EditarCastracionDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Datos para animales
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>("")
  const [nota, setNota] = useState<string>("")

  // Formulario de detalle animales
  const [mostrarFormDetalleAnimales, setMostrarFormDetalleAnimales] = useState(false)
  const [editandoDetalleAnimales, setEditandoDetalleAnimales] = useState<number | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cantidadAnimales, setCantidadAnimales] = useState<string>("")

  // Detalles agregados
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleActividad[]>([])

  // Errores
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalleAnimales, setErroresDetalleAnimales] = useState<string[]>([])

  const { currentEstablishment } = useCurrentEstablishment()
  const { usuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const nombreCompleto = parte ? `${parte.pd_usuario_nombres || ""} ${parte.pd_usuario_apellidos || ""}`.trim() : ""

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada && parte.pd_detalles?.detalle_id) {
      cargarDatosIniciales()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada, parte.pd_detalles?.detalle_id])

  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaId("")
    }
  }, [loteId])

  const cargarDatosIniciales = async () => {
    setLoadingData(true)
    try {
      // Set initial form data from parte
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora.slice(0, 5))
      setNota(parte.pd_nota || "")

      await fetchLotes()

      const response = await fetch(`/api/actividades-mixtas/${parte.pd_id}`)

      if (response.ok) {
        const actividadData = await response.json()

        // Map animal details with lot names
        const animales = (actividadData.pd_actividades_animales_detalle || []).map((animal: any) => ({
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_nombre: animal.pd_categoria_animales?.nombre || "",
          cantidad: animal.cantidad || 0,
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.pd_lotes?.nombre || "",
        }))
        setDetallesAnimales(animales)
      } else {
        const animales = (parte.pd_detalles?.detalles_animales || []).map((animal: any) => ({
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_nombre: animal.categoria_animal || "",
          cantidad: animal.cantidad || 0,
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.lote_nombre || "",
        }))
        setDetallesAnimales(animales)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar datos iniciales",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

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
      const response = await fetch(`/api/categorias-existentes-lote?lote_id=${loteId}&sexo=MACHO&edad=JOVEN`)
      if (!response.ok) throw new Error("Error al cargar categorías")

      const data = await response.json()
      setCategorias(data.categorias || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar categorías de machos jóvenes",
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
    if (detallesAnimales.length === 0) {
      errores.push("Debe agregar al menos un detalle de animales")
    }

    return errores
  }

  const validarDetalleAnimales = (): string[] => {
    const errores: string[] = []

    if (!loteId) errores.push("Debe seleccionar un lote")
    if (!categoriaId) errores.push("Debe seleccionar una categoría")
    if (!cantidadAnimales || Number.parseInt(cantidadAnimales) <= 0) errores.push("La cantidad debe ser mayor a 0")

    return errores
  }

  const agregarDetalleAnimales = () => {
    const erroresValidacion = validarDetalleAnimales()
    if (erroresValidacion.length > 0) {
      setErroresDetalleAnimales(erroresValidacion)
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

    if (!loteSeleccionado || !categoriaSeleccionada) return

    const nuevoDetalle: DetalleActividad = {
      categoria_animal_id: Number.parseInt(categoriaId),
      categoria_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidadAnimales),
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
    }

    if (editandoDetalleAnimales !== null) {
      const nuevosDetalles = [...detallesAnimales]
      nuevosDetalles[editandoDetalleAnimales] = nuevoDetalle
      setDetallesAnimales(nuevosDetalles)
      setEditandoDetalleAnimales(null)
    } else {
      setDetallesAnimales([...detallesAnimales, nuevoDetalle])
    }

    limpiarFormularioDetalleAnimales()
  }

  const editarDetalleAnimales = (index: number) => {
    const detalle = detallesAnimales[index]
    setLoteId(detalle.lote_id.toString())
    setCategoriaId(detalle.categoria_animal_id.toString())
    setCantidadAnimales(detalle.cantidad.toString())
    setEditandoDetalleAnimales(index)
    setMostrarFormDetalleAnimales(true)
    setErroresDetalleAnimales([])
  }

  const eliminarDetalleAnimales = (index: number) => {
    setDetallesAnimales(detallesAnimales.filter((_, i) => i !== index))
  }

  const limpiarFormularioDetalleAnimales = () => {
    setLoteId("")
    setCategoriaId("")
    setCantidadAnimales("")
    setMostrarFormDetalleAnimales(false)
    setEditandoDetalleAnimales(null)
    setErroresDetalleAnimales([])
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/actividades-mixtas/${parte.pd_detalles?.detalle_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          detalles_animales: detallesAnimales.map((d) => ({
            categoria_animal_id: d.categoria_animal_id,
            cantidad: d.cantidad,
            lote_id: d.lote_id,
          })),
          detalles_insumos: [], // Castración no usa insumos
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar castración")
      }

      const totalAnimales = detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      toast({
        title: "✅ Castración Actualizada",
        description: `Se actualizaron ${totalAnimales} animales para castración`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      console.log("Disparando evento reloadPartesDiarios después de actualizar castración")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating castración:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar castración",
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
    setDetallesAnimales([])
    limpiarFormularioDetalleAnimales()
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

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-blue-600" />
            Editar Castración
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando datos...</div>
            </div>
          ) : (
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
                        Castración
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

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Animales ({detallesAnimales.length}) *
                    </h3>
                    <Button
                      onClick={() => setMostrarFormDetalleAnimales(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {/* Formulario de detalle animales */}
                  {mostrarFormDetalleAnimales && (
                    <div className="bg-gray-50 border rounded-lg p-6 mb-4">
                      {/* Errores de detalle animales */}
                      {erroresDetalleAnimales.length > 0 && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                            <AlertCircle className="w-4 h-4" />
                            Errores encontrados:
                          </div>
                          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {erroresDetalleAnimales.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <h4 className="font-medium mb-4">
                        {editandoDetalleAnimales !== null ? "Editar Detalle Animal" : "Nuevo Detalle Animal"}
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
                            <Label>Categoría Animal * (Solo machos jóvenes)</Label>
                            <CustomCombobox
                              options={opcionesCategorias}
                              value={categoriaId}
                              onValueChange={setCategoriaId}
                              placeholder={loteId ? "Selecciona categoría..." : "Primero selecciona un lote"}
                              searchPlaceholder="Buscar categoría..."
                              emptyMessage="No se encontraron categorías de machos jóvenes con stock."
                              disabled={!loteId}
                              loading={loadingCategorias}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Cantidad *</Label>
                          <Input
                            type="number"
                            value={cantidadAnimales}
                            onChange={(e) => setCantidadAnimales(e.target.value)}
                            placeholder="Ej: 10"
                            min="1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={agregarDetalleAnimales} className="bg-green-600 hover:bg-green-700">
                          {editandoDetalleAnimales !== null ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalleAnimales}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de detalles animales */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-4 gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                        <div>Lote</div>
                        <div>Categoría Animal</div>
                        <div className="text-center">Cantidad</div>
                        <div className="text-center">Acciones</div>
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
                              className="grid grid-cols-4 gap-3 px-4 py-3 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                            >
                              <div className="font-medium truncate">{detalle.lote_nombre}</div>
                              <div className="truncate">{detalle.categoria_nombre}</div>
                              <div className="text-center font-medium">{detalle.cantidad}</div>
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalleAnimales(index)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalleAnimales(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
