"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, CheckCircle, Package } from "lucide-react"

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { toast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"

interface EntradaInsumosDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface InsumoDisponible {
  insumo_id: string
  nombre_insumo: string
  unidad_medida: string
  unidad_medida_uso_id: number | null
}

interface TipoMovimiento {
  id: string
  nombre: string
}

export default function EntradaInsumosDrawer({ isOpen, onClose, onSuccess }: EntradaInsumosDrawerProps) {
  /* ------------------------- estados ------------------------- */
  const [loading, setLoading] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)

  const [insumosDisponibles, setInsumosDisponibles] = useState<InsumoDisponible[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])

  // campos formulario
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(new Date())
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | undefined>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  const [insumoSeleccionado, setInsumoSeleccionado] = useState("")
  const [tipoMovimientoSeleccionado, setTipoMovimientoSeleccionado] = useState("")
  const [cantidad, setCantidad] = useState(0)

  const [erroresValidacion, setErroresValidacion] = useState<string[]>([])
  const [mostrarExito, setMostrarExito] = useState(false)

  /* ------------------------- contextos ------------------------- */
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Obtener los datos del insumo seleccionado
  const insumoSeleccionadoData = insumosDisponibles.find((i) => i.insumo_id === insumoSeleccionado)
  const unidadMedidaSeleccionada = insumoSeleccionadoData?.unidad_medida || ""

  /* ------------------------- carga inicial ------------------------- */
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado) {
      const ahora = new Date()
      setFechaSeleccionada(ahora)
      setHoraSeleccionada(ahora.toTimeString().slice(0, 5))

      cargarInsumosDisponibles()
      cargarTiposMovimiento()
    }
  }, [isOpen, establecimientoSeleccionado])

  /* ------------------------- reset al cerrar ------------------------- */
  useEffect(() => {
    if (!isOpen) {
      setNota("")
      setInsumoSeleccionado("")
      setTipoMovimientoSeleccionado("")
      setCantidad(0)
      setErroresValidacion([])
      setMostrarExito(false)
    }
  }, [isOpen])

  /* ------------------------- fetch helpers ------------------------- */
  const cargarInsumosDisponibles = async () => {
    if (!establecimientoSeleccionado) return
    setLoadingInsumos(true)
    try {
      const res = await fetch(`/api/insumos-disponibles?establecimiento_id=${establecimientoSeleccionado}`)
      if (!res.ok) throw new Error("HTTP " + res.status)
      const data = await res.json()
      setInsumosDisponibles(data.insumos ?? [])
    } catch (e) {
      console.error("Error cargando insumos disponibles:", e)
      setInsumosDisponibles([])
    } finally {
      setLoadingInsumos(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    setLoadingTipos(true)
    try {
      const res = await fetch(`/api/tipos-movimiento-insumos?direccion=ENTRADA`)
      if (!res.ok) throw new Error("HTTP " + res.status)
      const data = await res.json()
      setTiposMovimiento(data.tipos ?? [])
    } catch (e) {
      console.error("Error cargando tipos movimiento:", e)
      setTiposMovimiento([])
    } finally {
      setLoadingTipos(false)
    }
  }

  /* ------------------------- validación ------------------------- */
  const validarFormulario = () => {
    const errores: string[] = []
    if (!fechaSeleccionada) errores.push("Debe seleccionar una fecha")
    if (!horaSeleccionada) errores.push("Debe seleccionar una hora")
    if (!insumoSeleccionado) errores.push("Debe seleccionar un insumo")
    if (!tipoMovimientoSeleccionado) errores.push("Debe seleccionar un tipo de movimiento")
    if (!cantidad || cantidad <= 0) errores.push("La cantidad debe ser mayor a 0")
    if (!usuario?.id) errores.push("Error del sistema: no se encontró el usuario")
    if (!establecimientoSeleccionado) errores.push("Error del sistema: no se encontró el establecimiento")

    return errores
  }

  /* ------------------------- submit ------------------------- */
  const guardar = async () => {
    const err = validarFormulario()
    if (err.length) {
      setErroresValidacion(err)
      return
    }
    setErroresValidacion([])
    setLoading(true)

    try {
      const movimientoData = {
        insumo_id: Number.parseInt(insumoSeleccionado),
        cantidad,
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        fecha: fechaSeleccionada?.toISOString().split("T")[0] ?? "",
        hora: horaSeleccionada,
        nota: nota.trim() || null,
        user_id: usuario!.id,
        tipo_movimiento_insumo: Number.parseInt(tipoMovimientoSeleccionado),
      }

      const res = await fetch("/api/movimientos-insumos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movimientoData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error HTTP " + res.status)
      }

      setMostrarExito(true)
      toast({
        title: "✅ Entrada de Insumos Guardada",
        description: "Se registró el movimiento correctamente",
      })
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (e) {
      console.error("Error guardando movimiento:", e)
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Error desconocido al guardar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------- opciones combobox ------------------------- */
  const opcionesInsumos = insumosDisponibles.map((i) => ({
    value: i.insumo_id,
    label: i.nombre_insumo,
  }))
  const opcionesTiposMovimiento = tiposMovimiento.map((t) => ({
    value: t.id,
    label: t.nombre,
  }))

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  /* ------------------------- render ------------------------- */
  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full">
        {/* ----- header ----- */}
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-600" />
            Entrada de Insumos
          </DrawerTitle>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        {/* ----- body ----- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50 sticky top-0 z-50 shadow-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="space-y-1">
                <p className="font-medium text-green-800">¡Entrada guardada exitosamente!</p>
                <p className="text-sm text-green-700">Se registró el movimiento correctamente</p>
              </AlertDescription>
            </Alert>
          )}

          {/* errores */}
          {erroresValidacion.length > 0 && (
            <Alert variant="destructive" className="sticky top-0 z-50 bg-red-50 shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Se encontraron {erroresValidacion.length} errores:</p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {erroresValidacion.map((e, idx) => (
                    <li key={idx}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Solo mostrar Fecha */}
          <section className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
              <div className="mt-1">
                <CustomDatePicker date={fechaSeleccionada} onDateChange={setFechaSeleccionada} />
              </div>
            </div>
          </section>

          {/* DATOS MOVIMIENTO */}
          <section className="space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Datos del Movimiento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Insumo *</Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={opcionesInsumos}
                    value={insumoSeleccionado}
                    onValueChange={setInsumoSeleccionado}
                    placeholder="Selecciona insumo..."
                    emptyMessage="Sin insumos disponibles."
                    loading={loadingInsumos}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo de movimiento *</Label>
                <div className="mt-1">
                  <CustomCombobox
                    options={opcionesTiposMovimiento}
                    value={tipoMovimientoSeleccionado}
                    onValueChange={setTipoMovimientoSeleccionado}
                    placeholder="Selecciona tipo..."
                    emptyMessage="Sin tipos disponibles."
                    loading={loadingTipos}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={cantidad || ""}
                  onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)}
                  className="flex-1"
                  placeholder="Ej: 10"
                />
                {unidadMedidaSeleccionada && (
                  <div className="px-3 py-2 bg-gray-100 border rounded-md text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    {unidadMedidaSeleccionada.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* NOTA */}
          <section>
            <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
              Nota
            </Label>
            <Textarea
              id="nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 min-h-[100px]"
              placeholder="Notas adicionales sobre el movimiento..."
            />
          </section>
        </div>

        {/* ----- footer ----- */}
        <div className="border-t p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" disabled={loading} onClick={guardar}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
