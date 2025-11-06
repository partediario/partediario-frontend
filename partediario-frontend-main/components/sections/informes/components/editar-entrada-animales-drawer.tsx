"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle, Edit } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"

interface EditParteDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario | null
  onSuccess?: () => void
}

interface DetalleItem {
  id: string
  tipo_movimiento_id: string
  tipo_movimiento_nombre: string
  categoria_id: string
  categoria_nombre: string
  cantidad: number
  peso: number
  tipo_peso: "TOTAL" | "PROMEDIO"
}

interface Lote {
  id: string
  nombre: string
}

interface Categoria {
  id: string
  nombre: string
  sexo?: string
  edad?: string
}

interface TipoMovimiento {
  id: string
  nombre: string
  direccion?: string
}

interface UsuarioPerfil {
  id: string
  nombres: string
  apellidos: string
  email: string
  phone?: string
}

export default function EditParteDrawer({ isOpen, onClose, parte, onSuccess }: EditParteDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<Categoria[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])

  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Estados para mostrar errores de validación
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])
  const [mostrarExito, setMostrarExito] = useState(false)

  // Formulario principal
  const [loteSeleccionado, setLoteSeleccionado] = useState("")
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(new Date())
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | undefined>("")
  const [nota, setNota] = useState("")

  // Detalles
  const [detalles, setDetalles] = useState<DetalleItem[]>([])
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)

  // Formulario de detalle
  const [nuevoDetalle, setNuevoDetalle] = useState({
    tipo_movimiento_id: "",
    categoria_id: "",
    cantidad: 0,
    peso: 0,
    tipo_peso: "TOTAL" as "TOTAL" | "PROMEDIO",
  })

  // Estado para editar detalle existente
  const [editandoDetalle, setEditandoDetalle] = useState<DetalleItem | null>(null)

  // Datos del usuario
  const { usuario, loading: loadingUsuario } = useUser()

  // Obtener establecimiento_id y empresa_id actual del localStorage
  useEffect(() => {}, [])

  // Cargar datos del parte diario cuando se abre el drawer
  useEffect(() => {
    if (isOpen && parte && establecimientoSeleccionado && empresaSeleccionada) {
      console.log("🔄 Cargando datos del parte diario para edición:", parte)
      cargarDatosParteDiario()
      cargarLotes()
      cargarCategorias()
      cargarTiposMovimiento()
    }
  }, [isOpen, parte, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      setLoteSeleccionado("")
      setNota("")
      setDetalles([])
      setMostrarFormDetalle(false)
      setErroresValidacion([])
      setErroresDetalle([])
      setMostrarExito(false)
      setNuevoDetalle({
        tipo_movimiento_id: "",
        categoria_id: "",
        cantidad: 0,
        peso: 0,
        tipo_peso: "TOTAL",
      })
    }
  }, [isOpen])

  // Filtrar categorías cuando cambia el tipo de movimiento en nuevo detalle
  useEffect(() => {
    if (nuevoDetalle.tipo_movimiento_id && categorias.length > 0) {
      const tipoSeleccionado = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)

      console.log("Tipo seleccionado:", tipoSeleccionado)
      console.log("Todas las categorías:", categorias)

      if (tipoSeleccionado?.nombre === "Nacimiento") {
        // Solo mostrar TERNEROS MACHOS (id=21) y TERNEROS HEMBRAS (id=22)
        const categoriasTerneros = categorias
          .filter((cat) => {
            const esTermero =
              cat.id === "21" || cat.id === "22" || Number.parseInt(cat.id) === 21 || Number.parseInt(cat.id) === 22
            console.log(`Categoría ${cat.nombre} (ID: ${cat.id}) es ternero:`, esTermero)
            return esTermero
          })
          .sort((a, b) => Number.parseInt(a.id) - Number.parseInt(b.id))

        console.log("Categorías terneros filtradas:", categoriasTerneros)
        setCategoriasFiltradas(categoriasTerneros)

        // Si la categoría actual no es ternero, limpiar selección
        if (
          nuevoDetalle.categoria_id &&
          !["21", "22"].includes(nuevoDetalle.categoria_id) &&
          ![21, 22].includes(Number.parseInt(nuevoDetalle.categoria_id))
        ) {
          setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
        }
      } else {
        // Mostrar todas las categorías para otros tipos de movimiento
        setCategoriasFiltradas(categorias)
      }
    } else {
      setCategoriasFiltradas(categorias)
    }
  }, [nuevoDetalle.tipo_movimiento_id, categorias, tiposMovimiento])

  const cargarDatosParteDiario = () => {
    if (!parte) return

    console.log("📋 Cargando datos del parte diario:", parte)

    // Cargar fecha y hora
    try {
      const fecha = new Date(parte.pd_fecha + "T00:00:00")
      setFechaSeleccionada(fecha)
    } catch {
      setFechaSeleccionada(new Date())
    }

    setHoraSeleccionada(parte.pd_hora?.slice(0, 5) || "")
    setNota(parte.pd_nota || "")

    // Parsear detalles
    const parseDetalles = () => {
      try {
        if (typeof parte.pd_detalles === "string") {
          return JSON.parse(parte.pd_detalles)
        }
        return parte.pd_detalles || []
      } catch {
        return []
      }
    }

    const detallesOriginales = parseDetalles()
    console.log("📋 Detalles originales:", detallesOriginales)

    // Solo procesar detalles para tipos de movimiento de animales
    if (parte.pd_tipo === "ENTRADA" || parte.pd_tipo === "SALIDA") {
      if (Array.isArray(detallesOriginales) && detallesOriginales.length > 0) {
        const detallesFormateados = detallesOriginales.map((detalle: any, index: number) => ({
          id: detalle.detalle_id?.toString() || `existing_${index}`,
          tipo_movimiento_id: "", // Se llenará cuando se carguen los tipos
          tipo_movimiento_nombre: detalle.detalle_tipo_movimiento || "",
          categoria_id: "", // Se llenará cuando se carguen las categorías
          categoria_nombre: detalle.detalle_categoria_animal || "",
          cantidad: detalle.detalle_cantidad || 0,
          peso: detalle.detalle_peso || 0,
          tipo_peso: (detalle.detalle_tipo_peso as "TOTAL" | "PROMEDIO") || "TOTAL",
        }))

        setDetalles(detallesFormateados)

        // Obtener el lote del primer detalle
        if (detallesOriginales[0]?.detalle_lote) {
          // Se establecerá cuando se carguen los lotes
          console.log("🏷️ Lote a establecer:", detallesOriginales[0].detalle_lote)
        }
      }
    }
  }

  const cargarLotes = async () => {
    if (!establecimientoSeleccionado) return

    setLoadingLotes(true)
    try {
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setLotes(data.lotes || [])

      // Establecer el lote seleccionado si hay detalles
      if (parte && data.lotes && data.lotes.length > 0) {
        const parseDetalles = () => {
          try {
            if (typeof parte.pd_detalles === "string") {
              return JSON.parse(parte.pd_detalles)
            }
            return parte.pd_detalles || []
          } catch {
            return []
          }
        }

        const detallesOriginales = parseDetalles()
        if (Array.isArray(detallesOriginales) && detallesOriginales.length > 0) {
          const nombreLote = detallesOriginales[0]?.detalle_lote
          if (nombreLote) {
            const loteEncontrado = data.lotes.find((lote: Lote) => lote.nombre === nombreLote)
            if (loteEncontrado) {
              setLoteSeleccionado(loteEncontrado.id)
              console.log("🏷️ Lote establecido:", loteEncontrado)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error cargando lotes:", error)
      setLotes([
        { id: "1", nombre: "Lote A" },
        { id: "2", nombre: "Lote B" },
        { id: "3", nombre: "Lote C" },
      ])
    } finally {
      setLoadingLotes(false)
    }
  }

  const cargarCategorias = async () => {
    if (!empresaSeleccionada) return

    setLoadingCategorias(true)
    try {
      const response = await fetch(`/api/categorias-animales?empresa_id=${empresaSeleccionada}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setCategorias(data.categorias || [])
      setCategoriasFiltradas(data.categorias || [])

      // Actualizar los detalles con los IDs de categorías
      if (data.categorias && detalles.length > 0) {
        const detallesActualizados = detalles.map((detalle) => {
          const categoriaEncontrada = data.categorias.find((cat: Categoria) => cat.nombre === detalle.categoria_nombre)
          return {
            ...detalle,
            categoria_id: categoriaEncontrada?.id || detalle.categoria_id,
          }
        })
        setDetalles(detallesActualizados)
        console.log("🔄 Detalles actualizados con IDs de categorías:", detallesActualizados)
      }
    } catch (error) {
      console.error("Error cargando categorías:", error)
      setCategorias([
        { id: "1", nombre: "Terneros" },
        { id: "2", nombre: "Vaquillonas" },
        { id: "3", nombre: "Vacas" },
        { id: "4", nombre: "Toros" },
      ])
    } finally {
      setLoadingCategorias(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    if (!empresaSeleccionada) return

    setLoadingTipos(true)
    try {
      const response = await fetch(`/api/tipos-movimiento?empresa_id=${empresaSeleccionada}&direccion=ENTRADA`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setTiposMovimiento(data.tipos || [])

      // Actualizar los detalles con los IDs de tipos de movimiento
      if (data.tipos && detalles.length > 0) {
        const detallesActualizados = detalles.map((detalle) => {
          const tipoEncontrado = data.tipos.find(
            (tipo: TipoMovimiento) => tipo.nombre === detalle.tipo_movimiento_nombre,
          )
          return {
            ...detalle,
            tipo_movimiento_id: tipoEncontrado?.id || detalle.tipo_movimiento_id,
          }
        })
        setDetalles(detallesActualizados)
        console.log("🔄 Detalles actualizados con IDs de tipos:", detallesActualizados)
      }
    } catch (error) {
      console.error("Error cargando tipos de movimiento:", error)
      setTiposMovimiento([
        { id: "1", nombre: "Compra" },
        { id: "2", nombre: "Traslado desde otro campo" },
        { id: "3", nombre: "Nacimiento" },
        { id: "4", nombre: "Devolución" },
      ])
    } finally {
      setLoadingTipos(false)
    }
  }

  const agregarDetalle = () => {
    const errores: string[] = []

    if (!nuevoDetalle.tipo_movimiento_id) {
      errores.push("Debe seleccionar un tipo de movimiento")
    }

    if (!nuevoDetalle.categoria_id) {
      errores.push("Debe seleccionar una categoría")
    }

    if (!nuevoDetalle.cantidad || nuevoDetalle.cantidad <= 0) {
      errores.push("La cantidad debe ser mayor a 0")
    }

    if (!nuevoDetalle.peso || nuevoDetalle.peso <= 0) {
      errores.push("El peso debe ser mayor a 0")
    }

    if (errores.length > 0) {
      setErroresDetalle(errores)
      toast({
        title: "Campos faltantes en el detalle",
        description: errores.join(", "),
        variant: "destructive",
      })
      return
    }

    setErroresDetalle([])

    const tipoMov = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)
    const categoria = categoriasFiltradas.find((c) => c.id === nuevoDetalle.categoria_id)

    if (editandoDetalle) {
      // Actualizar detalle existente
      const detallesActualizados = detalles.map((detalle) =>
        detalle.id === editandoDetalle.id
          ? {
              ...detalle,
              tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
              tipo_movimiento_nombre: tipoMov?.nombre || "",
              categoria_id: nuevoDetalle.categoria_id,
              categoria_nombre: categoria?.nombre || "",
              cantidad: nuevoDetalle.cantidad,
              peso: nuevoDetalle.peso,
              tipo_peso: nuevoDetalle.tipo_peso,
            }
          : detalle,
      )
      setDetalles(detallesActualizados)
      setEditandoDetalle(null)
    } else {
      // Agregar nuevo detalle
      const detalle: DetalleItem = {
        id: `new_${Date.now()}`,
        tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
        tipo_movimiento_nombre: tipoMov?.nombre || "",
        categoria_id: nuevoDetalle.categoria_id,
        categoria_nombre: categoria?.nombre || "",
        cantidad: nuevoDetalle.cantidad,
        peso: nuevoDetalle.peso,
        tipo_peso: nuevoDetalle.tipo_peso,
      }
      setDetalles([...detalles, detalle])
    }

    setNuevoDetalle({
      tipo_movimiento_id: "",
      categoria_id: "",
      cantidad: 0,
      peso: 0,
      tipo_peso: "TOTAL",
    })
    setMostrarFormDetalle(false)
  }

  const eliminarDetalle = (id: string) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  const editarDetalle = (detalle: DetalleItem) => {
    setEditandoDetalle(detalle)
    setNuevoDetalle({
      tipo_movimiento_id: detalle.tipo_movimiento_id,
      categoria_id: detalle.categoria_id,
      cantidad: detalle.cantidad,
      peso: detalle.peso,
      tipo_peso: detalle.tipo_peso,
    })
    setMostrarFormDetalle(true)
  }

  const validarFormulario = () => {
    const errores: string[] = []

    if (!loteSeleccionado) {
      errores.push("Debe seleccionar un lote")
    }

    if (!fechaSeleccionada) {
      errores.push("Debe seleccionar una fecha")
    }

    if (!horaSeleccionada) {
      errores.push("Debe seleccionar una hora")
    }

    if (detalles.length === 0) {
      errores.push("Debe tener al menos un detalle de movimiento")
    }

    detalles.forEach((detalle, index) => {
      const numeroDetalle = index + 1

      if (!detalle.tipo_movimiento_id) {
        errores.push(`Detalle ${numeroDetalle}: Falta seleccionar el tipo de movimiento`)
      }

      if (!detalle.categoria_id) {
        errores.push(`Detalle ${numeroDetalle}: Falta seleccionar la categoría`)
      }

      if (!detalle.cantidad || detalle.cantidad <= 0) {
        errores.push(`Detalle ${numeroDetalle}: La cantidad debe ser mayor a 0`)
      }

      if (!detalle.peso || detalle.peso <= 0) {
        errores.push(`Detalle ${numeroDetalle}: El peso debe ser mayor a 0`)
      }
    })

    if (!usuario?.id) {
      errores.push("Error del sistema: No se pudo obtener el ID del usuario")
    }

    if (!establecimientoSeleccionado) {
      errores.push("Error del sistema: No se pudo obtener el ID del establecimiento")
    }

    return errores
  }

  const actualizar = async () => {
    if (!parte) return

    console.log("🔄 INICIANDO ACTUALIZACIÓN DE PARTE DIARIO...")

    const errores = validarFormulario()
    if (errores.length > 0) {
      setErroresValidacion(errores)

      const erroresGenerales = errores.filter((e) => !e.includes("Detalle") && !e.includes("Error del sistema"))
      const erroresDetalles = errores.filter((e) => e.includes("Detalle"))
      const erroresSistema = errores.filter((e) => e.includes("Error del sistema"))

      let mensajeError = ""

      if (erroresGenerales.length > 0) {
        mensajeError += "Datos generales: " + erroresGenerales.join(", ") + ". "
      }

      if (erroresDetalles.length > 0) {
        mensajeError += "Detalles: " + erroresDetalles.join(", ") + ". "
      }

      if (erroresSistema.length > 0) {
        mensajeError += erroresSistema.join(", ")
      }

      toast({
        title: `Se encontraron ${errores.length} error${errores.length > 1 ? "es" : ""} de validación`,
        description: mensajeError.trim(),
        variant: "destructive",
      })
      return
    }

    setErroresValidacion([])
    setLoading(true)

    try {
      const fechaString = fechaSeleccionada?.toISOString().split("T")[0] || ""

      const datosActualizacion = {
        id: parte.pd_id,
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        nota: nota.trim() || null,
        fecha: fechaString,
        hora: horaSeleccionada || "",
        lote_id: Number.parseInt(loteSeleccionado),
        user_id: usuario!.id,
        detalles: detalles.map((detalle) => ({
          id: detalle.id.startsWith("existing_") ? Number.parseInt(detalle.id.replace("existing_", "")) : undefined,
          categoria_id: Number.parseInt(detalle.categoria_id),
          cantidad: detalle.cantidad,
          peso: detalle.peso,
          tipo_peso: detalle.tipo_peso,
          tipo_movimiento_id: Number.parseInt(detalle.tipo_movimiento_id),
        })),
      }

      console.log("📤 Datos de actualización:", datosActualizacion)

      const response = await fetch("/api/movimientos-animales", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosActualizacion),
      })

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("🎉 PARTE DIARIO ACTUALIZADO EXITOSAMENTE:", result)

      setMostrarExito(true)

      setTimeout(() => {
        toast({
          title: "✅ Parte Diario Actualizado",
          description: `Se actualizaron ${detalles.length} detalles correctamente`,
          duration: 4000,
        })
      }, 500)

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("💥 ERROR ACTUALIZANDO PARTE DIARIO:", error)
      toast({
        title: "Error",
        description: `No se pudo actualizar el parte diario: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const cancelar = () => {
    onClose()
  }

  // Efecto para actualizar detalles cuando se cargan categorías y tipos
  useEffect(() => {
    if (categorias.length > 0 && tiposMovimiento.length > 0 && detalles.length > 0) {
      const detallesActualizados = detalles.map((detalle) => {
        const categoriaEncontrada = categorias.find((cat) => cat.nombre === detalle.categoria_nombre)
        const tipoEncontrado = tiposMovimiento.find((tipo) => tipo.nombre === detalle.tipo_movimiento_nombre)

        return {
          ...detalle,
          categoria_id: categoriaEncontrada?.id || detalle.categoria_id,
          tipo_movimiento_id: tipoEncontrado?.id || detalle.tipo_movimiento_id,
        }
      })

      // Solo actualizar si hay cambios
      const hayDiferencias = detallesActualizados.some(
        (detalle, index) =>
          detalle.categoria_id !== detalles[index]?.categoria_id ||
          detalle.tipo_movimiento_id !== detalles[index]?.tipo_movimiento_id,
      )

      if (hayDiferencias) {
        setDetalles(detallesActualizados)
        console.log("🔄 Detalles finalmente actualizados:", detallesActualizados)
      }
    }
  }, [categorias, tiposMovimiento])

  // Solo mostrar el drawer para tipos ENTRADA
  if (!parte || parte.pd_tipo !== "ENTRADA") {
    return null
  }

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id,
    label: lote.nombre,
  }))

  const opcionesTiposMovimiento = tiposMovimiento.map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
  }))

  const opcionesCategorias = categoriasFiltradas.map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
  }))

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Editar Entrada de Animales</DrawerTitle>
          <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mostrar mensaje de éxito */}
          {mostrarExito && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-800 mb-2">¡Parte diario actualizado exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se actualizaron {detalles.length} detalles correctamente. Los cambios se han guardado.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mostrar errores de validación general */}
          {erroresValidacion.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Se encontraron {erroresValidacion.length} errores:</div>
                <ul className="list-disc list-inside space-y-1">
                  {erroresValidacion.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Datos Generales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium text-gray-900">
                 Entrada
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                  {loadingUsuario ? "Cargando..." : nombreCompleto}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="lote" className="text-sm font-medium text-gray-700">
                Lote *
              </Label>
              <div className="mt-1">
                <CustomCombobox
                  options={opcionesLotes}
                  value={loteSeleccionado}
                  onValueChange={setLoteSeleccionado}
                  placeholder="Selecciona un lote..."
                  searchPlaceholder="Buscar lote..."
                  emptyMessage="No se encontraron lotes."
                  loading={loadingLotes}
                  disabled={loadingLotes}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                <div className="mt-1">
                  <CustomDatePicker
                    date={fechaSeleccionada}
                    onDateChange={setFechaSeleccionada}
                    placeholder="Seleccionar fecha"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Hora *</Label>
                <div className="mt-1">
                  <CustomTimePicker
                    time={horaSeleccionada}
                    onTimeChange={setHoraSeleccionada}
                    placeholder="Seleccionar hora"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detalles *</h3>
              <Button onClick={() => setMostrarFormDetalle(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar línea
              </Button>
            </div>

            {/* Formulario de nuevo detalle */}
            {mostrarFormDetalle && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="font-medium text-gray-900">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                {erroresDetalle.length > 0 && (
                  <Alert variant="destructive">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de movimiento *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesTiposMovimiento}
                        value={nuevoDetalle.tipo_movimiento_id}
                        onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, tipo_movimiento_id: value })}
                        placeholder="Selecciona tipo..."
                        searchPlaceholder="Buscar tipo de movimiento..."
                        emptyMessage="No se encontraron tipos de movimiento."
                        loading={loadingTipos}
                        disabled={loadingTipos}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Categoría Animal *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesCategorias}
                        value={nuevoDetalle.categoria_id}
                        onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, categoria_id: value })}
                        placeholder="Selecciona categoría..."
                        searchPlaceholder="Buscar categoría..."
                        emptyMessage="No se encontraron categorías."
                        loading={loadingCategorias}
                        disabled={loadingCategorias}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={nuevoDetalle.cantidad || ""}
                      onChange={(e) =>
                        setNuevoDetalle({ ...nuevoDetalle, cantidad: Number.parseInt(e.target.value) || 0 })
                      }
                      className="mt-1"
                      placeholder="Ej: 10"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Peso (kg) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={nuevoDetalle.peso || ""}
                      onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, peso: Number.parseInt(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder="Ej: 250"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de peso</Label>
                  <RadioGroup
                    value={nuevoDetalle.tipo_peso}
                    onValueChange={(value: "TOTAL" | "PROMEDIO") =>
                      setNuevoDetalle({ ...nuevoDetalle, tipo_peso: value })
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TOTAL" id="total" />
                      <Label htmlFor="total" className="text-sm">
                        Total
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PROMEDIO" id="promedio" />
                      <Label htmlFor="promedio" className="text-sm">
                        Promedio
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2">
                  <Button onClick={agregarDetalle} size="sm" className="bg-green-600 hover:bg-green-700">
                    {editandoDetalle ? "Actualizar" : "Agregar"}
                  </Button>
                  <Button
                    onClick={() => {
                      setMostrarFormDetalle(false)
                      setErroresDetalle([])
                      setEditandoDetalle(null)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de detalles */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de movimiento</TableHead>
                    <TableHead>Categoría Animal</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No hay detalles agregados
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((detalle) => (
                      <TableRow key={detalle.id}>
                        <TableCell>{detalle.tipo_movimiento_nombre}</TableCell>
                        <TableCell>{detalle.categoria_nombre}</TableCell>
                        <TableCell>{detalle.cantidad}</TableCell>
                        <TableCell>{detalle.peso} kg</TableCell>
                        <TableCell>{detalle.tipo_peso}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => editarDetalle(detalle)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => eliminarDetalle(detalle.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Nota */}
          <div>
            <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
              Nota
            </Label>
            <Textarea
              id="nota"
              placeholder="Notas adicionales sobre el movimiento..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <Button onClick={cancelar} variant="outline">
            Cancelar
          </Button>
          <Button onClick={actualizar} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
