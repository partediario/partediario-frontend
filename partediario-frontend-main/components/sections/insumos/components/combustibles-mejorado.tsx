"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, TrendingUp, TrendingDown, Fuel, Plus, Eye, Calendar } from "lucide-react"

export function CombustiblesMejorado() {
  const [selectedFuel, setSelectedFuel] = useState<string | null>(null)

  const combustibles = [
    {
      id: "gasoil",
      nombre: "Gasoil Común",
      stockActual: 1200,
      stockMinimo: 500,
      stockMaximo: 3000,
      unidad: "L",
      precio: 850,
      estado: "normal",
      consumoMensual: 800,
      diasRestantes: 45,
      proveedor: "YPF",
      ubicacion: "Tanque Principal",
    },
    {
      id: "nafta",
      nombre: "Nafta Super",
      stockActual: 180,
      stockMinimo: 200,
      stockMaximo: 1000,
      unidad: "L",
      precio: 920,
      estado: "critico",
      consumoMensual: 150,
      diasRestantes: 36,
      proveedor: "Shell",
      ubicacion: "Tanque Secundario",
    },
    {
      id: "aceite",
      nombre: "Aceite Motor 15W40",
      stockActual: 45,
      stockMinimo: 20,
      stockMaximo: 100,
      unidad: "L",
      precio: 1200,
      estado: "normal",
      consumoMensual: 25,
      diasRestantes: 54,
      proveedor: "Mobil",
      ubicacion: "Depósito",
    },
  ]

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "critico":
        return "text-red-600 bg-red-50 border-red-200"
      case "bajo":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-green-600 bg-green-50 border-green-200"
    }
  }

  const getProgressColor = (porcentaje: number) => {
    if (porcentaje < 20) return "bg-red-500"
    if (porcentaje < 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Combustibles</h1>
          <p className="text-gray-600">Control avanzado de stock y consumo</p>
        </div>
        <Button className="bg-[#227C63] hover:bg-[#1a5f4d]">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {combustibles.reduce((sum, c) => sum + c.stockActual, 0).toLocaleString()} L
                </p>
              </div>
              <Fuel className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(combustibles.reduce((sum, c) => sum + c.stockActual * c.precio, 0))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consumo Mensual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {combustibles.reduce((sum, c) => sum + c.consumoMensual, 0).toLocaleString()} L
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                <p className="text-2xl font-bold text-red-600">
                  {combustibles.filter((c) => c.estado === "critico").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Combustibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {combustibles.map((combustible) => {
          const porcentajeStock = (combustible.stockActual / combustible.stockMaximo) * 100
          const porcentajeMinimo = (combustible.stockMinimo / combustible.stockMaximo) * 100

          return (
            <Card
              key={combustible.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedFuel === combustible.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedFuel(combustible.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-blue-600" />
                    {combustible.nombre}
                  </CardTitle>
                  <Badge className={getEstadoColor(combustible.estado)}>
                    {combustible.estado === "critico" ? "Crítico" : combustible.estado === "bajo" ? "Bajo" : "Normal"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stock Visual */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stock Actual</span>
                    <span className="font-medium">
                      {combustible.stockActual.toLocaleString()} {combustible.unidad}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={porcentajeStock} className="h-3" />
                    <div
                      className="absolute top-0 h-3 w-1 bg-red-500 opacity-70"
                      style={{ left: `${porcentajeMinimo}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>Mín: {combustible.stockMinimo}</span>
                    <span>Máx: {combustible.stockMaximo}</span>
                  </div>
                </div>

                {/* Información Clave */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Precio</p>
                    <p className="font-medium">{formatCurrency(combustible.precio)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Días Restantes</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {combustible.diasRestantes}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Consumo/Mes</p>
                    <p className="font-medium">
                      {combustible.consumoMensual} {combustible.unidad}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Proveedor</p>
                    <p className="font-medium">{combustible.proveedor}</p>
                  </div>
                </div>

                {/* Valor Total */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(combustible.stockActual * combustible.precio)}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    <Plus className="w-3 h-3 mr-1" />
                    Entrada
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Eye className="w-3 h-3 mr-1" />
                    Historial
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detalles del Combustible Seleccionado */}
      {selectedFuel && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de {combustibles.find((c) => c.id === selectedFuel)?.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="movimientos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
                <TabsTrigger value="alertas">Alertas</TabsTrigger>
              </TabsList>
              <TabsContent value="movimientos" className="space-y-4">
                <p className="text-gray-600">Historial de movimientos del combustible seleccionado...</p>
              </TabsContent>
              <TabsContent value="estadisticas" className="space-y-4">
                <p className="text-gray-600">Estadísticas de consumo y tendencias...</p>
              </TabsContent>
              <TabsContent value="alertas" className="space-y-4">
                <p className="text-gray-600">Configuración de alertas y notificaciones...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
