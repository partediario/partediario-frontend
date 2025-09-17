"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  X,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  User,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { movimientosData, insumosData } from "@/lib/data"

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

export function HistorialConsumo() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filtrosOpen, setFiltrosOpen] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosAvanzados>({
    tipoMovimiento: [],
  })

  // Obtener datos únicos para los dropdowns
  const todosLosInsumos = Object.values(insumosData).flat()
  const usuariosUnicos = [...new Set(movimientosData.map((m) => m.usuario))]
  const destinosUnicos = [...new Set(movimientosData.map((m) => m.destino))]
  const clasesUnicas = [...new Set(todosLosInsumos.map((i) => i.clase))]
  const almacenesUnicos = [...new Set(movimientosData.map((m) => m.destino))]

  // Obtener tipos según la clase seleccionada
  const tiposSegunClase = useMemo(() => {
    if (!filtros.claseInsumo) return []
    const insumosDeClase = todosLosInsumos.filter((i) => i.clase === filtros.claseInsumo)
    return [...new Set(insumosDeClase.map((i) => i.tipoInsumo))]
  }, [filtros.claseInsumo])

  // Obtener subtipos según el tipo seleccionado
  const subtiposSegunTipo = useMemo(() => {
    if (!filtros.tipo) return []
    const insumosDelTipo = todosLosInsumos.filter((i) => i.tipoInsumo === filtros.tipo)
    return [...new Set(insumosDelTipo.map((i) => i.nombre))]
  }, [filtros.tipo])

  // Obtener insumos según la clase seleccionada
  const insumosSegunClase = useMemo(() => {
    if (!filtros.claseInsumo) return todosLosInsumos
    return todosLosInsumos.filter((i) => i.clase === filtros.claseInsumo)
  }, [filtros.claseInsumo])

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientosData.filter((movimiento) => {
      const insumo = todosLosInsumos.find((i) => i.id === movimiento.insumoId)
      if (!insumo) return false

      // Filtro de búsqueda general
      if (
        searchTerm &&
        !insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !movimiento.usuario.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !movimiento.destino.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [searchTerm, filtros, todosLosInsumos])

  // Estadísticas calculadas
  const estadisticas = useMemo(() => {
    const entradas = movimientosFiltrados.filter((m) => m.tipo === "Entrada")
    const salidas = movimientosFiltrados.filter((m) => m.tipo === "Salida")

    return {
      totalMovimientos: movimientosFiltrados.length,
      totalEntradas: entradas.length,
      totalSalidas: salidas.length,
      valorTotalEntradas: entradas.reduce((sum, m) => sum + m.valorTotal, 0),
      valorTotalSalidas: salidas.reduce((sum, m) => sum + m.valorTotal, 0),
      valorTotal: movimientosFiltrados.reduce((sum, m) => sum + m.valorTotal, 0),
    }
  }, [movimientosFiltrados])

  const limpiarFiltros = () => {
    setFiltros({ tipoMovimiento: [] })
    setSearchTerm("")
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

  const getCategoriaColor = (categoria: string) => {
    const colores = {
      Combustibles: "bg-blue-100 text-blue-800",
      Veterinarios: "bg-green-100 text-green-800",
      Balanceados: "bg-yellow-100 text-yellow-800",
      Materiales: "bg-purple-100 text-purple-800",
      Agroquímicos: "bg-red-100 text-red-800",
      Sales: "bg-orange-100 text-orange-800",
      Varios: "bg-gray-100 text-gray-800",
    }
    return colores[categoria as keyof typeof colores] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h1>
          <p className="text-gray-600 mt-1">Registro completo de entradas y salidas de insumos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalMovimientos}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.totalEntradas}</p>
                <p className="text-xs text-gray-500">{formatCurrency(estadisticas.valorTotalEntradas)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salidas</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.totalSalidas}</p>
                <p className="text-xs text-gray-500">{formatCurrency(estadisticas.valorTotalSalidas)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(estadisticas.valorTotal)}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Búsqueda básica */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por insumo, usuario o destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={limpiarFiltros} size="sm">
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>

            {/* Filtros avanzados colapsables */}
            <Collapsible open={filtrosOpen} onOpenChange={setFiltrosOpen}>
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
                  {filtrosOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Movimientos Recientes ({movimientosFiltrados.length})</span>
            <div className="text-sm font-normal text-gray-600">Total: {formatCurrency(estadisticas.valorTotal)}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {movimientosFiltrados.map((movimiento) => {
              const insumo = todosLosInsumos.find((i) => i.id === movimiento.insumoId)
              if (!insumo) return null

              return (
                <div key={movimiento.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          movimiento.tipo === "Entrada" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        {movimiento.tipo === "Entrada" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{insumo.icono}</span>
                          <h3 className="font-semibold text-gray-900">{insumo.nombre}</h3>
                          <Badge className={getCategoriaColor(insumo.clase)}>{insumo.clase}</Badge>
                          <Badge
                            className={
                              movimiento.tipo === "Entrada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {movimiento.tipo}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(new Date(movimiento.fecha), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {movimiento.cantidad} {movimiento.unidad}
                      </p>
                      <p className="text-sm text-gray-600">{formatCurrency(movimiento.valorTotal)}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{movimiento.usuario}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{movimiento.destino}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Precio unitario:</span>
                      <span className="font-medium">
                        {formatCurrency(movimiento.precio)}/{movimiento.unidad}
                      </span>
                    </div>
                  </div>

                  {movimiento.observaciones && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <strong>Observaciones:</strong> {movimiento.observaciones}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalles
                    </Button>
                  </div>
                </div>
              )
            })}

            {movimientosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron movimientos</h3>
                <p className="text-gray-600">
                  {searchTerm || Object.values(filtros).some((v) => v && (Array.isArray(v) ? v.length > 0 : true))
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "Aún no hay movimientos registrados"}
                </p>
                {(searchTerm || Object.values(filtros).some((v) => v && (Array.isArray(v) ? v.length > 0 : true))) && (
                  <Button variant="outline" onClick={limpiarFiltros} className="mt-4 bg-transparent">
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
