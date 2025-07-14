"use client"

import { useState } from "react"
import {
  CalendarDays,
  CheckCircle,
  Clock,
  MapPin,
  Filter,
  Download,
  Search,
  MoreHorizontal,
  Plus,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import ActividadAnimalesDrawer from "./components/actividad-animales-drawer"
import ReclasificacionDrawer from "./components/reclasificacion-drawer"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"

// Datos de ejemplo para KPIs
const kpiData = [
  {
    title: "Completadas Hoy",
    value: "6",
    icon: CheckCircle,
    description: "actividades finalizadas",
    trend: "+2 vs ayer",
    color: "text-green-600",
  },
  {
    title: "Pendientes",
    value: "3",
    icon: Clock,
    description: "requieren atención",
    trend: "-1 vs ayer",
    color: "text-orange-600",
  },
  {
    title: "Total Semana",
    value: "18",
    icon: CalendarDays,
    description: "tareas programadas",
    trend: "+5 vs sem. anterior",
    color: "text-blue-600",
  },
  {
    title: "Sector Más Activo",
    value: "Potrero 5",
    icon: MapPin,
    description: "7 tareas realizadas",
    trend: "Líder esta semana",
    color: "text-purple-600",
  },
]

// Datos de ejemplo para actividades
const actividadesEjemplo = [
  {
    id: 1,
    fecha: "2024-01-15",
    hora: "08:30",
    tipo: "Sanidad",
    actividad: "Recorrida sanitaria",
    sector: "Potrero 3",
    responsable: "Juan Pérez",
    estado: "Completada",
    comentarios: "Revisión de 45 cabezas de ganado",
  },
  {
    id: 2,
    fecha: "2024-01-15",
    hora: "10:15",
    tipo: "Manejo",
    actividad: "Conteo de animales",
    sector: "Corral 2",
    responsable: "María González",
    estado: "En Progreso",
    comentarios: "Conteo parcial realizado",
  },
  {
    id: 3,
    fecha: "2024-01-15",
    hora: "14:00",
    tipo: "Sanidad",
    actividad: "Aplicación de vacunas",
    sector: "Potrero 1",
    responsable: "Carlos López",
    estado: "Pendiente",
    comentarios: "Programado para la tarde",
  },
]

const getEstadoBadge = (estado: string) => {
  const variants = {
    Completada: "bg-green-100 text-green-800 border-green-200",
    "En Progreso": "bg-blue-100 text-blue-800 border-blue-200",
    Pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Vencida: "bg-red-100 text-red-800 border-red-200",
  }
  return variants[estado as keyof typeof variants] || "bg-gray-100 text-gray-800"
}

const getTipoBadge = (tipo: string) => {
  const variants = {
    Sanidad: "bg-purple-100 text-purple-800",
    Manejo: "bg-cyan-100 text-cyan-800",
    Reproducción: "bg-pink-100 text-pink-800",
    Alimentación: "bg-green-100 text-green-800",
  }
  return variants[tipo as keyof typeof variants] || "bg-gray-100 text-gray-800"
}

export default function ActividadesView() {
  const [date, setDate] = useState<Date>()
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos")
  const [busqueda, setBusqueda] = useState<string>("")
  const [actividades, setActividades] = useState(actividadesEjemplo)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showReclasificacionDrawer, setShowReclasificacionDrawer] = useState(false)

  const { currentEstablishment } = useCurrentEstablishment()

  const handleActividadCreada = () => {
    // Refrescar la lista de actividades
    setRefreshKey((prev) => prev + 1)
    console.log("Actividad creada exitosamente")
  }

  const handleReclasificacion = () => {
    console.log("🔄 Abriendo drawer de reclasificación directamente")
    setShowReclasificacionDrawer(true)
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Actividades con Animales</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestión de actividades que involucran animales - {currentEstablishment?.nombre || "Establecimiento"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleReclasificacion} size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Users className="w-4 h-4 mr-2" />
                Reclasificar Categorías
              </Button>
              <ActividadAnimalesDrawer
                trigger={
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Actividad
                  </Button>
                }
                onSuccess={handleActividadCreada}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData.map((kpi, index) => {
            const IconComponent = kpi.icon
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                      <p className="text-xs text-gray-500">{kpi.description}</p>
                      <p className={`text-xs mt-2 ${kpi.color}`}>{kpi.trend}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gray-50 ${kpi.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Información sobre actividades */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Actividades con Animales</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Solo se muestran actividades que requieren manejo de animales</li>
                  <li>• Cada actividad debe especificar lote, categoría animal, cantidad y peso</li>
                  <li>• Las categorías se filtran según el stock disponible en cada lote</li>
                  <li>
                    • <strong>Reclasificar Categorías:</strong> Permite cambiar todos los animales de una categoría a
                    otra
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar actividades, responsables o sectores..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-start text-left font-normal bg-transparent">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>

                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    <SelectItem value="sanidad">Sanidad</SelectItem>
                    <SelectItem value="manejo">Manejo</SelectItem>
                    <SelectItem value="reproduccion">Reproducción</SelectItem>
                    <SelectItem value="alimentacion">Alimentación</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="en-progreso">En Progreso</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Actividades */}
        <Card>
          <CardHeader>
            <CardTitle>Actividades Recientes</CardTitle>
            <CardDescription>Listado de actividades realizadas con animales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentarios</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividades.map((actividad) => (
                    <TableRow key={actividad.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{actividad.fecha}</div>
                          <div className="text-gray-500">{actividad.hora}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getTipoBadge(actividad.tipo)}>
                          {actividad.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{actividad.actividad}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {actividad.sector}
                        </div>
                      </TableCell>
                      <TableCell>{actividad.responsable}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoBadge(actividad.estado)}>
                          {actividad.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm text-gray-600 truncate">{actividad.comentarios}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Marcar como completada</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drawer de Reclasificación */}
      <ReclasificacionDrawer
        isOpen={showReclasificacionDrawer}
        onClose={() => setShowReclasificacionDrawer(false)}
        onSuccess={handleActividadCreada}
      />
    </div>
  )
}
