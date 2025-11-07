"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  Calendar,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Box,
  ChevronsDownUp,
  ChevronsUpDown,
  FileDown,
  Info,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Added for Tooltip
import { FiltroSelectorInsumos } from "./filtro-selector-insumos"
import { PeriodoFilter } from "./periodo-filter"
import { categoriasConfig } from "@/lib/data"
import { useEstablishment } from "@/contexts/establishment-context"
import { useInsumosData } from "@/hooks/use-insumos-data"

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
  usuarioEspecifico?: string
  destinoEspecifico?: string
  claseInsumo?: string
  tipo?: string
  subtipo?: string
  tipoMovimiento: string[]
  almacenOrigen?: string
  tipoInsumo?: string
  subtipoInsumo?: string
  insumoEspecifico?: string
}

interface GestionInsumoEspecificoProps {
  categoria: string
  categoriaNombre: string
  categoriaEmoji: string
  onCategoriaChange?: (categoria: string) => void
}

const categoriaToId: Record<string, number> = {
  sales: 1,
  veterinarios: 2,
  agricolas: 3,
  materiales: 4,
  combustibles: 5,
  semillas: 6,
}

const formatearFechaLocal = (fechaISO: string): string => {
  // Parsear la fecha como local sin conversión de zona horaria
  const partes = fechaISO.split("-")
  if (partes.length === 3) {
    const [año, mes, dia] = partes
    return `${dia}/${mes}/${año}`
  }
  return fechaISO
}

export function GestionInsumoEspecifico({
  categoria,
  categoriaNombre,
  categoriaEmoji,
  onCategoriaChange,
}: GestionInsumoEspecificoProps) {
  const { establecimientoSeleccionado } = useEstablishment()

  const [claseInsumoSeleccionada, setClaseInsumoSeleccionada] = useState<number | undefined>(categoriaToId[categoria])
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<number | undefined>(undefined)

  // const [tiposInsumo, setTiposInsumo] = useState<any[]>([])
  // const [subtiposInsumo, setSubtiposInsumo] = useState<any[]>([])
  // const [loadingTipos, setLoadingTipos] = useState(false)
  // const [loadingSubtipos, setLoadingSubtipos] = useState(false)

  const { data: insumosData, loading, error, top3InsumosMes } = useInsumosData(claseInsumoSeleccionada, undefined)

  const [fechaDesdeGlobal, setFechaDesdeGlobal] = useState<Date | undefined>(undefined)
  const [fechaHastaGlobal, setFechaHastaGlobal] = useState<Date | undefined>(undefined)

  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    usuarioEspecifico: "",
    tipoMovimiento: [] as string[],
    // Removed from here:
    // fechaDesde: undefined as Date | undefined,
    // fechaHasta: undefined as Date | undefined,
    // tipoInsumo: "",
    // subtipoInsumo: "",
    // insumoEspecifico: "",
  })

  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 10

  const [tiposExpandidos, setTiposExpandidos] = useState<Set<string>>(new Set())
  const [subtiposExpandidos, setSubtiposExpandidos] = useState<Set<string>>(new Set())
  const [productosVisibles, setProductosVisibles] = useState<Record<string, number>>({})
  const PRODUCTOS_POR_PAGINA = 10

  const [todoExpandido, setTodoExpandido] = useState(false)

  const [showExportMenu, setShowExportMenu] = useState(false)

  // const cargarTiposInsumo = async (claseId: number) => { ... }
  // const cargarSubtiposInsumo = async (tipoId: string) => { ... }

  const tiposInsumo = useMemo(() => {
    if (!insumosData || !Array.isArray(insumosData)) {
      return []
    }

    const tiposMap = new Map<number, { id: number; nombre: string }>()
    insumosData.forEach((insumo) => {
      if (insumo.insumo_tipo_id && insumo.insumo_tipo_nombre) {
        tiposMap.set(insumo.insumo_tipo_id, {
          id: insumo.insumo_tipo_id,
          nombre: insumo.insumo_tipo_nombre,
        })
      }
    })

    return Array.from(tiposMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [insumosData])

  const subtiposInsumo = useMemo(() => {
    if (!insumosData || !Array.isArray(insumosData) || !filtrosAvanzados.tipoInsumo) {
      return []
    }

    const tipoIdSeleccionado = Number.parseInt(filtrosAvanzados.tipoInsumo)
    const subtiposMap = new Map<number, { id: number; nombre: string }>()

    insumosData
      .filter((insumo) => insumo.insumo_tipo_id === tipoIdSeleccionado)
      .forEach((insumo) => {
        if (insumo.insumo_subtipo_id && insumo.insumo_subtipo_nombre) {
          subtiposMap.set(insumo.insumo_subtipo_id, {
            id: insumo.insumo_subtipo_id,
            nombre: insumo.insumo_subtipo_nombre,
          })
        }
      })

    return Array.from(subtiposMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [insumosData, filtrosAvanzados.tipoInsumo])

  const calcularConsumoMensual = (producto: any) => {
    const insumo = insumosData?.find((i) => i.pd_id === producto.producto_id)
    if (!insumo?.pd_detalles?.movimientos_asociados) {
      return 0
    }

    // Calcular fecha de hace 30 días desde hoy o desde fechaHastaGlobal
    const fechaFin = fechaHastaGlobal || new Date()
    const fechaInicio = new Date(fechaFin)
    fechaInicio.setDate(fechaFin.getDate() - 30)

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0]
    const fechaFinStr = fechaFin.toISOString().split("T")[0]

    // Filtrar movimientos de salida de los últimos 30 días
    const movimientos = insumo.pd_detalles.movimientos_asociados.filter(
      (mov) => mov.tipo_movimiento === "SALIDA" && mov.fecha >= fechaInicioStr && mov.fecha <= fechaFinStr,
    )

    const totalSalidas = movimientos.reduce((sum, mov) => sum + mov.cantidad, 0)

    return totalSalidas
  }

  const calcularDiasRestantes = (stockActual: number, consumoMensual: number) => {
    if (consumoMensual === 0) {
      return 999 // Infinite days if no consumption
    }
    const consumoDiario = consumoMensual / 30
    return Math.floor(stockActual / consumoDiario)
  }

  const toggleTipo = (tipoNombre: string) => {
    setTiposExpandidos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tipoNombre)) {
        newSet.delete(tipoNombre)
      } else {
        newSet.add(tipoNombre)
      }
      return newSet
    })
  }

  const toggleSubtipo = (subtipoKey: string) => {
    setSubtiposExpandidos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subtipoKey)) {
        newSet.delete(subtipoKey)
      } else {
        newSet.add(subtipoKey)
      }
      return newSet
    })
  }

  const toggleExpandirTodos = () => {
    if (todoExpandido) {
      // Collapse all
      setTiposExpandidos(new Set())
      setSubtiposExpandidos(new Set())
      setProductosVisibles({})
      setTodoExpandido(false)
    } else {
      // Expand all
      const allTipos = new Set(resumenPorTipo.map((t) => t.tipo_nombre))
      const allSubtipos = new Set<string>()
      resumenPorTipo.forEach((tipo) => {
        tipo.subtipos.forEach((subtipo) => {
          allSubtipos.add(`${tipo.tipo_nombre}-${subtipo.subtipo_nombre}`)
        })
      })
      setTiposExpandidos(allTipos)
      setSubtiposExpandidos(allSubtipos)
      setTodoExpandido(true)
    }
  }

  const mostrarMasProductos = (subtipoKey: string, currentCount: number) => {
    setProductosVisibles((prev) => ({
      ...prev,
      [subtipoKey]: currentCount + PRODUCTOS_POR_PAGINA,
    }))
  }

  const resumenPorTipo = useMemo(() => {
    if (!insumosData || !Array.isArray(insumosData)) {
      return []
    }

    const tiposMap = new Map<
      string,
      {
        tipo_id: number
        tipo_nombre: string
        subtipos: Array<{
          subtipo_id: number
          subtipo_nombre: string
          productos: Array<{
            producto_id: number
            producto_nombre: string
            entradas: number
            salidas: number
            stock_actual: number
            stock_total_contenido: number
            unidad: string
            contenido_por_unidad: number
            unidad_uso: string
          }>
        }>
      }
    >()

    insumosData.forEach((insumo) => {
      const tipoNombre = insumo.insumo_tipo_nombre || "Sin tipo"
      const tipoId = insumo.insumo_tipo_id || 0
      const subtipoNombre = insumo.insumo_subtipo_nombre || "Sin subtipo"
      const subtipoId = insumo.insumo_subtipo_id || 0
      const productoNombre = insumo.pd_nombre || "Sin nombre"
      const productoId = insumo.pd_id || 0
      const unidad = insumo.unidad_medida_producto_nombre || "unidad"
      const contenidoPorUnidad = insumo.contenido || 1
      const unidadUso = insumo.unidad_medida_uso_nombre || "kg"

      // Calculate entradas and salidas from movements
      const movimientos = insumo.pd_detalles?.movimientos_asociados || []
      const entradas = movimientos
        .filter((mov) => mov.tipo_movimiento === "ENTRADA")
        .reduce((sum, mov) => sum + mov.cantidad, 0)
      const salidas = movimientos
        .filter((mov) => mov.tipo_movimiento === "SALIDA")
        .reduce((sum, mov) => sum + mov.cantidad, 0)
      const stockActual = insumo.stock_total || 0
      const stockTotalContenido = insumo.stock_total_contenido || 0

      // Get or create tipo entry
      if (!tiposMap.has(tipoNombre)) {
        tiposMap.set(tipoNombre, {
          tipo_id: tipoId,
          tipo_nombre: tipoNombre,
          subtipos: [],
        })
      }

      const tipoEntry = tiposMap.get(tipoNombre)!

      // Find or create subtipo entry
      let subtipoEntry = tipoEntry.subtipos.find((s) => s.subtipo_nombre === subtipoNombre)
      if (!subtipoEntry) {
        subtipoEntry = {
          subtipo_id: subtipoId,
          subtipo_nombre: subtipoNombre,
          productos: [],
        }
        tipoEntry.subtipos.push(subtipoEntry)
      }

      // Add product to subtipo
      subtipoEntry.productos.push({
        producto_id: productoId,
        producto_nombre: productoNombre,
        entradas,
        salidas,
        stock_actual: stockActual,
        stock_total_contenido: stockTotalContenido,
        unidad,
        contenido_por_unidad: contenidoPorUnidad,
        unidad_uso: unidadUso,
      })
    })

    // Sort everything
    const result = Array.from(tiposMap.values()).sort((a, b) => a.tipo_nombre.localeCompare(b.tipo_nombre))
    result.forEach((tipo) => {
      tipo.subtipos.sort((a, b) => a.subtipo_nombre.localeCompare(b.subtipo_nombre))
      tipo.subtipos.forEach((subtipo) => {
        subtipo.productos.sort((a, b) => a.producto_nombre.localeCompare(b.producto_nombre))
      })
    })

    return result
  }, [insumosData])

  useEffect(() => {
    setTiposExpandidos(new Set())
    setSubtiposExpandidos(new Set())
    setProductosVisibles({})
    setTodoExpandido(false)
  }, [claseInsumoSeleccionada])

  useEffect(() => {
    if (resumenPorTipo.length > 0 && tiposExpandidos.size === 0) {
      const tiposConProductos = new Set<string>()
      const subtiposConProductos = new Set<string>()

      resumenPorTipo.forEach((tipo) => {
        tipo.subtipos.forEach((subtipo) => {
          // Expand if there are any products, not just products with stock
          if (subtipo.productos.length > 0) {
            tiposConProductos.add(tipo.tipo_nombre)
            subtiposConProductos.add(`${tipo.tipo_nombre}-${subtipo.subtipo_nombre}`)
          }
        })
      })

      setTiposExpandidos(tiposConProductos)
      setSubtiposExpandidos(subtiposConProductos)
    }
  }, [resumenPorTipo])

  useEffect(() => {
    const nuevaClaseId = categoriaToId[categoria]
    setClaseInsumoSeleccionada(nuevaClaseId)
    setInsumoSeleccionado(undefined)
    // if (nuevaClaseId) {
    //   cargarTiposInsumo(nuevaClaseId)
    // }
    // setFiltrosAvanzados((prev) => ({
    //   ...prev,
    //   tipoInsumo: "",
    //   subtipoInsumo: "",
    //   insumoEspecifico: "",
    // }))
  }, [categoria])

  // useEffect(() => {
  //   if (filtrosAvanzados.tipoInsumo) {
  //     cargarSubtiposInsumo(filtrosAvanzados.tipoInsumo)
  //   } else {
  //     setSubtiposInsumo([])
  //     setFiltrosAvanzados((prev) => ({ ...prev, subtipoInsumo: "" }))
  //   }
  // }, [filtrosAvanzados.tipoInsumo])

  useEffect(() => {
    if (insumoSeleccionado) {
      // Keep insumo selection in component state only
      // Removed setting insumoEspecifico in filtrosAvanzados
      // setFiltrosAvanzados((prev) => ({
      //   ...prev,
      //   insumoEspecifico: insumoSeleccionado.toString(),
      // }))
    } else {
      // Removed clearing insumoEspecifico from filtrosAvanzados
      // setFiltrosAvanzados((prev) => ({
      //   ...prev,
      //   insumoEspecifico: "",
      // }))
    }
  }, [insumoSeleccionado])

  const opcionesInsumos = useMemo(() => {
    if (!insumosData || !Array.isArray(insumosData)) {
      return []
    }

    return insumosData.map((insumo) => ({
      id: insumo.pd_id.toString(),
      tipo: insumo.pd_tipo,
      nombre: insumo.pd_nombre,
      clase: insumo.insumo_clase_nombre,
      tipoNombre: insumo.insumo_tipo_nombre,
      subtipoNombre: insumo.insumo_subtipo_nombre,
    }))
  }, [insumosData])

  const usuariosDisponibles = useMemo(() => {
    const usuarios = new Set<string>()
    if (insumosData && Array.isArray(insumosData)) {
      insumosData.forEach((insumo) => {
        if (insumo?.pd_detalles?.movimientos_asociados && Array.isArray(insumo.pd_detalles.movimientos_asociados)) {
          insumo.pd_detalles.movimientos_asociados.forEach((mov) => {
            if (mov?.usuario) {
              usuarios.add(mov.usuario)
            }
          })
        }
      })
    }
    return Array.from(usuarios).sort()
  }, [insumosData])

  const movimientosParaTabla = useMemo(() => {
    let movimientos: any[] = []

    if (!insumosData || !Array.isArray(insumosData)) {
      return []
    }

    if (insumoSeleccionado) {
      const insumo = insumosData.find((i) => i.pd_id === insumoSeleccionado)
      if (insumo?.pd_detalles?.movimientos_asociados && Array.isArray(insumo.pd_detalles.movimientos_asociados)) {
        movimientos = insumo.pd_detalles.movimientos_asociados.map((mov) => ({
          ...mov,
          insumo_nombre: insumo.pd_nombre,
          insumo_id: insumo.pd_id,
          unidad_medida: insumo.unidad_medida_nombre,
        }))
      }
    } else {
      insumosData.forEach((insumo) => {
        if (insumo?.pd_detalles?.movimientos_asociados && Array.isArray(insumo.pd_detalles.movimientos_asociados)) {
          const movimientosInsumo = insumo.pd_detalles.movimientos_asociados.map((mov) => ({
            ...mov,
            insumo_nombre: insumo.pd_nombre,
            insumo_id: insumo.pd_id,
            unidad_medida: insumo.unidad_medida_nombre,
          }))
          movimientos.push(...movimientosInsumo)
        }
      })
    }

    let movimientosFiltrados = movimientos

    if (fechaDesdeGlobal) {
      const fechaDesdeStr = fechaDesdeGlobal.toISOString().split("T")[0]
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.fecha >= fechaDesdeStr)
    }
    if (fechaHastaGlobal) {
      const fechaHasta = new Date(fechaHastaGlobal)
      fechaHasta.setDate(fechaHasta.getDate() + 1)
      const fechaHastaStr = fechaHasta.toISOString().split("T")[0]
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.fecha < fechaHastaStr)
    }

    if (filtrosAvanzados.usuarioEspecifico && filtrosAvanzados.usuarioEspecifico !== "all") {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.usuario === filtrosAvanzados.usuarioEspecifico)
    }

    if (filtrosAvanzados.tipoMovimiento.length > 0) {
      movimientosFiltrados = movimientosFiltrados.filter((mov) =>
        filtrosAvanzados.tipoMovimiento.includes(mov.tipo_movimiento),
      )
    }

    if (filtrosAvanzados.tipoInsumo) {
      const insumosFiltrados = insumosData.filter(
        (insumo) => insumo.insumo_tipo_id?.toString() === filtrosAvanzados.tipoInsumo,
      )
      const idsInsumosFiltrados = insumosFiltrados.map((i) => i.pd_id)
      movimientosFiltrados = movimientosFiltrados.filter((mov) => idsInsumosFiltrados.includes(mov.insumo_id))
    }

    if (filtrosAvanzados.subtipoInsumo) {
      const insumosFiltrados = insumosData.filter(
        (insumo) => insumo.insumo_subtipo_id?.toString() === filtrosAvanzados.subtipoInsumo,
      )
      const idsInsumosFiltrados = insumosFiltrados.map((i) => i.pd_id)
      movimientosFiltrados = movimientosFiltrados.filter((mov) => idsInsumosFiltrados.includes(mov.insumo_id))
    }

    return movimientosFiltrados.sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime()
      const fechaB = new Date(b.fecha).getTime()

      if (fechaA !== fechaB) {
        return fechaB - fechaA
      }

      const horaA = a.hora ? new Date(`1970-01-01T${a.hora}`).getTime() : 0
      const horaB = b.hora ? new Date(`1970-01-01T${b.hora}`).getTime() : 0

      return horaB - horaA
    })
  }, [insumosData, fechaDesdeGlobal, fechaHastaGlobal, filtrosAvanzados, insumoSeleccionado])

  const totalRegistros = movimientosParaTabla.length
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina)
  const indiceInicio = (paginaActual - 1) * registrosPorPagina
  const movimientosPaginados = movimientosParaTabla.slice(indiceInicio, indiceInicio + registrosPorPagina)

  const handleCategoriaChange = (nuevaCategoria: string) => {
    if (onCategoriaChange) {
      onCategoriaChange(nuevaCategoria)
    }
  }

  const handleInsumoSelection = (insumo: any) => {
    const insumoId = insumo ? Number.parseInt(insumo.id) : undefined
    setInsumoSeleccionado(insumoId)
  }

  const handleProductoSeleccionDesdeTabla = (productoId: number) => {
    setInsumoSeleccionado(productoId)
  }

  const handleLimpiarFiltros = () => {
    setFiltrosAvanzados({
      usuarioEspecifico: "",
      tipoMovimiento: [],
      // Removed from here:
      // fechaDesde: undefined,
      // fechaHasta: undefined,
      // tipoInsumo: "",
      // subtipoInsumo: "",
      // insumoEspecifico: "",
    })
    setInsumoSeleccionado(undefined)
    setBusqueda("")
    setPaginaActual(1)
    setFechaDesdeGlobal(undefined)
    setFechaHastaGlobal(undefined)
    // setPeriodoGlobal("all") // This was removed in the changes, so it's no longer here.
  }

  const handleTipoMovimientoChange = (tipo: string, checked: boolean) => {
    setFiltrosAvanzados((prev) => {
      if (checked) {
        // Only allow one type of movement to be selected at a time
        return {
          ...prev,
          tipoMovimiento: [tipo],
        }
      } else {
        return {
          ...prev,
          tipoMovimiento: prev.tipoMovimiento.filter((t) => t !== tipo),
        }
      }
    })
  }

  const handleExport = async (format: "pdf" | "xlsx") => {
    setShowExportMenu(false)
    try {
      console.log("[v0] Iniciando exportación", format)

      const dataToExport = movimientosParaTabla.map((mov) => ({
        Fecha: mov.fecha.split("-").reverse().join("/"),
        Tipo: mov.tipo_movimiento === "ENTRADA" ? "Entrada" : "Salida",
        Insumo: mov.insumo_nombre,
        Cantidad: mov.cantidad,
        "Tipo Movimiento": mov.tipo_movimiento_insumo_nombre,
        Usuario: mov.usuario,
        Observaciones: mov.nota || "-",
      }))

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf")
        const autoTable = (await import("jspdf-autotable")).default
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height
        const primaryColor = [140, 156, 120]

        // Intentar agregar logo
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = "anonymous"
          logoImg.src = "/logo-parte-diario.png"
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = () => resolve(null)
            setTimeout(reject, 3000)
          })
          doc.addImage(logoImg, "PNG", pageWidth - 40, 10, 30, 30)
        } catch {}

        // Encabezado
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(0, 0, pageWidth, 50, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(24)
        doc.text("REPORTE DE INSUMOS", 20, 25)
        doc.setFontSize(16)
        doc.text("Historial de Movimientos", 20, 35)

        // Información del reporte
        doc.setTextColor(60, 60, 60)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        const fechaGeneracion = new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        doc.setFillColor(248, 249, 250)
        doc.rect(20, 65, pageWidth - 40, 30, "F")
        doc.setDrawColor(220, 220, 220)
        doc.rect(20, 65, pageWidth - 40, 30, "S")
        doc.setFont("helvetica", "bold")
        doc.text("Categoría:", 25, 75)
        doc.setFont("helvetica", "normal")
        doc.text(categoriaNombre, 25, 85)
        doc.setFont("helvetica", "bold")
        doc.text("Fecha de generación:", 25, 95)
        doc.setFont("helvetica", "normal")
        doc.text(fechaGeneracion, 25, 105)

        let yPosition = 105
        const filtrosActivos: string[] = []

        if (insumoSeleccionado) {
          const insumoNombre = opcionesInsumos.find((i) => Number.parseInt(i.id) === insumoSeleccionado)?.nombre
          if (insumoNombre) {
            filtrosActivos.push(`Insumo: ${insumoNombre}`)
          }
        }
        if (fechaDesdeGlobal) {
          filtrosActivos.push(`Fecha desde: ${fechaDesdeGlobal.toLocaleDateString("es-ES")}`)
        }
        if (fechaHastaGlobal) {
          filtrosActivos.push(`Fecha hasta: ${fechaHastaGlobal.toLocaleDateString("es-ES")}`)
        }
        if (filtrosAvanzados.usuarioEspecifico && filtrosAvanzados.usuarioEspecifico !== "all") {
          filtrosActivos.push(`Usuario: ${filtrosAvanzados.usuarioEspecifico}`)
        }
        if (filtrosAvanzados.tipoMovimiento.length > 0) {
          filtrosActivos.push(`Tipo de movimiento: ${filtrosAvanzados.tipoMovimiento.join(", ")}`)
        }
        if (filtrosAvanzados.tipoInsumo) {
          const tipoNombre = tiposInsumo.find((t) => t.id.toString() === filtrosAvanzados.tipoInsumo)?.nombre
          if (tipoNombre) {
            filtrosActivos.push(`Tipo de insumo: ${tipoNombre}`)
          }
        }
        if (filtrosAvanzados.subtipoInsumo) {
          const subtipoNombre = subtiposInsumo.find((s) => s.id.toString() === filtrosAvanzados.subtipoInsumo)?.nombre
          if (subtipoNombre) {
            filtrosActivos.push(`Subtipo de insumo: ${subtipoNombre}`)
          }
        }

        if (filtrosActivos.length > 0) {
          const alturaFiltros = Math.max(35, 15 + filtrosActivos.length * 6)
          yPosition += 10
          doc.setFillColor(233, 246, 255)
          doc.rect(20, yPosition, pageWidth - 40, alturaFiltros, "F")
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(20, yPosition, pageWidth - 40, alturaFiltros, "S")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(11)
          doc.text("Filtros aplicados:", 25, yPosition + 10)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(10)
          let filterY = yPosition + 18

          filtrosActivos.forEach((filtro) => {
            doc.text(`• ${filtro}`, 25, filterY)
            filterY += 6
          })
          yPosition += alturaFiltros + 10
        } else {
          yPosition += 10
        }

        const tableData = dataToExport.map((item) => [
          item.Fecha,
          item.Tipo,
          item.Insumo,
          item.Cantidad.toLocaleString(),
          item["Tipo Movimiento"],
          item.Usuario,
          item.Observaciones,
        ])

        autoTable(doc, {
          head: [["Fecha", "Tipo", "Insumo", "Cantidad", "Tipo Movimiento", "Usuario", "Observaciones"]],
          body: tableData,
          startY: yPosition,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            halign: "center",
            valign: "middle",
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 4,
            halign: "center",
            minCellHeight: 10,
          },
          alternateRowStyles: { fillColor: [248, 249, 250] },
          columnStyles: {
            0: { cellWidth: 22, halign: "center" },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 35, halign: "left" },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 28, halign: "center" },
            5: { cellWidth: 25, halign: "center" },
            6: { cellWidth: 35, halign: "left" },
          },
          margin: { left: 10, right: 10 },
          tableWidth: "auto",
          didDrawPage: () => {
            const pageNumber = doc.internal.getCurrentPageInfo().pageNumber
            const totalPages = doc.internal.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(128, 128, 128)
            doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - 30, pageHeight - 10, { align: "right" })
            doc.text("Generado por Parte Diario", 20, pageHeight - 10)
          },
        })

        const fileName = `historial_insumos_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      } else {
        // Exportar a Excel
        try {
          const XLSX = await import("xlsx")
          const ws = XLSX.utils.json_to_sheet(dataToExport)
          const wb = XLSX.utils.book_new()
          XLSX.utils.book_append_sheet(wb, ws, "Movimientos")
          // @ts-ignore
          ws["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 30 }]
          const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
          const blob = new Blob([wbout], { type: "application/octet-stream" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `historial_insumos_${new Date().toISOString().split("T")[0]}.xlsx`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (xlsxError) {
          console.log("[v0] XLSX failed, using CSV fallback:", xlsxError)
          // Fallback a CSV
          const headers = Object.keys(dataToExport[0])
          const csvContent = [
            headers.join(","),
            ...dataToExport.map((row) =>
              headers
                .map((header) => {
                  const value = row[header as keyof typeof row]
                  if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`
                  }
                  return value
                })
                .join(","),
            ),
          ].join("\n")
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
          const link = document.createElement("a")
          const url = URL.createObjectURL(blob)
          link.setAttribute("href", url)
          link.setAttribute("download", `historial_insumos_${new Date().toISOString().split("T")[0]}.csv`)
          link.style.visibility = "hidden"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }

      console.log("[v0] Exportación completada exitosamente")
    } catch (error) {
      console.error("[v0] Error exporting:", error)
      alert(`Error al exportar el archivo ${format.toUpperCase()}. Intenta de nuevo.`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando datos de insumos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-red-600">
          <p>Error al cargar datos: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-sm rounded-xl border border-[#E57EB]" style={{ minHeight: "68px" }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Class selector and Insumo search */}
            <div className="flex items-center gap-4 flex-1">
              {/* Class Selector */}
              <div className="min-w-[220px]">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Clase de Insumo</label>
                <Select value={categoria} onValueChange={handleCategoriaChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{categoriasConfig[categoria]?.emoji}</span>
                        <span className="text-sm">{categoriasConfig[categoria]?.nombre}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriasConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{config.emoji}</span>
                          <span className="text-sm">{config.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Insumo Search/Selector - Always visible */}
              <div className="min-w-[280px]">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Insumo</label>
                <FiltroSelectorInsumos
                  insumos={opcionesInsumos}
                  onSelectionChange={handleInsumoSelection}
                  placeholder="Buscar o seleccionar insumo…"
                  className="w-full"
                  selectedInsumoId={insumoSeleccionado}
                />
              </div>
            </div>

            {/* Right side: Period filter */}
            <div className="min-w-[280px]">
              <PeriodoFilter
                onPeriodChange={(period, range) => {
                  setFechaDesdeGlobal(range.start || undefined)
                  setFechaHastaGlobal(range.end || undefined)
                }}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {insumoSeleccionado && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInsumoSeleccionado(undefined)}
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a vista general
          </Button>
        </div>
      )}

      {!insumoSeleccionado && (
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: insumoSeleccionado ? 0 : 1,
            transform: insumoSeleccionado ? "translateY(-10px)" : "translateY(0)",
          }}
        >
          <Card className="shadow-sm rounded-2xl">
            <CardHeader className="pb-3 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#4285F4]" />
                  <CardTitle className="text-lg">Resumen de Stock por Tipo</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpandirTodos}
                  className="text-xs bg-transparent transition-all"
                >
                  {todoExpandido ? (
                    <>
                      <ChevronsUpDown className="w-4 h-4 mr-1" />
                      Contraer Todo
                    </>
                  ) : (
                    <>
                      <ChevronsDownUp className="w-4 h-4 mr-1" />
                      Expandir Todo
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F9FAFB] border-b border-[#E57EB]">
                      <TableHead className="text-xs uppercase text-[#6B7280] font-semibold">Producto</TableHead>
                      <TableHead className="text-xs uppercase text-[#6B7280] font-semibold text-center">
                        Stock Actual
                      </TableHead>
                      <TableHead className="text-xs uppercase text-[#6B7280] font-semibold text-center">
                        Consumo Mensual
                      </TableHead>
                      <TableHead className="text-xs uppercase text-[#6B7280] font-semibold text-center">
                        Días Restantes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenPorTipo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No hay datos de stock disponibles
                        </TableCell>
                      </TableRow>
                    ) : (
                      resumenPorTipo.map((tipo, tipoIndex) => {
                        const isTipoExpanded = tiposExpandidos.has(tipo.tipo_nombre)

                        return (
                          <>
                            {/* Tipo Header Row */}
                            <TableRow
                              key={`tipo-${tipo.tipo_id}`}
                              className="bg-[#F5F6F7] cursor-pointer hover:bg-[#ECEDEF] transition-colors duration-200"
                              onClick={() => toggleTipo(tipo.tipo_nombre)}
                            >
                              <TableCell colSpan={4} className="py-1.5 px-3">
                                <div className="flex items-center gap-2">
                                  {isTipoExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-700" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-700" />
                                  )}
                                  <span className="text-xs font-semibold uppercase text-[#374151] tracking-wide">
                                    {tipo.tipo_nombre}
                                  </span>
                                  <span className="text-xs text-gray-500 font-normal">
                                    ({tipo.subtipos.length} subtipo{tipo.subtipos.length !== 1 ? "s" : ""})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Subtipo and Product Rows */}
                            {isTipoExpanded &&
                              tipo.subtipos.map((subtipo, subtipoIndex) => {
                                const subtipoKey = `${tipo.tipo_nombre}-${subtipo.subtipo_nombre}`
                                const isSubtipoExpanded = subtiposExpandidos.has(subtipoKey)
                                const productosVisiblesCount = productosVisibles[subtipoKey] || PRODUCTOS_POR_PAGINA
                                const productosAMostrar = subtipo.productos.slice(0, productosVisiblesCount)
                                const hayMasProductos = subtipo.productos.length > productosVisiblesCount
                                const bgColor = subtipoIndex % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"

                                return (
                                  <>
                                    {/* Subtipo Header Row */}
                                    <TableRow
                                      key={`subtipo-${subtipo.subtipo_id}`}
                                      className={`${bgColor} cursor-pointer hover:bg-gray-50 transition-colors duration-200`}
                                      onClick={() => toggleSubtipo(subtipoKey)}
                                    >
                                      <TableCell colSpan={4} className="py-1 px-3">
                                        <div className="flex items-center gap-2">
                                          {isSubtipoExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                                          )}
                                          <span className="text-[13px] font-medium text-[#6B7280]">
                                            {subtipo.subtipo_nombre}
                                          </span>
                                          <span className="text-xs text-[#9CA3AF]">({subtipo.productos.length})</span>
                                        </div>
                                      </TableCell>
                                    </TableRow>

                                    {/* Product Rows */}
                                    {isSubtipoExpanded &&
                                      productosAMostrar.map((producto) => {
                                        const stockTotal = producto.stock_actual
                                        const stockTotalContenido = producto.stock_total_contenido
                                        const consumoMensual = calcularConsumoMensual(producto)
                                        const diasRestantes = calcularDiasRestantes(
                                          producto.stock_actual,
                                          consumoMensual,
                                        )

                                        let diasColor = "#16A34A" // Green
                                        if (diasRestantes < 15) {
                                          diasColor = "#DC2626" // Red
                                        } else if (diasRestantes < 30) {
                                          diasColor = "#F59E0B" // Amber
                                        }

                                        return (
                                          <TableRow
                                            key={`producto-${producto.producto_id}`}
                                            className={`${bgColor} cursor-pointer hover:bg-[#F9FAFB] transition-all duration-200 border-b border-[#F0F0F0]`}
                                            onClick={() => handleProductoSeleccionDesdeTabla(producto.producto_id)}
                                            style={{ height: "36px" }}
                                          >
                                            {/* Producto Column */}
                                            <TableCell className="py-1 px-3">
                                              <span className="text-[13.5px] font-semibold text-[#111827]">
                                                {producto.producto_nombre}
                                              </span>
                                            </TableCell>

                                            {/* Stock Actual Column (with secondary line) */}
                                            <TableCell className="py-1 px-3 text-center">
                                              <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center justify-center gap-1">
                                                  <span className="text-[13px] font-semibold text-[#2563EB]">
                                                    {stockTotal.toLocaleString("es-ES")}
                                                  </span>
                                                  <span className="text-[13px] font-semibold text-[#2563EB]">
                                                    {producto.unidad_uso}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1">
                                                  <span className="text-xs text-[#6B7280]">
                                                    {stockTotalContenido.toLocaleString("es-ES")} {producto.unidad}
                                                  </span>
                                                </div>
                                              </div>
                                            </TableCell>

                                            {/* Consumo Mensual Column */}
                                            <TableCell className="py-1 px-3 text-center">
                                              <span className="text-[12.5px] text-[#374151]">
                                                {consumoMensual > 0
                                                  ? `${Math.round(consumoMensual)} ${producto.unidad_uso}/mes`
                                                  : "Sin datos"}
                                              </span>
                                            </TableCell>

                                            {/* Días Restantes Column */}
                                            <TableCell className="py-1 px-3 text-center">
                                              <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-base">⏳</span>
                                                <span
                                                  className="text-[13px] font-semibold"
                                                  style={{ color: diasColor }}
                                                >
                                                  {diasRestantes > 365 ? "365+" : diasRestantes} días
                                                </span>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}

                                    {/* Show More Button */}
                                    {isSubtipoExpanded && hayMasProductos && (
                                      <TableRow className={bgColor}>
                                        <TableCell colSpan={4} className="py-2 text-center">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              mostrarMasProductos(subtipoKey, productosVisiblesCount)
                                            }}
                                            className="text-[#4285F4] hover:text-[#4285F4]/80 text-xs h-7"
                                          >
                                            <ChevronDown className="w-3.5 h-3.5 mr-1" />
                                            Mostrar más ({subtipo.productos.length - productosVisiblesCount})
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                )
                              })}
                          </>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {insumoSeleccionado &&
        (() => {
          const insumoData = insumosData?.find((i) => i.pd_id === insumoSeleccionado)
          if (!insumoData) return null

          const movimientos = insumoData.pd_detalles?.movimientos_asociados || []

          const totalEntradas = movimientos
            .filter((mov) => mov.tipo_movimiento === "ENTRADA")
            .reduce((sum, mov) => sum + mov.cantidad, 0)

          const totalSalidas = movimientos
            .filter((mov) => mov.tipo_movimiento === "SALIDA")
            .reduce((sum, mov) => sum + mov.cantidad, 0)

          const ultimoMovimiento =
            movimientos.length > 0
              ? movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
              : null

          const fechaUltimoMovimiento = ultimoMovimiento
            ? formatearFechaLocal(ultimoMovimiento.fecha)
            : "Sin movimientos"

          const stockActual = insumoData.stock_total || 0
          const inventarioInicial = stockActual - totalEntradas + totalSalidas

          // Calculate consumo diario promedio
          const consumoDiarioPromedio =
            fechaDesdeGlobal && fechaHastaGlobal
              ? (() => {
                  const diasEnRango = Math.max(
                    1,
                    Math.ceil((fechaHastaGlobal.getTime() - fechaDesdeGlobal.getTime()) / (1000 * 60 * 60 * 24)),
                  )
                  return totalSalidas / diasEnRango
                })()
              : 0

          // Calculate días restantes
          const diasRestantes = consumoDiarioPromedio > 0 ? Math.floor(stockActual / consumoDiarioPromedio) : 999

          return (
            <div
              className="transition-all duration-300 ease-in-out animate-in fade-in-0 slide-in-from-top-4"
              style={{
                opacity: insumoSeleccionado ? 1 : 0,
                transform: insumoSeleccionado ? "translateY(0)" : "translateY(-10px)",
              }}
            >
              <div className="mb-4">
                <h2 className="text-[18px] font-semibold text-[#111827]">{insumoData.pd_nombre}</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Detalle completo del insumo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Stock Total Card */}
                <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Stock Total</p>
                        <p className="text-[22px] font-bold text-[#2563EB]">{stockActual}</p>
                        <p className="text-xs text-gray-500">{insumoData.unidad_medida_uso_nombre}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-[#2563EB]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Entradas Card */}
                <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Entradas</p>
                        <p className="text-[22px] font-bold text-[#16A34A]">{totalEntradas}</p>
                        <p className="text-xs text-gray-500">{insumoData.unidad_medida_uso_nombre}</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#16A34A]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Salidas Card */}
                <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Salidas</p>
                        <p className="text-[22px] font-bold text-[#DC2626]">{totalSalidas}</p>
                        <p className="text-xs text-gray-500">{insumoData.unidad_medida_uso_nombre}</p>
                      </div>
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#DC2626] rotate-180" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consumo Diario Promedio Card */}
                <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs text-gray-600">Consumo Diario Promedio</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Promedio de consumo diario basado en el período seleccionado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-[22px] font-bold text-[#F59E0B]">
                          {consumoDiarioPromedio > 0
                            ? consumoDiarioPromedio.toLocaleString("es-ES", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })
                            : "0"}
                        </p>
                        <p className="text-xs text-gray-500">{insumoData.unidad_medida_uso_nombre}</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Box className="w-5 h-5 text-[#F59E0B]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Días Restantes Card */}
                <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Días Restantes</p>
                        <p className="text-[22px] font-bold text-[#9333EA]">
                          {diasRestantes > 365 ? "365+" : diasRestantes}
                        </p>
                        <p className="text-xs text-gray-500">estimados</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-[#9333EA]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* START CHANGED SECTION */}
              <Card className="bg-white border border-[#E57EB] rounded-[10px] shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3 p-6">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Box className="w-5 h-5 text-gray-600" />
                    Detalle de Insumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
                    {/* Left column */}
                    {/* Tipo/Subtipo de Insumo */}
                    <div>
                      <p className="text-[13px] font-medium text-[#6B7280] mb-1">Tipo/Subtipo de Insumo</p>
                      <p className="text-[14px] font-semibold text-[#111827]">
                        {insumoData.insumo_tipo_nombre || "No especificado"} /{" "}
                        {insumoData.insumo_subtipo_nombre || "No especificado"}
                      </p>
                    </div>

                    {/* Right column */}
                    {/* Unidad de Medida de Uso */}
                    <div>
                      <p className="text-[13px] font-medium text-[#6B7280] mb-1">Unidad de Medida de Uso</p>
                      <p className="text-[14px] font-semibold text-[#111827]">
                        {insumoData.unidad_medida_uso_nombre || "No especificado"}
                      </p>
                    </div>

                    {/* Left column */}
                    <div>
                      <p className="text-[13px] font-medium text-[#6B7280] mb-1">Contenido por Unidad</p>
                      <p className="text-[14px] font-semibold text-[#111827]">
                        {insumoData.contenido || 0} {insumoData.unidad_medida_producto_nombre || "kg"}
                      </p>
                    </div>

                    {/* Right column */}
                    {/* Último Movimiento */}
                    <div>
                      <p className="text-[13px] font-medium text-[#6B7280] mb-1">Último Movimiento</p>
                      <p className="text-[14px] font-semibold text-[#111827]">{fechaUltimoMovimiento}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* END CHANGED SECTION */}
            </div>
          )
        })()}

      <Card className="shadow-sm rounded-2xl">
        <CardHeader className="pb-3 p-4">
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Movimientos</CardTitle>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="text-xs hover:bg-[#F9FAFB] transition-colors bg-transparent"
              >
                <FileDown className="w-4 h-4 mr-1.5" />
                Exportar
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>

              {showExportMenu && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-40">
                  <div className="py-1">
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                      onClick={() => handleExport("xlsx")}
                    >
                      <span>📊</span>
                      Excel
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                      onClick={() => handleExport("pdf")}
                    >
                      <span>📄</span>
                      PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <p className="text-[13px] text-[#6B7280]">
            {insumoSeleccionado || fechaDesdeGlobal
              ? `Mostrando movimientos para el período seleccionado.`
              : "Mostrando todos los movimientos."}
          </p>

          <div className="flex items-center gap-3 pb-4 border-b border-[#E57EB]">
            {/* Search input on the left */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar movimientos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Advanced Filters dropdown on the right */}
            <Collapsible open={filtrosAvanzadosAbiertos} onOpenChange={setFiltrosAvanzadosAbiertos}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap bg-transparent">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avanzados
                  {filtrosAvanzadosAbiertos ? (
                    <ChevronUp className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute right-4 mt-2 w-[400px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <div className="space-y-4">
                  {/* Conditional rendering based on insumo selection */}
                  {!insumoSeleccionado && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de insumo</label>
                        <Select
                          value={filtrosAvanzados.tipoInsumo || ""}
                          onValueChange={(value) => {
                            setFiltrosAvanzados((prev) => ({
                              ...prev,
                              tipoInsumo: value,
                              subtipoInsumo: "",
                            }))
                            // This part is removed as the useEffect handling this was also removed
                            // if (value && value !== "0") {
                            //   cargarSubtiposInsumo(value);
                            // } else {
                            //   setSubtiposInsumo([]);
                            //   setFiltrosAvanzados((prev) => ({ ...prev, subtipoInsumo: "" }));
                            // }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los tipos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Todos los tipos</SelectItem>
                            {tiposInsumo.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id.toString()}>
                                {tipo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subtipo de insumo</label>
                        <Select
                          value={filtrosAvanzados.subtipoInsumo || ""}
                          onValueChange={(value) => setFiltrosAvanzados((prev) => ({ ...prev, subtipoInsumo: value }))}
                          disabled={!filtrosAvanzados.tipoInsumo}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los subtipos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Todos los subtipos</SelectItem>
                            {subtiposInsumo.map((subtipo) => (
                              <SelectItem key={subtipo.id} value={subtipo.id.toString()}>
                                {subtipo.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Insumo</label>
                        <FiltroSelectorInsumos
                          insumos={opcionesInsumos}
                          onSelectionChange={(insumo) => {
                            const insumoId = insumo ? Number.parseInt(insumo.id) : undefined
                            setInsumoSeleccionado(insumoId)
                          }}
                          placeholder="Seleccionar insumo..."
                          className="w-full"
                          selectedInsumoId={insumoSeleccionado}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de movimiento</label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filtrosAvanzados.tipoMovimiento.includes("ENTRADA")}
                          onChange={(e) => handleTipoMovimientoChange("ENTRADA", e.target.checked)}
                        />
                        <span>Entrada</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filtrosAvanzados.tipoMovimiento.includes("SALIDA")}
                          onChange={(e) => handleTipoMovimientoChange("SALIDA", e.target.checked)}
                        />
                        <span>Salida</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuario específico</label>
                    <Select
                      value={filtrosAvanzados.usuarioEspecifico}
                      onValueChange={(value) => setFiltrosAvanzados((prev) => ({ ...prev, usuarioEspecifico: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los usuarios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los usuarios</SelectItem>
                        {usuariosDisponibles.map((usuario) => (
                          <SelectItem key={usuario} value={usuario}>
                            {usuario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {insumoSeleccionado && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {opcionesInsumos.find((i) => Number.parseInt(i.id) === insumoSeleccionado)?.nombre}
                <button
                  type="button"
                  onClick={() => setInsumoSeleccionado(undefined)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Tipo Movimiento</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-12 h-12 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          No se encontraron movimientos para los filtros actuales.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientosPaginados.map((movimiento, index) => (
                    <TableRow key={`${movimiento.movimiento_insumo_id}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{movimiento.fecha.split("-").reverse().join("/")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={movimiento.tipo_movimiento === "ENTRADA" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {movimiento.tipo_movimiento === "ENTRADA" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoriasConfig[categoria]?.emoji}</span>
                          <div>
                            <p className="font-medium">{movimiento.insumo_nombre}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {movimiento.cantidad.toLocaleString("es-ES")} {movimiento.unidad_medida}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-700">
                          {movimiento.tipo_movimiento_insumo_nombre}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{movimiento.usuario}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{movimiento.nota || "-"}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + registrosPorPagina, totalRegistros)} de{" "}
                {totalRegistros} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {showExportMenu && <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />}
    </div>
  )
}
