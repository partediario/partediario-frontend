"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Edit, Users, AlertCircle, X } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface TipoActividad {
  id: number
  nombre: string
  ubicacion: string
  animales: string
}

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
  cantidad: number
  sexo?: string
  edad?: string
}

interface Lote {
  id: number
  nombre: string
}

interface DetalleActividad {
  id: string
  categoria_animal_id: number
  categoria_nombre: string
  cantidad: number
  peso: number
  tipo_peso: "TOTAL" | "PROMEDIO"
  lote_id: number
  lote_nombre: string
  es_original: boolean
  cantidad_original: number
}

interface TipoMovimiento {
  id: number
  nombre: string
}

interface EditarFaenaDrawerProps {
  isOpen?: boolean
  onClose?: () => void
  onSuccess?: () => void
  parte: ParteDiario | null
}

export default function EditarFaenaDrawer({ isOpen = false, onClose, onSuccess, parte }: EditarFaenaDrawerProps) {
  // Estados principales
  const [tipoActividadNombre, setTipoActividadNombre] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Estados de opciones
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimiento[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  // Estados del formulario principal
  const [tipoActividadId, setTipoActividadId] = useState<string>("")
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")
  const [tipoMovimiento, setTipoMovimiento] = useState<string>("")

  // Estados del formulario de detalle
  const [mostrarFormDetalle, setMostrarFormDetalle] = useState(false)
  const [editandoDetalle, setEditandoDetalle] = useState<DetalleActividad | null>(null)
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaId, setCategoriaId] = useState<string>("")
  const [cantidad, setCantidad] = useState<string>("")
  const [peso, setPeso] = useState<string>("")
  const [tipoPeso, setTipoPeso] = useState<"TOTAL" | "PROMEDIO">("TOTAL")

  // Estados de datos
  const [detalles, setDetalles] = useState<DetalleActividad[]>([])
  const [errores, setErrores] = useState<string[]>([])
  const [erroresDetalle, setErroresDetalle] = useState<string[]>([])

  // Contextos
  const { usuario, loading: loadingUsuario } = useUser()
  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  const nombreCompleto = usuario ? `${usuario.nombres} ${usuario.apellidos}`.trim() : "Cargando..."

  // Función para calcular stock disponible (adaptada de editar-salida-animales-drawer)
  const calcularStockDisponible = (categoriaId: string): number => {
    console.log("🧮 CALCULANDO STOCK DISPONIBLE PARA FAENA")
    console.log("   Categoría ID:", categoriaId)
    console.log("   Editando detalle:", editandoDetalle?.id)

    // Obtener la categoría seleccionada
    const categoria = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)
    if (!categoria) {
      console.log("❌ Categoría no encontrada")
      return 0
    }

    console.log(`   Stock base de ${categoria.nombre_categoria_animal}: ${categoria.cantidad}`)
    const stockBase = Number(categoria.cantidad)

    // CASO 1: Editando una línea original
    if (
      editandoDetalle &&
      editandoDetalle.es_original &&
      editandoDetalle.categoria_animal_id.toString() === categoriaId
    ) {
      console.log("📝 EDITANDO LÍNEA ORIGINAL")
      console.log(`   Cantidad original de la línea: ${editandoDetalle.cantidad_original}`)

      // Para editar una línea original, el stock disponible es:
      // stock base + cantidad original de esa línea específica
      const stockParaEdicion = stockBase + editandoDetalle.cantidad_original
      console.log(`   Stock disponible para edición: ${stockParaEdicion}`)
      return Math.max(0, stockParaEdicion)
    }

    // CASO 2: Agregando nueva línea o editando línea nueva
    console.log("➕ AGREGANDO NUEVA LÍNEA O EDITANDO LÍNEA NUEVA")

    // Obtener los detalles originales iniciales para saber qué se había descontado
    const parseDetalles = () => {
      try {
        if (typeof parte?.pd_detalles === "string") {
          return JSON.parse(parte.pd_detalles)
        }
        return parte?.pd_detalles || {}
      } catch {
        return {}
      }
    }

    const detallesOriginalesIniciales = parseDetalles()

    // Calcular cuánto se había descontado originalmente para esta categoría
    let cantidadOriginalTotalDescontada = 0
    if (
      detallesOriginalesIniciales?.detalles_animales &&
      Array.isArray(detallesOriginalesIniciales.detalles_animales)
    ) {
      detallesOriginalesIniciales.detalles_animales.forEach((detalle: any) => {
        const categoriaDetalle = categoriasExistentes.find(
          (c) =>
            c.nombre_categoria_animal.toLowerCase().trim() === (detalle.categoria_animal || "").toLowerCase().trim(),
        )
        if (categoriaDetalle && categoriaDetalle.categoria_animal_id.toString() === categoriaId) {
          cantidadOriginalTotalDescontada += detalle.cantidad || 0
          console.log(`   Cantidad original descontada: ${detalle.cantidad}`)
        }
      })
    }

    console.log(`   Total cantidad original descontada: ${cantidadOriginalTotalDescontada}`)

    // Calcular cuánto de esa cantidad original aún está presente en los detalles actuales
    let cantidadOriginalAunPresente = 0
    detalles.forEach((detalle) => {
      if (detalle.categoria_animal_id.toString() === categoriaId && detalle.es_original) {
        cantidadOriginalAunPresente += detalle.cantidad_original
        console.log(`   Cantidad original aún presente: ${detalle.cantidad_original} (detalle ${detalle.id})`)
      }
    })

    console.log(`   Total cantidad original aún presente: ${cantidadOriginalAunPresente}`)

    // La cantidad liberada es la diferencia entre lo que se había descontado y lo que aún está presente
    const cantidadLiberada = cantidadOriginalTotalDescontada - cantidadOriginalAunPresente
    console.log(`   Cantidad liberada: ${cantidadLiberada}`)

    // Stock ajustado = stock base + cantidad liberada
    const stockAjustado = stockBase + cantidadLiberada
    console.log(`   Stock ajustado: ${stockAjustado}`)

    // Restar cantidades usadas por detalles nuevos (no originales) y excluyendo el que estamos editando
    let cantidadUsadaPorNuevos = 0
    detalles.forEach((detalle) => {
      if (
        detalle.categoria_animal_id.toString() === categoriaId &&
        !detalle.es_original &&
        detalle.id !== editandoDetalle?.id
      ) {
        cantidadUsadaPorNuevos += detalle.cantidad
        console.log(`   - Cantidad usada por detalle nuevo ${detalle.id}: ${detalle.cantidad}`)
      }
    })

    console.log(`   Total cantidad usada por nuevos: ${cantidadUsadaPorNuevos}`)

    const stockFinal = stockAjustado - cantidadUsadaPorNuevos
    console.log(`   = Stock disponible final: ${stockFinal}`)

    return Math.max(0, stockFinal)
  }

  // Función para limpiar todos los estados
  const limpiarEstados = useCallback(() => {
    console.log("🧹 Limpiando todos los estados")
    setTipoActividadId("")
    setTipoActividadNombre("")
    setFecha(new Date())
    setHora(new Date().toTimeString().slice(0, 5))
    setNota("")
    setDetalles([])
    setTipoMovimiento("")
    setLotes([])
    setTiposMovimiento([])
    setCategorias([])
    limpiarFormularioDetalle()
    setErrores([])
    setLoadingData(false)
  }, [])

  // Función para cargar lotes
  const fetchLotes = useCallback(async () => {
    if (!establecimientoSeleccionado) return []

    try {
      console.log("🔄 Cargando lotes...")
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar lotes")

      const data = await response.json()
      const lotesData = data.lotes || []
      setLotes(lotesData)
      console.log("✅ Lotes cargados:", lotesData.length)
      return lotesData
    } catch (error) {
      console.error("❌ Error fetching lotes:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar lotes",
        variant: "destructive",
      })
      return []
    }
  }, [establecimientoSeleccionado])

  // Función para cargar tipos de movimiento
  const fetchTiposMovimiento = useCallback(async () => {
    if (!empresaSeleccionada) return []

    try {
      console.log("🔄 Cargando tipos de movimiento...")
      const response = await fetch(`/api/tipos-movimiento?empresa_id=${empresaSeleccionada}&direccion=SALIDA`)
      if (!response.ok) throw new Error("Error al cargar tipos de movimiento")

      const data = await response.json()
      // Filtrar para solo incluir los IDs 11 y 7
      const tiposFiltrados = data.tipos.filter((tipo: TipoMovimiento) => tipo.id === 11 || tipo.id === 7)
      setTiposMovimiento(tiposFiltrados)
      console.log("✅ Tipos de movimiento cargados:", tiposFiltrados)
      return tiposFiltrados
    } catch (error) {
      console.error("❌ Error fetching tipos de movimiento:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar tipos de movimiento",
        variant: "destructive",
      })
      return []
    }
  }, [empresaSeleccionada])

  // Función para extraer datos del parte diario
  const extraerDatosParteDiario = useCallback(() => {
    if (!parte) {
      console.log("❌ No hay parte diario disponible")
      return null
    }

    try {
      console.log("🔄 Extrayendo datos del parte diario...")
      console.log("📋 Parte completo:", parte)

      let detalles = parte.pd_detalles
      if (typeof detalles === "string") {
        detalles = JSON.parse(detalles)
      }

      console.log("📋 Detalles parseados:", detalles)

      // Extraer tipo_movimiento_animal_id específicamente
      const tipoMovimientoId = detalles?.tipo_movimiento_animal_id
      console.log("🎯 tipo_movimiento_animal_id encontrado:", tipoMovimientoId, typeof tipoMovimientoId)

      const datosExtraidos = {
        tipoActividadNombre: detalles?.detalle_tipo || "Faena",
        tipoActividadId: detalles?.detalle_tipo_id?.toString() || "",
        tipoMovimientoId: tipoMovimientoId ? tipoMovimientoId.toString() : "11", // Convertir a string
        fecha: new Date(parte.pd_fecha + "T00:00:00"),
        hora: parte.pd_hora?.slice(0, 5) || "",
        nota: parte.pd_nota || "",
        detalles:
          detalles?.detalles_animales?.map((detalle: any, index: number) => ({
            id: detalle.detalle_id?.toString() || `existing_${index}`,
            categoria_animal_id: detalle.categoria_animal_id || 0,
            categoria_nombre: detalle.categoria_animal,
            cantidad: detalle.cantidad,
            peso: detalle.peso,
            tipo_peso: detalle.tipo_peso as "TOTAL" | "PROMEDIO",
            lote_id: detalle.lote_id || 0,
            lote_nombre: detalle.lote_id ? `Lote ${detalle.lote_id}` : "Sin lote",
            es_original: true, // Marcar como original
            cantidad_original: detalle.cantidad || 0, // Guardar cantidad original
          })) || [],
      }

      console.log("✅ Datos extraídos exitosamente:", datosExtraidos)
      return datosExtraidos
    } catch (err) {
      console.error("❌ Error extrayendo datos del parte diario:", err)
      return null
    }
  }, [parte])

  // Función para aplicar los datos extraídos
  const aplicarDatosExtraidos = useCallback((datos: any, lotesDisponibles: Lote[] = []) => {
    if (!datos) {
      console.log("❌ No hay datos para aplicar")
      return
    }

    console.log("🔄 Aplicando datos extraídos...")
    console.log("📋 Datos a aplicar:", datos)
    console.log("🏷️ Lotes disponibles:", lotesDisponibles)

    // Aplicar datos básicos
    setTipoActividadNombre(datos.tipoActividadNombre)
    setTipoActividadId(datos.tipoActividadId)
    setFecha(datos.fecha)
    setHora(datos.hora)
    setNota(datos.nota)

    // CRÍTICO: Aplicar tipo de movimiento
    console.log("🎯 Aplicando tipo de movimiento:", datos.tipoMovimientoId)
    setTipoMovimiento(datos.tipoMovimientoId)

    // NUEVO: Actualizar nombres de lotes en los detalles usando los lotes disponibles
    if (datos.detalles && datos.detalles.length > 0) {
      const detallesConNombres = datos.detalles.map((detalle: any) => {
        const loteEncontrado = lotesDisponibles.find((l) => l.id === detalle.lote_id)
        console.log(`🔍 Buscando lote ${detalle.lote_id}:`, loteEncontrado)
        return {
          ...detalle,
          lote_nombre: loteEncontrado ? loteEncontrado.nombre : `Lote ${detalle.lote_id}`,
        }
      })
      console.log("✅ Detalles con nombres actualizados:", detallesConNombres)
      setDetalles(detallesConNombres)
    } else {
      setDetalles(datos.detalles)
    }

    console.log("✅ Datos aplicados exitosamente")
  }, [])

  // Función principal de inicialización
  const inicializarDrawer = useCallback(async () => {
    if (!establecimientoSeleccionado || !empresaSeleccionada || !parte) {
      console.log("❌ Faltan datos para inicializar:", {
        establecimiento: !!establecimientoSeleccionado,
        empresa: !!empresaSeleccionada,
        parte: !!parte,
      })
      return
    }

    console.log("🚀 Iniciando inicialización del drawer...")
    setLoadingData(true)

    try {
      // 1. Cargar opciones en paralelo
      console.log("📡 Cargando opciones...")
      const [lotesData, tiposMovimientoData] = await Promise.all([fetchLotes(), fetchTiposMovimiento()])

      console.log("✅ Opciones cargadas:", {
        lotes: lotesData.length,
        tiposMovimiento: tiposMovimientoData.length,
      })

      // 2. Extraer datos del parte diario
      console.log("📋 Extrayendo datos...")
      const datosExtraidos = extraerDatosParteDiario()

      if (!datosExtraidos) {
        console.log("❌ No se pudieron extraer los datos")
        return
      }

      // 3. Pequeña pausa para asegurar que React haya actualizado los estados
      await new Promise((resolve) => setTimeout(resolve, 200))

      // 4. Aplicar los datos extraídos CON los lotes cargados
      console.log("🔧 Aplicando datos con lotes...")
      aplicarDatosExtraidos(datosExtraidos, lotesData)

      console.log("✅ Inicialización completada exitosamente")
    } catch (error) {
      console.error("❌ Error durante la inicialización:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar los datos de la faena",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }, [
    establecimientoSeleccionado,
    empresaSeleccionada,
    parte,
    fetchLotes,
    fetchTiposMovimiento,
    extraerDatosParteDiario,
    aplicarDatosExtraidos,
  ])

  // Effect principal - se ejecuta cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      console.log("🔓 Drawer abierto - iniciando carga...")
      inicializarDrawer()
    } else {
      console.log("🔒 Drawer cerrado - limpiando estados...")
      limpiarEstados()
    }
  }, [isOpen, inicializarDrawer, limpiarEstados])

  // Effect para cargar categorías cuando cambia el lote
  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaId("")
    }
  }, [loteId])

  const fetchCategoriasExistentes = async () => {
    if (!loteId) return

    setLoadingCategorias(true)
    try {
      const response = await fetch(`/api/categorias-existentes-lote?lote_id=${loteId}`)
      if (!response.ok) throw new Error("Error al cargar categorías")

      const data = await response.json()
      setCategorias(data.categorias || [])
    } catch (error) {
      console.error("Error fetching categorias:", error)
      toast({
        title: "❌ Error",
        description: "Error al cargar categorías",
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
    if (!tipoActividadId) errores.push("Debe tener un tipo de actividad válido")
    if (!tipoMovimiento) errores.push("Debe seleccionar un tipo de movimiento")

    return errores
  }

  const validarDetalle = (): string[] => {
    const errores: string[] = []

    if (!loteId) errores.push("Debe seleccionar un lote")
    if (!categoriaId) errores.push("Debe seleccionar una categoría")
    if (!cantidad || Number.parseInt(cantidad) <= 0) errores.push("La cantidad debe ser mayor a 0")
    if (!peso || Number.parseInt(peso) <= 0) errores.push("El peso debe ser mayor a 0")

    // VALIDACIÓN DE STOCK PARA FAENA
    if (categoriaId && cantidad && Number.parseInt(cantidad) > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK PARA FAENA")
      console.log("   Categoría seleccionada ID:", categoriaId)
      console.log("   Cantidad solicitada:", cantidad)
      console.log("   Editando detalle:", editandoDetalle?.id)

      const stockDisponible = calcularStockDisponible(categoriaId)
      const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

      console.log(`📊 Validación de stock para ${categoriaSeleccionada?.nombre_categoria_animal}:`)
      console.log(`   Stock disponible calculado: ${stockDisponible}`)
      console.log(`   Cantidad solicitada: ${cantidad}`)
      console.log(`   ¿Supera el stock?: ${Number.parseInt(cantidad) > stockDisponible}`)

      if (Number.parseInt(cantidad) > stockDisponible) {
        const errorMsg =
          `Stock insuficiente para ${categoriaSeleccionada?.nombre_categoria_animal}. ` +
          `Disponible: ${stockDisponible}, solicitado: ${cantidad}`
        console.log("❌ ERROR DE STOCK:", errorMsg)
        errores.push(errorMsg)
      } else {
        console.log("✅ Stock suficiente")
      }
    }

    return errores
  }

  const agregarDetalle = () => {
    const erroresValidacion = validarDetalle()
    if (erroresValidacion.length > 0) {
      setErroresDetalle(erroresValidacion)

      // También mostrar toast
      toast({
        title: "Error en validación",
        description: erroresValidacion.join(", "),
        variant: "destructive",
      })
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find((c) => c.categoria_animal_id.toString() === categoriaId)

    if (!loteSeleccionado || !categoriaSeleccionada) return

    const nuevoDetalle: DetalleActividad = {
      id: editandoDetalle ? editandoDetalle.id : Date.now().toString(),
      categoria_animal_id: Number.parseInt(categoriaId),
      categoria_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidad),
      peso: Number.parseInt(peso),
      tipo_peso: tipoPeso,
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
      es_original: editandoDetalle ? editandoDetalle.es_original : false,
      cantidad_original: editandoDetalle ? editandoDetalle.cantidad_original : 0,
    }

    if (editandoDetalle) {
      // Actualizar detalle existente
      const detallesActualizados = detalles.map((detalle) =>
        detalle.id === editandoDetalle.id ? nuevoDetalle : detalle,
      )
      setDetalles(detallesActualizados)
      setEditandoDetalle(null)
    } else {
      // Agregar nuevo detalle
      setDetalles([...detalles, nuevoDetalle])
    }

    limpiarFormularioDetalle()
  }

  const editarDetalle = (detalle: DetalleActividad) => {
    console.log("✏️ Iniciando edición de detalle:", detalle)
    setEditandoDetalle(detalle)
    setLoteId(detalle.lote_id.toString())
    setCategoriaId(detalle.categoria_animal_id.toString())
    setCantidad(detalle.cantidad.toString())
    setPeso(detalle.peso.toString())
    setTipoPeso(detalle.tipo_peso)
    setMostrarFormDetalle(true)
    setErroresDetalle([])
  }

  const eliminarDetalle = (id: string) => {
    setDetalles(detalles.filter((d) => d.id !== id))
  }

  const limpiarFormularioDetalle = () => {
    setLoteId("")
    setCategoriaId("")
    setCantidad("")
    setPeso("")
    setTipoPeso("TOTAL")
    setMostrarFormDetalle(false)
    setEditandoDetalle(null)
    setErroresDetalle([])
  }

  const handleSubmit = async () => {
    const erroresValidacion = validarFormularioPrincipal()
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/actividades-animales/${parte.pd_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_actividad_id: Number.parseInt(tipoActividadId),
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          user_id: usuario?.id,
          tipo_movimiento_animal_id: Number.parseInt(tipoMovimiento),
          detalles: detalles.map((d) => ({
            categoria_animal_id: d.categoria_animal_id,
            cantidad: d.cantidad,
            peso: d.peso,
            tipo_peso: d.tipo_peso,
            lote_id: d.lote_id,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar faena")
      }

      const totalAnimales = detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0)

      toast({
        title: "✅ Faena Actualizada",
        description: `Se actualizaron ${detalles.length} detalles con ${totalAnimales} animales`,
        duration: 4000,
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))

      onClose?.()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating faena:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar faena",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  // Opciones para los combobox
  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  const opcionesTiposMovimiento = tiposMovimiento.map((tipo) => ({
    value: tipo.id.toString(),
    label: tipo.nombre,
  }))

  if (!parte || parte.pd_tipo !== "ACTIVIDAD") return null

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Editar Faena
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingData && (
            <div className="text-center py-8">
              <div className="text-gray-500">Cargando datos de la faena...</div>
            </div>
          )}

          {!loadingData && (
            <>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipo de Actividad</Label>
                        <div className="mt-1 px-3 py-2 bg-gray-100 border rounded-md text-sm text-gray-900 font-medium">
                          {tipoActividadNombre || "Faena"}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tipo de Movimiento *</Label>
                        <div className="mt-1">
                          <CustomCombobox
                            options={opcionesTiposMovimiento}
                            value={tipoMovimiento}
                            onValueChange={setTipoMovimiento}
                            placeholder="Selecciona tipo de movimiento..."
                            searchPlaceholder="Buscar tipo de movimiento..."
                            emptyMessage="No se encontraron tipos de movimiento."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                        <div className="mt-1">
                          <CustomDatePicker date={fecha} onDateChange={setFecha} placeholder="Seleccionar fecha" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Hora *</Label>
                        <div className="mt-1">
                          <CustomTimePicker time={hora} onTimeChange={setHora} placeholder="Seleccionar hora" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Detalles</h3>
                    <Button onClick={() => setMostrarFormDetalle(true)} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar línea
                    </Button>
                  </div>

                  {mostrarFormDetalle && (
                    <div className="bg-gray-50 border rounded-lg p-6 mb-4">
                      {erroresDetalle.length > 0 && (
                        <Alert variant="destructive" className="mb-4">
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

                      <h4 className="font-medium mb-4">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Lote *</Label>
                            <div className="mt-1">
                              <CustomCombobox
                                options={opcionesLotes}
                                value={loteId}
                                onValueChange={setLoteId}
                                placeholder="Selecciona lote..."
                                searchPlaceholder="Buscar lote..."
                                emptyMessage="No se encontraron lotes."
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Categoría Animal *
                              {categoriaId && (
                                <span className="text-xs text-gray-500 ml-2">
                                  (Stock disponible: {calcularStockDisponible(categoriaId)})
                                </span>
                              )}
                            </Label>
                            <div className="mt-1">
                              <CustomCombobox
                                options={opcionesCategorias}
                                value={categoriaId}
                                onValueChange={setCategoriaId}
                                placeholder={loteId ? "Selecciona categoría..." : "Primero selecciona un lote"}
                                searchPlaceholder="Buscar categoría..."
                                emptyMessage="No se encontraron categorías con stock."
                                disabled={!loteId}
                                loading={loadingCategorias}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                placeholder="Ej: 10"
                                min="1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-gray-700">Peso (kg) *</Label>
                            <div className="mt-1">
                              <Input
                                type="number"
                                value={peso}
                                onChange={(e) => setPeso(e.target.value)}
                                placeholder="Ej: 250"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tipo de peso</Label>
                          <RadioGroup
                            value={tipoPeso}
                            onValueChange={(value) => setTipoPeso(value as "TOTAL" | "PROMEDIO")}
                            className="flex gap-6 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="TOTAL" id="total" />
                              <Label htmlFor="total" className="text-sm font-normal text-gray-700">
                                Total
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="PROMEDIO" id="promedio" />
                              <Label htmlFor="promedio" className="text-sm font-normal text-gray-700">
                                Promedio
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6">
                        <Button onClick={agregarDetalle} className="bg-green-600 hover:bg-green-700">
                          {editandoDetalle ? "Actualizar" : "Agregar"}
                        </Button>
                        <Button variant="outline" onClick={limpiarFormularioDetalle}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b">
                      <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                        <div className="col-span-2">Lote</div>
                        <div className="col-span-3">Categoría Animal</div>
                        <div className="col-span-2 text-center">Cantidad</div>
                        <div className="col-span-2 text-center">Peso</div>
                        <div className="col-span-2 text-center">Tipo</div>
                        <div className="col-span-1 text-center">Acciones</div>
                      </div>
                    </div>

                    <div className="min-h-[100px]">
                      {detalles.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay detalles agregados</div>
                      ) : (
                        <div className="divide-y">
                          {detalles.map((detalle, index) => (
                            <div
                              key={detalle.id}
                              className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                            >
                              <div className="col-span-2 font-medium truncate">{detalle.lote_nombre}</div>
                              <div className="col-span-3 truncate">{detalle.categoria_nombre}</div>
                              <div className="col-span-2 text-center">{detalle.cantidad}</div>
                              <div className="col-span-2 text-center">{detalle.peso} kg</div>
                              <div className="col-span-2 text-center">{detalle.tipo_peso}</div>
                              <div className="col-span-1 flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editarDetalle(detalle)}
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarDetalle(detalle.id)}
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
                    Nota
                  </Label>
                  <div className="mt-1">
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
            </>
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || loadingData} className="bg-green-600 hover:bg-green-700">
            {loading ? "Actualizando..." : "Actualizar Faena"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
