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
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"

interface SalidaAnimalesDrawerProps {
  isOpen: boolean
  onClose: () => void
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

interface CategoriaExistente {
  categoria_animal_id: string
  nombre_categoria_animal: string
  sexo?: string
  edad?: string
  lote_id: string
  cantidad: number
}

interface TipoMovimiento {
  id: string
  nombre: string
  direccion?: string
}

export default function SalidaAnimalesDrawer({ isOpen, onClose, onSuccess }: SalidaAnimalesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategoriasExistentes] = useState<CategoriaExistente[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  // Estados para mostrar errores de validación
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])
  const [mostrarExito, setMostrarExito] = useState(false)

  // Formulario principal
  const [loteSeleccionado, setLoteSeleccionado] = useState("")
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(new Date())
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | undefined>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState("")

  // Detalles
  const [detalles, setDetalles] = useState<DetalleItem[]>([])
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)

  // Estados para edición de detalle
  const [editandoDetalle, setEditandoDetalle] = useState<string | null>(null)

  // Formulario de detalle
  const [nuevoDetalle, setNuevoDetalle] = useState({
    tipo_movimiento_id: "",
    categoria_id: "",
    cantidad: 0,
    peso: 0,
    tipo_peso: "PROMEDIO" as "TOTAL" | "PROMEDIO",
  })

  // Datos del usuario desde la vista
  const { usuario, loading: loadingUsuario } = useUser()

  // Cargar datos iniciales cuando se abre el drawer y tenemos los IDs necesarios
  useEffect(() => {
    if (isOpen && establecimientoSeleccionado && empresaSeleccionada) {
      // Actualizar fecha y hora actual cada vez que se abre
      const ahora = new Date()
      setFechaSeleccionada(ahora)
      setHoraSeleccionada(ahora.toTimeString().slice(0, 5))

      cargarLotes()
      cargarTiposMovimiento()
    }
  }, [isOpen, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      // Limpiar todos los campos del formulario
      setLoteSeleccionado("")
      setNota("")
      setDetalles([])
      setMostrarFormDetalle(false)
      setEditandoDetalle(null)
      setErroresValidacion([])
      setErroresDetalle([])
      setMostrarExito(false)
      setCategoriasExistentes([])
      setNuevoDetalle({
        tipo_movimiento_id: "",
        categoria_id: "",
        cantidad: 0,
        peso: 0,
        tipo_peso: "PROMEDIO",
      })
      // console.log("Formulario limpiado al cerrar el drawer")
    }
  }, [isOpen])

  // Efecto para cargar categorías cuando cambia el lote seleccionado
  useEffect(() => {
    if (loteSeleccionado) {
      console.log("🔄 Lote seleccionado cambió a:", loteSeleccionado)

      // Limpiar detalles existentes y selector de categoría
      if (detalles.length > 0) {
        console.log("🧹 Limpiando detalles existentes debido al cambio de lote")
        setDetalles([])
      }

      // Limpiar categoría seleccionada en el formulario de detalle
      if (nuevoDetalle.categoria_id) {
        console.log("🧹 Limpiando categoría seleccionada en el formulario")
        setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
      }

      cargarCategoriasExistentes()
    } else {
      // Si no hay lote seleccionado, limpiar categorías
      setCategoriasExistentes([])
      setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
    }
  }, [loteSeleccionado])

  const cargarLotes = async () => {
    if (!establecimientoSeleccionado) {
      console.error("No hay establecimiento_id disponible para cargar lotes")
      return
    }

    setLoadingLotes(true)
    try {
      console.log("Cargando lotes para establecimiento_id:", establecimientoSeleccionado)
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos de lotes recibidos:", data)

      setLotes(data.lotes || [])
    } catch (error) {
      console.error("Error cargando lotes:", error)
      toast({
        title: "Error cargando lotes",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      // Datos de fallback para desarrollo
      setLotes([
        { id: "1", nombre: "Lote A" },
        { id: "2", nombre: "Lote B" },
        { id: "3", nombre: "Lote C" },
      ])
    } finally {
      setLoadingLotes(false)
    }
  }

  const cargarCategoriasExistentes = async () => {
    if (!loteSeleccionado) {
      console.error("No hay lote_id disponible para cargar categorías existentes")
      return
    }

    setLoadingCategorias(true)
    try {
      console.log("🔄 Cargando categorías existentes para lote_id:", loteSeleccionado)
      const response = await fetch(`/api/categorias-animales-existentes?lote_id=${loteSeleccionado}`)

      console.log("📡 Respuesta del servidor - Status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Error del servidor:", errorData)
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ Datos de categorías existentes recibidos:", data)
      console.log("📋 CATEGORÍAS EXISTENTES DETALLADAS:")

      if (data.categorias && data.categorias.length > 0) {
        data.categorias.forEach((cat: any, index: number) => {
          console.log(
            `  ${index + 1}. ID: ${cat.categoria_animal_id} | Nombre: ${cat.nombre_categoria_animal} | Stock: ${cat.cantidad} | Sexo: ${cat.sexo} | Edad: ${cat.edad}`,
          )
        })
      } else {
        console.log("❌ No se encontraron categorías existentes para el lote")
      }

      setCategoriasExistentes(data.categorias || [])
    } catch (error) {
      console.error("💥 Error cargando categorías existentes:", error)

      toast({
        title: "Error cargando categorías",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })

      // Datos de fallback para desarrollo
      setCategoriasExistentes([
        { categoria_animal_id: "1", nombre_categoria_animal: "Terneros", lote_id: loteSeleccionado, cantidad: 10 },
        { categoria_animal_id: "2", nombre_categoria_animal: "Vaquillonas", lote_id: loteSeleccionado, cantidad: 5 },
      ])
    } finally {
      setLoadingCategorias(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    if (!empresaSeleccionada) {
      console.error("No hay empresa_id disponible para cargar tipos de movimiento")
      return
    }

    setLoadingTipos(true)
    try {
      console.log("Cargando tipos de movimiento para empresa_id:", empresaSeleccionada, "direccion: SALIDA")
      const response = await fetch(`/api/tipos-movimiento?empresa_id=${empresaSeleccionada}&direccion=SALIDA`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos de tipos de movimiento recibidos:", data)

      setTiposMovimiento(data.tipos || [])
    } catch (error) {
      console.error("Error cargando tipos de movimiento:", error)
      toast({
        title: "Error cargando tipos de movimiento",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      // Datos de fallback para desarrollo
      setTiposMovimiento([
        { id: "1", nombre: "Venta" },
        { id: "2", nombre: "Traslado a otro campo" },
        { id: "3", nombre: "Muerte" },
        { id: "4", nombre: "Faena" },
        { id: "8", nombre: "Mortandad" },
      ])
    } finally {
      setLoadingTipos(false)
    }
  }

  const editarDetalle = (detalle: DetalleItem) => {
    console.log("🖊️ Editando detalle:", detalle)
    setEditandoDetalle(detalle.id)
    setNuevoDetalle({
      tipo_movimiento_id: detalle.tipo_movimiento_id,
      categoria_id: detalle.categoria_id,
      cantidad: detalle.cantidad,
      peso: detalle.peso,
      tipo_peso: detalle.tipo_peso,
    })
    setMostrarFormDetalle(true)
  }

  const agregarDetalle = () => {
    console.log("🔍 Iniciando validación de detalle...")
    console.log("Datos del nuevo detalle:", nuevoDetalle)

    const errores: string[] = []

    // Validar campos obligatorios del detalle
    if (!nuevoDetalle.tipo_movimiento_id) {
      errores.push("Debe seleccionar un tipo de movimiento")
    }

    if (!nuevoDetalle.categoria_id) {
      errores.push("Debe seleccionar una categoría")
    }

    if (!nuevoDetalle.cantidad || nuevoDetalle.cantidad <= 0) {
      errores.push("La cantidad debe ser mayor a 0")
    }

    const tipoMovimientoId = Number.parseInt(nuevoDetalle.tipo_movimiento_id)
    const esMortandad = tipoMovimientoId === 8

    if (!esMortandad && (!nuevoDetalle.peso || nuevoDetalle.peso <= 0)) {
      errores.push("El peso debe ser mayor a 0")
    }

    // VALIDACIÓN DE STOCK
    if (nuevoDetalle.categoria_id && nuevoDetalle.cantidad > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK")
      console.log("   Categoría seleccionada ID:", nuevoDetalle.categoria_id)
      console.log("   Cantidad solicitada:", nuevoDetalle.cantidad)
      console.log("   Categorías disponibles:", categoriasExistentes.length)

      const categoriaSeleccionada = categoriasExistentes.find(
        (c) => c.categoria_animal_id === nuevoDetalle.categoria_id,
      )

      console.log("   Categoría encontrada:", categoriaSeleccionada)

      if (categoriaSeleccionada) {
        // Calcular cantidad ya utilizada en otros detalles de la misma categoría
        const cantidadYaUtilizada = detalles
          .filter((d) => d.categoria_id === nuevoDetalle.categoria_id && d.id !== editandoDetalle)
          .reduce((sum, d) => sum + d.cantidad, 0)

        const stockDisponible = Number(categoriaSeleccionada.cantidad) - cantidadYaUtilizada

        console.log(`📊 Validación de stock para ${categoriaSeleccionada.nombre_categoria_animal}:`)
        console.log(
          `   Stock total: ${categoriaSeleccionada.cantidad} (tipo: ${typeof categoriaSeleccionada.cantidad})`,
        )
        console.log(`   Ya utilizado en otros detalles: ${cantidadYaUtilizada}`)
        console.log(`   Stock disponible: ${stockDisponible}`)
        console.log(`   Cantidad solicitada: ${nuevoDetalle.cantidad}`)
        console.log(`   ¿Supera el stock?: ${nuevoDetalle.cantidad > stockDisponible}`)

        if (nuevoDetalle.cantidad > stockDisponible) {
          const errorMsg =
            `Stock insuficiente para ${categoriaSeleccionada.nombre_categoria_animal}. ` +
            `Disponible: ${stockDisponible}, solicitado: ${nuevoDetalle.cantidad}`
          console.log("❌ ERROR DE STOCK:", errorMsg)
          errores.push(errorMsg)
        } else {
          console.log("✅ Stock suficiente")
        }
      } else {
        console.log("❌ No se encontró la categoría seleccionada en las categorías existentes")
        errores.push("No se pudo validar el stock para la categoría seleccionada")
      }
    }

    console.log("Errores encontrados en detalle:", errores)

    // Si hay errores, mostrarlos y no agregar el detalle
    if (errores.length > 0) {
      console.log("❌ Mostrando errores de validación de detalle")
      setErroresDetalle(errores)

      // También mostrar toast
      toast({
        title: "Error en validación",
        description: errores.join(", "),
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validación de detalle exitosa, agregando...")
    setErroresDetalle([])

    const tipoMov = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)
    const categoria = categoriasExistentes.find((c) => c.categoria_animal_id === nuevoDetalle.categoria_id)

    if (editandoDetalle) {
      // Actualizar detalle existente
      const detallesActualizados = detalles.map((d) =>
        d.id === editandoDetalle
          ? {
              ...d,
              tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
              tipo_movimiento_nombre: tipoMov?.nombre || "",
              categoria_id: nuevoDetalle.categoria_id,
              categoria_nombre: categoria?.nombre_categoria_animal || "",
              cantidad: nuevoDetalle.cantidad,
              peso: nuevoDetalle.peso,
              tipo_peso: nuevoDetalle.tipo_peso,
            }
          : d,
      )
      setDetalles(detallesActualizados)
      console.log("✅ Detalle actualizado")
    } else {
      // Agregar nuevo detalle
      const detalle: DetalleItem = {
        id: Date.now().toString(),
        tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
        tipo_movimiento_nombre: tipoMov?.nombre || "",
        categoria_id: nuevoDetalle.categoria_id,
        categoria_nombre: categoria?.nombre_categoria_animal || "",
        cantidad: nuevoDetalle.cantidad,
        peso: nuevoDetalle.peso,
        tipo_peso: nuevoDetalle.tipo_peso,
      }
      setDetalles([...detalles, detalle])
      console.log("✅ Detalle agregado")
    }

    // Limpiar formulario
    setNuevoDetalle({
      tipo_movimiento_id: "",
      categoria_id: "",
      cantidad: 0,
      peso: 0,
      tipo_peso: "PROMEDIO",
    })
    setMostrarFormDetalle(false)
    setEditandoDetalle(null)
  }

  const cancelarEdicion = () => {
    setMostrarFormDetalle(false)
    setEditandoDetalle(null)
    setErroresDetalle([])
    setNuevoDetalle({
      tipo_movimiento_id: "",
      categoria_id: "",
      cantidad: 0,
      peso: 0,
      tipo_peso: "PROMEDIO",
    })
  }

  const eliminarDetalle = (id: string) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  const validarFormulario = () => {
    console.log("🔍 Iniciando validación completa del formulario...")

    const errores: string[] = []

    // Validar datos generales
    if (!loteSeleccionado) {
      errores.push("Debe seleccionar un lote")
    }

    if (!fechaSeleccionada) {
      errores.push("Debe seleccionar una fecha")
    }

    if (!horaSeleccionada) {
      errores.push("Debe seleccionar una hora")
    }

    // Validar que haya detalles
    if (detalles.length === 0) {
      errores.push("Debe agregar al menos un detalle de movimiento")
    }

    // Validar datos del sistema
    if (!usuario?.id) {
      errores.push("Error del sistema: No se pudo obtener el ID del usuario")
    }

    if (!establecimientoSeleccionado) {
      errores.push("Error del sistema: No se pudo obtener el ID del establecimiento")
    }

    console.log("Errores encontrados en formulario completo:", errores)
    return errores
  }

  const guardar = async () => {
    console.log("🚀 INICIANDO GUARDADO DE SALIDA DE ANIMALES...")

    // Validar formulario
    const errores = validarFormulario()
    if (errores.length > 0) {
      console.log("❌ Errores de validación encontrados:", errores)

      setErroresValidacion(errores)

      // Separar errores por categorías para mejor presentación
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

      console.log("Mensaje de error a mostrar:", mensajeError)

      toast({
        title: `Se encontraron ${errores.length} error${errores.length > 1 ? "es" : ""} de validación`,
        description: mensajeError.trim(),
        variant: "destructive",
      })
      return
    }

    console.log("✅ Validación exitosa, procediendo a guardar...")
    setErroresValidacion([])

    setLoading(true)
    try {
      console.log("📦 Preparando datos para guardar...")

      // Convertir fecha a formato string
      const fechaString = fechaSeleccionada?.toISOString().split("T")[0] || ""

      const datosMovimiento = {
        establecimiento_id: Number.parseInt(establecimientoSeleccionado!),
        nota: nota.trim() || null,
        fecha: fechaString,
        hora: horaSeleccionada || "",
        lote_id: Number.parseInt(loteSeleccionado),
        user_id: usuario!.id,
        detalles: detalles.map((detalle) => ({
          categoria_id: Number.parseInt(detalle.categoria_id),
          cantidad: detalle.cantidad,
          peso: detalle.peso,
          tipo_peso: detalle.tipo_peso,
          tipo_movimiento_id: Number.parseInt(detalle.tipo_movimiento_id),
        })),
      }

      console.log("📤 Datos a enviar:", datosMovimiento)

      const response = await fetch("/api/movimientos-animales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosMovimiento),
      })

      console.log("📡 Respuesta del servidor - Status:", response.status)

      if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status}`
        try {
          const errorData = await response.json()
          console.log("❌ Error del servidor:", errorData)
          errorMessage = errorData.details || errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          console.log("❌ Error texto del servidor:", errorText)
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("🎉 MOVIMIENTO GUARDADO EXITOSAMENTE:", result)

      // Mostrar mensaje de éxito visual
      setMostrarExito(true)

      // Toast más elaborado después de un momento
      setTimeout(() => {
        console.log("📢 Mostrando toast detallado...")
        toast({
          title: "✅ Parte Diario Guardado",
          description: `Se registraron ${detalles.length} detalles con ${detalles.reduce((sum, d) => sum + d.cantidad, 0)} animales`,
          duration: 4000,
        })
      }, 500)

      // Disparar evento para recargar partes diarios
      console.log("🔄 Disparando evento reloadPartesDiarios...")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      console.log("✅ Evento reloadPartesDiarios disparado")

      // Actualizar fecha y hora para el próximo registro
      const nuevaFecha = new Date()
      setFechaSeleccionada(nuevaFecha)
      setHoraSeleccionada(nuevaFecha.toTimeString().slice(0, 5))

      // Cerrar drawer después de mostrar éxito
      setTimeout(() => {
        console.log("🚪 Cerrando drawer...")
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("💥 ERROR GUARDANDO MOVIMIENTO:", error)
      toast({
        title: "Error",
        description: `No se pudo guardar la salida de animales: ${error instanceof Error ? error.message : "Error desconocido"}`,
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

  // Preparar opciones para los comboboxes
  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id,
    label: lote.nombre,
  }))

  const opcionesTiposMovimiento = tiposMovimiento.map((tipo) => ({
    value: tipo.id,
    label: tipo.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((categoria) => ({
    value: categoria.categoria_animal_id,
    label: categoria.nombre_categoria_animal,
  }))

  // Mostrar nombre completo del usuario
  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Salida de Animales</DrawerTitle>
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
                <div className="font-medium text-green-800 mb-2">¡Salida guardada exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se registraron {detalles.length} detalles con {detalles.reduce((sum, d) => sum + d.cantidad, 0)}{" "}
                  animales. Los datos se han sincronizado correctamente.
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
                  Salida
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
              {loadingLotes && (
                <p className="text-xs text-gray-500 mt-1">
                  Cargando lotes del establecimiento {establecimientoSeleccionado}...
                </p>
              )}
              {!loadingLotes && lotes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No se encontraron lotes para el establecimiento {establecimientoSeleccionado}
                </p>
              )}
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
              <Button
                onClick={() => setMostrarFormDetalle(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                disabled={!loteSeleccionado}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar línea
              </Button>
            </div>

            {!loteSeleccionado && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Debe seleccionar un lote antes de agregar detalles de salida.</AlertDescription>
              </Alert>
            )}

            {/* Formulario de nuevo detalle */}
            {mostrarFormDetalle && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="font-medium text-gray-900">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                {/* Mostrar errores de validación del detalle */}
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
                    <Label className="text-sm font-medium text-gray-700">
                      Categoría Animal *
                      {nuevoDetalle.categoria_id && (
                        <span className="text-xs text-gray-500 ml-2">
                          (Stock:{" "}
                          {categoriasExistentes.find((c) => c.categoria_animal_id === nuevoDetalle.categoria_id)
                            ?.cantidad || 0}
                          )
                        </span>
                      )}
                    </Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesCategorias}
                        value={nuevoDetalle.categoria_id}
                        onValueChange={(value) => setNuevoDetalle({ ...nuevoDetalle, categoria_id: value })}
                        placeholder="Selecciona categoría..."
                        searchPlaceholder="Buscar categoría..."
                        emptyMessage="No hay animales disponibles en este lote."
                        loading={loadingCategorias}
                        disabled={loadingCategorias || !loteSeleccionado}
                      />
                    </div>
                    {loadingCategorias && (
                      <p className="text-xs text-gray-500 mt-1">Cargando categorías disponibles...</p>
                    )}
                    {!loadingCategorias && categoriasExistentes.length === 0 && loteSeleccionado && (
                      <p className="text-xs text-amber-600 mt-1">No hay animales disponibles en el lote seleccionado</p>
                    )}
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
                    <Label className="text-sm font-medium text-gray-700">
                      Peso (kg){" "}
                      {nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) !== 8 && "*"}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={nuevoDetalle.peso || ""}
                      onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, peso: Number.parseInt(e.target.value) || 0 })}
                      className="mt-1"
                      placeholder={
                        nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) === 8
                          ? "Dejar vacío para usar promedio"
                          : "Ej: 250"
                      }
                    />
                    {nuevoDetalle.tipo_movimiento_id && Number.parseInt(nuevoDetalle.tipo_movimiento_id) === 8 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Si no ingresa un peso, se calculará automáticamente el promedio del lote
                      </p>
                    )}
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
                  <Button onClick={agregarDetalle} size="sm" className="bg-red-600 hover:bg-red-700">
                    {editandoDetalle ? "Actualizar" : "Agregar"}
                  </Button>
                  <Button onClick={cancelarEdicion} variant="outline" size="sm">
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
          <Button onClick={guardar} disabled={loading} className="bg-red-600 hover:bg-red-700">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
