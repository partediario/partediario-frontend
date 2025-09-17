"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Settings, Bell, Fuel, Save, ArrowLeft } from "lucide-react"

export function ConfiguracionCombustibles() {
  const [configuracion, setConfiguracion] = useState({
    alertasEmail: true,
    alertasSMS: false,
    stockCritico: 20,
    stockBajo: 40,
    diasAlerta: 7,
    proveedorPredeterminado: "YPF",
    unidadMedida: "L",
    calcularConsumo: true,
    alertasAutomaticas: true,
  })

  const combustibles = [
    {
      id: "gasoil",
      nombre: "Gasoil Común",
      stockMinimo: 500,
      stockMaximo: 3000,
      precio: 850,
      proveedor: "YPF",
      activo: true,
    },
    {
      id: "nafta",
      nombre: "Nafta Super",
      stockMinimo: 200,
      stockMaximo: 1000,
      precio: 920,
      proveedor: "Shell",
      activo: true,
    },
    {
      id: "aceite",
      nombre: "Aceite Motor 15W40",
      stockMinimo: 20,
      stockMaximo: 100,
      precio: 1200,
      proveedor: "Mobil",
      activo: true,
    },
  ]

  const handleSave = () => {
    console.log("Guardando configuración:", configuracion)
    // Aquí iría la lógica para guardar la configuración
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Combustibles</h1>
            <p className="text-gray-600">Gestiona alertas, límites y parámetros del sistema</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-[#227C63] hover:bg-[#1a5f4d]">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="combustibles" className="flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Combustibles
          </TabsTrigger>
          <TabsTrigger value="parametros" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Parámetros
          </TabsTrigger>
          <TabsTrigger value="proveedores" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Proveedores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alertas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configuración de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipos de Alertas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canales de Notificación</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alertas-email">Alertas por Email</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones por correo electrónico</p>
                    </div>
                    <Switch
                      id="alertas-email"
                      checked={configuracion.alertasEmail}
                      onCheckedChange={(checked) => setConfiguracion((prev) => ({ ...prev, alertasEmail: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alertas-sms">Alertas por SMS</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones por mensaje de texto</p>
                    </div>
                    <Switch
                      id="alertas-sms"
                      checked={configuracion.alertasSMS}
                      onCheckedChange={(checked) => setConfiguracion((prev) => ({ ...prev, alertasSMS: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Umbrales de Alerta */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Umbrales de Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-critico">Stock Crítico (%)</Label>
                    <Input
                      id="stock-critico"
                      type="number"
                      value={configuracion.stockCritico}
                      onChange={(e) => setConfiguracion((prev) => ({ ...prev, stockCritico: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-500">Porcentaje del stock mínimo para alerta crítica</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-bajo">Stock Bajo (%)</Label>
                    <Input
                      id="stock-bajo"
                      type="number"
                      value={configuracion.stockBajo}
                      onChange={(e) => setConfiguracion((prev) => ({ ...prev, stockBajo: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-gray-500">Porcentaje del stock mínimo para alerta de stock bajo</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configuración Temporal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración Temporal</h3>
                <div className="space-y-2">
                  <Label htmlFor="dias-alerta">Días de Anticipación</Label>
                  <Input
                    id="dias-alerta"
                    type="number"
                    value={configuracion.diasAlerta}
                    onChange={(e) => setConfiguracion((prev) => ({ ...prev, diasAlerta: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-500">Días de anticipación para alertas basadas en consumo promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combustibles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" />
                Gestión de Combustibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {combustibles.map((combustible) => (
                  <div key={combustible.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Fuel className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{combustible.nombre}</h3>
                          <p className="text-sm text-gray-600">Proveedor: {combustible.proveedor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={combustible.activo ? "default" : "secondary"}>
                          {combustible.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        <Switch checked={combustible.activo} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Mínimo</Label>
                        <Input type="number" defaultValue={combustible.stockMinimo} />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock Máximo</Label>
                        <Input type="number" defaultValue={combustible.stockMaximo} />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio Actual</Label>
                        <Input type="number" defaultValue={combustible.precio} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametros" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Parámetros del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuración General</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="proveedor-predeterminado">Proveedor Predeterminado</Label>
                      <Select
                        value={configuracion.proveedorPredeterminado}
                        onValueChange={(value) =>
                          setConfiguracion((prev) => ({ ...prev, proveedorPredeterminado: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YPF">YPF</SelectItem>
                          <SelectItem value="Shell">Shell</SelectItem>
                          <SelectItem value="Mobil">Mobil</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unidad-medida">Unidad de Medida</Label>
                      <Select
                        value={configuracion.unidadMedida}
                        onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, unidadMedida: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Litros (L)</SelectItem>
                          <SelectItem value="m3">Metros Cúbicos (m³)</SelectItem>
                          <SelectItem value="gal">Galones (gal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Automatización</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="calcular-consumo">Calcular Consumo Automático</Label>
                        <p className="text-sm text-gray-600">Calcular consumo promedio basado en movimientos</p>
                      </div>
                      <Switch
                        id="calcular-consumo"
                        checked={configuracion.calcularConsumo}
                        onCheckedChange={(checked) =>
                          setConfiguracion((prev) => ({ ...prev, calcularConsumo: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="alertas-automaticas">Alertas Automáticas</Label>
                        <p className="text-sm text-gray-600">Generar alertas automáticamente según umbrales</p>
                      </div>
                      <Switch
                        id="alertas-automaticas"
                        checked={configuracion.alertasAutomaticas}
                        onCheckedChange={(checked) =>
                          setConfiguracion((prev) => ({ ...prev, alertasAutomaticas: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proveedores" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Gestión de Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="bg-[#227C63] hover:bg-[#1a5f4d]">Agregar Proveedor</Button>
                <div className="space-y-3">
                  {["YPF", "Shell", "Mobil", "Petrobras"].map((proveedor) => (
                    <div key={proveedor} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{proveedor}</h3>
                        <p className="text-sm text-gray-600">Proveedor de combustibles</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Activo</Badge>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
