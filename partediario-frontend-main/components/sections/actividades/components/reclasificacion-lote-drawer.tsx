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

interface Lote {
  id: number
  nombre: string
}

interface CategoriaExistente {
  lote_stock_id: number
  lote_id: number
  empresa_id: number
  establecimiento_id: number
  categoria_animal_id: number
  categoria_animal_nombre: string
  sexo: string
  edad: string
  cantidad: number
  peso_total: number
}

interface CategoriaDisponible {
  id: number
  nombre: string
  sexo: string
  edad: string
  empresa_id: number
}

interface ReclasificacionLote {
  lote_stock_id: number
  nueva_categoria_id: number | null
  cantidad: number
  peso_total: number
}

interface ReclasificacionLoteDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ReclasificacionLoteDrawer({ isOpen, onClose, onSuccess }: ReclasificacionLoteDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loteSeleccionado, setLoteSeleccionado] = useState<string>("")
  const [categoriasExistentes, setCategoriasExistentes] = useState<CategoriaExistente[]>([])
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaDisponible[]>([])
  const [reclasificaciones, setReclasificaciones] = useState<ReclasificacionLote[]>([])
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  // Usar el contexto de establecimiento
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()
  const { usuario } = useUser()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      console.log("🔄 Drawer abierto, cargando datos iniciales...")
      console.log("👤 Usuario actual:", usuario)
      loadLotes()
      loadCategorias()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada, usuario])

  // Cargar lotes de stock cuando se selecciona un lote
  useEffect(() => {
    if (loteSeleccionado && establecimientoSeleccionado) {
      console.log("🔄 Lote seleccionado, cargando stock...")
      loadLotesStock()
    }
  }, [loteSeleccionado, establecimientoSeleccionado])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      console.log("🧹 Limpiando formulario...")
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setLotes([])
      setLoteSeleccionado("")
      setCategoriasExistentes([])
      setCategoriasDisponibles([])
      setReclasificaciones([])
    }
  }, [isOpen])

  const loadLotes = async () => {
    setLoadingLotes(true)

    try {
      console.log("🔍 Cargando lotes...")
      console.log("🏢 Establecimiento:", establecimientoSeleccionado)

      const lotesUrl = `/api/lotes?establecimiento_id=${establecimientoSeleccionado}`
      console.log("🌐 Llamando API lotes:", lotesUrl)

      const lotesResponse = await fetch(lotesUrl)
      console.log("📡 Response lotes status:", lotesResponse.status)

      if (lotesResponse.ok) {
        const lotesData = await lotesResponse.json()
        console.log("📊 Datos lotes recibidos:", lotesData)

        if (lotesData.lotes && lotesData.lotes.length > 0) {
          setLotes(lotesData.lotes)
          console.log("✅ Lotes cargados:", lotesData.lotes.length)
        } else {
          console.log("⚠️ No se encontraron lotes")
          toast({
            title: "Información",
            description: "No se encontraron lotes para este establecimiento",
            variant: "default",
          })
        }
      } else {
        const errorText = await lotesResponse.text()
        console.error("❌ Error response lotes:", errorText)
        toast({
          title: "Error",
          description: "Error al cargar lotes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error general cargando lotes:", error)
      toast({
        title: "Error",
        description: "Error al cargar los lotes: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoadingLotes(false)
    }
  }

  const loadCategorias = async () => {
    try {
      console.log("🔍 Cargando categorías disponibles...")

      // Cargar todas las categorías disponibles
      const disponiblesUrl = `/api/categorias-animales-empresa?empresa_id=${empresaSeleccionada}`
      console.log("🌐 Llamando API categorías:", disponiblesUrl)

      const disponiblesResponse = await fetch(disponiblesUrl)
      console.log("📡 Response categorías status:", disponiblesResponse.status)

      if (disponiblesResponse.ok) {
        const disponiblesData = await disponiblesResponse.json()
        console.log("📊 Datos categorías recibidos:", disponiblesData)

        if (disponiblesData.categorias) {
          setCategoriasDisponibles(disponiblesData.categorias)
          console.log("✅ Categorías disponibles cargadas:", disponiblesData.categorias.length)
        }
      } else {
        const errorText = await disponiblesResponse.text()
        console.error("❌ Error response categorías:", errorText)
        toast({
          title: "Error",
          description: "Error al cargar categorías disponibles",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error general cargando categorías:", error)
      toast({
        title: "Error",
        description: "Error al cargar categorías: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    }
  }

  const loadLotesStock = async () => {
    setLoading(true)

    try {
      console.log("🔍 Cargando lotes de stock...")
      console.log("🏢 Establecimiento:", establecimientoSeleccionado)
      console.log("📦 Lote seleccionado:", loteSeleccionado)

      // Cargar lotes de stock individuales desde la vista pd_lote_stock_categoria_view
      const lotesUrl = `/api/lote-stock-individual?establecimiento_id=${establecimientoSeleccionado}&lote_id=${loteSeleccionado}`
      console.log("🌐 Llamando API lotes stock:", lotesUrl)

      const lotesResponse = await fetch(lotesUrl)
      console.log("📡 Response lotes stock status:", lotesResponse.status)

      if (lotesResponse.ok) {
        const lotesData = await lotesResponse.json()
        console.log("📊 Datos lotes stock recibidos:", lotesData)

        if (lotesData.categorias && lotesData.categorias.length > 0) {
          setCategoriasExistentes(lotesData.categorias)

          // Inicializar reclasificaciones
          const iniciales = lotesData.categorias.map((cat: CategoriaExistente) => ({
            lote_stock_id: cat.lote_stock_id,
            nueva_categoria_id: null,
            cantidad: cat.cantidad,
            peso_total: cat.peso_total,
          }))
          setReclasificaciones(iniciales)
          console.log("✅ Reclasificaciones inicializadas:", iniciales.length)
        } else {
          console.log("⚠️ No se encontraron registros de stock para este lote")
          setCategoriasExistentes([])
          setReclasificaciones([])
          toast({
            title: "Información",
            description: "No se encontraron registros de stock para este lote",
            variant: "default",
          })
        }
      } else {
        const errorText = await lotesResponse.text()
        console.error("❌ Error response lotes stock:", errorText)
        toast({
          title: "Error",
          description: "Error al cargar registros de stock del lote",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error general cargando lotes stock:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReclasificacionChange = (index: number, field: keyof ReclasificacionLote, value: any) => {
    const updated = [...reclasificaciones]
    updated[index] = { ...updated[index], [field]: value }
    setReclasificaciones(updated)
    console.log("🔄 Reclasificación actualizada:", updated[index])
  }

  const handleSubmit = async () => {
    // Validar que se haya seleccionado un lote
    if (!loteSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un lote",
        variant: "destructive",
      })
      return
    }

    // Validar que el usuario esté cargado
    if (!usuario || !usuario.id) {
      toast({
        title: "Error",
        description: "Usuario no identificado. Por favor, recarga la página.",
        variant: "destructive",
      })
      return
    }

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

    console.log("💾 Guardando reclasificaciones por lote...")
    console.log("📦 Lote ID:", loteSeleccionado)
    console.log("👤 Usuario ID:", usuario.id)
    console.log("📝 Nota:", nota)
    console.log("📋 Reclasificaciones válidas:", reclasificacionesValidas)

    // Preparar datos para envío
    const datosEnvio = {
      establecimiento_id: establecimientoSeleccionado,
      lote_id: Number(loteSeleccionado),
      user_id: usuario.id, // UUID string
      fecha: fecha.toISOString().split("T")[0], // YYYY-MM-DD
      hora: hora, // HH:MM
      nota: nota.trim() || "", // Usar la nota del usuario o string vacío
      reclasificaciones: reclasificacionesValidas.map((r) => ({
        lote_stock_id: r.lote_stock_id,
        nueva_categoria_id: r.nueva_categoria_id,
      })),
    }

    console.log("📤 Datos a enviar:", JSON.stringify(datosEnvio, null, 2))

    setLoading(true)
    try {
      const response = await fetch("/api/reclasificacion-lote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosEnvio),
      })

      console.log("📡 Response status:", response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log("✅ Respuesta exitosa:", responseData)

        toast({
          title: "✅ Actividad Guardada",
          description: `Se procesaron ${reclasificacionesValidas.length} reclasificaciones del lote`,
          duration: 4000,
        })

        // Disparar evento para recargar actividades
        window.dispatchEvent(new Event("reloadActividades"))

        // Disparar evento para recargar partes diarios
        window.dispatchEvent(new Event("reloadPartesDiarios"))

        handleClose()
        onSuccess()
      } else {
        const errorData = await response.json()
        console.error("❌ Error response completo:", errorData)
        toast({
          title: "Error",
          description: errorData.message || errorData.error || "Error al procesar la reclasificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error general guardando:", error)
      toast({
        title: "Error",
        description:
          "Error al procesar la reclasificación: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    console.log("🚪 Cerrando drawer de reclasificación por lote")
    onClose()
    // Reset form
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setLotes([])
    setLoteSeleccionado("")
    setCategoriasExistentes([])
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

    console.log(`🔍 Categorías filtradas para sexo ${sexoActual}:`, filtradas.length)
    return filtradas
  }

  // Preparar opciones para el selector de lotes
  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Reclasificación de Animales por Lote
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

                {/* Selector de Lote */}
                <div>
                  <Label>Lote *</Label>
                  <CustomCombobox
                    options={opcionesLotes}
                    value={loteSeleccionado}
                    onValueChange={setLoteSeleccionado}
                    placeholder="Selecciona lote..."
                    searchPlaceholder="Buscar lote..."
                    emptyMessage="No se encontraron lotes."
                    loading={loadingLotes}
                    disabled={loadingLotes}
                  />
                </div>

                <div>
                  <Label htmlFor="tipo-actividad">Tipo de Actividad *</Label>
                  <Input value="Reclasificación de animales por Lote" disabled className="bg-gray-50" />
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
              {!loteSeleccionado ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Selecciona un lote para ver las categorías disponibles para reclasificar</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Cargando categorías del lote...</span>
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
                      {categoriasExistentes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No hay registros para reclasificar en este lote
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoriasExistentes.map((categoria, index) => {
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
                            <TableRow key={categoria.lote_stock_id}>
                              <TableCell>
                                <div className="font-medium">{categoria.categoria_animal_nombre}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{categoria.cantidad}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{categoria.peso_total} kg</Badge>
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
          <Button
            onClick={handleSubmit}
            disabled={loading || !loteSeleccionado || !usuario}
            className="bg-orange-600 hover:bg-orange-700"
          >
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
