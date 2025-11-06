"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Package, AlertCircle, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import type { ParteDiario } from "@/lib/types"

interface EditarEntradaInsumosDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

interface MovimientoInsumo {
  id: number
  fecha: string
  hora: string
  nota?: string
  cantidad: number
  insumo_id: number
  tipo_movimiento_insumo: number
  pd_insumos: {
    id: number
    nombre: string
    pd_unidad_medida_insumos?: {
      nombre: string
    }
  }
  pd_tipo_movimientos_insumos: {
    id: number
    nombre: string
  }
  pd_usuarios: {
    nombres: string
    apellidos: string
  }
}

interface InsumoDisponible {
  insumo_id: string
  nombre_insumo: string
  unidad_medida: string
}

interface TipoMovimiento {
  id: string
  nombre: string
}

export default function EditarEntradaInsumosDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarEntradaInsumosDrawerProps) {
  const [movimiento, setMovimiento] = useState<MovimientoInsumo | null>(null)
  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoDisponible[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mostrarModalErrores, setMostrarModalErrores] = useState(false)

  // Formulario
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")
  const [insumoId, setInsumoId] = useState<string>("")
  const [tipoMovimientoId, setTipoMovimientoId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")

  // Errores
  const [errores, setErrores] = useState<string[]>([])

  const { usuario, loading: loadingUsuario } = useUser()

  useEffect(() => {
    if (isOpen && parte.pd_detalles?.detalle_id) {
      console.log("Drawer abierto, cargando datos para:", parte.pd_detalles.detalle_id)
      cargarDatos()
    }
  }, [isOpen, parte.pd_detalles?.detalle_id])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar en paralelo
      await Promise.all([cargarMovimientoInsumo(), cargarInsumosDisponibles(), cargarTiposMovimiento()])
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarMovimientoInsumo = async () => {
    if (!parte.pd_detalles?.detalle_id) return

    try {
      console.log("Cargando movimiento:", parte.pd_detalles.detalle_id)
      const response = await fetch(`/api/movimientos-insumos/${parte.pd_detalles.detalle_id}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos del movimiento recibidos:", data)

      if (!data.movimiento) {
        throw new Error("No se encontró información del movimiento")
      }

      const mov = data.movimiento
      setMovimiento(mov)

      // Precargar formulario
      setFecha(new Date(mov.fecha + "T00:00:00"))
      setHora(mov.hora.slice(0, 5))
      setNota(mov.nota || "")
      setInsumoId(mov.insumo_id.toString())
      setTipoMovimientoId(mov.tipo_movimiento_insumo.toString())
      setCantidad(mov.cantidad.toString())

      console.log("Formulario precargado:", {
        insumoId: mov.insumo_id.toString(),
        tipoMovimientoId: mov.tipo_movimiento_insumo.toString(),
        cantidad: mov.cantidad.toString(),
      })
    } catch (error) {
      console.error("Error cargando movimiento:", error)
      toast({
        title: "Error",
        description: `No se pudo cargar la información del movimiento: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    }
  }

  const cargarInsumosDisponibles = async () => {
    setLoadingInsumos(true)
    try {
      // Obtener el establecimiento_id del localStorage
      const selectedEstablishmentData = localStorage.getItem("selected_establishment")
      let establecimientoId: string | null = null

      if (selectedEstablishmentData) {
        try {
          const parsedData = JSON.parse(selectedEstablishmentData)
          establecimientoId = parsedData.id
        } catch (parseError) {
          console.error("Error parsing selected_establishment from localStorage:", parseError)
        }
      }

      console.log("Cargando insumos para establecimiento:", establecimientoId)

      if (!establecimientoId) {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del establecimiento. Por favor, seleccione uno en el menú principal.",
          variant: "destructive",
        })
        setLoadingInsumos(false)
        return
      }

      const response = await fetch(`/api/insumos-disponibles?establecimiento_id=${establecimientoId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar insumos")
      }

      const data = await response.json()
      console.log("Insumos recibidos:", data)

      setInsumosDisponibles(data.insumos || [])
    } catch (error) {
      console.error("Error cargando insumos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos disponibles",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    setLoadingTipos(true)
    try {
      const response = await fetch("/api/tipos-movimiento-insumos?direccion=ENTRADA")
      if (!response.ok) throw new Error("Error al cargar tipos")

      const data = await response.json()
      console.log("Tipos de movimiento recibidos:", data)
      setTiposMovimiento(data.tipos || [])
    } catch (error) {
      console.error("Error cargando tipos:", error)
    } finally {
      setLoadingTipos(false)
    }
  }

  const validarFormulario = (): string[] => {
    const errores: string[] = []

    if (!fecha) errores.push("La fecha es requerida")
    if (!hora) errores.push("La hora es requerida")
    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!tipoMovimientoId) errores.push("Debe seleccionar un tipo de movimiento")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")

    return errores
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormulario()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      setMostrarModalErrores(true)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/movimientos-insumos/${movimiento?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          insumo_id: Number.parseInt(insumoId),
          cantidad: Number.parseInt(cantidad),
          tipo_movimiento_insumo: Number.parseInt(tipoMovimientoId),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar movimiento")
      }

      toast({
        title: "✅ Entrada Actualizada",
        description: "El movimiento de entrada se actualizó correctamente",
        duration: 4000,
      })

      window.dispatchEvent(new Event("reloadPartesDiarios"))
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating movimiento:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar movimiento",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const puedeEliminar = (): boolean => {
    return parte.pd_detalles?.detalle_deleteable === true
  }

  const eliminarMovimiento = async () => {
    console.log("[v0] eliminarMovimiento iniciado")
    console.log("[v0] movimiento:", movimiento)
    console.log("[v0] usuario:", usuario)

    if (!movimiento || !usuario?.id) {
      console.log("[v0] Validación fallida - movimiento o usuario faltante")
      return
    }

    console.log("[v0] Iniciando eliminación...")
    setDeleting(true)
    try {
      console.log("[v0] Haciendo PATCH a:", `/api/movimientos-insumos/${movimiento.id}`)
      const response = await fetch(`/api/movimientos-insumos/${movimiento.id}`, {
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
        throw new Error("Error al eliminar el movimiento")
      }

      console.log("[v0] Eliminación exitosa")
      toast({
        title: "Movimiento Eliminado",
        description: "El movimiento de entrada ha sido eliminado correctamente",
      })

      console.log("[v0] Disparando evento reloadPartesDiarios")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      handleClose()
    } catch (error) {
      console.error("[v0] Error eliminando movimiento:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento",
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
    setErrores([])
    setMostrarModalErrores(false)
    setShowDeleteConfirm(false)
    // Limpiar formulario
    setMovimiento(null)
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setInsumoId("")
    setTipoMovimientoId("")
    setCantidad("")
  }

  const opcionesInsumos = insumosDisponibles.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const opcionesTipos = tiposMovimiento.map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
  }))

  const insumoSeleccionado = insumosDisponibles.find((i) => i.insumo_id === insumoId)
  const unidadMedida = insumoSeleccionado?.unidad_medida || ""

  const nombreCompleto = movimiento
    ? `${movimiento.pd_usuarios.nombres} ${movimiento.pd_usuarios.apellidos}`.trim()
    : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="editar-entrada-insumos-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            Editar Entrada de Insumos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="editar-entrada-insumos-description" className="sr-only">
          Editar los detalles de una entrada de insumos registrada
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || loadingUsuario ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando movimiento...</div>
            </div>
          ) : movimiento ? (
            <div className="space-y-6">
              {/* Solo mostrar Fecha */}
              <div>
                <div className="space-y-4">
                  <div>
                    <Label>Fecha *</Label>
                    <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                  </div>
                </div>
              </div>

              {/* Datos del Movimiento */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Datos del Movimiento</h3>
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
                        emptyMessage="No se encontraron insumos."
                        loading={loadingInsumos}
                      />
                      {loadingInsumos && <p className="text-xs text-gray-500 mt-1">Cargando insumos...</p>}
                    </div>

                    <div>
                      <Label>Tipo de movimiento *</Label>
                      <CustomCombobox
                        options={opcionesTipos}
                        value={tipoMovimientoId}
                        onValueChange={setTipoMovimientoId}
                        placeholder="Selecciona tipo..."
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos."
                        loading={loadingTipos}
                      />
                      {loadingTipos && <p className="text-xs text-gray-500 mt-1">Cargando tipos...</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Cantidad *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 10"
                        min="1"
                        className="flex-1"
                      />
                      {unidadMedida && (
                        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded border min-w-[80px] text-center">
                          {unidadMedida.toUpperCase()}
                        </span>
                      )}
                    </div>
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
                  placeholder="Notas adicionales sobre el movimiento..."
                  rows={3}
                />
              </div>

              {/* Debug info */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <p>
                    <strong>Debug:</strong>
                  </p>
                  <p>Insumos disponibles: {insumosDisponibles.length}</p>
                  <p>Tipos movimiento: {tiposMovimiento.length}</p>
                  <p>Insumo seleccionado: {insumoId}</p>
                  <p>Tipo seleccionado: {tipoMovimientoId}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No se pudo cargar la información del movimiento</div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-between">
          <div>
            {puedeEliminar() ? (
              <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            ) : (
              <div className="flex flex-col">
                <Button variant="outline" disabled className="text-gray-400 cursor-not-allowed bg-transparent">
                  Eliminar
                </Button>
                <span className="text-xs text-gray-500 mt-1">Este movimiento no puede ser eliminado</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || loading} className="bg-green-600 hover:bg-green-700">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Se encontraron {errores.length} errores:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    {errores.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setMostrarModalErrores(false)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">¿Seguro que quiere eliminar este movimiento de entrada?</p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
                  No
                </Button>
                <Button onClick={eliminarMovimiento} variant="destructive" disabled={deleting}>
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
