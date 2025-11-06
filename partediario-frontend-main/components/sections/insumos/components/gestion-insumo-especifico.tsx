"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarIcon,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  BarChart3,
  Activity,
  Building2,
  Tractor,
  Info,
  ChevronDown,
  ChevronUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { FormularioNuevoMovimiento } from "./formulario-nuevo-movimiento"
import { FiltroSelectorInsumos } from "./filtro-selector-insumos"
import { ConfiguracionInsumos } from "./configuracion-insumos"
import { categoriasConfig } from "@/lib/data"

interface Insumo {
  id: string
  nombre: string
  clase: string
  tipoInsumo: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number
  unidad: string
  precio?: number
  proveedor: string
  ubicacion: string
  estado: "normal" | "bajo" | "critico"
  icono: string
  categoria: string
  tipo: string
}

interface Destino {
  id: string
  nombre: string
  tipo: "tractor" | "lote" | "potrero" | "deposito" | "instalacion"
  icono: string
}

interface FiltrosAvanzados {
  fechaDesde?: Date
  fechaHasta?: Date
  insumoEspecifico?: string
  usuarioEspecifico?: string
  destinoEspecifico?: string
  claseInsumo?: string
  tipo?: string
  subtipo?: string
  tipoMovimiento: string[]
  almacenOrigen?: string
  valorMin?: number
  valorMax?: number
}

interface GestionInsumoEspecificoProps {
  categoria: string
  categoriaNombre: string
  categoriaEmoji: string
  onCategoriaChange?: (nuevaCategoria: string) => void
}

// Datos de ejemplo para movimientos
const movimientosEjemplo = [
  {
    id: 1,
    fecha: "2024-01-15",
    tipo: "Entrada",
    cantidad: 500,
    unidad: "L",
    destino: "Depósito Central",
    usuario: "Juan Pérez",
    precio: 850,
    observaciones: "Compra mensual",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 425000,
  },
  {
    id: 2,
    fecha: "2024-01-18",
    tipo: "Salida",
    cantidad: 120,
    unidad: "L",
    destino: "Tractor JD 6110",
    usuario: "Carlos López",
    precio: 850,
    observaciones: "Carga de combustible para siembra",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 102000,
  },
  {
    id: 3,
    fecha: "2024-01-20",
    tipo: "Salida",
    cantidad: 80,
    unidad: "L",
    destino: "Cosechadora Case",
    usuario: "Ana Martín",
    precio: 850,
    observaciones: "Mantenimiento preventivo",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 68000,
  },
  {
    id: 4,
    fecha: "2024-01-22",
    tipo: "Entrada",
    cantidad: 300,
    unidad: "L",
    destino: "Depósito Central",
    usuario: "María González",
    precio: 870,
    observaciones: "Reposición de stock",
    proveedor: "YPF",
    insumoId: "gasoil-premium",
    insumoNombre: "Gasoil Premium",
    clase: "combustibles",
    valorTotal: 261000,
  },
  {
    id: 5,
    fecha: "2024-01-25",
    tipo: "Salida",
    cantidad: 150,
    unidad: "L",
    destino: "Pulverizadora Apache",
    usuario: "Roberto Silva",
    precio: 870,
    observaciones: "Aplicación de herbicidas",
    proveedor: "YPF",
    insumoId: "gasoil-premium",
    insumoNombre: "Gasoil Premium",
    clase: "combustibles",
    valorTotal: 130500,
  },
  {
    id: 6,
    fecha: "2024-01-26",
    tipo: "Salida",
    cantidad: 25,
    unidad: "dosis",
    destino: "Corral Norte",
    usuario: "Pedro Ruiz",
    precio: 1200,
    observaciones: "Vacunación del ganado",
    proveedor: "Biogénesis Bagó",
    insumoId: "vacuna-aftosa",
    insumoNombre: "Vacuna Aftosa",
    clase: "veterinarios",
    valorTotal: 30000,
  },
  {
    id: 7,
    fecha: "2024-01-28",
    tipo: "Entrada",
    cantidad: 100,
    unidad: "dosis",
    destino: "Heladera Veterinaria",
    usuario: "María González",
    precio: 1200,
    observaciones: "Reposición de vacunas",
    proveedor: "Biogénesis Bagó",
    insumoId: "vacuna-aftosa",
    insumoNombre: "Vacuna Aftosa",
    clase: "veterinarios",
    valorTotal: 120000,
  },
  {
    id: 8,
    fecha: "2024-01-30",
    tipo: "Salida",
    cantidad: 50,
    unidad: "kg",
    destino: "Lote Norte",
    usuario: "Carlos López",
    precio: 2500,
    observaciones: "Aplicación de herbicida",
    proveedor: "Bayer",
    insumoId: "glifosato",
    insumoNombre: "Glifosato",
    clase: "agroquimicos",
    valorTotal: 125000,
  },
  {
    id: 9,
    fecha: "2024-02-01",
    tipo: "Entrada",
    cantidad: 200,
    unidad: "kg",
    destino: "Depósito Agroquímicos",
    usuario: "Ana Martín",
    precio: 2500,
    observaciones: "Compra para temporada",
    proveedor: "Bayer",
    insumoId: "glifosato",
    insumoNombre: "Glifosato",
    clase: "agroquimicos",
    valorTotal: 500000,
  },
  {
    id: 10,
    fecha: "2024-02-03",
    tipo: "Salida",
    cantidad: 500,
    unidad: "kg",
    destino: "Lote Sur",
    usuario: "Roberto Silva",
    precio: 1800,
    observaciones: "Fertilización de base",
    proveedor: "Profertil",
    insumoId: "urea",
    insumoNombre: "Urea",
    clase: "sales",
    valorTotal: 900000,
  },
  {
    id: 11,
    fecha: "2024-02-05",
    tipo: "Entrada",
    cantidad: 800,
    unidad: "L",
    destino: "Depósito Central",
    usuario: "Juan Pérez",
    precio: 850,
    observaciones: "Compra adicional",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 680000,
  },
  {
    id: 12,
    fecha: "2024-02-07",
    tipo: "Salida",
    cantidad: 200,
    unidad: "L",
    destino: "Tractor Case",
    usuario: "Pedro Silva",
    precio: 850,
    observaciones: "Trabajo de campo",
    proveedor: "YPF",
    insumoId: "gasoil-comun",
    insumoNombre: "Gasoil Común",
    clase: "combustibles",
    valorTotal: 170000,
  },
]

// Datos de ejemplo para insumos
const insumosEjemplo: Insumo[] = [
  {
    id: "gasoil-comun",
    nombre: "Gasoil Común",
    clase: "combustibles",
    tipoInsumo: "Combustible",
    stockActual: 1200,
    stockMinimo: 500,
    stockMaximo: 3000,
    unidad: "L",
    precio: 850,
    proveedor: "YPF",
    ubicacion: "Depósito Central",
    estado: "normal",
    icono: "⛽",
    categoria: "combustibles",
    tipo: "Combustible",
  },
  {
    id: "gasoil-premium",
    nombre: "Gasoil Premium",
    clase: "combustibles",
    tipoInsumo: "Combustible",
    stockActual: 800,
    stockMinimo: 300,
    stockMaximo: 2000,
    unidad: "L",
    precio: 920,
    proveedor: "Shell",
    ubicacion: "Depósito Central",
    estado: "normal",
    icono: "⛽",
    categoria: "combustibles",
    tipo: "Combustible",
  },
  {
    id: "vacuna-aftosa",
    nombre: "Vacuna Aftosa",
    clase: "veterinarios",
    tipoInsumo: "Vacuna",
    stockActual: 50,
    stockMinimo: 20,
    stockMaximo: 200,
    unidad: "dosis",
    precio: 1200,
    proveedor: "Biogénesis Bagó",
    ubicacion: "Heladera Veterinaria",
    estado: "bajo",
    icono: "💉",
    categoria: "veterinarios",
    tipo: "Vacuna",
  },
  {
    id: "glifosato",
    nombre: "Glifosato",
    clase: "agroquimicos",
    tipoInsumo: "Herbicida",
    stockActual: 200,
    stockMinimo: 50,
    stockMaximo: 500,
    unidad: "kg",
    precio: 2500,
    proveedor: "Bayer",
    ubicacion: "Depósito Agroquímicos",
    estado: "normal",
    icono: "🌿",
    categoria: "agroquimicos",
    tipo: "Herbicida",
  },
  {
    id: "urea",
    nombre: "Urea",
    clase: "sales",
    tipoInsumo: "Fertilizante",
    stockActual: 1500,
    stockMinimo: 500,
    stockMaximo: 5000,
    unidad: "kg",
    precio: 1800,
    proveedor: "Profertil",
    ubicacion: "Depósito Fertilizantes",
    estado: "normal",
    icono: "🧂",
    categoria: "sales",
    tipo: "Fertilizante",
  },
  {
    id: "antiparasitario",
    nombre: "Antiparasitario Bovino",
    clase: "veterinarios",
    tipoInsumo: "Medicamento",
    stockActual: 15,
    stockMinimo: 10,
    stockMaximo: 100,
    unidad: "frascos",
    precio: 3500,
    proveedor: "Zoetis",
    ubicacion: "Heladera Veterinaria",
    estado: "critico",
    icono: "💊",
    categoria: "veterinarios",
    tipo: "Medicamento",
  },
]

// Datos de ejemplo para destinos
const destinosEjemplo: Destino[] = [
  { id: "tractor-jd-6110", nombre: "Tractor JD 6110", tipo: "tractor", icono: "🚜" },
  { id: "cosechadora-case", nombre: "Cosechadora Case", tipo: "tractor", icono: "🚜" },
  { id: "pulverizadora-apache", nombre: "Pulverizadora Apache", tipo: "tractor", icono: "🚜" },
  { id: "deposito-central", nombre: "Depósito Central", tipo: "deposito", icono: "🏢" },
  { id: "lote-norte", nombre: "Lote Norte", tipo: "lote", icono: "🌾" },
  { id: "potrero-sur", nombre: "Potrero Sur", tipo: "potrero", icono: "🐄" },
  { id: "heladera-veterinaria", nombre: "Heladera Veterinaria", tipo: "instalacion", icono: "❄️" },
]

export function GestionInsumoEspecifico({
  categoria,
  categoriaNombre,
  categoriaEmoji,
  onCategoriaChange,
}: GestionInsumoEspecificoProps) {
  const [vistaActiva, setVistaActiva] = useState<"por-insumo" | "por-destino">("por-insumo")
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [selectedDestino, setSelectedDestino] = useState<Destino | null>(null)
  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false)
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false)

  // Para modo "Ver por Destino": clases activas (toggles múltiples)
  const [clasesActivas, setClasesActivas] = useState<Set<string>>(new Set(Object.keys(categoriasConfig)))

  const [busqueda, setBusqueda] = useState("")
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({
    tipoMovimiento: [],
  })
  const [movimientos, setMovimientos] = useState(movimientosEjemplo)

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina] = useState(10)

  // Limpiar selección de insumo cuando cambia la categoría
  useEffect(() => {
    setSelectedInsumo(null)
  }, [categoria])

  // Reset pagination when filters change
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtros])

  // Filtrar insumos por categoría actual
  const insumosDeClase = useMemo(() => {
    return insumosEjemplo.filter((insumo) => insumo.categoria === categoria)
  }, [categoria])

  // Preparar datos para el selector de insumos
  const insumosParaSelector = useMemo(() => {
    return insumosDeClase.map((insumo) => ({
      id: insumo.id,
      tipo: insumo.tipoInsumo,
      nombre: insumo.nombre,
    }))
  }, [insumosDeClase])

  // Preparar datos para el selector de destinos
  const destinosParaSelector = useMemo(() => {
    return destinosEjemplo.map((destino) => ({
      id: destino.id,
      tipo: destino.tipo,
      nombre: destino.nombre,
    }))
  }, [])

  // Obtener insumo seleccionado
  const insumoActual = useMemo(() => {
    if (!selectedInsumo) return null
    return insumosDeClase.find((insumo) => insumo.id === selectedInsumo.id)
  }, [insumosDeClase, selectedInsumo])

  // Obtener destino seleccionado
  const destinoActual = useMemo(() => {
    if (!selectedDestino) return null
    return destinosEjemplo.find((destino) => destino.id === selectedDestino.id)
  }, [selectedDestino])

  // Obtener datos únicos para los dropdowns de filtros
  const todosLosInsumos = insumosEjemplo
  const usuariosUnicos = [...new Set(movimientos.map((m) => m.usuario))]
  const destinosUnicos = [...new Set(movimientos.map((m) => m.destino))]
  const clasesUnicas = [...new Set(todosLosInsumos.map((i) => i.clase))]
  const almacenesUnicos = [...new Set(movimientos.map((m) => m.destino))]

  // Obtener tipos según la clase seleccionada en filtros
  const tiposSegunClase = useMemo(() => {
    if (!filtros.claseInsumo) return []
    const insumosDeClase = todosLosInsumos.filter((i) => i.clase === filtros.claseInsumo)
    return [...new Set(insumosDeClase.map((i) => i.tipoInsumo))]
  }, [filtros.claseInsumo])

  // Obtener subtipos según el tipo seleccionado en filtros
  const subtiposSegunTipo = useMemo(() => {
    if (!filtros.tipo) return []
    const insumosDelTipo = todosLosInsumos.filter((i) => i.tipoInsumo === filtros.tipo)
    return [...new Set(insumosDelTipo.map((i) => i.nombre))]
  }, [filtros.tipo])

  // Obtener insumos según la clase seleccionada en filtros
  const insumosSegunClase = useMemo(() => {
    if (!filtros.claseInsumo) return todosLosInsumos
    return todosLosInsumos.filter((i) => i.clase === filtros.claseInsumo)
  }, [filtros.claseInsumo])

  // Función para aplicar filtros avanzados
  const aplicarFiltrosAvanzados = (movimientosBase: any[]) => {
    return movimientosBase.filter((movimiento) => {
      const insumo = todosLosInsumos.find((i) => i.id === movimiento.insumoId)
      if (!insumo) return false

      // Filtro de búsqueda general
      if (
        busqueda &&
        !insumo.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !movimiento.usuario.toLowerCase().includes(busqueda.toLowerCase()) &&
        !movimiento.destino.toLowerCase().includes(busqueda.toLowerCase()) &&
        !movimiento.observaciones.toLowerCase().includes(busqueda.toLowerCase())
      ) {
        return false
      }

      // Filtros avanzados
      if (filtros.fechaDesde && new Date(movimiento.fecha) < filtros.fechaDesde) return false
      if (filtros.fechaHasta && new Date(movimiento.fecha) > filtros.fechaHasta) return false
      if (filtros.insumoEspecifico && movimiento.insumoId !== filtros.insumoEspecifico) return false
      if (filtros.usuarioEspecifico && movimiento.usuario !== filtros.usuarioEspecifico) return false
      if (filtros.destinoEspecifico && movimiento.destino !== filtros.destinoEspecifico) return false
      if (filtros.claseInsumo && insumo.clase !== filtros.claseInsumo) return false
      if (filtros.tipo && insumo.tipoInsumo !== filtros.tipo) return false
      if (filtros.subtipo && insumo.nombre !== filtros.subtipo) return false
      if (filtros.tipoMovimiento.length > 0 && !filtros.tipoMovimiento.includes(movimiento.tipo)) return false
      if (filtros.almacenOrigen && movimiento.destino !== filtros.almacenOrigen) return false
      if (filtros.valorMin && movimiento.valorTotal < filtros.valorMin) return false
      if (filtros.valorMax && movimiento.valorTotal > filtros.valorMax) return false

      return true
    })
  }

  // Filtrar movimientos según la vista activa
  const movimientosFiltrados = useMemo(() => {
    let movimientosBase = movimientos

    if (vistaActiva === "por-insumo" && selectedInsumo) {
      movimientosBase = movimientos.filter((mov) => mov.insumoId === selectedInsumo.id)
    } else if (vistaActiva === "por-destino" && selectedDestino) {
      const destinoNombre = destinoActual?.nombre || ""
      movimientosBase = movimientos.filter((mov) => mov.destino === destinoNombre)

      // Aplicar filtro de clases activas
      if (clasesActivas.size > 0) {
        movimientosBase = movimientosBase.filter((mov) => clasesActivas.has(mov.clase))
      }
    }

    // Aplicar filtros avanzados
    return aplicarFiltrosAvanzados(movimientosBase)
  }, [movimientos, vistaActiva, selectedInsumo, selectedDestino, destinoActual, clasesActivas, busqueda, filtros])

  // Calcular paginación
  const totalRegistros = movimientosFiltrados.length
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina)
  const indiceInicio = (paginaActual - 1) * registrosPorPagina
  const indiceFin = indiceInicio + registrosPorPagina
  const movimientosPaginados = movimientosFiltrados.slice(indiceInicio, indiceFin)

  // Generar números de página (máximo 5 visibles)
  const generarNumerosPagina = () => {
    const numeros = []
    const maxVisibles = 5
    let inicio = Math.max(1, paginaActual - Math.floor(maxVisibles / 2))
    const fin = Math.min(totalPaginas, inicio + maxVisibles - 1)

    if (fin - inicio + 1 < maxVisibles) {
      inicio = Math.max(1, fin - maxVisibles + 1)
    }

    for (let i = inicio; i <= fin; i++) {
      numeros.push(i)
    }
    return numeros
  }

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const entradas = movimientosFiltrados.filter((m) => m.tipo === "Entrada")
    const salidas = movimientosFiltrados.filter((m) => m.tipo === "Salida")

    const totalEntradas = entradas.reduce((sum, m) => sum + m.cantidad, 0)
    const totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0)

    let valorInventario = 0
    if (vistaActiva === "por-insumo" && insumoActual) {
      valorInventario = insumoActual.stockActual * (insumoActual.precio || 0)
    } else if (vistaActiva === "por-destino") {
      valorInventario = movimientosFiltrados.reduce((sum, m) => sum + m.valorTotal, 0)
    }

    const ultimoMovimiento =
      movimientosFiltrados.length > 0
        ? movimientosFiltrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
        : null

    return {
      totalEntradas,
      totalSalidas,
      valorInventario,
      ultimoMovimiento,
      cantidadMovimientos: movimientosFiltrados.length,
    }
  }, [movimientosFiltrados, vistaActiva, insumoActual])

  // Calcular datos para cuando no hay selección
  const datosGenerales = useMemo(() => {
    // Aplicar filtros avanzados a todos los movimientos
    const movimientosFiltradosGenerales = aplicarFiltrosAvanzados(movimientos)

    // Top 3 insumos más utilizados (por salidas)
    const consumoPorInsumo = new Map()
    movimientosFiltradosGenerales
      .filter((m) => m.tipo === "Salida")
      .forEach((mov) => {
        const key = mov.insumoId
        if (!consumoPorInsumo.has(key)) {
          consumoPorInsumo.set(key, {
            id: mov.insumoId,
            nombre: mov.insumoNombre,
            clase: mov.clase,
            total: 0,
            unidad: mov.unidad,
          })
        }
        consumoPorInsumo.get(key).total += mov.cantidad
      })

    const top3Insumos = Array.from(consumoPorInsumo.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    // Destinos con mayor uso
    const usoPorDestino = new Map()
    movimientosFiltradosGenerales
      .filter((m) => m.tipo === "Salida")
      .forEach((mov) => {
        const key = mov.destino
        if (!usoPorDestino.has(key)) {
          usoPorDestino.set(key, {
            nombre: mov.destino,
            movimientos: 0,
            totalCantidad: 0,
          })
        }
        const destino = usoPorDestino.get(key)
        destino.movimientos += 1
        destino.totalCantidad += mov.cantidad
      })

    const topDestinos = Array.from(usoPorDestino.values())
      .sort((a, b) => b.totalCantidad - a.totalCantidad)
      .slice(0, 5)

    return {
      top3Insumos,
      topDestinos,
      movimientosFiltradosGenerales,
    }
  }, [movimientos, busqueda, filtros])

  // Paginación para todos los movimientos cuando no hay selección
  const [paginaGeneralActual, setPaginaGeneralActual] = useState(1)
  const totalRegistrosGenerales = datosGenerales.movimientosFiltradosGenerales.length
  const totalPaginasGenerales = Math.ceil(totalRegistrosGenerales / registrosPorPagina)
  const indiceInicioGeneral = (paginaGeneralActual - 1) * registrosPorPagina
  const indiceFinGeneral = indiceInicioGeneral + registrosPorPagina
  const movimientosGeneralesPaginados = datosGenerales.movimientosFiltradosGenerales.slice(
    indiceInicioGeneral,
    indiceFinGeneral,
  )

  const handleNuevoMovimiento = (nuevoMovimiento: any) => {
    setMovimientos((prev) => [nuevoMovimiento, ...prev])
  }

  const handleInsumoSelection = (insumo: any) => {
    setSelectedInsumo(insumo)
  }

  const handleDestinoSelection = (destino: any) => {
    setSelectedDestino(destino)
  }

  const handleLimpiarSeleccionInsumo = () => {
    setSelectedInsumo(null)
  }

  const handleLimpiarSeleccionDestino = () => {
    setSelectedDestino(null)
  }

  // Manejar toggle de clases en modo "Ver por Destino"
  const handleToggleClase = (claseKey: string) => {
    if (vistaActiva === "por-destino") {
      setClasesActivas((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(claseKey)) {
          newSet.delete(claseKey)
        } else {
          newSet.add(claseKey)
        }
        return newSet
      })
    }
  }

  // Manejar cambio de categoría en modo "Ver por Insumo"
  const handleCategoriaChange = (nuevaCategoria: string) => {
    if (vistaActiva === "por-insumo" && onCategoriaChange) {
      onCategoriaChange(nuevaCategoria)
    }
  }

  // Funciones para manejar filtros avanzados
  const limpiarFiltros = () => {
    setFiltros({ tipoMovimiento: [] })
    setBusqueda("")
  }

  const handleTipoMovimientoChange = (tipo: string, checked: boolean) => {
    setFiltros((prev) => ({
      ...prev,
      tipoMovimiento: checked ? [...prev.tipoMovimiento, tipo] : prev.tipoMovimiento.filter((t) => t !== tipo),
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "critico":
        return "border-red-200 text-red-700 bg-red-50"
      case "bajo":
        return "border-yellow-200 text-yellow-700 bg-yellow-50"
      default:
        return "border-green-200 text-green-700 bg-green-50"
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "critico":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "bajo":
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-600" />
    }
  }

  const getTipoDestinoIcon = (tipo: string) => {
    switch (tipo) {
      case "tractor":
        return <Tractor className="w-4 h-4" />
      case "deposito":
        return <Building2 className="w-4 h-4" />
      case "lote":
        return <Package className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getCategoriaIcon = (clase: string) => {
    const config = categoriasConfig[clase as keyof typeof categoriasConfig]
    return config ? config.emoji : "📦"
  }

  const getInformacionDetallada = () => {
    if (vistaActiva === "por-insumo" && insumoActual) {
      return {
        titulo: "Información del Insumo",
        datos: [
          { label: "Proveedor", valor: insumoActual.proveedor || "Sin proveedor" },
          { label: "Categoría", valor: insumoActual.tipoInsumo || "General" },
          {
            label: "Estado",
            valor: insumoActual.estado || "Normal",
            icono: getEstadoIcon(insumoActual.estado || "normal"),
          },
          { label: "Stock Mínimo", valor: `${insumoActual.stockMinimo.toLocaleString()} ${insumoActual.unidad}` },
          { label: "Stock Máximo", valor: `${insumoActual.stockMaximo.toLocaleString()} ${insumoActual.unidad}` },
          { label: "Ubicación", valor: insumoActual.ubicacion || "Sin ubicación" },
          {
            label: "Último Movimiento",
            valor: estadisticas.ultimoMovimiento
              ? new Date(estadisticas.ultimoMovimiento.fecha).toLocaleDateString()
              : "Sin movimientos",
          },
          { label: "Total Movimientos", valor: estadisticas.cantidadMovimientos.toString() },
          { label: "Precio Promedio", valor: `$${(insumoActual.precio || 0).toLocaleString()}` },
        ],
      }
    } else if (vistaActiva === "por-destino" && destinoActual) {
      return {
        titulo: "Información del Destino",
        datos: [
          { label: "Nombre", valor: destinoActual.nombre },
          { label: "Tipo", valor: destinoActual.tipo, icono: getTipoDestinoIcon(destinoActual.tipo) },
          {
            label: "Clases Activas",
            valor:
              Array.from(clasesActivas)
                .map((c) => categoriasConfig[c as keyof typeof categoriasConfig]?.nombre)
                .join(", ") || "Ninguna",
          },
          { label: "Total Movimientos", valor: estadisticas.cantidadMovimientos.toString() },
          {
            label: "Último Movimiento",
            valor: estadisticas.ultimoMovimiento
              ? new Date(estadisticas.ultimoMovimiento.fecha).toLocaleDateString()
              : "Sin movimientos",
          },
          { label: "Valor Total Movimientos", valor: `$${estadisticas.valorInventario.toLocaleString()}` },
          {
            label: "Balance Entradas/Salidas",
            valor: `${(estadisticas.totalEntradas - estadisticas.totalSalidas).toLocaleString()}`,
          },
          {
            label: "Eficiencia",
            valor:
              estadisticas.totalEntradas > 0
                ? `${Math.round((estadisticas.totalSalidas / estadisticas.totalEntradas) * 100)}%`
                : "N/A",
          },
          {
            label: "Promedio por Movimiento",
            valor:
              estadisticas.cantidadMovimientos > 0
                ? `$${Math.round(estadisticas.valorInventario / estadisticas.cantidadMovimientos).toLocaleString()}`
                : "N/A",
          },
        ],
      }
    }
    return null
  }

  // Componente de filtros avanzados reutilizable
  const FiltrosAvanzadosComponent = () => (
    <Collapsible open={filtrosAvanzadosAbiertos} onOpenChange={setFiltrosAvanzadosAbiertos}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-transparent">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Avanzados
            {Object.values(filtros).some((v) => v && (Array.isArray(v) ? v.length > 0 : true)) && (
              <Badge variant="secondary" className="ml-2">
                Activos
              </Badge>
            )}
          </div>
          {filtrosAvanzadosAbiertos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Fecha desde */}
          <div className="space-y-2">
            <Label>Fecha desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filtros.fechaDesde && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.fechaDesde ? format(filtros.fechaDesde, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filtros.fechaDesde}
                  onSelect={(date) => setFiltros((prev) => ({ ...prev, fechaDesde: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha hasta */}
          <div className="space-y-2">
            <Label>Fecha hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filtros.fechaHasta && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filtros.fechaHasta ? format(filtros.fechaHasta, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filtros.fechaHasta}
                  onSelect={(date) => setFiltros((prev) => ({ ...prev, fechaHasta: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clase de insumo */}
          <div className="space-y-2">
            <Label>Clase de insumo</Label>
            <Select
              value={filtros.claseInsumo || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({
                  ...prev,
                  claseInsumo: value === "all" ? undefined : value,
                  tipo: undefined,
                  subtipo: undefined,
                  insumoEspecifico: undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar clase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {clasesUnicas.map((clase) => (
                  <SelectItem key={clase} value={clase}>
                    {clase}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={filtros.tipo || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipo: value === "all" ? undefined : value,
                  subtipo: undefined,
                }))
              }
              disabled={!filtros.claseInsumo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposSegunClase.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subtipo */}
          <div className="space-y-2">
            <Label>Subtipo</Label>
            <Select
              value={filtros.subtipo || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, subtipo: value === "all" ? undefined : value }))
              }
              disabled={!filtros.tipo}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar subtipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los subtipos</SelectItem>
                {subtiposSegunTipo.map((subtipo) => (
                  <SelectItem key={subtipo} value={subtipo}>
                    {subtipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Insumo específico */}
          <div className="space-y-2">
            <Label>Insumo específico</Label>
            <Select
              value={filtros.insumoEspecifico || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, insumoEspecifico: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar insumo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los insumos</SelectItem>
                {insumosSegunClase.map((insumo) => (
                  <SelectItem key={insumo.id} value={insumo.id}>
                    {insumo.icono} {insumo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Usuario específico */}
          <div className="space-y-2">
            <Label>Usuario específico</Label>
            <Select
              value={filtros.usuarioEspecifico || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, usuarioEspecifico: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {usuariosUnicos.map((usuario) => (
                  <SelectItem key={usuario} value={usuario}>
                    {usuario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destino específico */}
          <div className="space-y-2">
            <Label>Destino específico</Label>
            <Select
              value={filtros.destinoEspecifico || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, destinoEspecifico: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los destinos</SelectItem>
                {destinosUnicos.map((destino) => (
                  <SelectItem key={destino} value={destino}>
                    {destino}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Almacén origen/destino */}
          <div className="space-y-2">
            <Label>Almacén origen/destino</Label>
            <Select
              value={filtros.almacenOrigen || "all"}
              onValueChange={(value) =>
                setFiltros((prev) => ({ ...prev, almacenOrigen: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los almacenes</SelectItem>
                {almacenesUnicos.map((almacen) => (
                  <SelectItem key={almacen} value={almacen}>
                    {almacen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tipo de movimiento */}
        <div className="space-y-2">
          <Label>Tipo de movimiento</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="entrada"
                checked={filtros.tipoMovimiento.includes("Entrada")}
                onCheckedChange={(checked) => handleTipoMovimientoChange("Entrada", checked as boolean)}
              />
              <Label htmlFor="entrada" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Entrada
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="salida"
                checked={filtros.tipoMovimiento.includes("Salida")}
                onCheckedChange={(checked) => handleTipoMovimientoChange("Salida", checked as boolean)}
              />
              <Label htmlFor="salida" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                Salida
              </Label>
            </div>
          </div>
        </div>

        {/* Rango de valor */}
        <div className="space-y-2">
          <Label>Rango de valor</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Valor mínimo"
              value={filtros.valorMin || ""}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  valorMin: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
            <span className="text-gray-500">-</span>
            <Input
              type="number"
              placeholder="Valor máximo"
              value={filtros.valorMax || ""}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  valorMax: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )

  // Si está mostrando configuración, renderizar esa pantalla
  if (mostrarConfiguracion) {
    return <ConfiguracionInsumos onVolver={() => setMostrarConfiguracion(false)} insumos={insumosEjemplo} />
  }

  return (
    <div className="space-y-6">
      {/* Header con botón Nuevo Movimiento y Configuración */}
      <div className="flex items-center justify-between">
        

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarConfiguracion(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurar Insumos
          </Button>
          <FormularioNuevoMovimiento onMovimientoCreado={handleNuevoMovimiento} />
        </div>
      </div>

      {/* Selector de Vista */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={vistaActiva === "por-insumo" ? "default" : "ghost"}
            size="sm"
            onClick={() => setVistaActiva("por-insumo")}
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Ver por Insumo
          </Button>
          <Button
            variant={vistaActiva === "por-destino" ? "default" : "ghost"}
            size="sm"
            onClick={() => setVistaActiva("por-destino")}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Ver por Destino
          </Button>
        </div>
      </div>

      {/* Barra de Categorías */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-white border rounded-lg">
          {Object.entries(categoriasConfig).map(([key, config]) => {
            const isActive = vistaActiva === "por-insumo" ? categoria === key : clasesActivas.has(key)

            return (
              <Button
                key={key}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (vistaActiva === "por-insumo") {
                    handleCategoriaChange(key)
                  } else {
                    handleToggleClase(key)
                  }
                }}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isActive ? "bg-primary text-primary-foreground" : ""
                }`}
              >
                <span className="text-base">{config.emoji}</span>
                <span className="text-sm font-medium">{config.nombre}</span>
              </Button>
            )
          })}
        </div>

        <div className="mt-2 text-xs text-gray-500 italic">
          {vistaActiva === "por-insumo"
            ? "Modo selección única: Hacé clic en una clase para cambiar de categoría"
            : "Modo selección múltiple: Hacé clic en las clases para activar/desactivar"}
        </div>
      </div>

      {/* Contenido según la vista activa */}
      {vistaActiva === "por-insumo" && (
        <div className="space-y-6">
          {/* Selector de insumo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiltroSelectorInsumos
                insumos={insumosParaSelector}
                onSelectionChange={handleInsumoSelection}
                placeholder="Seleccionar insumo..."
                className="w-[400px]"
              />
              {selectedInsumo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarSeleccionInsumo}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              )}
            </div>
            {insumosParaSelector.length === 0 && (
              <div className="text-sm text-gray-500">
                No hay insumos disponibles en la categoría "{categoriaNombre}"
              </div>
            )}
          </div>

          {/* KPIs Superiores - Solo se muestran cuando hay insumo seleccionado */}
          {selectedInsumo && insumoActual && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Stock Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {insumosDeClase.reduce((sum, insumo) => sum + insumo.stockActual, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {insumosDeClase
                          .reduce((sum, insumo) => sum + insumo.stockActual * (insumo.precio || 0), 0)
                          .toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">total</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Consumo Diario Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(
                          insumosDeClase.reduce((sum, insumo) => sum + insumo.stockActual * 0.05, 0),
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">unidades/día</p>
                    </div>
                    <Activity className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Días Restantes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(
                          insumosDeClase.reduce(
                            (sum, insumo) => sum + insumo.stockActual / Math.max(insumo.stockActual * 0.05, 1),
                            0,
                          ) / Math.max(insumosDeClase.length, 1),
                        )}
                      </p>
                      <p className="text-xs text-gray-500">estimados</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contenido cuando NO hay insumo seleccionado */}
          {!selectedInsumo && (
            <div className="space-y-6">
              {/* Top 3 insumos más utilizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Top 3 Insumos Más Utilizados del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {datosGenerales.top3Insumos.map((insumo, index) => (
                      <div key={insumo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoriaIcon(insumo.clase)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{insumo.nombre}</p>
                              <p className="text-sm text-gray-500 capitalize">{insumo.clase}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">
                            {insumo.total.toLocaleString()} {insumo.unidad}
                          </p>
                          <p className="text-sm text-gray-500">Total usado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Destinos con mayor uso */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Destinos con Mayor Uso de Insumos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datosGenerales.topDestinos.map((destino, index) => (
                      <div key={destino.nombre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{destino.nombre}</p>
                            <p className="text-sm text-gray-500">{destino.movimientos} movimientos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{destino.totalCantidad.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">unidades utilizadas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de todos los movimientos con filtros avanzados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Historial de Movimientos</span>
                    <Badge variant="outline">{totalRegistrosGenerales} registros</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtros básicos */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar movimientos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" onClick={limpiarFiltros} size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>

                  {/* Filtros avanzados */}
                  <FiltrosAvanzadosComponent />

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimientosGeneralesPaginados.map((movimiento) => (
                          <TableRow key={movimiento.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                {new Date(movimiento.fecha).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={movimiento.tipo === "Entrada" ? "default" : "destructive"}
                                className="flex items-center gap-1 w-fit"
                              >
                                {movimiento.tipo === "Entrada" ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {movimiento.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getCategoriaIcon(movimiento.clase)}</span>
                                <span>{movimiento.insumoNombre}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {movimiento.cantidad.toLocaleString()} {movimiento.unidad}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {movimiento.destino}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {movimiento.usuario}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(movimiento.valorTotal)}</TableCell>
                            <TableCell className="max-w-xs truncate">{movimiento.observaciones}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación para movimientos generales */}
                  {totalPaginasGenerales > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {indiceInicioGeneral + 1} a {Math.min(indiceFinGeneral, totalRegistrosGenerales)} de{" "}
                        {totalRegistrosGenerales} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaGeneralActual(paginaGeneralActual - 1)}
                          disabled={paginaGeneralActual === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>

                        {Array.from({ length: Math.min(5, totalPaginasGenerales) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === paginaGeneralActual ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaginaGeneralActual(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaGeneralActual(paginaGeneralActual + 1)}
                          disabled={paginaGeneralActual === totalPaginasGenerales}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedInsumo && insumoActual && (
            <>
              {/* Alerta de estado */}
              {insumoActual.estado !== "normal" && (
                <Alert className={getEstadoColor(insumoActual.estado)}>
                  <div className="flex items-center gap-2">
                    {getEstadoIcon(insumoActual.estado)}
                    <AlertDescription>
                      {insumoActual.estado === "critico" &&
                        `Stock crítico: Solo quedan ${insumoActual.stockActual} ${insumoActual.unidad}. Se recomienda reposición inmediata.`}
                      {insumoActual.estado === "bajo" &&
                        `Stock bajo: Quedan ${insumoActual.stockActual} ${insumoActual.unidad}. Considere realizar un pedido pronto.`}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Información Detallada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Información Detallada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Proveedor</p>
                        <p className="text-sm text-gray-900">{insumoActual?.proveedor || "Sin proveedor"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Categoría</p>
                        <p className="text-sm text-gray-900 capitalize">{insumoActual?.tipoInsumo || "General"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estado</p>
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(insumoActual?.estado || "normal")}
                          <span className="text-sm text-gray-900 capitalize">{insumoActual?.estado || "Normal"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Stock Mínimo</p>
                        <p className="text-sm text-gray-900">
                          {insumoActual?.stockMinimo.toLocaleString() || 0} {insumoActual?.unidad}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Stock Máximo</p>
                        <p className="text-sm text-gray-900">
                          {insumoActual?.stockMaximo.toLocaleString() || 0} {insumoActual?.unidad}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ubicación</p>
                        <p className="text-sm text-gray-900">{insumoActual?.ubicacion || "Sin ubicación"}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Último Movimiento</p>
                        <p className="text-sm text-gray-900">
                          {estadisticas.ultimoMovimiento
                            ? new Date(estadisticas.ultimoMovimiento.fecha).toLocaleDateString()
                            : "Sin movimientos"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                        <p className="text-sm text-gray-900">{estadisticas.cantidadMovimientos}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                        <p className="text-sm text-gray-900">{formatCurrency(insumoActual?.precio || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {vistaActiva === "por-destino" && (
        <div className="space-y-6">
          {/* Mensaje informativo */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-700">
              <strong>Vista por destino activa:</strong> Seleccioná las clases de insumos que querés ver para este
              destino.
            </span>
          </div>

          {/* Alerta si no hay clases seleccionadas */}
          {clasesActivas.size === 0 && (
            <Alert className="border-orange-200 text-orange-700 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Seleccioná al menos una clase para ver los insumos utilizados en este destino.
              </AlertDescription>
            </Alert>
          )}

          {/* Selector de destino */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FiltroSelectorInsumos
                insumos={destinosParaSelector}
                onSelectionChange={handleDestinoSelection}
                placeholder="Buscar y seleccionar destino operativo..."
                className="w-[400px]"
              />
              {selectedDestino && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarSeleccionDestino}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Contenido cuando NO hay destino seleccionado */}
          {!selectedDestino && (
            <div className="space-y-6">
              {/* Top 3 insumos más utilizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Top 3 Insumos Más Utilizados del Mes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {datosGenerales.top3Insumos.map((insumo, index) => (
                      <div key={insumo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoriaIcon(insumo.clase)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{insumo.nombre}</p>
                              <p className="text-sm text-gray-500 capitalize">{insumo.clase}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">
                            {insumo.total.toLocaleString()} {insumo.unidad}
                          </p>
                          <p className="text-sm text-gray-500">Total usado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Destinos con mayor uso */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Destinos con Mayor Uso de Insumos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datosGenerales.topDestinos.map((destino, index) => (
                      <div key={destino.nombre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{destino.nombre}</p>
                            <p className="text-sm text-gray-500">{destino.movimientos} movimientos</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{destino.totalCantidad.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">unidades utilizadas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de todos los movimientos con filtros avanzados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Historial de Movimientos</span>
                    <Badge variant="outline">{totalRegistrosGenerales} registros</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filtros básicos */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar movimientos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" onClick={limpiarFiltros} size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>

                  {/* Filtros avanzados */}
                  <FiltrosAvanzadosComponent />

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimientosGeneralesPaginados.map((movimiento) => (
                          <TableRow key={movimiento.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                {new Date(movimiento.fecha).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={movimiento.tipo === "Entrada" ? "default" : "destructive"}
                                className="flex items-center gap-1 w-fit"
                              >
                                {movimiento.tipo === "Entrada" ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {movimiento.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getCategoriaIcon(movimiento.clase)}</span>
                                <span>{movimiento.insumoNombre}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {movimiento.cantidad.toLocaleString()} {movimiento.unidad}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {movimiento.destino}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                {movimiento.usuario}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(movimiento.valorTotal)}</TableCell>
                            <TableCell className="max-w-xs truncate">{movimiento.observaciones}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación para movimientos generales */}
                  {totalPaginasGenerales > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {indiceInicioGeneral + 1} a {Math.min(indiceFinGeneral, totalRegistrosGenerales)} de{" "}
                        {totalRegistrosGenerales} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaGeneralActual(paginaGeneralActual - 1)}
                          disabled={paginaGeneralActual === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>

                        {Array.from({ length: Math.min(5, totalPaginasGenerales) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === paginaGeneralActual ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPaginaGeneralActual(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaginaGeneralActual(paginaGeneralActual + 1)}
                          disabled={paginaGeneralActual === totalPaginasGenerales}
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {selectedDestino && destinoActual && clasesActivas.size > 0 && <></>}
        </div>
      )}

      {/* Mostrar contenido solo si hay selección y condiciones apropiadas */}
      {((vistaActiva === "por-insumo" && selectedInsumo) ||
        (vistaActiva === "por-destino" && selectedDestino && clasesActivas.size > 0)) && (
        <Tabs defaultValue="movimientos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movimientos" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movimientos" className="space-y-4">
            {/* Información Detallada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {getInformacionDetallada()?.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getInformacionDetallada()
                    ?.datos.slice(0, 3)
                    .map((item, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{item.label}</p>
                        <div className="flex items-center gap-2">
                          {item.icono && item.icono}
                          <p className="text-sm text-gray-900">{item.valor}</p>
                        </div>
                      </div>
                    ))}
                  {getInformacionDetallada()
                    ?.datos.slice(3, 6)
                    .map((item, index) => (
                      <div key={index + 3} className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{item.label}</p>
                        <div className="flex items-center gap-2">
                          {item.icono && item.icono}
                          <p className="text-sm text-gray-900">{item.valor}</p>
                        </div>
                      </div>
                    ))}
                  {getInformacionDetallada()
                    ?.datos.slice(6)
                    .map((item, index) => (
                      <div key={index + 6} className="space-y-1">
                        <p className="text-sm font-medium text-gray-600">{item.label}</p>
                        <div className="flex items-center gap-2">
                          {item.icono && item.icono}
                          <p className="text-sm text-gray-900">{item.valor}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* KPIs de Entradas y Salidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                      <p className="text-2xl font-bold text-green-600">{estadisticas.totalEntradas.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Salidas</p>
                      <p className="text-2xl font-bold text-red-600">{estadisticas.totalSalidas.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">unidades</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Importe Entradas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          movimientosFiltrados
                            .filter((m) => m.tipo === "Entrada")
                            .reduce((sum, m) => sum + m.valorTotal, 0),
                        )}
                      </p>
                      <p className="text-xs text-gray-500">total</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Importe Salidas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(
                          movimientosFiltrados
                            .filter((m) => m.tipo === "Salida")
                            .reduce((sum, m) => sum + m.valorTotal, 0),
                        )}
                      </p>
                      <p className="text-xs text-gray-500">total</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Historial de Movimientos con filtros avanzados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Historial de Movimientos</span>
                  <Badge variant="outline">{totalRegistros} registros</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros en una sola fila */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar movimientos..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={limpiarFiltros} size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                </div>

                {/* Filtros avanzados */}
                <FiltrosAvanzadosComponent />

                {/* Tabla de movimientos */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        {vistaActiva === "por-destino" && <TableHead>Insumo</TableHead>}
                        <TableHead>Cantidad</TableHead>
                        <TableHead>{vistaActiva === "por-insumo" ? "Destino" : "Origen/Destino"}</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimientosPaginados.map((movimiento) => (
                        <TableRow key={movimiento.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {new Date(movimiento.fecha).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={movimiento.tipo === "Entrada" ? "default" : "destructive"}
                              className="flex items-center gap-1 w-fit"
                            >
                              {movimiento.tipo === "Entrada" ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {movimiento.tipo}
                            </Badge>
                          </TableCell>
                          {vistaActiva === "por-destino" && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span>{movimiento.insumoNombre}</span>
                                <Badge variant="outline" className="text-xs">
                                  {categoriasConfig[movimiento.clase as keyof typeof categoriasConfig]?.emoji}
                                </Badge>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="font-medium">
                            {movimiento.cantidad.toLocaleString()} {movimiento.unidad}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {movimiento.destino}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {movimiento.usuario}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(movimiento.valorTotal)}</TableCell>
                          <TableCell className="max-w-xs truncate">{movimiento.observaciones}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Mostrando {indiceInicio + 1} a {Math.min(indiceFin, totalRegistros)} de {totalRegistros} registros
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(paginaActual - 1)}
                        disabled={paginaActual === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>

                      {generarNumerosPagina().map((numero) => (
                        <Button
                          key={numero}
                          variant={numero === paginaActual ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaginaActual(numero)}
                          className="w-8 h-8 p-0"
                        >
                          {numero}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                      >
                        Siguiente
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {movimientosFiltrados.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {vistaActiva === "por-insumo" && !selectedInsumo && "Seleccione un insumo para ver sus movimientos"}
                    {vistaActiva === "por-destino" &&
                      !selectedDestino &&
                      "Seleccione un destino para ver sus movimientos"}
                    {vistaActiva === "por-destino" &&
                      selectedDestino &&
                      clasesActivas.size === 0 &&
                      "Seleccione al menos una clase para ver los movimientos"}
                    {((vistaActiva === "por-insumo" && selectedInsumo) ||
                      (vistaActiva === "por-destino" && selectedDestino && clasesActivas.size > 0)) &&
                      "No se encontraron movimientos con los filtros aplicados"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Movimientos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total de movimientos:</span>
                    <span className="font-bold">{estadisticas.cantidadMovimientos}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-green-600">
                    <span>Total entradas:</span>
                    <span className="font-bold">{estadisticas.totalEntradas.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600">
                    <span>Total salidas:</span>
                    <span className="font-bold">{estadisticas.totalSalidas.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>Balance neto:</span>
                    <span
                      className={`font-bold ${estadisticas.totalEntradas - estadisticas.totalSalidas >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(estadisticas.totalEntradas - estadisticas.totalSalidas).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Valor total:</span>
                    <span className="font-bold">{formatCurrency(estadisticas.valorInventario)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Último movimiento:</span>
                    <span className="font-bold">
                      {estadisticas.ultimoMovimiento
                        ? new Date(estadisticas.ultimoMovimiento.fecha).toLocaleDateString()
                        : "Sin movimientos"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vista activa:</span>
                    <Badge variant="outline">{vistaActiva === "por-insumo" ? "Por Insumo" : "Por Destino"}</Badge>
                  </div>
                  {vistaActiva === "por-destino" && clasesActivas.size > 0 && (
                    <div className="flex justify-between items-center">
                      <span>Clases activas:</span>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(clasesActivas).map((claseKey) => (
                          <Badge key={claseKey} variant="outline" className="text-xs">
                            {categoriasConfig[claseKey as keyof typeof categoriasConfig]?.emoji}{" "}
                            {categoriasConfig[claseKey as keyof typeof categoriasConfig]?.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alertas" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Alertas de Stock */}
              {insumoActual && insumoActual.estado !== "normal" && (
                <Alert className={getEstadoColor(insumoActual.estado)}>
                  <AlertTriangle className="h-4 w-4" />
                  <div>
                    <h4 className="font-semibold">Alerta de Stock</h4>
                    <p className="text-sm mt-1">
                      {insumoActual.estado === "critico"
                        ? `Stock crítico: Solo quedan ${insumoActual.stockActual} ${insumoActual.unidad}. Se recomienda reposición inmediata.`
                        : `Stock bajo: Quedan ${insumoActual.stockActual} ${insumoActual.unidad}. Considere realizar un pedido pronto.`}
                    </p>
                  </div>
                </Alert>
              )}

              {/* Alertas de Movimientos Recientes */}
              {estadisticas.ultimoMovimiento &&
                new Date().getTime() - new Date(estadisticas.ultimoMovimiento.fecha).getTime() >
                  30 * 24 * 60 * 60 * 1000 && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <div>
                      <h4 className="font-semibold">Sin Movimientos Recientes</h4>
                      <p className="text-sm mt-1">
                        No se han registrado movimientos en los últimos 30 días. Último movimiento:{" "}
                        {new Date(estadisticas.ultimoMovimiento.fecha).toLocaleDateString()}
                      </p>
                    </div>
                  </Alert>
                )}

              {/* Alerta de Precio */}
              {insumoActual && insumoActual.precio && insumoActual.precio > 1000 && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <div>
                    <h4 className="font-semibold">Precio Elevado</h4>
                    <p className="text-sm mt-1">
                      El precio actual de {formatCurrency(insumoActual.precio)} por {insumoActual.unidad} está por
                      encima del promedio.
                    </p>
                  </div>
                </Alert>
              )}

              {/* Alerta de Eficiencia */}
              {estadisticas.totalSalidas > estadisticas.totalEntradas && (
                <Alert className="border-orange-200 text-orange-700 bg-orange-50">
                  <TrendingDown className="h-4 w-4" />
                  <div>
                    <h4 className="font-semibold">Consumo Alto</h4>
                    <p className="text-sm mt-1">
                      Las salidas ({estadisticas.totalSalidas.toLocaleString()}) superan a las entradas (
                      {estadisticas.totalEntradas.toLocaleString()}). Revise el patrón de consumo.
                    </p>
                  </div>
                </Alert>
              )}

              {/* Estado Normal */}
              {insumoActual &&
                insumoActual.estado === "normal" &&
                estadisticas.totalEntradas >= estadisticas.totalSalidas &&
                estadisticas.ultimoMovimiento &&
                new Date().getTime() - new Date(estadisticas.ultimoMovimiento.fecha).getTime() <=
                  30 * 24 * 60 * 60 * 1000 && (
                  <Alert className="border-green-200 text-green-700 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-semibold">Todo en Orden</h4>
                      <p className="text-sm mt-1">
                        No se detectaron alertas para este insumo. El stock y los movimientos están dentro de los
                        parámetros normales.
                      </p>
                    </div>
                  </Alert>
                )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
