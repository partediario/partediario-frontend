"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Plus, Trash2, Edit, Users, AlertCircle, X, Scissors } from "lucide-react"
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

interface CastracionDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  actividadSeleccionada?: TipoActividad | null
}

export default function CastracionDrawer({
  isOpen = false,
  onClose,
  onSuccess,
  actividadSeleccionada = null,
}: CastracionDrawerProps) {
  const [loading, setLoading] = useState(false)

  // Datos para animales
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
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
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      fetchLotes()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setNota("")
      setDetallesAnimales([])
      limpiarFormularioDetalleAnimales()
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

    if (!actividadSeleccionada) errores.push("Debe seleccionar un tipo de actividad")
    if (!fecha) errores.push("La fecha es requerida")
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
      const horaActual = new Date().toTimeString().slice(0, 5)

      const response = await fetch("/api/actividades-animales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establecimiento_id: establecimientoSeleccionado,
          tipo_actividad_id: 12, // Fixed tipo_actividad_id for castration
          fecha: fecha.toISOString().split("T")[0],
          hora: horaActual,
          nota: nota || null,
          user_id: usuario?.id,
          detalles: detallesAnimales.map((d) => ({
            categoria_animal_id: d.categoria_animal_id,
            cantidad: d.cantidad,
            lote_id: d.lote_id,
            peso: null,
            tipo_peso: null,
          })),
          tipo_movimiento_animal_id: null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar actividad")
      }

      // Calcular totales
      const totalAnimales = detallesAnimales.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      toast({
        title: "✅ Castración Guardada",
        description: `Se registraron ${totalAnimales} animales para castración`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      console.log("Disparando evento reloadPartesDiarios después de guardar castración")
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error saving castración:", error)
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
            Castración
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

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Animales ({detallesAnimales.length}) *
                </h3>
                <Button
                  onClick={() => setMostrarFormDetalleAnimales(true)}
                  disabled={!actividadSeleccionada}
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
                  <div className="grid grid-cols-10 gap-3 px-4 py-3 text-sm font-medium text-gray-700">
                    <div className="col-span-3">Lote</div>
                    <div className="col-span-4">Categoría Animal</div>
                    <div className="col-span-2 text-center">Cantidad</div>
                    <div className="col-span-1 text-center">Acciones</div>
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
                          className="grid grid-cols-10 gap-3 px-4 py-3 text-sm hover:bg-gray-50 items-center min-h-[48px]"
                        >
                          <div className="col-span-3 font-medium truncate">{detalle.lote_nombre}</div>
                          <div className="col-span-4 truncate">{detalle.categoria_nombre}</div>
                          <div className="col-span-2 text-center font-medium">{detalle.cantidad}</div>
                          <div className="col-span-1 flex justify-center gap-1">
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
