"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CustomCombobox } from "@/components/ui/custom-combobox"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
import { CustomTimePicker } from "@/components/ui/custom-time-picker"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Package, Users, AlertCircle, X } from "lucide-react"
import { useEstablishment } from "@/contexts/establishment-context"
import { toast } from "@/hooks/use-toast"
import type { ParteDiario } from "@/lib/types"

interface EditarActividadMixtaDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
  onSuccess: () => void
}

interface Lote {
  id: number
  nombre: string
}

interface CategoriaExistente {
  categoria_animal_id: number
  nombre_categoria_animal: string
  lote_id: number
}

interface Insumo {
  id: number
  nombre: string
  pd_unidad_medida_insumos?: {
    nombre: string
  }
}

interface InsumoExistente {
  insumo_id: string
  nombre_insumo: string
  cantidad_disponible: number
  unidad_medida: string
  unidad_medida_uso_id: number
}

interface DetalleAnimal {
  lote_id: number
  lote_nombre: string
  categoria_animal_id: number
  categoria_animal_nombre: string
  cantidad: number
  peso: number
  tipo: string
}

interface DetalleInsumo {
  insumo_id: number
  insumo_nombre: string
  cantidad: number
  unidad_medida: string
  es_original: boolean // Nueva propiedad para distinguir detalles originales de nuevos
  cantidad_original?: number // Cantidad original para detalles que fueron editados
}

export default function EditarActividadMixtaDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarActividadMixtaDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Datos para formularios
  const [lotes, setLotes] = useState<Lote[]>([])
  const [categoriasExistentes, setCategorias] = useState<CategoriaExistente[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumosExistentes, setInsumosExistentes] = useState<InsumoExistente[]>([])

  // Formulario principal
  const [fecha, setFecha] = useState<Date>(new Date())
  const [hora, setHora] = useState<string>(new Date().toTimeString().slice(0, 5))
  const [nota, setNota] = useState<string>("")

  // Detalles
  const [detallesAnimales, setDetallesAnimales] = useState<DetalleAnimal[]>([])
  const [detallesInsumos, setDetallesInsumos] = useState<DetalleInsumo[]>([])

  // Formularios de detalle
  const [mostrarFormAnimales, setMostrarFormAnimales] = useState(false)
  const [mostrarFormInsumos, setMostrarFormInsumos] = useState(false)
  const [editandoAnimal, setEditandoAnimal] = useState<number | null>(null)
  const [editandoInsumo, setEditandoInsumo] = useState<number | null>(null)

  // Formulario animales
  const [loteId, setLoteId] = useState<string>("")
  const [categoriaAnimalId, setCategoriaAnimalId] = useState<string>("")
  const [cantidadAnimal, setCantidadAnimal] = useState<string>("")
  const [peso, setPeso] = useState<string>("")
  const [tipoAnimal, setTipoAnimal] = useState<string>("PROMEDIO") // Cambiado de vacío a "PROMEDIO"

  // Formulario insumos
  const [insumoId, setInsumoId] = useState<string>("")
  const [cantidadInsumo, setCantidadInsumo] = useState<string>("")
  const [unidadMedidaActual, setUnidadMedidaActual] = useState<string>("")
  const [stockDisponible, setStockDisponible] = useState<number>(0)

  // Errores
  const [errores, setErrores] = useState<string[]>([])

  const { establecimientoSeleccionado, empresaSeleccionada } = useEstablishment()

  useEffect(() => {
    if (isOpen && parte) {
      console.log("🔄 Cargando datos para editar actividad mixta:", parte)
      cargarDatosIniciales()
    }
  }, [isOpen, parte])

  // Cargar categorías cuando se selecciona lote
  useEffect(() => {
    if (loteId) {
      fetchCategoriasExistentes()
    } else {
      setCategorias([])
      setCategoriaAnimalId("")
    }
  }, [loteId])

  // Actualizar unidad de medida y stock cuando cambia el insumo seleccionado
  useEffect(() => {
    if (insumoId) {
      const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
      if (insumoSeleccionado) {
        setUnidadMedidaActual(insumoSeleccionado.unidad_medida)

        // Calcular stock disponible considerando todos los casos
        const stockCalculado = calcularStockDisponibleInsumos(insumoId, editandoInsumo)
        setStockDisponible(stockCalculado)

        console.log(`📊 Stock calculado para insumo ${insumoId}:`, {
          stockBase: insumoSeleccionado.cantidad_disponible,
          stockCalculado,
          editandoInsumo,
          detallesActuales: detallesInsumos.length,
        })
      }
    } else {
      setUnidadMedidaActual("")
      setStockDisponible(0)
    }
  }, [insumoId, insumosExistentes, editandoInsumo, detallesInsumos])

  const calcularStockDisponibleInsumos = (insumoIdSeleccionado: string, indexEditando: number | null): number => {
    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoIdSeleccionado)
    if (!insumoSeleccionado) return 0

    const stockBase = insumoSeleccionado.cantidad_disponible

    // Si estamos editando una línea original, devolver stock base + cantidad original de esa línea
    if (indexEditando !== null && detallesInsumos[indexEditando]?.es_original) {
      const detalleEditado = detallesInsumos[indexEditando]
      if (detalleEditado.insumo_id.toString() === insumoIdSeleccionado) {
        const cantidadOriginal = detalleEditado.cantidad_original || detalleEditado.cantidad
        const stockDisponible = stockBase + cantidadOriginal

        console.log(`📊 Editando línea original - insumo ${insumoIdSeleccionado}:`, {
          stockBase,
          cantidadOriginal,
          stockDisponible,
        })

        return Math.max(0, stockDisponible)
      }
    }

    // Para agregar nueva línea o editar línea nueva: calcular stock considerando uso actual
    // Obtener detalles originales iniciales desde parte.pd_detalles
    const detallesOriginalesIniciales = parte.pd_detalles?.detalles_insumos || []

    // Calcular cantidad total descontada originalmente para este insumo
    const cantidadDescontadaOriginalmente = detallesOriginalesIniciales
      .filter((detalle: any) => detalle.insumo_id?.toString() === insumoIdSeleccionado)
      .reduce((total: number, detalle: any) => total + (detalle.cantidad || 0), 0)

    // Calcular cantidad original aún presente en detalles actuales
    const cantidadOriginalPresente = detallesInsumos
      .filter(
        (detalle, index) =>
          detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + (detalle.cantidad_original || detalle.cantidad), 0)

    // Calcular cantidad liberada (descontada originalmente - aún presente)
    const cantidadLiberada = cantidadDescontadaOriginalmente - cantidadOriginalPresente

    // Calcular cantidad usada por líneas nuevas (no originales)
    const cantidadNuevosUsada = detallesInsumos
      .filter(
        (detalle, index) =>
          !detalle.es_original && detalle.insumo_id.toString() === insumoIdSeleccionado && index !== indexEditando,
      )
      .reduce((total, detalle) => total + detalle.cantidad, 0)

    // Stock disponible = stock base + cantidad liberada - cantidad usada por nuevos
    const stockDisponible = stockBase + cantidadLiberada - cantidadNuevosUsada

    console.log(`📊 Cálculo para nueva línea - insumo ${insumoIdSeleccionado}:`, {
      stockBase,
      cantidadDescontadaOriginalmente,
      cantidadOriginalPresente,
      cantidadLiberada,
      cantidadNuevosUsada,
      stockDisponible,
    })

    return Math.max(0, stockDisponible)
  }

  const cargarDatosIniciales = async () => {
    setLoading(true)
    try {
      // Cargar datos del parte
      setFecha(new Date(parte.pd_fecha + "T00:00:00"))
      setHora(parte.pd_hora.slice(0, 5))
      setNota(parte.pd_nota || "")

      // Cargar datos para formularios primero
      await Promise.all([fetchLotes(), fetchInsumosExistentes()])

      // Luego cargar detalles existentes desde la API
      const response = await fetch(`/api/actividades-mixtas/${parte.pd_id}`)
      if (response.ok) {
        const actividadData = await response.json()

        // Mapear detalles de animales (mantener como está)
        const animales = (actividadData.pd_actividades_animales_detalle || []).map((animal: any) => ({
          lote_id: animal.lote_id || 0,
          lote_nombre: animal.pd_lotes?.nombre || "",
          categoria_animal_id: animal.categoria_animal_id || 0,
          categoria_animal_nombre: animal.pd_categoria_animales?.nombre || "",
          cantidad: animal.cantidad || 0,
          peso: animal.peso || 0,
          tipo: animal.tipo_peso || "TOTAL",
        }))

        // Mapear detalles de insumos - USAR pd_detalles para unidad_medida si está disponible
        let insumosData = []

        if (parte.pd_detalles?.detalles_insumos && parte.pd_detalles.detalles_insumos.length > 0) {
          // ✅ Usar datos de pd_detalles que ya incluyen unidad_medida
          console.log("📋 Usando unidades de medida desde pd_detalles:", parte.pd_detalles.detalles_insumos)

          insumosData = parte.pd_detalles.detalles_insumos.map((insumo: any) => ({
            insumo_id: insumo.insumo_id || 0,
            insumo_nombre: insumo.insumo || "",
            cantidad: insumo.cantidad || 0,
            unidad_medida: insumo.unidad_medida || "", // ✅ Ya viene en pd_detalles
            es_original: true, // Marcar como detalle original
            cantidad_original: insumo.cantidad || 0, // Guardar cantidad original
          }))
        } else {
          // Fallback: usar datos de la API
          insumosData = (actividadData.pd_actividades_insumos_detalle || []).map((insumo: any) => ({
            insumo_id: insumo.insumo_id || 0,
            insumo_nombre: insumo.pd_insumos?.nombre || "",
            cantidad: insumo.cantidad || 0,
            unidad_medida: insumo.pd_insumos?.pd_unidad_medida_insumos?.nombre || "",
            es_original: true, // Marcar como detalle original
            cantidad_original: insumo.cantidad || 0, // Guardar cantidad original
          }))
        }

        setDetallesAnimales(animales)
        setDetallesInsumos(insumosData)

        console.log("✅ Datos cargados desde API:", {
          animales: animales.length,
          insumos: insumosData.length,
          insumosOriginales: insumosData.filter((i) => i.es_original).length,
          insumosConUnidades: insumosData.map((i) => ({
            nombre: i.insumo_nombre,
            unidad: i.unidad_medida,
            esOriginal: i.es_original,
          })),
        })
      } else {
        console.error("❌ Error cargando datos desde API")
        toast({
          title: "Error",
          description: "No se pudo cargar la información desde el servidor",
          variant: "destructive",
        })
      }

      console.log("✅ Datos cargados para edición:", {
        animales: detallesAnimales.length,
        insumos: detallesInsumos.length,
        lotesCargados: lotes.length,
      })
    } catch (error) {
      console.error("❌ Error al cargar datos:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLotes = async () => {
    if (!establecimientoSeleccionado) {
      console.log("❌ No hay establecimiento seleccionado para cargar lotes")
      return
    }

    try {
      console.log("🔄 Fetching lotes para establecimiento:", establecimientoSeleccionado)
      const response = await fetch(`/api/lotes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar lotes")
      const data = await response.json()
      setLotes(data.lotes || [])
      console.log("✅ Lotes cargados:", data.lotes?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching lotes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los lotes",
        variant: "destructive",
      })
    }
  }

  const fetchCategoriasExistentes = async () => {
    if (!loteId) return

    setLoadingCategorias(true)
    try {
      console.log("🔄 Fetching categorías para lote:", loteId)
      const response = await fetch(`/api/categorias-existentes-lote?lote_id=${loteId}`)
      if (!response.ok) throw new Error("Error al cargar categorías")

      const data = await response.json()
      setCategorias(data.categorias || [])
      console.log("✅ Categorías cargadas:", data.categorias?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching categorias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoadingCategorias(false)
    }
  }

  const fetchInsumosExistentes = async () => {
    if (!establecimientoSeleccionado) {
      console.log("❌ No hay establecimiento seleccionado para cargar insumos")
      return
    }

    try {
      console.log("🔄 Fetching insumos existentes para establecimiento:", establecimientoSeleccionado)
      const response = await fetch(`/api/insumos-existentes?establecimiento_id=${establecimientoSeleccionado}`)
      if (!response.ok) throw new Error("Error al cargar insumos")
      const data = await response.json()
      setInsumosExistentes(data.insumos || [])
      console.log("✅ Insumos existentes cargados:", data.insumos?.length || 0)
    } catch (error) {
      console.error("❌ Error fetching insumos existentes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos disponibles",
        variant: "destructive",
      })
    }
  }

  const agregarAnimal = () => {
    if (!loteId || !categoriaAnimalId || !cantidadAnimal || !peso) {
      toast({
        title: "Error",
        description: "Lote, categoría animal, cantidad y peso son requeridos",
        variant: "destructive",
      })
      return
    }

    const loteSeleccionado = lotes.find((l) => l.id.toString() === loteId)
    const categoriaSeleccionada = categoriasExistentes.find(
      (c) => c.categoria_animal_id.toString() === categoriaAnimalId,
    )

    if (!loteSeleccionado || !categoriaSeleccionada) {
      toast({
        title: "Error",
        description: "Lote o categoría animal no válidos",
        variant: "destructive",
      })
      return
    }

    const nuevoDetalle: DetalleAnimal = {
      lote_id: Number.parseInt(loteId),
      lote_nombre: loteSeleccionado.nombre,
      categoria_animal_id: Number.parseInt(categoriaAnimalId),
      categoria_animal_nombre: categoriaSeleccionada.nombre_categoria_animal,
      cantidad: Number.parseInt(cantidadAnimal),
      peso: Number.parseFloat(peso),
      tipo: tipoAnimal,
    }

    if (editandoAnimal !== null) {
      const nuevosDetalles = [...detallesAnimales]
      nuevosDetalles[editandoAnimal] = nuevoDetalle
      setDetallesAnimales(nuevosDetalles)
      setEditandoAnimal(null)
    } else {
      setDetallesAnimales([...detallesAnimales, nuevoDetalle])
    }

    limpiarFormularioAnimal()
  }

  const validarDetalleInsumos = (): string[] => {
    const errores: string[] = []

    if (!insumoId) errores.push("Debe seleccionar un insumo")
    if (!cantidadInsumo || Number.parseInt(cantidadInsumo) <= 0) errores.push("La cantidad debe ser mayor a 0")

    // Validar cantidad ingresada contra stock disponible calculado
    const cantidadNumerica = Number.parseInt(cantidadInsumo) || 0
    const stockDisponibleCalculado = calcularStockDisponibleInsumos(insumoId, editandoInsumo)

    if (cantidadNumerica > stockDisponibleCalculado) {
      errores.push(`La cantidad no puede ser mayor al stock disponible (${stockDisponibleCalculado})`)
    }

    return errores
  }

  const agregarInsumo = () => {
    const erroresInsumo = validarDetalleInsumos()
    if (erroresInsumo.length > 0) {
      setErrores(erroresInsumo)
      return
    }

    const insumoSeleccionado = insumosExistentes.find((i) => i.insumo_id === insumoId)
    if (!insumoSeleccionado) {
      toast({
        title: "Error",
        description: "Insumo no válido",
        variant: "destructive",
      })
      return
    }

    const nuevoDetalle: DetalleInsumo = {
      insumo_id: Number.parseInt(insumoId),
      insumo_nombre: insumoSeleccionado.nombre_insumo,
      cantidad: Number.parseInt(cantidadInsumo),
      unidad_medida: insumoSeleccionado.unidad_medida,
      es_original: false, // Los nuevos detalles no son originales
    }

    if (editandoInsumo !== null) {
      const nuevosDetalles = [...detallesInsumos]
      const detalleAnterior = nuevosDetalles[editandoInsumo]

      // Si estamos editando un detalle original, mantener la cantidad original
      if (detalleAnterior.es_original) {
        nuevoDetalle.es_original = true
        nuevoDetalle.cantidad_original = detalleAnterior.cantidad_original
      }

      nuevosDetalles[editandoInsumo] = nuevoDetalle
      setDetallesInsumos(nuevosDetalles)
      setEditandoInsumo(null)
    } else {
      setDetallesInsumos([...detallesInsumos, nuevoDetalle])
    }

    limpiarFormularioInsumo()
  }

  const limpiarFormularioAnimal = () => {
    setLoteId("")
    setCategoriaAnimalId("")
    setCantidadAnimal("")
    setPeso("")
    setTipoAnimal("TOTAL")
    setMostrarFormAnimales(false)
    setEditandoAnimal(null)
  }

  const limpiarFormularioInsumo = () => {
    setInsumoId("")
    setCantidadInsumo("")
    setUnidadMedidaActual("")
    setStockDisponible(0)
    setMostrarFormInsumos(false)
    setEditandoInsumo(null)
  }

  const editarAnimal = (index: number) => {
    const detalle = detallesAnimales[index]
    console.log("🔄 Editando animal:", detalle)

    // Buscar el lote correcto en la lista de lotes disponibles
    const loteEncontrado = lotes.find((l) => l.id === detalle.lote_id || l.nombre === detalle.lote_nombre)

    if (loteEncontrado) {
      setLoteId(loteEncontrado.id.toString())
    } else {
      console.warn("⚠️ No se encontró el lote:", detalle.lote_nombre)
      setLoteId(detalle.lote_id.toString())
    }

    setCantidadAnimal(detalle.cantidad.toString())
    setPeso(detalle.peso.toString())
    setTipoAnimal(detalle.tipo)
    setEditandoAnimal(index)
    setMostrarFormAnimales(true)

    // Cargar categorías para el lote y luego establecer la categoría
    if (detalle.lote_id || loteEncontrado) {
      const loteIdParaCategorias = loteEncontrado ? loteEncontrado.id : detalle.lote_id

      setLoadingCategorias(true)
      fetch(`/api/categorias-existentes-lote?lote_id=${loteIdParaCategorias}`)
        .then((response) => response.json())
        .then((data) => {
          setCategorias(data.categorias || [])

          // Buscar la categoría correcta
          const categoriaEncontrada = data.categorias?.find(
            (cat: any) =>
              cat.categoria_animal_id === detalle.categoria_animal_id ||
              cat.nombre_categoria_animal === detalle.categoria_animal_nombre,
          )

          if (categoriaEncontrada) {
            setCategoriaAnimalId(categoriaEncontrada.categoria_animal_id.toString())
          } else {
            console.warn("⚠️ No se encontró la categoría:", detalle.categoria_animal_nombre)
            setCategoriaAnimalId(detalle.categoria_animal_id.toString())
          }
        })
        .catch((error) => {
          console.error("❌ Error cargando categorías:", error)
        })
        .finally(() => {
          setLoadingCategorias(false)
        })
    }
  }

  const editarInsumo = (index: number) => {
    const detalle = detallesInsumos[index]
    console.log("🔄 Editando insumo:", detalle)

    setInsumoId(detalle.insumo_id.toString())
    setCantidadInsumo(detalle.cantidad.toString())
    setEditandoInsumo(index)
    setMostrarFormInsumos(true)
  }

  const handleSubmit = async () => {
    const erroresValidacion: string[] = []

    if (!fecha) erroresValidacion.push("La fecha es requerida")
    if (!hora) erroresValidacion.push("La hora es requerida")
    if (detallesAnimales.length === 0 && detallesInsumos.length === 0) {
      erroresValidacion.push("Debe agregar al menos un detalle de animal o insumo")
    }

    // Validar que todos los animales tengan lote_id
    detallesAnimales.forEach((animal, index) => {
      if (!animal.lote_id || animal.lote_id === 0) {
        erroresValidacion.push(`Animal en línea ${index + 1}: Lote es requerido`)
      }
      if (!animal.categoria_animal_id || animal.categoria_animal_id === 0) {
        erroresValidacion.push(`Animal en línea ${index + 1}: Categoría animal es requerida`)
      }
    })

    // Validar que todos los insumos tengan insumo_id
    detallesInsumos.forEach((insumo, index) => {
      if (!insumo.insumo_id || insumo.insumo_id === 0) {
        erroresValidacion.push(`Insumo en línea ${index + 1}: Insumo es requerido`)
      }
    })

    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/actividades-mixtas/${parte.pd_detalles?.detalle_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fecha.toISOString().split("T")[0],
          hora,
          nota: nota || null,
          detalles_animales: detallesAnimales.map((animal) => ({
            lote_id: animal.lote_id,
            categoria_animal_id: animal.categoria_animal_id,
            cantidad: animal.cantidad,
            peso: animal.peso,
            tipo: animal.tipo,
          })),
          detalles_insumos: detallesInsumos.map((insumo) => ({
            insumo_id: insumo.insumo_id,
            cantidad: insumo.cantidad,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar actividad")
      }

      toast({
        title: "✅ Actividad Actualizada",
        description: `Se actualizó la actividad mixta con ${detallesAnimales.length} animales y ${detallesInsumos.length} insumos`,
        duration: 4000,
      })

      // Disparar evento para recargar partes diarios
      window.dispatchEvent(new Event("reloadPartesDiarios"))

      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error("Error updating actividad mixta:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al actualizar actividad",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    onClose?.()
    limpiarFormularioAnimal()
    limpiarFormularioInsumo()
    setErrores([])
  }

  const nombreCompleto = `${parte.pd_usuario_nombres || ""} ${parte.pd_usuario_apellidos || ""}`.trim()

  const opcionesLotes = lotes.map((lote) => ({
    value: lote.id.toString(),
    label: lote.nombre,
  }))

  const opcionesCategorias = categoriasExistentes.map((cat) => ({
    value: cat.categoria_animal_id.toString(),
    label: cat.nombre_categoria_animal,
  }))

  const opcionesInsumos = insumosExistentes.map((insumo) => ({
    value: insumo.insumo_id,
    label: insumo.nombre_insumo,
  }))

  // Calcular stock disponible real para mostrar en insumos
  const stockDisponibleRealInsumos = insumoId ? calcularStockDisponibleInsumos(insumoId, editandoInsumo) : 0

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            <Package className="w-6 h-6 text-blue-600" />
            Editar Actividad Mixta (Animales + Insumos)
          </DrawerTitle>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Cargando actividad...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Errores principales */}
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

              {/* Datos Generales */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Datos Generales</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Actividad *</Label>
                    <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900">
                      {parte.pd_detalles?.detalle_tipo || ""}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Detalles con Pestañas */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Detalles *</h3>

                <Tabs defaultValue="animales" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="animales" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Animales ({detallesAnimales.length})
                    </TabsTrigger>
                    <TabsTrigger value="insumos" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Insumos ({detallesInsumos.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="animales" className="space-y-4">
                    <div className="flex justify-end">
                      <Button onClick={() => setMostrarFormAnimales(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar animal
                      </Button>
                    </div>

                    {/* Formulario de animales */}
                    {mostrarFormAnimales && (
                      <div className="bg-gray-50 border rounded-lg p-6">
                        <h4 className="font-medium mb-4">
                          {editandoAnimal !== null ? "Editar Animal" : "Nuevo Animal"}
                        </h4>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <Label>Categoría Animal *</Label>
                              <CustomCombobox
                                options={opcionesCategorias}
                                value={categoriaAnimalId}
                                onValueChange={setCategoriaAnimalId}
                                placeholder={loteId ? "Selecciona categoría..." : "Primero selecciona un lote"}
                                searchPlaceholder="Buscar categoría..."
                                emptyMessage="No se encontraron categorías con stock."
                                disabled={!loteId}
                                loading={loadingCategorias}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Cantidad *</Label>
                              <Input
                                type="number"
                                value={cantidadAnimal}
                                onChange={(e) => setCantidadAnimal(e.target.value)}
                                placeholder="Ej: 10"
                                min="1"
                              />
                            </div>

                            <div>
                              <Label>Peso (kg) *</Label>
                              <Input
                                type="number"
                                value={peso}
                                onChange={(e) => setPeso(e.target.value)}
                                placeholder="Ej: 250"
                                min="1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Tipo de peso</Label>
                            <RadioGroup value={tipoAnimal} onValueChange={setTipoAnimal} className="flex gap-6 mt-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="TOTAL" id="total" />
                                <Label htmlFor="total">Total</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PROMEDIO" id="promedio" />
                                <Label htmlFor="promedio">Promedio</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                          <Button onClick={agregarAnimal} className="bg-green-600 hover:bg-green-700">
                            {editandoAnimal !== null ? "Actualizar" : "Agregar"}
                          </Button>
                          <Button variant="outline" onClick={limpiarFormularioAnimal}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tabla de animales */}
                    <div className="border rounded-lg overflow-hidden overflow-x-auto">
                      <div className="bg-gray-50 border-b">
                        <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-gray-700">
                          <div className="col-span-2">Lote</div>
                          <div className="col-span-3">Categoría</div>
                          <div className="col-span-2 text-center">Cantidad</div>
                          <div className="col-span-2 text-center">Peso</div>
                          <div className="col-span-2 text-center">Tipo</div>
                          <div className="col-span-1 text-center">Acciones</div>
                        </div>
                      </div>

                      <div className="min-h-[100px]">
                        {detallesAnimales.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">No hay animales agregados</div>
                        ) : (
                          <div className="divide-y">
                            {detallesAnimales.map((detalle, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-gray-50 items-center"
                              >
                                <div className="col-span-2 font-medium truncate">{detalle.lote_nombre}</div>
                                <div className="col-span-3 truncate">{detalle.categoria_animal_nombre}</div>
                                <div className="col-span-2 text-center">{detalle.cantidad}</div>
                                <div className="col-span-2 text-center">{detalle.peso} kg</div>
                                <div className="col-span-2 text-center">{detalle.tipo}</div>
                                <div className="col-span-1 flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editarAnimal(index)}
                                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDetallesAnimales(detallesAnimales.filter((_, i) => i !== index))}
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
                  </TabsContent>

                  <TabsContent value="insumos" className="space-y-4">
                    <div className="flex justify-end">
                      <Button onClick={() => setMostrarFormInsumos(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar insumo
                      </Button>
                    </div>

                    {/* Formulario de insumos */}
                    {mostrarFormInsumos && (
                      <div className="bg-gray-50 border rounded-lg p-6">
                        <h4 className="font-medium mb-4">
                          {editandoInsumo !== null ? "Editar Insumo" : "Nuevo Insumo"}
                        </h4>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Insumo *</Label>
                              <CustomCombobox
                                options={opcionesInsumos}
                                value={insumoId}
                                onValueChange={setInsumoId}
                                placeholder="Selecciona insumo..."
                                searchPlaceholder="Buscar insumo..."
                                emptyMessage="No se encontraron insumos disponibles."
                              />
                            </div>

                            <div>
                              <Label>
                                Cantidad *{" "}
                                {insumoId &&
                                  stockDisponibleRealInsumos >= 0 &&
                                  `(Disponible: ${stockDisponibleRealInsumos})`}
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={cantidadInsumo}
                                  onChange={(e) => setCantidadInsumo(e.target.value)}
                                  placeholder="Ej: 5"
                                  min="1"
                                  max={stockDisponibleRealInsumos}
                                  className="flex-1"
                                />
                                {unidadMedidaActual && (
                                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded border min-w-[80px] text-center">
                                    {unidadMedidaActual}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                          <Button onClick={agregarInsumo} className="bg-blue-600 hover:bg-blue-700">
                            {editandoInsumo !== null ? "Actualizar" : "Agregar"}
                          </Button>
                          <Button variant="outline" onClick={limpiarFormularioInsumo}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tabla de insumos */}
                    <div className="border rounded-lg overflow-hidden overflow-x-auto">
                      <div className="bg-gray-50 border-b">
                        <div className="grid grid-cols-10 gap-4 p-4 text-sm font-medium text-gray-700">
                          <div className="col-span-4">Insumo</div>
                          <div className="col-span-2">Cantidad</div>
                          <div className="col-span-2">Unidad Medida</div>
                          <div className="col-span-2 text-center">Acciones</div>
                        </div>
                      </div>

                      <div className="min-h-[100px]">
                        {detallesInsumos.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">No hay insumos agregados</div>
                        ) : (
                          <div className="divide-y">
                            {detallesInsumos.map((detalle, index) => (
                              <div key={index} className="grid grid-cols-10 gap-4 p-4 text-sm hover:bg-gray-50">
                                <div className="col-span-4 font-medium">{detalle.insumo_nombre}</div>
                                <div className="col-span-2">{detalle.cantidad}</div>
                                <div className="col-span-2 text-gray-600">{detalle.unidad_medida}</div>
                                <div className="col-span-2 flex justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editarInsumo(index)}
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDetallesInsumos(detallesInsumos.filter((_, i) => i !== index))}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? "Guardando..." : "Actualizar Actividad"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
