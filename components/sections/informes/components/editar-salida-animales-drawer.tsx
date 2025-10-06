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
  es_original: boolean // Nueva propiedad para distinguir detalles originales
  cantidad_original: number // Nueva propiedad para guardar cantidad original
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

interface UsuarioPerfil {
  id: string
  nombres: string
  apellidos: string
  email: string
  phone?: string
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

  // Usar el contexto de usuario
  const { usuario, loading: loadingUsuario } = useUser()

  // Datos del movimiento original
  const [movimientoOriginal, setMovimientoOriginal] = useState<MovimientoCompleto | null>(null)

  // Estado para controlar si estamos en carga inicial
  const cargaInicialRef = useRef(true)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Función para calcular stock disponible
  const calcularStockDisponible = (categoriaId: string): number => {
    console.log("🧮 CALCULANDO STOCK DISPONIBLE PARA ANIMALES")
    console.log("   Categoría ID:", categoriaId)
    console.log("   Editando detalle:", editandoDetalle?.id)

    // Obtener la categoría seleccionada
    const categoria = categoriasExistentes.find((c) => c.categoria_animal_id === categoriaId)
    if (!categoria) {
      console.log("❌ Categoría no encontrada")
      return 0
    }

    console.log(`   Stock base de ${categoria.nombre_categoria_animal}: ${categoria.cantidad}`)
    const stockBase = Number(categoria.cantidad)

    // CASO 1: Editando una línea original
    if (editandoDetalle && editandoDetalle.es_original && editandoDetalle.categoria_id === categoriaId) {
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
        if (typeof parte.pd_detalles === "string") {
          return JSON.parse(parte.pd_detalles)
        }
        return parte.pd_detalles || []
      } catch {
        return []
      }
    }

    const detallesOriginalesIniciales = parseDetalles()

    // Calcular cuánto se había descontado originalmente para esta categoría
    let cantidadOriginalTotalDescontada = 0
    if (Array.isArray(detallesOriginalesIniciales)) {
      detallesOriginalesIniciales.forEach((detalle: any) => {
        const categoriaDetalle = categoriasExistentes.find(
          (c) =>
            c.nombre_categoria_animal.toLowerCase().trim() ===
            (detalle.detalle_categoria_animal || "").toLowerCase().trim(),
        )
        if (categoriaDetalle && categoriaDetalle.categoria_animal_id === categoriaId) {
          cantidadOriginalTotalDescontada += detalle.detalle_cantidad || 0
          console.log(`   Cantidad original descontada: ${detalle.detalle_cantidad}`)
        }
      })
    }

    console.log(`   Total cantidad original descontada: ${cantidadOriginalTotalDescontada}`)

    // Calcular cuánto de esa cantidad original aún está presente en los detalles actuales
    let cantidadOriginalAunPresente = 0
    detalles.forEach((detalle) => {
      if (detalle.categoria_id === categoriaId && detalle.es_original) {
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
      if (detalle.categoria_id === categoriaId && !detalle.es_original && detalle.id !== editandoDetalle?.id) {
        cantidadUsadaPorNuevos += detalle.cantidad
        console.log(`   - Cantidad usada por detalle nuevo ${detalle.id}: ${detalle.cantidad}`)
      }
    })

    console.log(`   Total cantidad usada por nuevos: ${cantidadUsadaPorNuevos}`)

    const stockFinal = stockAjustado - cantidadUsadaPorNuevos
    console.log(`   = Stock disponible final: ${stockFinal}`)

    return Math.max(0, stockFinal)
  }

  // Función para limpiar el formulario de detalle
  const [loteId, setLoteId] = useState("")
  const [categoriaId, setCategoriaId] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [peso, setPeso] = useState("")
  const [tipoPeso, setTipoPeso] = useState<"TOTAL" | "PROMEDIO">("TOTAL")

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

  // Obtener establecimiento_id y empresa_id actual del localStorage
  useEffect(() => {
    // Obtener establecimiento_id
    // const establecimientoGuardado = localStorage.getItem("establecimiento_seleccionado")
    // if (establecimientoGuardado) {
    //   setEstablecimientoId(establecimientoGuardado)
    //   console.log("Establecimiento obtenido del localStorage:", establecimientoGuardado)
    // } else {
    //   setEstablecimientoId("2")
    //   console.log("No se encontró establecimiento en localStorage, usando valor por defecto: 2")
    // }
    // // Obtener empresa_id
    // const empresaGuardada = localStorage.getItem("empresa_seleccionada")
    // if (empresaGuardada) {
    //   setEmpresaId(empresaGuardada)
    //   console.log("Empresa obtenida del localStorage:", empresaGuardada)
    // } else {
    //   setEmpresaId("1")
    //   console.log("No se encontró empresa en localStorage, usando valor por defecto: 1")
    // }
    // // Escuchar eventos de cambio
    // const handleEstablishmentChange = (event: CustomEvent) => {
    //   const nuevoEstablecimientoId = event.detail?.establecimientoId
    //   if (nuevoEstablecimientoId) {
    //     console.log("Evento de cambio de establecimiento detectado:", nuevoEstablecimientoId)
    //     setEstablecimientoId(nuevoEstablecimientoId)
    //   }
    // }
    // const handleCompanyChange = (event: CustomEvent) => {
    //   const nuevaEmpresaId = event.detail?.empresaId
    //   if (nuevaEmpresaId) {
    //     console.log("Evento de cambio de empresa detectado:", nuevaEmpresaId)
    //     setEmpresaId(nuevaEmpresaId)
    //   }
    // }
    // window.addEventListener("establishmentChange", handleEstablishmentChange as EventListener)
    // window.addEventListener("companyChange", handleCompanyChange as EventListener)
    // return () => {
    //   window.removeEventListener("establishmentChange", handleEstablishmentChange as EventListener)
    //   window.removeEventListener("companyChange", handleCompanyChange as EventListener)
    // }
  }, [])

  // Cargar perfil del usuario
  // Eliminar el useEffect de cargar perfil del usuario.

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
      limpiarFormularioDetalle() // Usar la función de limpieza
      // console.log("Formulario limpiado al cerrar el drawer")
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
      console.log("🔄 INICIANDO MAPEO DE IDs PARA ANIMALES")
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
          es_original: d.es_original,
        })),
      )

      const detallesActualizados = detalles.map((detalle, index) => {
        console.log(`\n🔍 PROCESANDO DETALLE ${index + 1}:`)
        console.log(`   Tipo original: "${detalle.tipo_movimiento_nombre}"`)
        console.log(`   Categoría original: "${detalle.categoria_nombre}"`)
        console.log(`   Es original: ${detalle.es_original}`)

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
        }

        if (!categoria) {
          console.log(`   ❌ Categoría NO encontrada para: "${detalle.categoria_nombre}"`)
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

      console.log("\n✅ MAPEO COMPLETADO PARA ANIMALES")
      setDetalles(detallesActualizados)
    }
  }, [tiposMovimiento, categoriasExistentes])

  // Efecto para esperar a que el usuario se cargue antes de permitir acciones
  useEffect(() => {
    if (isOpen && !loadingUsuario && !usuario) {
      console.log("⚠️ Drawer abierto pero no hay usuario disponible")
      toast({
        title: "Error de usuario",
        description: "No se pudo cargar la información del usuario. Intente cerrar y abrir nuevamente.",
        variant: "destructive",
      })
    }
  }, [isOpen, loadingUsuario, usuario])

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
          es_original: true, // Marcar como original
          cantidad_original: detalle.detalle_cantidad || 0, // Guardar cantidad original
        }))

        console.log(
          "📋 Detalles formateados con flags:",
          detallesFormateados.map((d) => ({
            id: d.id,
            categoria: d.categoria_nombre,
            cantidad: d.cantidad,
            es_original: d.es_original,
            cantidad_original: d.cantidad_original,
          })),
        )

        setDetalles(detallesFormateados)

        // Obtener el lote del primer detalle
        if (detallesOriginales[0]?.detalle_lote) {
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
      console.log("Cargando categorías existentes para lote_id:", loteSeleccionado)
      const response = await fetch(`/api/categorias-animales-existentes?lote_id=${loteSeleccionado}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Datos de categorías existentes recibidos:", data)

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
      console.error("Error cargando categorías existentes:", error)
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
    console.log("🔍 Iniciando validación de detalle de animales...")
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

    // VALIDACIÓN DE STOCK PARA ANIMALES
    if (nuevoDetalle.categoria_id && nuevoDetalle.cantidad > 0) {
      console.log("🔍 INICIANDO VALIDACIÓN DE STOCK PARA ANIMALES")
      console.log("   Categoría seleccionada ID:", nuevoDetalle.categoria_id)
      console.log("   Cantidad solicitada:", nuevoDetalle.cantidad)
      console.log("   Editando detalle:", editandoDetalle?.id)

      const stockDisponible = calcularStockDisponible(nuevoDetalle.categoria_id)
      const categoriaSeleccionada = categoriasExistentes.find(
        (c) => c.categoria_animal_id === nuevoDetalle.categoria_id,
      )

      console.log(`📊 Validación de stock para ${categoriaSeleccionada?.nombre_categoria_animal}:`)
      console.log(`   Stock disponible calculado: ${stockDisponible}`)
      console.log(`   Cantidad solicitada: ${nuevoDetalle.cantidad}`)
      console.log(`   ¿Supera el stock?: ${nuevoDetalle.cantidad > stockDisponible}`)

      if (nuevoDetalle.cantidad > stockDisponible) {
        const errorMsg =
          `Stock insuficiente para ${categoriaSeleccionada?.nombre_categoria_animal}. ` +
          `Disponible: ${stockDisponible}, solicitado: ${nuevoDetalle.cantidad}`
        console.log("❌ ERROR DE STOCK:", errorMsg)
        errores.push(errorMsg)
      } else {
        console.log("✅ Stock suficiente")
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
              // Mantener es_original y cantidad_original
            }
          : detalle,
      )
      setDetalles(detallesActualizados)
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
        es_original: false, // Marcar como nuevo
        cantidad_original: 0, // No tiene cantidad original
      }
      setDetalles([...detalles, detalle])
      console.log("✅ Nuevo detalle agregado exitosamente")
    }

    // Limpiar formulario y cerrar
    limpiarFormularioDetalle()
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

  const cancelarFormularioDetalle = () => {
    console.log("❌ Cancelando formulario de detalle...")
    limpiarFormularioDetalle()
    setMostrarFormDetalle(false)
    console.log("✅ Formulario de detalle cancelado y limpiado")
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

      // Validación de peso para detalles que no son de Mortandad
      const tipoMovimientoId = Number.parseInt(detalle.tipo_movimiento_id)
      const esMortandad = tipoMovimientoId === 8 // Asumiendo que 8 es el ID de Mortandad
      if (!esMortandad && (!detalle.peso || detalle.peso <= 0)) {
        console.log(`❌ Detalle ${numeroDetalle}: peso inválido (${detalle.peso})`)
        errores.push(`Detalle ${numeroDetalle}: El peso debe ser mayor a 0 (excepto para Mortandad)`)
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

  const eliminarParteDiario = async () => {
    if (!parte || !usuario?.id) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/movimientos-animales/${parte.pd_id}`, {
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

      if (!response.ok) {
        throw new Error("Error al eliminar el parte diario")
      }

      toast({
        title: "Parte Diario Eliminado",
        description: "El parte diario ha sido eliminado correctamente",
      })

      window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error("Error eliminando parte diario:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el parte diario",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const puedeEliminar = () => {
    if (!parte) return false

    try {
      let detalles
      if (typeof parte.pd_detalles === "string") {
        detalles = JSON.parse(parte.pd_detalles)
      } else {
        detalles = parte.pd_detalles
      }

      // Si es un array, tomar el primer elemento y buscar detalle_deleteable
      if (Array.isArray(detalles) && detalles.length > 0) {
        return detalles[0].detalle_deleteable === true
      }

      // Si es un objeto directo, buscar detalle_deleteable
      return detalles?.detalle_deleteable === true
    } catch {
      return false
    }
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
                          (Stock disponible: {calcularStockDisponible(nuevoDetalle.categoria_id)})
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
                  <Button onClick={cancelarFormularioDetalle} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/*Tabla de detalles */}
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
                <span className="text-xs text-gray-500 mt-1">Este parte diario no puede ser eliminado</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={cancelar} variant="outline">
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">¿Seguro que quiere eliminar el Parte Diario?</p>
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowDeleteConfirm(false)} variant="outline">
                  No
                </Button>
                <Button onClick={eliminarParteDiario} variant="destructive" disabled={deleting}>
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
