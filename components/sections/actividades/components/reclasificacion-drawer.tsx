"use client"

import { useState, useEffect } from "react"
import { X, Users, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"

interface CategoriaActual {
  categoria_animal_id: number
  categoria_animal_nombre: string
  total_cantidad: number
  total_peso: number
  sexo: string
  edad: string
  empresa_id: number
  establecimiento_id: number
}

interface CategoriaDisponible {
  id: number
  nombre: string
  sexo: string
  edad: string
  empresa_id: number
}

interface Reclasificacion {
  categoria_actual_id: number
  nueva_categoria_id: number | null
  cantidad: number
  peso: number
}

interface ReclasificacionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReclasificacionDrawer({ isOpen, onClose, onSuccess }: ReclasificacionDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [categoriasActuales, setCategoriasActuales] = useState<CategoriaActual[]>([])
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaDisponible[]>([])
  const [reclasificaciones, setReclasificaciones] = useState<Reclasificacion[]>([])
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  // Usar el contexto de establecimiento
  const { establecimientoSeleccionado, empresaSeleccionada, getEstablecimientoNombre, getEmpresaNombre } =
    useEstablishment()
  const { usuario, loading: loadingUsuario } = useUser()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      loadData()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setCategoriasActuales([])
      setCategoriasDisponibles([])
      setReclasificaciones([])
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)

    try {
      // Cargar categorías actuales desde la vista
      const categoriasUrl = `/api/reclasificacion-categorias?establecimiento_id=${establecimientoSeleccionado}`
      const categoriasResponse = await fetch(categoriasUrl)

      if (categoriasResponse.ok) {
        const categoriasData = await categoriasResponse.json()

        if (categoriasData.categorias && categoriasData.categorias.length > 0) {
          setCategoriasActuales(categoriasData.categorias)

          // Inicializar reclasificaciones
          const iniciales = categoriasData.categorias.map((cat: CategoriaActual) => ({
            categoria_actual_id: cat.categoria_animal_id,
            nueva_categoria_id: null,
            cantidad: cat.total_cantidad,
            peso: cat.total_peso,
          }))
          setReclasificaciones(iniciales)
        } else {
          console.log("No hay categorías disponibles para reclasificar")
          setCategoriasActuales([])
          setReclasificaciones([])
        }
      } else {
        const errorText = await categoriasResponse.text()
        console.error("Error response:", errorText)
        toast({
          title: "Error",
          description: "Error al cargar categorías actuales: " + errorText,
          variant: "destructive",
        })
      }

      // Cargar todas las categorías disponibles
      const disponiblesUrl = `/api/categorias-animales-empresa?empresa_id=${empresaSeleccionada}`
      const disponiblesResponse = await fetch(disponiblesUrl)

      if (disponiblesResponse.ok) {
        const disponiblesData = await disponiblesResponse.json()

        if (disponiblesData.categorias) {
          setCategoriasDisponibles(disponiblesData.categorias)
        }
      } else {
        toast({
          title: "Error",
          description: "Error al cargar categorías disponibles",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los datos: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReclasificacionChange = (index: number, field: keyof Reclasificacion, value: any) => {
    const updated = [...reclasificaciones]
    updated[index] = { ...updated[index], [field]: value }
    setReclasificaciones(updated)
  }

  const handleSubmit = async () => {
    // Validar que al menos una reclasificación esté seleccionada
    const reclasificacionesValidas = reclasificaciones.filter((r) => r.nueva_categoria_id !== null)

    if (reclasificacionesValidas.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una nueva categoría",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/reclasificacion-categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresa_id: empresaSeleccionada,
          establecimiento_id: establecimientoSeleccionado,
          reclasificaciones: reclasificacionesValidas,
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota,
          user_id: usuario?.id,
        }),
      })

      if (response.ok) {
        toast({
          title: "✅ Parte Diario Guardado",
          description: `Se procesaron ${reclasificacionesValidas.length} reclasificaciones`,
          duration: 4000,
        })

        // Disparar evento para recargar partes diarios
        window.dispatchEvent(new Event("reloadPartesDiarios"))

        handleClose()
        onSuccess()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al procesar la reclasificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar la reclasificación",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setCategoriasActuales([])
    setCategoriasDisponibles([])
    setReclasificaciones([])
  }

  // Filtrar categorías disponibles por sexo y excluir la categoría actual
  const getCategoriasDisponiblesPorSexo = (sexoActual: string, categoriaActualId: number) => {
    const filtradas = categoriasDisponibles.filter((cat) => {
      const mismosexo = cat.sexo === sexoActual
      const noEsLaMisma = cat.id !== categoriaActualId
      return mismosexo && noEsLaMisma
    })

    return filtradas
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Reclasificación de Animales por Categoría
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Datos Generales */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Datos Generales</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                      Reclasificación
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
                  <Input value="Reclasificación de animales por Categoría" disabled className="bg-gray-50" />
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

            {/* Reclasificaciones */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Reclasificaciones *</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Cargando categorías...</span>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría Actual</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Peso Total</TableHead>
                        <TableHead>Nueva Categoría</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriasActuales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No hay categorías para reclasificar
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoriasActuales.map((categoria, index) => {
                          // Filtrar categorías disponibles por sexo para esta fila
                          const categoriasFiltradasPorSexo = getCategoriasDisponiblesPorSexo(
                            categoria.sexo,
                            categoria.categoria_animal_id,
                          )
                          const opcionesCategorias = categoriasFiltradasPorSexo.map((cat) => ({
                            value: cat.id.toString(),
                            label: cat.nombre,
                          }))

                          return (
                            <TableRow key={categoria.categoria_animal_id}>
                              <TableCell>
                                <div className="font-medium">{categoria.categoria_animal_nombre}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{categoria.total_cantidad}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{categoria.total_peso} kg</Badge>
                              </TableCell>
                              <TableCell>
                                <CustomCombobox
                                  options={opcionesCategorias}
                                  value={reclasificaciones[index]?.nueva_categoria_id?.toString() || ""}
                                  onValueChange={(value) =>
                                    handleReclasificacionChange(
                                      index,
                                      "nueva_categoria_id",
                                      value ? Number.parseInt(value) : null,
                                    )
                                  }
                                  placeholder="Selecciona categoría..."
                                  searchPlaceholder="Buscar categoría..."
                                  emptyMessage="No se encontraron categorías."
                                  loading={false}
                                  disabled={false}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
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
          <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Reclasificación
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
