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
import type { ParteDiario } from "@/lib/types"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"

interface EditarSalidaInsumosDrawerProps {
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
  cantidad: number // Cantidad original del movimiento
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

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
}

interface TipoMovimiento {
  id: string
  nombre: string
}

export default function EditarSalidaInsumosDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarSalidaInsumosDrawerProps) {
  const [movimiento, setMovimiento] = useState<MovimientoInsumo | null>(null)
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])
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

  // Contexto de establecimiento
  const { establecimientoSeleccionado } = useEstablishment()

  const { usuario, loading: loadingUsuario } = useUser()

  useEffect(() => {
    if (isOpen && parte.pd_detalles?.detalle_id && establecimientoSeleccionado) {
      cargarMovimientoInsumo()
      cargarInsumosExistentes() // Ahora se llama con establecimientoSeleccionado
      cargarTiposMovimiento()
    }
  }, [isOpen, parte.pd_detalles?.detalle_id, establecimientoSeleccionado]) // Añadir establecimientoSeleccionado como dependencia

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
        description: "El movimiento de salida ha sido eliminado correctamente",
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

  const cargarMovimientoInsumo = async () => {
    if (!parte.pd_detalles?.detalle_id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/movimientos-insumos/${parte.pd_detalles.detalle_id}`)
      if (!response.ok) throw new Error("Error al cargar movimiento")

      const data = await response.json()
      const mov = data.movimiento

      setMovimiento(mov)
      setFecha(new Date(mov.fecha + "T00:00:00"))
      setHora(mov.hora.slice(0, 5))
      setNota(mov.nota || "")
      setInsumoId(mov.insumo_id.toString())
      setTipoMovimientoId(mov.tipo_movimiento_insumo.toString())
      setCantidad(mov.cantidad.toString())
    } catch (error) {
      console.error("Error cargando movimiento:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del movimiento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const cargarInsumosExistentes = async () => {
    if (!establecimientoSeleccionado) {
      console.error("Error: establecimientoSeleccionado no está disponible para cargar insumos.")
      setErrores((prev) => [...prev, "Error: No se pudo obtener el ID del establecimiento para cargar insumos."])
      return
    }

    setLoadingInsumos(true)
    try {
      // Pasar establecimiento_id como query parameter
      const response = await fetch(`/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar insumos")
      }

      const data = await response.json()
      setInsumosExistentes(data.insumos || [])
    } catch (error) {
      console.error("Error cargando insumos:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al cargar insumos existentes",
        variant: "destructive",
      })
    } finally {
      setLoadingInsumos(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    setLoadingTipos(true)
    try {
      const response = await fetch("/api/tipos-movimiento-insumos?direccion=SALIDA")
      if (!response.ok) throw new Error("Error al cargar tipos")

      const data = await response.json()
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

    // Validar stock disponible para edición
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
    const cantidadSolicitada = Number.parseInt(cantidad)
    const cantidadOriginalMovimiento = movimiento?.cantidad || 0 // Cantidad que ya se había movido en este registro

    if (insumoSeleccionado) {
      // Stock disponible real + cantidad original de este movimiento
      // Esto "devuelve" la cantidad original al stock para la validación
      const stockAjustadoParaValidacion = insumoSeleccionado.cantidad_disponible + cantidadOriginalMovimiento

      if (cantidadSolicitada > stockAjustadoParaValidacion) {
        errores.push(
          `La cantidad solicitada (${cantidadSolicitada}) supera el stock disponible ajustado (${stockAjustadoParaValidacion}).`,
        )
      }
    }

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
        title: "✅ Salida Actualizada",
        description: "El movimiento de salida se actualizó correctamente",
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

  const handleClose = () => {
    onClose?.()
    setErrores([])
    setMostrarModalErrores(false)
    setShowDeleteConfirm(false)
  }

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  const opcionesTipos = tiposMovimiento.map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
  }))

  const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
  const unidadMedida = insumoSeleccionado?.unidad_medida || ""

  // Calcular la cantidad disponible ajustada para mostrar en la UI
  const cantidadOriginalMovimiento = movimiento?.cantidad || 0
  const cantidadDisponibleParaMostrar = insumoSeleccionado
    ? insumoSeleccionado.cantidad_disponible + cantidadOriginalMovimiento
    : 0

  const nombreCompleto = movimiento
    ? `${movimiento.pd_usuarios.nombres} ${movimiento.pd_usuarios.apellidos}`.trim()
    : ""

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto" aria-describedby="editar-salida-insumos-description">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Editar Salida de Insumos
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>
        <div id="editar-salida-insumos-description" className="sr-only">
          Editar los detalles de una salida de insumos registrada
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
                <Label>Fecha *</Label>
                <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
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
                    </div>
                  </div>

                  <div>
                    <Label>
                      Cantidad *
                      {insumoSeleccionado && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Disponible: {cantidadDisponibleParaMostrar})
                        </span>
                      )}
                    </Label>
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
            <Button onClick={handleSubmit} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {mostrarModalErrores && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-600 mb-3">Se encontraron {errores.length} errores:</h3>
                  <ul className="space-y-2 text-gray-700">
                    {errores.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1.5">•</span>
                        <span>{error}</span>
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
              <p className="text-gray-600 mb-6">¿Seguro que quiere eliminar este movimiento de salida?</p>
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
