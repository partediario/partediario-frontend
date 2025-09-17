"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { ConfiguracionCombustibles } from "./configuracion-combustibles"
import { KPIPersonalizable } from "./kpi-personalizable"
import { CombustiblesMejorado } from "./combustibles-mejorado"
import InsumosDashboard from "./insumos-dashboard"
import { IndicadorCritico } from "./indicador-critico"
import { HistorialConsumo } from "./historial-consumo"
import { TrazabilidadPanel } from "./trazabilidad-panel"
import { DashboardConfiguracion } from "./dashboard-configuracion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Plus, Eye, Edit } from "lucide-react"
import { VistaPorDestino } from "./vista-por-destino"
import { GestionInsumoEspecifico } from "./gestion-insumo-especifico"

export function Dashboard() {
  const [activeSection, setActiveSection] = useState("insumos")
  const [kpisVisibles, setKpisVisibles] = useState<any[]>([])
  const [trazabilidadOpen, setTrazabilidadOpen] = useState(false)
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<any>(null)

  const handleKPIChange = (kpis: any[]) => {
    setKpisVisibles(kpis)
  }

  const handleAgregarMovimiento = (insumo: any) => {
    console.log("Agregar movimiento para:", insumo)
    // Aquí iría la lógica para abrir el modal de agregar movimiento
  }

  const handleVerTrazabilidad = (insumo: any) => {
    setInsumoSeleccionado(insumo)
    setTrazabilidadOpen(true)
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case "configuracion":
        return <DashboardConfiguracion />
      case "configuracion-combustibles":
        return <ConfiguracionCombustibles />
      case "combustibles":
        return <CombustiblesMejorado />
      case "indicadores":
        return (
          <div className="p-6">
            <IndicadorCritico onAgregarMovimiento={handleAgregarMovimiento} onVerTrazabilidad={handleVerTrazabilidad} />
          </div>
        )
      case "historial":
        return (
          <div className="p-6">
            <HistorialConsumo />
          </div>
        )
      case "trazabilidad":
        return (
          <div className="p-6">
            <KPIPersonalizable onKPIChange={handleKPIChange} />
          </div>
        )
      case "vista-destino":
        return (
          <div className="p-6">
            <VistaPorDestino insumosData={[]} movimientosData={[]} />
          </div>
        )
      case "insumos":
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <GestionInsumoEspecifico
              categoria="combustibles"
              categoriaNombre="Combustibles y Lubricantes"
              categoriaEmoji="⛽"
            />
          </div>
        )
      case "veterinarios":
      case "balanceados":
      case "agricolas":
      case "materiales":
        return (
          <div className="p-6">
            <InsumosDashboard />
          </div>
        )
      default:
        return (
          <div className="flex-1 bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Partes Diarios</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Selecciona la fecha</span>
                </div>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                AGREGAR
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">NACIMIENTOS</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">COMPRA</p>
                  <p className="text-3xl font-bold text-gray-900">296</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">VENTA</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">LLUVIA TOTAL 2025</p>
                  <p className="text-3xl font-bold text-gray-900">710 mm</p>
                </CardContent>
              </Card>
            </div>

            {/* Sample Entries */}
            <div className="space-y-4">
              {[
                {
                  title: "ENTRADA",
                  subtitle: "Compra2, Categoría: DESMAMANTE/MACHO, Cantidad: 148, Peso: 180 kg",
                  date: "17/5/2025 13:45 Emilio Benítez Santubí",
                },
                {
                  title: "ENTRADA",
                  subtitle: "Compra2, Categoría: DESMAMANTE/MACHO, Cantidad: 148, Peso: 180 kg",
                  date: "17/5/2025 13:44 Emilio Benítez Santubí",
                },
                { title: "CLIMA", subtitle: "LLUVIA, Medida: 35 mm", date: "24/4/2025 11:34 Emilio Benítez Santubí" },
                { title: "CLIMA", subtitle: "LLUVIA, Medida: 160 mm", date: "15/4/2025 10:48 Emilio Benítez Santubí" },
                { title: "CLIMA", subtitle: "LLUVIA, Medida: 95 mm", date: "1/4/2025 00:00 Emilio Benítez Santubí" },
                { title: "CLIMA", subtitle: "LLUVIA, Medida: 400 mm", date: "1/3/2025 15:30 Emilio Benítez Santubí" },
              ].map((entry, index) => (
                <Card key={index} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src="/placeholder.svg?height=60&width=60"
                        alt="Entry image"
                        className="w-15 h-15 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{entry.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{entry.subtitle}</p>
                        <p className="text-xs text-gray-500">{entry.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      {renderMainContent()}
      <TrazabilidadPanel
        isOpen={trazabilidadOpen}
        onClose={() => setTrazabilidadOpen(false)}
        insumo={insumoSeleccionado}
      />
    </div>
  )
}
