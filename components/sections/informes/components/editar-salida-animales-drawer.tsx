"use client"

import { useState, useEffect, useRef } from "react"
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

interface EditarSalidaAnimalesDrawerProps {
  isOpen: boolean
  onClose: () => void
  parte: ParteDiario
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

interface MovimientoDetalle {
  id: number
  movimiento_animal_id: number
  categoria_animal_id: number
  cantidad: number
  peso: number
  tipo_peso: string
  tipo_movimiento_id: number
  categoria_nombre?: string
  tipo_movimiento_nombre?: string
}

interface MovimientoCompleto {
  id: number
  establecimiento_id: number
  nota: string | null
  fecha: string
  hora: string
  lote_id: number
  user_id: string
  lote_nombre?: string
  detalles: MovimientoDetalle[]
}

export default function EditarSalidaAnimalesDrawer({
  isOpen,
  onClose,
  parte,
  onSuccess,
}: EditarSalidaAnimalesDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
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
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>(undefined)
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | undefined>(undefined)
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

  // Datos del usuario desde la vista
  const { usuario, loading: loadingUsuario } = useUser()

  // Datos del movimiento original
  const [movimientoOriginal, setMovimientoOriginal] = useState<MovimientoCompleto | null>(null)

  // Estado para controlar si estamos en carga inicial
  const cargaInicialRef = useRef(true)

  // Cargar datos del parte diario cuando se abre el drawer
  useEffect(() => {
    if (isOpen && parte && establecimientoSeleccionado && empresaSeleccionada) {
      console.log("🔄 Cargando datos del parte diario para edición:", parte)
      cargarDatosParteDiario()
      cargarLotes()
      cargarTiposMovimiento()
    }
  }, [isOpen, parte, establecimientoSeleccionado, empresaSeleccionada])

  // Limpiar formulario cuando se cierra el drawer
  useEffect(() => {
    if (!isOpen) {
      // Limpiar todos los campos del formulario
      setLoteSeleccionado("")
      setFechaSeleccionada(undefined)
      setHoraSeleccionada(undefined)
      setNota("")
      setDetalles([])
      setMostrarFormDetalle(false)
      setErroresValidacion([])
      setErroresDetalle([])
      setMostrarExito(false)
      setCategoriasExistentes([])
      setMovimientoOriginal(null)
      cargaInicialRef.current = true // Resetear bandera de carga inicial
      setNuevoDetalle({
        tipo_movimiento_id: "",
        categoria_id: "",
        cantidad: 0,
        peso: 0,
        tipo_peso: "TOTAL",
      })
      console.log("Formulario limpiado al cerrar el drawer")
    }
  }, [isOpen])

  // Efecto para cargar categorías cuando cambia el lote seleccionado
  useEffect(() => {
    if (loteSeleccionado) {
      console.log("🔄 Lote seleccionado cambió a:", loteSeleccionado)
      console.log("🔍 Carga inicial:", cargaInicialRef.current)

      // Solo limpiar detalles si NO estamos en carga inicial
      if (!cargaInicialRef.current) {
        // Limpiar detalles existentes y selector de categoría
        if (detalles.length > 0) {
          console.log("🧹 Limpiando detalles existentes debido al cambio manual de lote")
          setDetalles([])
        }

        // Limpiar categoría seleccionada en el formulario de detalle
        if (nuevoDetalle.categoria_id) {
          console.log("🧹 Limpiando categoría seleccionada en el formulario")
          setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
        }
      } else {
        console.log("🔄 Carga inicial - no se limpian los detalles")
      }

      cargarCategoriasExistentes()
    } else {
      // Si no hay lote seleccionado, limpiar categorías
      setCategoriasExistentes([])
      setNuevoDetalle((prev) => ({ ...prev, categoria_id: "" }))
    }
  }, [loteSeleccionado])

  // Efecto para mapear IDs cuando se cargan tipos de movimiento y categorías
  useEffect(() => {
    if (tiposMovimiento.length > 0 && categoriasExistentes.length > 0 && detalles.length > 0) {
      console.log("🔄 INICIANDO MAPEO DE IDs")
      console.log(
        "📋 Tipos disponibles:",
        tiposMovimiento.map((t) => ({ id: t.id, nombre: t.nombre })),
      )
      console.log(
        "📋 Categorías disponibles:",
        categoriasExistentes.map((c) => ({ id: c.categoria_animal_id, nombre: c.nombre_categoria_animal })),
      )
      console.log(
        "📋 Detalles a mapear:",
        detalles.map((d) => ({
          id: d.id,
          tipo_nombre: d.tipo_movimiento_nombre,
          categoria_nombre: d.categoria_nombre,
          tipo_id_actual: d.tipo_movimiento_id,
          categoria_id_actual: d.categoria_id,
        })),
      )

      const detallesActualizados = detalles.map((detalle, index) => {
        console.log(`🔍 PROCESANDO DETALLE ${index + 1}:`)
        console.log(`   Tipo original: "${detalle.tipo_movimiento_nombre}"`)
        console.log(`   Categoría original: "${detalle.categoria_nombre}"`)

        // Buscar tipo de movimiento
        const tipoMovimiento = tiposMovimiento.find((tipo) => {
          const tipoNorm = tipo.nombre.toLowerCase().trim()
          const detalleNorm = detalle.tipo_movimiento_nombre.toLowerCase().trim()
          const coincide = tipoNorm === detalleNorm || tipoNorm.includes(detalleNorm) || detalleNorm.includes(tipoNorm)
          if (coincide) {
            console.log(`   ✅ Tipo encontrado: "${tipo.nombre}" (ID: ${tipo.id})`)
          }
          return coincide
        })

        // Buscar categoría
        const categoria = categoriasExistentes.find((cat) => {
          const catNorm = cat.nombre_categoria_animal.toLowerCase().trim()
          const detalleNorm = detalle.categoria_nombre.toLowerCase().trim()
          const coincide = catNorm === detalleNorm || catNorm.includes(detalleNorm) || detalleNorm.includes(catNorm)
          if (coincide) {
            console.log(`   ✅ Categoría encontrada: "${cat.nombre_categoria_animal}" (ID: ${cat.categoria_animal_id})`)
          }
          return coincide
        })

        if (!tipoMovimiento) {
          console.log(`   ❌ Tipo NO encontrado para: "${detalle.tipo_movimiento_nombre}"`)
          console.log(
            `   📝 Tipos disponibles:`,
            tiposMovimiento.map((t) => t.nombre),
          )
        }

        if (!categoria) {
          console.log(`   ❌ Categoría NO encontrada para: "${detalle.categoria_nombre}"`)
          console.log(
            `   📝 Categorías disponibles:`,
            categoriasExistentes.map((c) => c.nombre_categoria_animal),
          )
        }

        const detalleActualizado = {
          ...detalle,
          tipo_movimiento_id: tipoMovimiento?.id || detalle.tipo_movimiento_id || "",
          categoria_id: categoria?.categoria_animal_id || detalle.categoria_id || "",
        }

        console.log(`   📤 Resultado final:`)
        console.log(`      tipo_movimiento_id: "${detalleActualizado.tipo_movimiento_id}"`)
        console.log(`      categoria_id: "${detalleActualizado.categoria_id}"`)

        return detalleActualizado
      })

      console.log("✅ MAPEO COMPLETADO")
      console.log(
        "📋 Detalles finales:",
        detallesActualizados.map((d) => ({
          id: d.id,
          tipo_id: d.tipo_movimiento_id,
          categoria_id: d.categoria_id,
          tipo_nombre: d.tipo_movimiento_nombre,
          categoria_nombre: d.categoria_nombre,
        })),
      )

      setDetalles(detallesActualizados)
    }
  }, [tiposMovimiento, categoriasExistentes])

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

              // Marcar que la carga inicial ha terminado después de un breve delay
              setTimeout(() => {
                cargaInicialRef.current = false
                console.log("✅ Carga inicial completada")
              }, 100)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error cargando lotes:", error)
      toast({
        title: "Error cargando lotes",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
      setLotes([
        { id: "1", nombre: "Lote A" },
        { id: "2", nombre: "Lote B" },
        { id: "3", nombre: "Lote C" },
      ])
      // También marcar fin de carga inicial en caso de error
      setTimeout(() => {
        cargaInicialRef.current = false
        console.log("✅ Carga inicial completada (con error)")
      }, 100)
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

      // Intentar primera API
      let response = await fetch(`/api/categorias-animales-existentes?lote_id=${loteSeleccionado}`)
      let data

      if (!response.ok) {
        console.log("⚠️ Primera API falló, intentando API alternativa...")

        // Intentar API alternativa
        response = await fetch(`/api/lote-stock-categoria?lote_id=${loteSeleccionado}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        data = await response.json()
        console.log("✅ Datos obtenidos de API alternativa:", data)
      } else {
        data = await response.json()
        console.log("✅ Datos obtenidos de API principal:", data)
      }

      console.log("📋 CATEGORÍAS EXISTENTES DETALLADAS:")
      if (data.categorias && data.categorias.length > 0) {
        data.categorias.forEach((cat: any, index: number) => {
          console.log(
            `  ${index + 1}. ID: ${cat.categoria_animal_id} | Nombre: ${cat.nombre_categoria_animal} | Stock: ${cat.cantidad} | Sexo: ${cat.sexo || "N/A"} | Edad: ${cat.edad || "N/A"}`,
          )
        })
      } else {
        console.log("❌ No se encontraron categorías existentes para el lote")
      }

      // Mostrar información adicional si está disponible
      if (data.fallback) {
        console.log("⚠️ Se están usando datos de fallback")
        toast({
          title: "Usando datos de prueba",
          description: "No se pudieron cargar las categorías reales. Se muestran datos de ejemplo.",
          variant: "default",
        })
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
      const fallbackData = [
        { categoria_animal_id: "1", nombre_categoria_animal: "Terneros", lote_id: loteSeleccionado, cantidad: 10 },
        { categoria_animal_id: "2", nombre_categoria_animal: "Vaquillonas", lote_id: loteSeleccionado, cantidad: 5 },
      ]

      console.log("🔄 Usando datos de fallback locales:", fallbackData)
      setCategoriasExistentes(fallbackData)
    } finally {
      setLoadingCategorias(false)
    }
  }

  const cargarTiposMovimiento = async () => {
    if (!empresaSeleccionada) return

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
      ])
    } finally {
      setLoadingTipos(false)
    }
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

    if (!nuevoDetalle.peso || nuevoDetalle.peso <= 0) {
      errores.push("El peso debe ser mayor a 0")
    }

    // NUEVA VALIDACIÓN DE STOCK PARA EDICIÓN
    if (nuevoDetalle.categoria_id && nuevoDetalle.cantidad > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK PARA EDICIÓN")
      console.log("   Categoría seleccionada ID:", nuevoDetalle.categoria_id)
      console.log("   Cantidad solicitada:", nuevoDetalle.cantidad)
      console.log("   Editando detalle:", editandoDetalle?.id)

      const categoriaSeleccionada = categoriasExistentes.find(
        (c) => c.categoria_animal_id === nuevoDetalle.categoria_id,
      )

      console.log("   Categoría encontrada:", categoriaSeleccionada)

      if (categoriaSeleccionada) {
        // Calcular cantidad ya utilizada en otros detalles de la misma categoría
        const cantidadYaUtilizada = detalles
          .filter((d) => d.categoria_id === nuevoDetalle.categoria_id && d.id !== editandoDetalle?.id)
          .reduce((sum, d) => sum + d.cantidad, 0)

        // Si estamos editando, considerar la cantidad original
        let cantidadOriginal = 0
        if (editandoDetalle && editandoDetalle.categoria_id === nuevoDetalle.categoria_id) {
          cantidadOriginal = editandoDetalle.cantidad
          console.log(`📝 Editando detalle existente. Cantidad original: ${cantidadOriginal}`)
        }

        // El stock disponible incluye la cantidad original si estamos editando la misma categoría
        const stockDisponible = Number(categoriaSeleccionada.cantidad) - cantidadYaUtilizada + cantidadOriginal

        console.log(`📊 Validación de stock para ${categoriaSeleccionada.nombre_categoria_animal}:`)
        console.log(
          `   Stock total: ${categoriaSeleccionada.cantidad} (tipo: ${typeof categoriaSeleccionada.cantidad})`,
        )
        console.log(`   Ya utilizado en otros detalles: ${cantidadYaUtilizada}`)
        console.log(`   Cantidad original (si editando): ${cantidadOriginal}`)
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

    console.log("✅ Validación de detalle exitosa, procesando...")
    setErroresDetalle([])

    const tipoMov = tiposMovimiento.find((t) => t.id === nuevoDetalle.tipo_movimiento_id)
    const categoria = categoriasExistentes.find((c) => c.categoria_animal_id === nuevoDetalle.categoria_id)

    if (editandoDetalle) {
      // Actualizar detalle existente
      console.log("🔄 Actualizando detalle existente:", editandoDetalle.id)
      const detallesActualizados = detalles.map((detalle) =>
        detalle.id === editandoDetalle.id
          ? {
              ...detalle,
              tipo_movimiento_id: nuevoDetalle.tipo_movimiento_id,
              tipo_movimiento_nombre: tipoMov?.nombre || "",
              categoria_id: nuevoDetalle.categoria_id,
              categoria_nombre: categoria?.nombre_categoria_animal || "",
              cantidad: nuevoDetalle.cantidad,
              peso: nuevoDetalle.peso,
              tipo_peso: nuevoDetalle.tipo_peso,
            }
          : detalle,
      )
      setDetalles(detallesActualizados)
      setEditandoDetalle(null)
      console.log("✅ Detalle actualizado exitosamente")
    } else {
      // Agregar nuevo detalle
      console.log("➕ Agregando nuevo detalle...")
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
      console.log("✅ Nuevo detalle agregado exitosamente")
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
    console.log("✏️ Iniciando edición de detalle:", detalle)
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
    console.log("🔍 Iniciando validación completa del formulario...")
    console.log("🔍 Estado del usuario:", { usuario, loading: loadingUsuario })

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

    // Validar cada detalle individualmente
    detalles.forEach((detalle, index) => {
      const numeroDetalle = index + 1

      console.log(`🔍 Validando detalle ${numeroDetalle}:`, {
        tipo_movimiento_id: detalle.tipo_movimiento_id,
        categoria_id: detalle.categoria_id,
        cantidad: detalle.cantidad,
        peso: detalle.peso,
      })

      if (!detalle.tipo_movimiento_id) {
        console.log(`❌ Detalle ${numeroDetalle}: tipo_movimiento_id vacío`)
        errores.push(`Detalle ${numeroDetalle}: Falta seleccionar el tipo de movimiento`)
      }

      if (!detalle.categoria_id) {
        console.log(`❌ Detalle ${numeroDetalle}: categoria_id vacío`)
        errores.push(`Detalle ${numeroDetalle}: Falta seleccionar la categoría`)
      }

      if (!detalle.cantidad || detalle.cantidad <= 0) {
        console.log(`❌ Detalle ${numeroDetalle}: cantidad inválida (${detalle.cantidad})`)
        errores.push(`Detalle ${numeroDetalle}: La cantidad debe ser mayor a 0`)
      }

      if (!detalle.peso || detalle.peso <= 0) {
        console.log(`❌ Detalle ${numeroDetalle}: peso inválido (${detalle.peso})`)
        errores.push(`Detalle ${numeroDetalle}: El peso debe ser mayor a 0`)
      }
    })

    // Validar datos del sistema con más detalle
    if (!usuario) {
      errores.push("Error del sistema: No se pudo cargar la información del usuario")
    } else if (!usuario.id) {
      errores.push("Error del sistema: No se pudo obtener el ID del usuario")
    }

    if (!establecimientoSeleccionado) {
      errores.push("Error del sistema: No se pudo obtener el ID del establecimiento")
    }

    if (!parte?.pd_id) {
      errores.push("Error del sistema: No se pudo obtener el ID del parte diario")
    }

    console.log("Errores encontrados en formulario completo:", errores)
    return errores
  }

  const guardar = async () => {
    console.log("🚀 INICIANDO ACTUALIZACIÓN DE SALIDA DE ANIMALES...")

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

    console.log("✅ Validación exitosa, procediendo a actualizar...")
    setErroresValidacion([])

    setLoading(true)
    try {
      console.log("📦 Preparando datos para actualizar...")

      // Convertir fecha a formato string
      const fechaString = fechaSeleccionada?.toISOString().split("T")[0] || ""

      const datosMovimiento = {
        id: parte!.pd_id,
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
        method: "PUT",
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
      console.log("🎉 MOVIMIENTO ACTUALIZADO EXITOSAMENTE:", result)

      // Mostrar mensaje de éxito visual
      setMostrarExito(true)

      // Toast más elaborado después de un momento
      setTimeout(() => {
        console.log("📢 Mostrando toast detallado...")
        toast({
          title: "✅ Parte Diario Actualizado",
          description: `Se actualizaron ${detalles.length} detalles con ${detalles.reduce((sum, d) => sum + d.cantidad, 0)} animales`,
          duration: 4000,
        })
      }, 500)

      // Disparar evento para recargar partes diarios
      console.log("🔄 Disparando evento reloadPartesDiarios...")
      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      console.log("✅ Evento reloadPartesDiarios disparado")

      // Cerrar drawer después de mostrar éxito
      setTimeout(() => {
        console.log("🚪 Cerrando drawer...")
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error("💥 ERROR ACTUALIZANDO MOVIMIENTO:", error)
      toast({
        title: "Error",
        description: `No se pudo actualizar la salida de animales: ${error instanceof Error ? error.message : "Error desconocido"}`,
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

  if (loadingData) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="h-full w-[850px] ml-auto">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle className="text-xl font-bold text-gray-900">Editar Salida de Animales</DrawerTitle>
            <button onClick={cancelar} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DrawerHeader>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos del movimiento...</p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[850px] ml-auto">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-xl font-bold text-gray-900">Editar Salida de Animales</DrawerTitle>
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
                <div className="font-medium text-green-800 mb-2">¡Salida actualizada exitosamente!</div>
                <div className="text-sm text-green-700">
                  Se actualizaron {detalles.length} detalles con {detalles.reduce((sum, d) => sum + d.cantidad, 0)}{" "}
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

            {/* Mostrar errores de validación de detalle */}
            {erroresDetalle.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Errores en el detalle:</div>
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

            {/* Formulario de detalle */}
            {mostrarFormDetalle && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{editandoDetalle ? "Editar Detalle" : "Nuevo Detalle"}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMostrarFormDetalle(false)
                      setEditandoDetalle(null)
                      setNuevoDetalle({
                        tipo_movimiento_id: "",
                        categoria_id: "",
                        cantidad: 0,
                        peso: 0,
                        tipo_peso: "TOTAL",
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Movimiento *</Label>
                    <div className="mt-1">
                      <CustomCombobox
                        options={opcionesTiposMovimiento}
                        value={nuevoDetalle.tipo_movimiento_id}
                        onValueChange={(value) => setNuevoDetalle((prev) => ({ ...prev, tipo_movimiento_id: value }))}
                        placeholder="Selecciona un tipo..."
                        searchPlaceholder="Buscar tipo..."
                        emptyMessage="No se encontraron tipos."
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
                        onValueChange={(value) => setNuevoDetalle((prev) => ({ ...prev, categoria_id: value }))}
                        placeholder="Selecciona una categoría..."
                        searchPlaceholder="Buscar categoría..."
                        emptyMessage="No se encontraron categorías."
                        loading={loadingCategorias}
                        disabled={loadingCategorias || !loteSeleccionado}
                      />
                    </div>
                    {loadingCategorias && (
                      <p className="text-xs text-gray-500 mt-1">Cargando categorías existentes...</p>
                    )}
                    {!loadingCategorias && categoriasExistentes.length === 0 && loteSeleccionado && (
                      <p className="text-xs text-amber-600 mt-1">No hay categorías con stock en el lote seleccionado</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cantidad *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={nuevoDetalle.cantidad || ""}
                      onChange={(e) =>
                        setNuevoDetalle((prev) => ({ ...prev, cantidad: Number.parseInt(e.target.value) || 0 }))
                      }
                      placeholder="0"
                      className="mt-1"
                    />
                    {nuevoDetalle.categoria_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Stock disponible:{" "}
                        {categoriasExistentes.find((c) => c.categoria_animal_id === nuevoDetalle.categoria_id)
                          ?.cantidad || 0}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Peso *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={nuevoDetalle.peso || ""}
                      onChange={(e) =>
                        setNuevoDetalle((prev) => ({ ...prev, peso: Number.parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0.0"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Peso *</Label>
                    <div className="mt-1">
                      <RadioGroup
                        value={nuevoDetalle.tipo_peso}
                        onValueChange={(value) =>
                          setNuevoDetalle((prev) => ({ ...prev, tipo_peso: value as "TOTAL" | "PROMEDIO" }))
                        }
                        className="flex space-x-4"
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
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMostrarFormDetalle(false)
                      setEditandoDetalle(null)
                      setNuevoDetalle({
                        tipo_movimiento_id: "",
                        categoria_id: "",
                        cantidad: 0,
                        peso: 0,
                        tipo_peso: "TOTAL",
                      })
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={agregarDetalle} className="bg-red-600 hover:bg-red-700">
                    {editandoDetalle ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de detalles */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-900">Tipo de movimiento</TableHead>
                    <TableHead className="font-medium text-gray-900">Categoría Animal</TableHead>
                    <TableHead className="font-medium text-gray-900">Cantidad</TableHead>
                    <TableHead className="font-medium text-gray-900">Peso</TableHead>
                    <TableHead className="font-medium text-gray-900">Tipo</TableHead>
                    <TableHead className="font-medium text-gray-900">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No hay detalles agregados
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((detalle) => (
                      <TableRow key={detalle.id}>
                        <TableCell className="font-medium">{detalle.tipo_movimiento_nombre}</TableCell>
                        <TableCell>{detalle.categoria_nombre}</TableCell>
                        <TableCell>{detalle.cantidad}</TableCell>
                        <TableCell>{detalle.peso} kg</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              detalle.tipo_peso === "TOTAL"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {detalle.tipo_peso}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editarDetalle(detalle)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarDetalle(detalle.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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

            {detalles.length > 0 && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-1">Resumen:</div>
                <div>Total de animales: {detalles.reduce((sum, d) => sum + d.cantidad, 0)}</div>
                <div>Peso total: {detalles.reduce((sum, d) => sum + d.peso, 0)} kg</div>
              </div>
            )}
          </div>

          {/* Nota */}
          <div>
            <Label htmlFor="nota" className="text-sm font-medium text-gray-700">
              Nota
            </Label>
            <Textarea
              id="nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Observaciones adicionales..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Footer con botones */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={cancelar} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                "Actualizar"
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
