"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, TrendingUp, TrendingDown, Calendar, User, Package, Download } from "lucide-react"

interface VistaPorDestinoProps {
  insumosData: any[]
  movimientosData: any[]
}

export function VistaPorDestino({ insumosData, movimientosData }: VistaPorDestinoProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDestino, setSelectedDestino] = useState<string>("todos")
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas")
  const [dateRange, setDateRange] = useState<string>("30")

  // Datos de ejemplo para destinos
  const destinosEjemplo = [
    {
      id: "tractor-jd-6110",
      nombre: "Tractor JD 6110",
      tipo: "Maquinaria",
      ubicacion: "Campo Norte",
      estado: "Activo",
      icono: "🚜",
    },
    {
      id: "cosechadora-case",
      nombre: "Cosechadora Case",
      tipo: "Maquinaria",
      ubicacion: "Campo Sur",
      estado: "Activo",
      icono: "🚜",
    },
    {
      id: "deposito-central",
      nombre: "Depósito Central",
      tipo: "Almacén",
      ubicacion: "Establecimiento",
      estado: "Activo",
      icono: "🏢",
    },
    {
      id: "lote-norte",
      nombre: "Lote Norte",
      tipo: "Campo",
      ubicacion: "Sector A",
      estado: "Activo",
      icono: "🌾",
    },
    {
      id: "potrero-sur",
      nombre: "Potrero Sur",
      tipo: "Ganadería",
      ubicacion: "Sector B",
      estado: "Activo",
      icono: "🐄",
    },
  ]

  // Datos de ejemplo para movimientos por destino
  const movimientosPorDestino = [
    {
      id: 1,
      fecha: "2024-01-15",
      destino: "Tractor JD 6110",
      insumo: "Gasoil Común",
      categoria: "Combustibles",
      tipo: "Salida",
      cantidad: 120,
      unidad: "L",
      usuario: "Carlos López",
      observaciones: "Carga para siembra",
      valorTotal: 102000,
    },
    {
      id: 2,
      fecha: "2024-01-18",
      destino: "Cosechadora Case",
      insumo: "Gasoil Premium",
      categoria: "Combustibles",
      tipo: "Salida",
      cantidad: 80,
      unidad: "L",
      usuario: "Ana Martín",
      observaciones: "Mantenimiento preventivo",
      valorTotal: 73600,
    },
    {
      id: 3,
      fecha: "2024-01-20",
      destino: "Lote Norte",
      insumo: "Glifosato",
      categoria: "Agroquímicos",
      tipo: "Salida",
      cantidad: 25,
      unidad: "kg",
      usuario: "Roberto Silva",
      observaciones: "Aplicación herbicida",
      valorTotal: 62500,
    },
    {
      id: 4,
      fecha: "2024-01-22",
      destino: "Potrero Sur",
      insumo: "Vacuna Aftosa",
      categoria: "Veterinarios",
      tipo: "Salida",
      cantidad: 15,
      unidad: "dosis",
      usuario: "María González",
      observaciones: "Vacunación ganado",
      valorTotal: 18000,
    },
    {
      id: 5,
      fecha: "2024-01-25",
      destino: "Depósito Central",
      insumo: "Gasoil Común",
      categoria: "Combustibles",
      tipo: "Entrada",
      cantidad: 500,
      unidad: "L",
      usuario: "Juan Pérez",
      observaciones: "Reposición stock",
      valorTotal: 425000,
    },
  ]

  // Filtrar movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientosPorDestino.filter((movimiento) => {
      const matchesSearch =
        searchTerm === "" ||
        movimiento.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movimiento.insumo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movimiento.usuario.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDestino = selectedDestino === "todos" || movimiento.destino === selectedDestino
      const matchesCategoria = selectedCategoria === "todas" || movimiento.categoria === selectedCategoria

      return matchesSearch && matchesDestino && matchesCategoria
    })
  }, [searchTerm, selectedDestino, selectedCategoria])

  // Estadísticas por destino
  const estadisticasPorDestino = useMemo(() => {
    const stats = new Map()

    movimientosFiltrados.forEach((movimiento) => {
      const destino = movimiento.destino
      if (!stats.has(destino)) {
        stats.set(destino, {
          nombre: destino,
          totalMovimientos: 0,
          totalEntradas: 0,
          totalSalidas: 0,
          valorTotal: 0,
          ultimoMovimiento: null,
        })
      }

      const stat = stats.get(destino)
      stat.totalMovimientos += 1
      stat.valorTotal += movimiento.valorTotal

      if (movimiento.tipo === "Entrada") {
        stat.totalEntradas += 1
      } else {
        stat.totalSalidas += 1
      }

      if (!stat.ultimoMovimiento || new Date(movimiento.fecha) > new Date(stat.ultimoMovimiento)) {
        stat.ultimoMovimiento = movimiento.fecha
      }
    })

    return Array.from(stats.values())
  }, [movimientosFiltrados])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  const getTipoColor = (tipo: string) => {
    return tipo === "Entrada" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
  }

  const getDestinoIcon = (destino: string) => {
    const destinoData = destinosEjemplo.find((d) => d.nombre === destino)
    return destinoData?.icono || "📦"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vista por Destino</h1>
          <p className="text-gray-600">Análisis de consumo de insumos por destino operativo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por destino, insumo o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDestino} onValueChange={setSelectedDestino}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos los destinos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los destinos</SelectItem>
                {destinosEjemplo.map((destino) => (
                  <SelectItem key={destino.id} value={destino.nombre}>
                    {destino.icono} {destino.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                <SelectItem value="Combustibles">⛽ Combustibles</SelectItem>
                <SelectItem value="Veterinarios">💉 Veterinarios</SelectItem>
                <SelectItem value="Agroquímicos">🌿 Agroquímicos</SelectItem>
                <SelectItem value="Balanceados">🌾 Balanceados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas por Destino */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estadisticasPorDestino.map((stat) => (
          <Card key={stat.nombre}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{getDestinoIcon(stat.nombre)}</span>
                {stat.nombre}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Movimientos</p>
                  <p className="font-bold text-lg">{stat.totalMovimientos}</p>
                </div>
                <div>
                  <p className="text-gray-600">Valor Total</p>
                  <p className="font-bold text-lg">{formatCurrency(stat.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Entradas</p>
                  <p className="font-medium text-green-600">{stat.totalEntradas}</p>
                </div>
                <div>
                  <p className="text-gray-600">Salidas</p>
                  <p className="font-medium text-red-600">{stat.totalSalidas}</p>
                </div>
              </div>
              {stat.ultimoMovimiento && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Último movimiento</p>
                  <p className="text-sm font-medium">{new Date(stat.ultimoMovimiento).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla de Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Movimientos por Destino</span>
            <Badge variant="outline">{movimientosFiltrados.length} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(movimiento.fecha).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getDestinoIcon(movimiento.destino)}</span>
                        <div>
                          <p className="font-medium">{movimiento.destino}</p>
                          <p className="text-xs text-gray-500">
                            {destinosEjemplo.find((d) => d.nombre === movimiento.destino)?.tipo}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{movimiento.insumo}</p>
                          <p className="text-xs text-gray-500">{movimiento.categoria}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoColor(movimiento.tipo)}>
                        {movimiento.tipo === "Entrada" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {movimiento.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {movimiento.cantidad} {movimiento.unidad}
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

          {movimientosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron movimientos con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
