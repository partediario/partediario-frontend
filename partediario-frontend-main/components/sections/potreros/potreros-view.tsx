"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  MapPin,
  Calendar,
  X,
  Wheat,
  BarChart3,
  Settings,
  List,
  MapIcon,
  Layers,
  TrendingUp,
  PieChart,
  Activity,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent } from "@/components/ui/tabs"

// Interfaces para los datos que vendrían de Supabase
interface Sector {
  id: string
  nombre: string
}

interface Potrero {
  id: string
  nombre: string
  superficieTotal: number
  superficieUtil: number
  recursoForrajero: string
  receptividad: number
  unidadReceptividad: string
  estado: "Libre" | "Ocupado"
  estadoCarga: "libre" | "baja" | "media" | "alta"
  sectorId: string
  sector?: string
  loteActual?: {
    nombre: string
    categoria: string
    cantidadAnimales: number
    fechaEntrada: string
    pesoPromedio: number // kg por animal
  }
}

interface HistorialOcupacion {
  id: string
  lote: string
  categoria: string
  fechaEntrada: string
  fechaSalida?: string
  diasOcupacion: number
  kgGanados?: number
  cantidadAnimales: number
  pesoPromedio: number
}

export default function PotrerosView() {
  // Estados para filtros y selección
  const [selectedSector, setSelectedSector] = useState<string>("todos")
  const [selectedPotrero, setSelectedPotrero] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"lista" | "mapa" | "graficos">("lista")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedHistorial, setExpandedHistorial] = useState(false)

  // Datos de ejemplo - en producción vendrían de Supabase
  const sectores: Sector[] = [
    { id: "1", nombre: "Sector Norte" },
    { id: "2", nombre: "Sector Sur" },
    { id: "3", nombre: "Sector Este" },
  ]

  const potreros: Potrero[] = [
    {
      id: "1",
      nombre: "Potrero Norte 1",
      superficieTotal: 50,
      superficieUtil: 45,
      recursoForrajero: "Pasto natural",
      receptividad: 0.7,
      unidadReceptividad: "EV/ha",
      estado: "Ocupado",
      estadoCarga: "media",
      sectorId: "1",
      sector: "Sector Norte",
      loteActual: {
        nombre: "Lote Vaquillas 2024",
        categoria: "Vaquillas recría",
        cantidadAnimales: 35,
        fechaEntrada: "2024-01-15",
        pesoPromedio: 380,
      },
    },
    {
      id: "2",
      nombre: "Potrero Sur 1",
      superficieTotal: 75,
      superficieUtil: 70,
      recursoForrajero: "Gatton Panic",
      receptividad: 1.2,
      unidadReceptividad: "vacas/ha",
      estado: "Ocupado",
      estadoCarga: "alta",
      sectorId: "2",
      sector: "Sector Sur",
      loteActual: {
        nombre: "Lote Novillos A",
        categoria: "Novillos terminación",
        cantidadAnimales: 28,
        fechaEntrada: "2024-02-01",
        pesoPromedio: 450,
      },
    },
    {
      id: "3",
      nombre: "Potrero Este 1",
      superficieTotal: 60,
      superficieUtil: 55,
      recursoForrajero: "Brachiaria",
      receptividad: 0.9,
      unidadReceptividad: "EV/ha",
      estado: "Libre",
      estadoCarga: "libre",
      sectorId: "3",
      sector: "Sector Este",
    },
    {
      id: "4",
      nombre: "Potrero Norte 2",
      superficieTotal: 40,
      superficieUtil: 38,
      recursoForrajero: "Estrella Africana",
      receptividad: 1.1,
      unidadReceptividad: "vacas/ha",
      estado: "Ocupado",
      estadoCarga: "baja",
      sectorId: "1",
      sector: "Sector Norte",
      loteActual: {
        nombre: "Lote Terneros",
        categoria: "Terneros destete",
        cantidadAnimales: 15,
        fechaEntrada: "2024-03-10",
        pesoPromedio: 180,
      },
    },
    {
      id: "5",
      nombre: "Potrero Sur 2",
      superficieTotal: 65,
      superficieUtil: 60,
      recursoForrajero: "Gatton Panic",
      receptividad: 1.0,
      unidadReceptividad: "EV/ha",
      estado: "Libre",
      estadoCarga: "libre",
      sectorId: "2",
      sector: "Sector Sur",
    },
  ]

  const historialOcupacion: HistorialOcupacion[] = [
    {
      id: "1",
      lote: "Lote Vaquillas 2024",
      categoria: "Vaquillas recría",
      fechaEntrada: "2024-01-15",
      fechaSalida: undefined,
      diasOcupacion: 45,
      kgGanados: 1200,
      cantidadAnimales: 35,
      pesoPromedio: 380,
    },
    {
      id: "2",
      lote: "Lote Toros 2023",
      categoria: "Toros cría",
      fechaEntrada: "2023-11-01",
      fechaSalida: "2024-01-10",
      diasOcupacion: 70,
      kgGanados: 2100,
      cantidadAnimales: 25,
      pesoPromedio: 520,
    },
    {
      id: "3",
      lote: "Lote Novillos B",
      categoria: "Novillos terminación",
      fechaEntrada: "2023-08-15",
      fechaSalida: "2023-10-30",
      diasOcupacion: 76,
      kgGanados: 1800,
      cantidadAnimales: 30,
      pesoPromedio: 420,
    },
    {
      id: "4",
      lote: "Lote Terneras A",
      categoria: "Terneras destete",
      fechaEntrada: "2023-06-01",
      fechaSalida: "2023-08-10",
      diasOcupacion: 70,
      kgGanados: 800,
      cantidadAnimales: 40,
      pesoPromedio: 160,
    },
    {
      id: "5",
      lote: "Lote Vacas Cría",
      categoria: "Vacas cría",
      fechaEntrada: "2023-03-15",
      fechaSalida: "2023-05-25",
      diasOcupacion: 71,
      kgGanados: 1500,
      cantidadAnimales: 20,
      pesoPromedio: 480,
    },
  ]

  // Filtrar potreros según sector seleccionado y término de búsqueda
  const filteredPotreros = potreros.filter((potrero) => {
    const matchesSector = selectedSector === "todos" || potrero.sectorId === selectedSector
    const matchesSearch = potrero.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSector && matchesSearch
  })

  const selectedPotreroData = potreros.find((p) => p.id === selectedPotrero)

  // Calcular KPIs para el sector seleccionado
  const sectorPotreros = selectedSector === "todos" ? potreros : potreros.filter((p) => p.sectorId === selectedSector)

  const calculateCargaPromedio = () => {
    const potrerosOcupados = sectorPotreros.filter((p) => p.estado === "Ocupado" && p.loteActual)
    if (potrerosOcupados.length === 0) return 0

    const totalCarga = potrerosOcupados.reduce((sum, p) => {
      if (p.loteActual) {
        return sum + (p.loteActual.cantidadAnimales * p.loteActual.pesoPromedio) / p.superficieUtil
      }
      return sum
    }, 0)

    return totalCarga / potrerosOcupados.length
  }

  const kpis = {
    totalPotreros: sectorPotreros.length,
    potrerosOcupados: sectorPotreros.filter((p) => p.estado === "Ocupado").length,
    superficieUtil: sectorPotreros.reduce((sum, p) => sum + p.superficieUtil, 0),
    porcentajeOcupacion:
      sectorPotreros.length > 0
        ? (sectorPotreros.filter((p) => p.estado === "Ocupado").length / sectorPotreros.length) * 100
        : 0,
    potrerosConSobrecarga: sectorPotreros.filter((p) => p.estadoCarga === "alta").length,
    cargaPromedio: calculateCargaPromedio(),
  }

  const calculateOccupancy = (potrero: Potrero) => {
    if (potrero.estado === "Libre") return 0
    if (!potrero.loteActual) return 0

    const capacidadMaxima = potrero.superficieUtil * potrero.receptividad
    return Math.min((potrero.loteActual.cantidadAnimales / capacidadMaxima) * 100, 100)
  }

  const calculateCargaKgHa = (potrero: Potrero) => {
    if (potrero.estado === "Libre" || !potrero.loteActual) return 0
    return (potrero.loteActual.cantidadAnimales * potrero.loteActual.pesoPromedio) / potrero.superficieUtil
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const calculateDays = (fechaEntrada: string) => {
    const entrada = new Date(fechaEntrada)
    const hoy = new Date()
    const diffTime = Math.abs(hoy.getTime() - entrada.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getEstadoCargaColor = (estadoCarga: string) => {
    switch (estadoCarga) {
      case "libre":
        return "bg-green-100 text-green-800"
      case "baja":
        return "bg-blue-100 text-blue-800"
      case "media":
        return "bg-yellow-100 text-yellow-800"
      case "alta":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleConfiguracionClick = () => {
    // Navegar a configuración con tab de potreros
    const event = new CustomEvent("navigate-to-config", { detail: { tab: "potreros" } })
    window.dispatchEvent(event)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-auto">
      {/* Barra Superior */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Potreros / Parcelas</h1>
          <p className="text-gray-600">Gestión de potreros y su ocupación</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800" onClick={handleConfiguracionClick}>
          <Settings className="w-4 h-4 mr-2" />
          Ir a Configuración de Potreros
        </Button>
      </div>

      {/* Filtros Superiores */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sector</label>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los sectores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los sectores</SelectItem>
                {sectores.map((sector) => (
                  <SelectItem key={sector.id} value={sector.id}>
                    {sector.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Potrero</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar potrero..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "lista" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("lista")}
                className="flex items-center gap-1"
              >
                <List className="w-4 h-4" />
                Lista
              </Button>
              <Button
                variant={viewMode === "mapa" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("mapa")}
                className="flex items-center gap-1"
              >
                <MapIcon className="w-4 h-4" />
                Mapa
              </Button>
              <Button
                variant={viewMode === "graficos" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("graficos")}
                className="flex items-center gap-1"
              >
                <BarChart3 className="w-4 h-4" />
                Gráficos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <Layers className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Potreros Ocupados</p>
              <p className="text-2xl font-bold">
                {kpis.potrerosOcupados} / {kpis.totalPotreros}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Wheat className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Superficie Útil</p>
              <p className="text-2xl font-bold">{kpis.superficieUtil} ha</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ocupación Promedio</p>
              <p className="text-2xl font-bold">{kpis.porcentajeOcupacion.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Carga Promedio</p>
              <p className="text-2xl font-bold">{kpis.cargaPromedio.toFixed(0)} kg/ha</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <Layers className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Potreros Sobrecargados</p>
              <p className="text-2xl font-bold">{kpis.potrerosConSobrecarga}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Principal (Lista, Mapa o Gráficos) */}
      <div className="flex-1 p-4">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "lista" | "mapa" | "graficos")}
          className="w-full"
        >
          <TabsContent value="lista" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPotreros.map((potrero) => {
                const occupancy = calculateOccupancy(potrero)
                const cargaKgHa = calculateCargaKgHa(potrero)
                const isSelected = selectedPotrero === potrero.id

                return (
                  <Card
                    key={potrero.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected ? "ring-2 ring-green-500 bg-green-50" : ""
                    }`}
                    onClick={() => setSelectedPotrero(potrero.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{potrero.nombre}</h3>
                        <Badge className={getEstadoCargaColor(potrero.estadoCarga)}>
                          {potrero.estado === "Ocupado"
                            ? potrero.estadoCarga === "alta"
                              ? "Sobrecargado"
                              : "Ocupado"
                            : "Libre"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Wheat className="w-4 h-4" />
                          <span>{potrero.superficieUtil} ha útiles</span>
                        </div>

                        {potrero.estado === "Ocupado" && potrero.loteActual && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🐄</span>
                              <span>{potrero.loteActual.cantidadAnimales} animales</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              <span>{cargaKgHa.toFixed(0)} kg/ha</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Ocupación</span>
                                <span>{occupancy.toFixed(0)}%</span>
                              </div>
                              <Progress
                                value={occupancy}
                                className={`h-2 ${
                                  occupancy > 90 ? "bg-red-200" : occupancy > 70 ? "bg-yellow-200" : "bg-green-200"
                                }`}
                              />
                            </div>
                          </>
                        )}

                        {potrero.estado === "Libre" && (
                          <div className="text-green-600 text-sm font-medium">Disponible para ocupación</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="mapa" className="mt-0">
            <Card>
              <CardContent className="p-4">
                <div className="bg-slate-100 h-[400px] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Mapa</h3>
                    <p className="text-gray-600">Aquí se mostrará el mapa interactivo con Leaflet</p>
                    <p className="text-sm text-gray-500 mt-2">Los potreros se colorearán según su estado de carga</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graficos" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Histórico de ocupación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Histórico de Ocupación por Potrero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 h-[250px] rounded-lg flex items-center justify-center">
                    <span className="text-slate-600">Gráfico Gantt - Ocupación temporal</span>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico 2: % Ocupación promedio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />% Ocupación Promedio (90 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 h-[250px] rounded-lg flex items-center justify-center">
                    <span className="text-slate-600">Barras verticales por potrero</span>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico 3: Distribución actual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Distribución Actual de Animales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 h-[250px] rounded-lg flex items-center justify-center">
                    <span className="text-slate-600">Gráfico Donut - Animales por potrero</span>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico 4: Carga vs Receptividad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Carga Actual vs Receptividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-100 h-[250px] rounded-lg flex items-center justify-center">
                    <span className="text-slate-600">Barras agrupadas - EV actual vs teórica</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vista Detalle (Horizontal) */}
      {selectedPotreroData && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">{selectedPotreroData.nombre}</h2>
            <div className="flex gap-2">
              <Badge className={getEstadoCargaColor(selectedPotreroData.estadoCarga)}>
                {selectedPotreroData.estado === "Ocupado"
                  ? selectedPotreroData.estadoCarga === "alta"
                    ? "Sobrecargado"
                    : "Ocupado"
                  : "Libre"}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setExpandedHistorial(!expandedHistorial)}>
                {expandedHistorial ? "Contraer" : "Expandir"} Historial
              </Button>
            </div>
          </div>

          {!expandedHistorial ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Datos del Potrero */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5" />
                    Datos del Potrero
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Sector</p>
                      <p className="font-medium">{selectedPotreroData.sector}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Superficie Total</p>
                      <p className="font-medium">{selectedPotreroData.superficieTotal} ha</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Superficie Útil</p>
                      <p className="font-medium">{selectedPotreroData.superficieUtil} ha</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Recurso Forrajero</p>
                      <p className="font-medium">{selectedPotreroData.recursoForrajero}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Receptividad</p>
                      <p className="font-medium">
                        {selectedPotreroData.receptividad} {selectedPotreroData.unidadReceptividad}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidad Máxima</p>
                      <p className="font-medium">
                        {(selectedPotreroData.superficieUtil * selectedPotreroData.receptividad).toFixed(0)} animales
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carga Actual */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-xl">🐄</span>
                    Carga Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPotreroData.estado === "Ocupado" && selectedPotreroData.loteActual ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Lote</p>
                          <p className="font-medium">{selectedPotreroData.loteActual.nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Categoría</p>
                          <p className="font-medium">{selectedPotreroData.loteActual.categoria}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cantidad</p>
                          <p className="font-medium">{selectedPotreroData.loteActual.cantidadAnimales} animales</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Peso Promedio</p>
                          <p className="font-medium">{selectedPotreroData.loteActual.pesoPromedio} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Carga</p>
                          <p className="font-medium">{calculateCargaKgHa(selectedPotreroData).toFixed(0)} kg/ha</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Entrada</p>
                          <p className="font-medium">{formatDate(selectedPotreroData.loteActual.fechaEntrada)}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Ocupación</span>
                          <span>{calculateOccupancy(selectedPotreroData).toFixed(1)}%</span>
                        </div>
                        <Progress value={calculateOccupancy(selectedPotreroData)} className="h-2" />
                        <p className="text-xs text-gray-500">
                          Días en el potrero: {calculateDays(selectedPotreroData.loteActual.fechaEntrada)}
                        </p>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 w-full bg-transparent"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cerrar Ocupación
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-6">
                      <span className="text-4xl mb-2">🐄</span>
                      <p className="text-gray-500">Potrero sin ocupación actual</p>
                      <Button className="mt-4 bg-green-700 hover:bg-green-800">Asignar Lote</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historial de Ocupación */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    Historial de Ocupación
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[250px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Días</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialOcupacion.slice(0, 3).map((registro) => (
                        <TableRow key={registro.id}>
                          <TableCell className="font-medium">{registro.lote}</TableCell>
                          <TableCell>{formatDate(registro.fechaEntrada)}</TableCell>
                          <TableCell>{registro.fechaSalida ? formatDate(registro.fechaSalida) : "Actual"}</TableCell>
                          <TableCell>{registro.diasOcupacion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-4">
              {/* Historial Expandido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historialOcupacion.map((registro) => (
                  <Card key={registro.id}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-gray-600">Lote</p>
                          <p className="font-medium">{registro.lote}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Categoría</p>
                          <p className="font-medium">{registro.categoria}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Entrada</p>
                          <p className="font-medium">{formatDate(registro.fechaEntrada)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Salida</p>
                          <p className="font-medium">
                            {registro.fechaSalida ? formatDate(registro.fechaSalida) : "Actual"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Días de Ocupación</p>
                          <p className="font-medium">{registro.diasOcupacion}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">KG Ganados</p>
                          <p className="font-medium">{registro.kgGanados ? registro.kgGanados.toFixed(0) : "N/A"} kg</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Cantidad de Animales</p>
                          <p className="font-medium">{registro.cantidadAnimales} animales</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Peso Promedio</p>
                          <p className="font-medium">{registro.pesoPromedio} kg</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
