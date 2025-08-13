"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, ArrowRightLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "@/hooks/use-toast"

interface PotreroLote {
  establecimiento_id: number
  potrero_id: number
  potrero_nombre: string
  lote_id: number | null
  lote_nombre: string | null
}

interface CategoriaAnimal {
  categoria_animal_id: number
  categoria_animal_nombre: string
  cantidad: number
  peso_total: number
  cantidad_trasladar: number
  seleccionada: boolean
}

interface LoteStock {
  lote_id: number
  lote_nombre: string
  pd_detalles: Array<{
    categoria_animal_id: number
    categoria_animal_nombre: string
    cantidad: number
    peso_total: number
    peso_promedio: number
    cantidad_trasladar: number
    seleccionada: boolean
  }>
}

interface LoteInfo {
  id: number
  nombre: string
  categorias: CategoriaAnimal[]
  seleccionado: boolean
}

interface TrasladoPotreroDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tipoActividadId?: number
}

export default function TrasladoPotreroDrawer({
  isOpen,
  onClose,
  onSuccess,
  tipoActividadId,
}: TrasladoPotreroDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [potreros, setPotreros] = useState<PotreroLote[]>([])
  const [potreroOrigen, setPotreroOrigen] = useState<string>("")
  const [potreroDestino, setPotreroDestino] = useState<string>("")
  const [loteInfo, setLoteInfo] = useState<LoteStock | null>(null)
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  const [nombreLoteNuevo, setNombreLoteNuevo] = useState("")
  const [opcionTraslado, setOpcionTraslado] = useState<"trasladados" | "quedan">("trasladados")

  // Usar el contexto de establecimiento
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()
  const { usuario } = useUser()

  // Obtener nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      loadPotreros()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Cargar información del lote cuando se selecciona potrero origen
  useEffect(() => {
    if (potreroOrigen && establecimientoSeleccionado) {
      const potreroSeleccionado = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)
      if (potreroSeleccionado && potreroSeleccionado.lote_id) {
        loadLoteInfo(potreroSeleccionado.lote_id)
      } else {
        setLoteInfo(null)
      }
    } else {
      setLoteInfo(null)
    }
  }, [potreroOrigen, establecimientoSeleccionado])

  // Limpiar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      setFecha(new Date())
      setHora(new Date().toTimeString().slice(0, 5))
      setNota("")
      setPotreros([])
      setPotreroOrigen("")
      setPotreroDestino("")
      setLoteInfo(null)
      setNombreLoteNuevo("")
      setOpcionTraslado("trasladados")
    }
  }, [isOpen])

  const loadPotreros = async () => {
    if (!establecimientoSeleccionado) {
      console.error("No hay establecimiento seleccionado")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/potreros-lotes?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        throw new Error("Error al cargar potreros")
      }

      const potrerosData: PotreroLote[] = await response.json()
      setPotreros(potrerosData)
    } catch (error) {
      console.error("Error loading potreros:", error)
      toast({
        title: "Error",
        description: "Error al cargar potreros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadLoteInfo = async (loteId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lote-stock/by-lote/${loteId}`)

      if (!response.ok) {
        if (response.status === 404) {
          setLoteInfo(null)
          return
        }
        throw new Error("Error al cargar stock del lote")
      }

      const data = await response.json()

      if (!data || !data.pd_detalles || data.pd_detalles.length === 0) {
        setLoteInfo(null)
        return
      }

      // Initialize cantidad_trasladar for each category to prevent undefined values
      const loteInfoWithDefaults = {
        ...data,
        pd_detalles: data.pd_detalles.map((detalle: any) => ({
          ...detalle,
          cantidad_trasladar: detalle.cantidad || 0,
          seleccionada: false,
        })),
      }

      setLoteInfo(loteInfoWithDefaults)
    } catch (error) {
      console.error("Error loading lote info:", error)
      setLoteInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLoteSelectionChange = (checked: boolean) => {
    if (!loteInfo) return

    const updatedLoteInfo = { ...loteInfo }
    updatedLoteInfo.pd_detalles = updatedLoteInfo.pd_detalles.map((detalle) => ({
      ...detalle,
      seleccionada: checked,
      cantidad_trasladar: checked ? detalle.cantidad : detalle.cantidad,
    }))

    setLoteInfo(updatedLoteInfo)
  }

  const handleCategoriaSelectionChange = (categoriaId: number, checked: boolean) => {
    if (!loteInfo) return

    const updatedLoteInfo = { ...loteInfo }
    updatedLoteInfo.pd_detalles = updatedLoteInfo.pd_detalles.map((detalle) => {
      if (detalle.categoria_animal_id === categoriaId) {
        return {
          ...detalle,
          seleccionada: checked,
          cantidad_trasladar: checked ? detalle.cantidad : 0,
        }
      }
      return detalle
    })

    setLoteInfo(updatedLoteInfo)
  }

  const handleCantidadChange = (categoriaId: number, cantidad: number) => {
    if (!loteInfo) return

    const updatedLoteInfo = { ...loteInfo }
    updatedLoteInfo.pd_detalles = updatedLoteInfo.pd_detalles.map((detalle) => {
      if (detalle.categoria_animal_id === categoriaId) {
        const cantidadValida = cantidad === 0 ? 0 : Math.min(Math.max(1, cantidad), detalle.cantidad)
        return {
          ...detalle,
          cantidad_trasladar: cantidadValida,
          // Destildar automáticamente si la cantidad es 0
          seleccionada: cantidadValida > 0 ? detalle.seleccionada : false,
        }
      }
      return detalle
    })

    setLoteInfo(updatedLoteInfo)
  }

  const esTraslladoParcial = () => {
    if (!loteInfo) return false

    const categoriasSeleccionadas = loteInfo.pd_detalles.filter((detalle) => detalle.seleccionada)
    if (categoriasSeleccionadas.length === 0) return false

    const todasLasCategoriasSeleccionadas = categoriasSeleccionadas.length === loteInfo.pd_detalles.length
    const algunaCategoriaEsParcial = categoriasSeleccionadas.some(
      (detalle) => detalle.cantidad_trasladar < detalle.cantidad,
    )

    return !todasLasCategoriasSeleccionadas || algunaCategoriaEsParcial
  }

  const getTotalAnimalesTraslado = () => {
    if (!loteInfo) return 0
    return loteInfo.pd_detalles
      .filter((detalle) => detalle.seleccionada)
      .reduce((total, detalle) => total + detalle.cantidad_trasladar, 0)
  }

  const getTotalAnimalesQuedan = () => {
    if (!loteInfo) return 0
    return loteInfo.pd_detalles
      .filter((detalle) => detalle.seleccionada)
      .reduce((total, detalle) => total + (detalle.cantidad - detalle.cantidad_trasladar), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!loteInfo || !loteInfo.pd_detalles || loteInfo.pd_detalles.length === 0) {
        toast({
          title: "Error",
          description: "El Potrero elegido no posee stock de animales para trasladar",
          variant: "destructive",
        })
        return
      }

      // Validaciones existentes
      if (!potreroOrigen || !potreroDestino) {
        toast({
          title: "Error",
          description: "Debe seleccionar potrero origen y destino",
          variant: "destructive",
        })
        return
      }

      const esParcial = esTraslladoParcial()
      const potreroDestinoData = potreros.find((p) => p.potrero_id.toString() === potreroDestino)

      if (esParcial && !potreroDestinoData?.lote_id && !nombreLoteNuevo.trim()) {
        toast({
          title: "Error",
          description: "Debe ingresar un nombre para el nuevo lote",
          variant: "destructive",
        })
        return
      }

      if (esParcial && !potreroDestinoData?.lote_id && nombreLoteNuevo.trim().length < 3) {
        toast({
          title: "Error",
          description: "El nombre del lote debe tener al menos 3 caracteres",
          variant: "destructive",
        })
        return
      }

      // Preparar movimientos para las APIs usando la estructura correcta de datos
      const movimientos = loteInfo?.pd_detalles
        .filter((detalle) => {
          const categoria = loteInfo.pd_detalles.find((cat) => cat.categoria_animal_id === detalle.categoria_animal_id)
          return categoria?.seleccionada && categoria?.cantidad_trasladar > 0
        })
        .map((detalle) => {
          const categoria = loteInfo.pd_detalles.find((cat) => cat.categoria_animal_id === detalle.categoria_animal_id)
          return {
            categoria_animal_id: detalle.categoria_animal_id,
            cantidad_a_mover: categoria.cantidad_trasladar,
            peso_promedio_a_mover: detalle.peso_promedio,
          }
        })

      let response
      let loteDestinoId = null

      // Escenario 1: Traslado a potrero con lote existente (siempre usar esta API cuando destino tiene lote)
      if (potreroDestinoData?.lote_id) {
        const potreroOrigenData = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)
        loteDestinoId = potreroDestinoData.lote_id

        response = await fetch("/api/mover-stock-entre-lotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_lote_origen_id: potreroOrigenData?.lote_id,
            p_lote_destino_id: potreroDestinoData?.lote_id,
            p_movimientos: movimientos,
          }),
        })
      }
      // Escenario 2: Traslado completo a potrero vacío
      else if (!esParcial && !potreroDestinoData?.lote_id) {
        const potreroOrigenData = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)
        loteDestinoId = potreroOrigenData?.lote_id // The same lote moves to new potrero

        response = await fetch("/api/mover-lote-completo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lote_id: potreroOrigenData?.lote_id,
            potrero_destino_id: potreroDestinoData?.potrero_id,
          }),
        })
      }
      // Escenario 3: Traslado parcial a potrero vacío
      else if (esParcial && !potreroDestinoData?.lote_id) {
        if (opcionTraslado === "trasladados") {
          // Los animales trasladados llevan el nuevo nombre
          response = await fetch("/api/crear-y-mover-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              p_lote_origen_id: potreros.find((p) => p.potrero_id.toString() === potreroOrigen)?.lote_id,
              p_movimientos: movimientos,
              p_nombre_lote: nombreLoteNuevo.trim(),
              p_potrero_id: potreroDestinoData?.potrero_id,
            }),
          })
          // New lote will be created, we'll get the ID from response if needed
        } else {
          const movimientosQuedan = loteInfo?.pd_detalles
            .filter((detalle) => {
              const categoria = loteInfo.pd_detalles.find(
                (cat) => cat.categoria_animal_id === detalle.categoria_animal_id,
              )
              return categoria?.seleccionada && categoria?.cantidad_trasladar > 0
            })
            .map((detalle) => {
              const categoria = loteInfo.pd_detalles.find(
                (cat) => cat.categoria_animal_id === detalle.categoria_animal_id,
              )
              const cantidadQueQueda = detalle.cantidad - categoria.cantidad_trasladar
              return {
                categoria_animal_id: detalle.categoria_animal_id,
                cantidad_a_mover: cantidadQueQueda,
                peso_promedio_a_mover: detalle.peso_promedio,
              }
            })
            .filter((mov) => mov.cantidad_a_mover > 0) // Only include categories that have remaining animals

          // Los animales que se quedan llevan el nuevo nombre
          response = await fetch("/api/mover-lote-y-crear-stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              p_lote_origen_id: potreros.find((p) => p.potrero_id.toString() === potreroOrigen)?.lote_id,
              p_potrero_destino_id: potreroDestinoData?.potrero_id,
              p_nombre_lote_nuevo: nombreLoteNuevo.trim(),
              p_movimientos: movimientosQuedan,
            }),
          })
          // Original lote moves to destination, new lote created in origin
          loteDestinoId = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)?.lote_id
        }
      }

      if (!response || !response.ok) {
        const errorData = await response?.json()
        throw new Error(errorData?.error || "Error al procesar el traslado")
      }

      if (tipoActividadId && usuario?.id) {
        try {
          const potreroOrigenData = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)

          // Prepare transfer data for activity logging
          const trasladosParaActividad = loteInfo.pd_detalles
            .filter((detalle) => detalle.seleccionada && detalle.cantidad_trasladar > 0)
            .map((detalle) => ({
              categoria_animal_id: detalle.categoria_animal_id,
              cantidad: detalle.cantidad_trasladar,
              peso_promedio: detalle.peso_promedio,
              potrero_origen_id: potreroOrigenData?.potrero_id,
              potrero_destino_id: potreroDestinoData?.potrero_id,
              lote_origen_id: potreroOrigenData?.lote_id,
              lote_destino_id: loteDestinoId,
            }))

          const actividadResponse = await fetch("/api/guardar-traslado-actividad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              establecimiento_id: establecimientoSeleccionado,
              tipo_actividad_id: tipoActividadId,
              fecha: fecha.toISOString().split("T")[0],
              hora: hora,
              nota: nota.trim() || null,
              user_id: usuario.id,
              traslados: trasladosParaActividad,
            }),
          })

          if (!actividadResponse.ok) {
            console.error("Error saving activity record, but transfer was successful")
          } else {
            console.log("Activity record saved successfully")
            // Dispatch event to reload activities
            window.dispatchEvent(new Event("reloadPartesDiarios"))
          }
        } catch (activityError) {
          console.error("Error saving activity record:", activityError)
          // Don't fail the main operation if activity logging fails
        }
      }

      toast({
        title: "✅ Traslado Completado",
        description: "El traslado de potrero ha sido procesado exitosamente",
        duration: 4000,
      })

      handleClose()
      onSuccess()
    } catch (error) {
      console.error("Error processing transfer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el traslado",
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
    setPotreros([])
    setPotreroOrigen("")
    setPotreroDestino("")
    setLoteInfo(null)
    setNombreLoteNuevo("")
    setOpcionTraslado("trasladados")
  }

  const opcionesPotreroOrigen = potreros
    .filter((p) => p.lote_id !== null) // Solo potreros con animales
    .map((potrero) => ({
      value: potrero.potrero_id.toString(),
      label: `${potrero.potrero_nombre} - ${potrero.lote_nombre}`,
    }))

  const opcionesPotreroDestino = potreros
    .filter((p) => p.potrero_id.toString() !== potreroOrigen) // Excluir el potrero origen
    .map((potrero) => ({
      value: potrero.potrero_id.toString(),
      label: potrero.lote_id
        ? `${potrero.potrero_nombre} - ${potrero.lote_nombre}`
        : `${potrero.potrero_nombre} - (Vacío)`,
    }))

  const mostrarOpcionesTraslado = () => {
    const potreroDestinoData = potreros.find((p) => p.potrero_id.toString() === potreroDestino)
    const destinoEstaVacio = potreroDestinoData && !potreroDestinoData.lote_id
    const esParcial = esTraslladoParcial()

    // Show options only if destination is empty AND it's a partial transfer
    // For complete transfers to empty potreros, just update potrero_id (no yellow form needed)
    return destinoEstaVacio && esParcial
  }

  const getAyudaTraslado = () => {
    if (!potreroOrigen || !potreroDestino || !loteInfo) return null

    const potreroDestinoData = potreros.find((p) => p.potrero_id.toString() === potreroDestino)
    const potreroOrigenData = potreros.find((p) => p.potrero_id.toString() === potreroOrigen)
    const esParcial = esTraslladoParcial()
    const destinoTieneLote = potreroDestinoData?.lote_id
    const totalAnimalesTraslado = getTotalAnimalesTraslado()
    const totalAnimalesQuedan = getTotalAnimalesQuedan()

    // Caso 1: Potrero destino tiene lote existente
    if (destinoTieneLote) {
      return {
        titulo: "📋 Resumen del Traslado",
        descripcion: `Se moverán ${totalAnimalesTraslado} animales desde el lote "${potreroOrigenData?.lote_nombre}" hacia el lote existente "${potreroDestinoData?.lote_nombre}". Los animales se integrarán al lote de destino.`,
        tipo: "info",
      }
    }

    // Caso 2: Potrero destino vacío con traslado completo
    if (!destinoTieneLote && !esParcial) {
      return {
        titulo: "📋 Resumen del Traslado",
        descripcion: `Se trasladará completamente el lote "${potreroOrigenData?.lote_nombre}" al potrero "${potreroDestinoData?.potrero_nombre}". El lote mantendrá su nombre original y solo cambiará de ubicación.`,
        tipo: "success",
      }
    }

    // Caso 3: Potrero destino vacío con traslado parcial
    if (!destinoTieneLote && esParcial && mostrarOpcionesTraslado()) {
      if (opcionTraslado === "trasladados") {
        return {
          titulo: "📋 Resumen del Traslado",
          descripcion: `Se crearán dos lotes: un nuevo lote "${nombreLoteNuevo || "Nuevo Lote"}" en el potrero "${potreroDestinoData?.potrero_nombre}" con ${totalAnimalesTraslado} animales trasladados, y el lote original "${potreroOrigenData?.lote_nombre}" permanecerá en el potrero origen con ${totalAnimalesQuedan} animales restantes.`,
          tipo: "warning",
        }
      } else {
        return {
          titulo: "📋 Resumen del Traslado",
          descripcion: `Se trasladará el lote completo "${potreroOrigenData?.lote_nombre}" al potrero "${potreroDestinoData?.potrero_nombre}", y se creará un nuevo lote "${nombreLoteNuevo || "Nuevo Lote"}" en el potrero origen con ${totalAnimalesQuedan} animales que permanecen.`,
          tipo: "warning",
        }
      }
    }

    return null
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-600" />
            Traslado de Potrero
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
                      Traslado
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
                  <Input value="Traslado de Potrero" disabled className="bg-gray-50" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Potrero Origen *</Label>
                    <CustomCombobox
                      options={opcionesPotreroOrigen}
                      value={potreroOrigen}
                      onValueChange={setPotreroOrigen}
                      placeholder="Selecciona potrero origen..."
                      searchPlaceholder="Buscar potrero..."
                      emptyMessage="No se encontraron potreros con animales."
                      loading={loading}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label>Potrero Destino *</Label>
                    <CustomCombobox
                      options={opcionesPotreroDestino}
                      value={potreroDestino}
                      onValueChange={setPotreroDestino}
                      placeholder="Selecciona potrero destino..."
                      searchPlaceholder="Buscar potrero..."
                      emptyMessage="No se encontraron potreros disponibles."
                      loading={loading}
                      disabled={loading || !potreroOrigen}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Animales a Trasladar */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Animales a Trasladar *</h3>
              {!potreroOrigen ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Selecciona un potrero origen para ver los animales disponibles</p>
                </div>
              ) : !loteInfo ? (
                <div className="text-center py-8 text-gray-500">
                  <p>El Potrero elegido no posee stock de animales</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Cargando animales...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Checkbox
                      id="lote-completo"
                      checked={loteInfo.pd_detalles.every((detalle) => detalle.seleccionada)}
                      onCheckedChange={handleLoteSelectionChange}
                    />
                    <Label htmlFor="lote-completo" className="font-medium text-blue-900">
                      Lote Completo (Seleccionar todo el lote)
                    </Label>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Cantidad a Trasladar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loteInfo.pd_detalles.map((detalle) => (
                          <TableRow key={detalle.categoria_animal_id}>
                            <TableCell>
                              <Checkbox
                                checked={detalle.seleccionada}
                                onCheckedChange={(checked) =>
                                  handleCategoriaSelectionChange(detalle.categoria_animal_id, checked as boolean)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{detalle.categoria_animal_nombre}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={detalle.cantidad}
                                  value={detalle.cantidad_trasladar === 0 ? "" : detalle.cantidad_trasladar.toString()}
                                  onChange={(e) => {
                                    const inputValue = e.target.value
                                    if (inputValue === "") {
                                      handleCantidadChange(detalle.categoria_animal_id, 0)
                                    } else {
                                      const value = Number.parseInt(inputValue)
                                      if (!isNaN(value)) {
                                        handleCantidadChange(detalle.categoria_animal_id, value)
                                      }
                                    }
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  className="w-20"
                                  disabled={!detalle.seleccionada}
                                  placeholder="0"
                                />
                                <span className="text-gray-500">/ {detalle.cantidad}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {mostrarOpcionesTraslado() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                      <div>
                        <Label htmlFor="nombreLoteNuevo" className="text-sm font-medium">
                          Nombre del nuevo lote *
                        </Label>
                        <Input
                          id="nombreLoteNuevo"
                          value={nombreLoteNuevo}
                          onChange={(e) => setNombreLoteNuevo(e.target.value)}
                          placeholder="Ej: Lote A"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Opciones de nomenclatura:</Label>
                        <RadioGroup
                          value={opcionTraslado}
                          onValueChange={(value: "trasladados" | "quedan") => setOpcionTraslado(value)}
                          className="mt-2 space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="trasladados" id="trasladados" />
                            <Label htmlFor="trasladados" className="text-sm">
                              Los {getTotalAnimalesTraslado()} animales trasladados llevarán el nombre "
                              {nombreLoteNuevo || "Nuevo Lote"}"
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="quedan" id="quedan" />
                            <Label htmlFor="quedan" className="text-sm">
                              Los {getTotalAnimalesQuedan()} animales que se quedan llevarán el nombre "
                              {nombreLoteNuevo || "Nuevo Lote"}"
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(() => {
              const ayuda = getAyudaTraslado()
              if (!ayuda) return null

              const bgColor =
                ayuda.tipo === "info"
                  ? "bg-blue-50 border-blue-200"
                  : ayuda.tipo === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"

              return (
                <div className={`${bgColor} border rounded-lg p-4`}>
                  <h4 className="font-medium text-gray-900 mb-2">{ayuda.titulo}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{ayuda.descripcion}</p>
                </div>
              )
            })()}

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
                Guardar Traslado
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
