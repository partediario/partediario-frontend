"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CustomDatePicker } from "@/components/ui/custom-date-picker"
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
} from "lucide-react"
import { FiltroSelectorInsumos } from "./filtro-selector-insumos"
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
  insumoEspecifico?: string
  usuarioEspecifico?: string
  destinoEspecifico?: string
  claseInsumo?: string
  tipo?: string
  subtipo?: string
  tipoMovimiento: string[]
  almacenOrigen?: string
  tipoInsumo?: string
  subtipoInsumo?: string
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

export function GestionInsumoEspecifico({
  categoria,
  categoriaNombre,
  categoriaEmoji,
  onCategoriaChange,
}: GestionInsumoEspecificoProps) {
  const { establecimientoSeleccionado } = useEstablishment()

  const [claseInsumoSeleccionada, setClaseInsumoSeleccionada] = useState<number | undefined>(categoriaToId[categoria])
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<number | undefined>(undefined)

  const [tiposInsumo, setTiposInsumo] = useState<any[]>([])
  const [subtiposInsumo, setSubtiposInsumo] = useState<any[]>([])
  const [loadingTipos, setLoadingTipos] = useState(false)
  const [loadingSubtipos, setLoadingSubtipos] = useState(false)

  const {
    data: insumosData,
    loading,
    error,
    top3InsumosMes,
  } = useInsumosData(claseInsumoSeleccionada, insumoSeleccionado)

  // Estados para filtros avanzados
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    fechaDesde: undefined as Date | undefined,
    fechaHasta: undefined as Date | undefined,
    usuarioEspecifico: "",
    tipoMovimiento: [] as string[],
    tipoInsumo: "",
    subtipoInsumo: "",
  })

  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 10

  useEffect(() => {
    const nuevaClaseId = categoriaToId[categoria]
    setClaseInsumoSeleccionada(nuevaClaseId)
    setInsumoSeleccionado(undefined) // Limpiar selección de insumo
    if (nuevaClaseId) {
      cargarTiposInsumo(nuevaClaseId)
    }
    setFiltrosAvanzados((prev) => ({
      ...prev,
      tipoInsumo: "",
      subtipoInsumo: "",
    }))
  }, [categoria])

  useEffect(() => {
    if (filtrosAvanzados.tipoInsumo) {
      cargarSubtiposInsumo(filtrosAvanzados.tipoInsumo)
    } else {
      setSubtiposInsumo([])
      setFiltrosAvanzados((prev) => ({ ...prev, subtipoInsumo: "" }))
    }
  }, [filtrosAvanzados.tipoInsumo])

  const opcionesInsumos = useMemo(() => {
    if (!insumosData || !Array.isArray(insumosData)) {
      return []
    }

    return insumosData.map((insumo) => ({
      id: insumo.pd_id.toString(),
      tipo: insumo.pd_tipo,
      nombre: insumo.pd_nombre,
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
      // Si hay insumo seleccionado, mostrar solo sus movimientos
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
      // Si no hay insumo seleccionado, mostrar todos los movimientos de la clase
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

    // Aplicar filtros avanzados
    let movimientosFiltrados = movimientos

    // Filtro por fechas
    if (filtrosAvanzados.fechaDesde) {
      const fechaDesdeStr = filtrosAvanzados.fechaDesde.toISOString().split("T")[0]
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.fecha >= fechaDesdeStr)
    }
    if (filtrosAvanzados.fechaHasta) {
      const fechaHasta = new Date(filtrosAvanzados.fechaHasta)
      fechaHasta.setDate(fechaHasta.getDate() + 1) // Agregar un día para incluir todo el día seleccionado
      const fechaHastaStr = fechaHasta.toISOString().split("T")[0]
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.fecha < fechaHastaStr)
    }

    if (filtrosAvanzados.usuarioEspecifico && filtrosAvanzados.usuarioEspecifico !== "all") {
      movimientosFiltrados = movimientosFiltrados.filter((mov) => mov.usuario === filtrosAvanzados.usuarioEspecifico)
    }

    // Filtro por tipo de movimiento
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
      // Primero comparar por fecha
      const fechaA = new Date(a.fecha).getTime()
      const fechaB = new Date(b.fecha).getTime()

      if (fechaA !== fechaB) {
        return fechaB - fechaA // Fecha más reciente primero
      }

      // Si las fechas son iguales, comparar por hora
      const horaA = a.hora ? new Date(`1970-01-01T${a.hora}`).getTime() : 0
      const horaB = b.hora ? new Date(`1970-01-01T${b.hora}`).getTime() : 0

      return horaB - horaA // Hora más reciente primero
    })
  }, [insumosData, insumoSeleccionado, filtrosAvanzados, busqueda])

  // Paginación
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
    setInsumoSeleccionado(insumo ? Number.parseInt(insumo.id) : undefined)
  }

  const handleLimpiarFiltros = () => {
    setFiltrosAvanzados({
      fechaDesde: undefined,
      fechaHasta: undefined,
      usuarioEspecifico: "",
      tipoMovimiento: [],
      tipoInsumo: "",
      subtipoInsumo: "",
    })
    setBusqueda("")
    setPaginaActual(1)
  }

  const handleTipoMovimientoChange = (tipo: string, checked: boolean) => {
    setFiltrosAvanzados((prev) => {
      if (checked) {
        // Si se marca uno, desmarcar el otro
        const otroTipo = tipo === "ENTRADA" ? "SALIDA" : "ENTRADA"
        return {
          ...prev,
          tipoMovimiento: [tipo], // Solo el tipo seleccionado
        }
      } else {
        // Si se desmarca, quitar de la lista
        return {
          ...prev,
          tipoMovimiento: prev.tipoMovimiento.filter((t) => t !== tipo),
        }
      }
    })
  }

  const cargarTiposInsumo = async (claseId: number) => {
    setLoadingTipos(true)
    try {
      const response = await fetch(`/api/tipos-insumo?clase_insumo_id=${claseId}`)
      const data = await response.json()
      setTiposInsumo(data.tipos || [])
    } catch (error) {
      console.error("Error cargando tipos de insumo:", error)
      setTiposInsumo([])
    } finally {
      setLoadingTipos(false)
    }
  }

  const cargarSubtiposInsumo = async (tipoId: string) => {
    if (!tipoId) {
      setSubtiposInsumo([])
      return
    }
    setLoadingSubtipos(true)
    try {
      const response = await fetch(`/api/subtipos-insumo?tipo_insumo_id=${tipoId}`)
      const data = await response.json()
      setSubtiposInsumo(data.subtipos || [])
    } catch (error) {
      console.error("Error cargando subtipos de insumo:", error)
      setSubtiposInsumo([])
    } finally {
      setLoadingSubtipos(false)
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
    <div className="space-y-6">
      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-white border rounded-lg">
          {Object.entries(categoriasConfig).map(([key, config]) => {
            const isActive = categoria === key

            return (
              <Button
                key={key}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleCategoriaChange(key)}
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
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiltroSelectorInsumos
            insumos={opcionesInsumos}
            onSelectionChange={handleInsumoSelection}
            placeholder="Seleccionar insumo..."
            className="w-[400px]"
            selectedInsumoId={insumoSeleccionado}
          />
          {insumoSeleccionado && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInsumoSeleccionado(undefined)}
              className="flex items-center gap-2 bg-transparent"
            >
              <X className="w-4 h-4" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {!insumoSeleccionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Top 3 Insumos Más Utilizados del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top3InsumosMes.map((insumo, index) => {
                const getEmojiPorClase = (claseId: number) => {
                  const claseMap: Record<number, string> = {
                    1: "🧂", // Sales, Balanceados y Forrajes
                    2: "💉", // Insumos Veterinarios
                    3: "🌿", // Insumos Agrícolas
                    4: "🏗️", // Materiales
                    5: "⛽", // Combustibles y Lubricantes
                    6: "🌱", // Semillas
                  }
                  return claseMap[claseId] || "📦"
                }

                const getNombreClase = (claseId: number) => {
                  const claseMap: Record<number, string> = {
                    1: "Sales, Balanceados y Forrajes",
                    2: "Insumos Veterinarios",
                    3: "Insumos Agrícolas",
                    4: "Materiales",
                    5: "Combustibles y Lubricantes",
                    6: "Semillas",
                  }
                  return claseMap[claseId] || "Otros"
                }

                return (
                  <div key={insumo.pd_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEmojiPorClase(insumo.insumo_clase_id)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{insumo.pd_nombre}</p>
                          <p className="text-sm text-gray-500">{getNombreClase(insumo.insumo_clase_id)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {insumo.total_usado.toLocaleString()} {insumo.unidad_medida}
                      </p>
                      <p className="text-sm text-gray-500">Total usado</p>
                    </div>
                  </div>
                )
              })}
              {top3InsumosMes.length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay movimientos registrados para este mes</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historial de Movimientos</span>
            <Badge variant="outline">{totalRegistros} registros</Badge>
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
            <Button variant="outline" onClick={handleLimpiarFiltros} size="sm">
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          </div>

          <Collapsible open={filtrosAvanzadosAbiertos} onOpenChange={setFiltrosAvanzadosAbiertos}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-transparent">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros Avanzados
                </div>
                {filtrosAvanzadosAbiertos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Fecha desde */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha desde</label>
                  <CustomDatePicker
                    date={filtrosAvanzados.fechaDesde}
                    onDateChange={(date) => setFiltrosAvanzados((prev) => ({ ...prev, fechaDesde: date }))}
                    placeholder="Seleccionar fecha desde"
                    className="w-full"
                  />
                </div>

                {/* Fecha hasta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha hasta</label>
                  <CustomDatePicker
                    date={filtrosAvanzados.fechaHasta}
                    onDateChange={(date) => setFiltrosAvanzados((prev) => ({ ...prev, fechaHasta: date }))}
                    placeholder="Seleccionar fecha hasta"
                    className="w-full"
                  />
                </div>

                {/* Usuario específico */}
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de insumo</label>
                  <Select
                    value={filtrosAvanzados.tipoInsumo}
                    onValueChange={(value) => {
                      setFiltrosAvanzados((prev) => ({
                        ...prev,
                        tipoInsumo: value,
                        subtipoInsumo: "", // Resetear subtipo a vacío
                      }))
                    }}
                    disabled={loadingTipos}
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
                    value={filtrosAvanzados.subtipoInsumo}
                    onValueChange={(value) => setFiltrosAvanzados((prev) => ({ ...prev, subtipoInsumo: value }))}
                    disabled={loadingSubtipos || !filtrosAvanzados.tipoInsumo}
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
              </div>

              {/* Tipo de movimiento */}
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
            </CollapsibleContent>
          </Collapsible>

          {/* Tabla de movimientos */}
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
                {movimientosPaginados.map((movimiento, index) => (
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
                        {movimiento.cantidad.toLocaleString()} {movimiento.unidad_medida}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
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
    </div>
  )
}
