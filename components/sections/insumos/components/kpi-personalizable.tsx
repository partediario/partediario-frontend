"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Calendar,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react"

interface KPIConfig {
  id: string
  nombre: string
  descripcion: string
  icono: React.ReactNode
  visible: boolean
  posicion: number
  color: string
  formato: "numero" | "moneda" | "porcentaje"
  categoria: "stock" | "financiero" | "movimientos" | "alertas"
}

interface KPIPersonalizableProps {
  onKPIChange: (kpis: KPIConfig[]) => void
}

export function KPIPersonalizable({ onKPIChange }: KPIPersonalizableProps) {
  const [kpisDisponibles, setKpisDisponibles] = useState<KPIConfig[]>([
    {
      id: "stock-total",
      nombre: "Stock Total",
      descripcion: "Cantidad total de insumos en inventario",
      icono: <Package className="w-4 h-4" />,
      visible: true,
      posicion: 1,
      color: "blue",
      formato: "numero",
      categoria: "stock",
    },
    {
      id: "valor-inventario",
      nombre: "Valor Inventario",
      descripcion: "Valor monetario total del inventario",
      icono: <DollarSign className="w-4 h-4" />,
      visible: true,
      posicion: 2,
      color: "green",
      formato: "moneda",
      categoria: "financiero",
    },
    {
      id: "entradas-mes",
      nombre: "Entradas del Mes",
      descripcion: "Total de entradas registradas este mes",
      icono: <TrendingUp className="w-4 h-4" />,
      visible: true,
      posicion: 3,
      color: "emerald",
      formato: "numero",
      categoria: "movimientos",
    },
    {
      id: "salidas-mes",
      nombre: "Salidas del Mes",
      descripcion: "Total de salidas registradas este mes",
      icono: <TrendingDown className="w-4 h-4" />,
      visible: true,
      posicion: 4,
      color: "red",
      formato: "numero",
      categoria: "movimientos",
    },
    {
      id: "alertas-criticas",
      nombre: "Alertas Críticas",
      descripcion: "Número de alertas de stock crítico activas",
      icono: <AlertTriangle className="w-4 h-4" />,
      visible: false,
      posicion: 5,
      color: "orange",
      formato: "numero",
      categoria: "alertas",
    },
    {
      id: "rotacion-inventario",
      nombre: "Rotación de Inventario",
      descripcion: "Velocidad de rotación del inventario",
      icono: <BarChart3 className="w-4 h-4" />,
      visible: false,
      posicion: 6,
      color: "purple",
      formato: "porcentaje",
      categoria: "financiero",
    },
    {
      id: "dias-stock",
      nombre: "Días de Stock",
      descripcion: "Días promedio de stock disponible",
      icono: <Calendar className="w-4 h-4" />,
      visible: false,
      posicion: 7,
      color: "indigo",
      formato: "numero",
      categoria: "stock",
    },
  ])

  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")

  const handleVisibilityChange = (kpiId: string, visible: boolean) => {
    const nuevosKpis = kpisDisponibles.map((kpi) => (kpi.id === kpiId ? { ...kpi, visible } : kpi))
    setKpisDisponibles(nuevosKpis)
    onKPIChange(nuevosKpis.filter((kpi) => kpi.visible))
  }

  const handleColorChange = (kpiId: string, color: string) => {
    const nuevosKpis = kpisDisponibles.map((kpi) => (kpi.id === kpiId ? { ...kpi, color } : kpi))
    setKpisDisponibles(nuevosKpis)
    onKPIChange(nuevosKpis.filter((kpi) => kpi.visible))
  }

  const handleFormatoChange = (kpiId: string, formato: "numero" | "moneda" | "porcentaje") => {
    const nuevosKpis = kpisDisponibles.map((kpi) => (kpi.id === kpiId ? { ...kpi, formato } : kpi))
    setKpisDisponibles(nuevosKpis)
    onKPIChange(nuevosKpis.filter((kpi) => kpi.visible))
  }

  const kpisFiltrados =
    filtroCategoria === "todas" ? kpisDisponibles : kpisDisponibles.filter((kpi) => kpi.categoria === filtroCategoria)

  const categorias = [
    { value: "todas", label: "Todas las categorías" },
    { value: "stock", label: "Stock" },
    { value: "financiero", label: "Financiero" },
    { value: "movimientos", label: "Movimientos" },
    { value: "alertas", label: "Alertas" },
  ]

  const colores = [
    { value: "blue", label: "Azul", class: "bg-blue-500" },
    { value: "green", label: "Verde", class: "bg-green-500" },
    { value: "red", label: "Rojo", class: "bg-red-500" },
    { value: "orange", label: "Naranja", class: "bg-orange-500" },
    { value: "purple", label: "Morado", class: "bg-purple-500" },
    { value: "indigo", label: "Índigo", class: "bg-indigo-500" },
    { value: "emerald", label: "Esmeralda", class: "bg-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPIs Personalizables</h1>
          <p className="text-gray-600">Configura los indicadores que quieres ver en tu dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{kpisDisponibles.filter((kpi) => kpi.visible).length} KPIs activos</Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="filtro-categoria">Filtrar por categoría:</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de KPIs */}
      <div className="space-y-4">
        {kpisFiltrados.map((kpi) => (
          <Card key={kpi.id} className={`transition-all ${kpi.visible ? "ring-2 ring-blue-200" : ""}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-${kpi.color}-100 text-${kpi.color}-600`}>{kpi.icono}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{kpi.nombre}</h3>
                    <p className="text-sm text-gray-600">{kpi.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {kpi.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {kpi.formato}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Configuración de color */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Color:</Label>
                    <Select value={kpi.color} onValueChange={(color) => handleColorChange(kpi.id, color)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colores.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.class}`} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configuración de formato */}
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Formato:</Label>
                    <Select
                      value={kpi.formato}
                      onValueChange={(formato: "numero" | "moneda" | "porcentaje") =>
                        handleFormatoChange(kpi.id, formato)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="moneda">Moneda</SelectItem>
                        <SelectItem value="porcentaje">Porcentaje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Switch de visibilidad */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`visible-${kpi.id}`} className="text-sm">
                      {kpi.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Label>
                    <Switch
                      id={`visible-${kpi.id}`}
                      checked={kpi.visible}
                      onCheckedChange={(visible) => handleVisibilityChange(kpi.id, visible)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vista previa de KPIs activos */}
      {kpisDisponibles.filter((kpi) => kpi.visible).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Vista Previa del Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpisDisponibles
                .filter((kpi) => kpi.visible)
                .sort((a, b) => a.posicion - b.posicion)
                .map((kpi) => (
                  <div key={kpi.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{kpi.nombre}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {kpi.formato === "moneda" && "$"}
                          1,234
                          {kpi.formato === "porcentaje" && "%"}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg bg-${kpi.color}-100 text-${kpi.color}-600`}>{kpi.icono}</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
