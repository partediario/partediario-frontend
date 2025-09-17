"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Settings,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  Fuel,
  Syringe,
  Wheat,
  Wrench,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    {
      id: "insumos",
      label: "Combustibles",
      icon: <Fuel className="w-4 h-4" />,
      badge: "12",
      description: "Gestión de combustibles y lubricantes",
    },
    {
      id: "veterinarios",
      label: "Veterinarios",
      icon: <Syringe className="w-4 h-4" />,
      badge: "8",
      description: "Medicamentos y vacunas",
    },
    {
      id: "balanceados",
      label: "Balanceados",
      icon: <Wheat className="w-4 h-4" />,
      badge: "15",
      description: "Alimentos y suplementos",
    },
    {
      id: "agricolas",
      label: "Agrícolas",
      icon: <Package className="w-4 h-4" />,
      badge: "6",
      description: "Semillas y agroquímicos",
    },
    {
      id: "materiales",
      label: "Materiales",
      icon: <Wrench className="w-4 h-4" />,
      badge: "23",
      description: "Herramientas y repuestos",
    },
  ]

  const analyticsItems = [
    {
      id: "indicadores",
      label: "Indicadores Críticos",
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: "3",
      color: "text-red-600",
    },
    {
      id: "historial",
      label: "Historial de Consumo",
      icon: <Clock className="w-4 h-4" />,
      badge: null,
      color: "text-blue-600",
    },
    {
      id: "trazabilidad",
      label: "KPIs Personalizables",
      icon: <TrendingUp className="w-4 h-4" />,
      badge: null,
      color: "text-green-600",
    },
    {
      id: "vista-destino",
      label: "Vista por Destino",
      icon: <MapPin className="w-4 h-4" />,
      badge: null,
      color: "text-purple-600",
    },
  ]

  const configItems = [
    {
      id: "configuracion",
      label: "Configuración General",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "configuracion-combustibles",
      label: "Config. Combustibles",
      icon: <Fuel className="w-4 h-4" />,
    },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-6 h-6 text-[#227C63]" />
          <h2 className="text-lg font-semibold text-gray-900">Gestión de Insumos</h2>
        </div>

        {/* Categorías de Insumos */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Categorías</h3>
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                activeSection === item.id ? "bg-[#227C63] text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant={activeSection === item.id ? "secondary" : "outline"} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Analytics y Reportes */}
        <div className="space-y-2 mb-6">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Analytics</h3>
          {analyticsItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                activeSection === item.id ? "bg-[#227C63] text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={activeSection === item.id ? "text-white" : item.color}>{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant={activeSection === item.id ? "secondary" : "destructive"} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Configuración */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Configuración</h3>
          {configItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                activeSection === item.id ? "bg-[#227C63] text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Button>
          ))}
        </div>

        {/* Resumen rápido */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Resumen Rápido</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total Insumos:</span>
              <span className="font-medium">64</span>
            </div>
            <div className="flex justify-between">
              <span>Alertas Activas:</span>
              <span className="font-medium text-red-600">3</span>
            </div>
            <div className="flex justify-between">
              <span>Valor Inventario:</span>
              <span className="font-medium">$2.4M</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
