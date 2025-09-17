"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Database, Users, Save, ArrowLeft } from "lucide-react"

export function DashboardConfiguracion() {
  const [configuracion, setConfiguracion] = useState({
    // Configuración de alertas
    alertasEmail: true,
    alertasSMS: false,
    alertasWhatsApp: true,
    stockCritico: 20,
    stockBajo: 40,
    diasAlerta: 7,

    // Configuración de datos
    actualizacionAutomatica: true,
    intervalActualizacion: 30,
    backupAutomatico: true,
    retencionDatos: 365,

    // Configuración de usuarios
    registroPublico: false,
    aprobarUsuarios: true,
    sesionExpira: 480,

    // Configuración general
    moneda: "ARS",
    idioma: "es",
    zonaHoraria: "America/Argentina/Buenos_Aires",
    formatoFecha: "DD/MM/YYYY",
  })

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
            Volver al Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600">Gestiona las configuraciones generales del dashboard</p>
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
          <TabsTrigger value="datos" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
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
              {/* Canales de Notificación */}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="alertas-whatsapp">Alertas por WhatsApp</Label>
                      <p className="text-sm text-gray-600">Recibir notificaciones por WhatsApp</p>
                    </div>
                    <Switch
                      id="alertas-whatsapp"
                      checked={configuracion.alertasWhatsApp}
                      onCheckedChange={(checked) => setConfiguracion((prev) => ({ ...prev, alertasWhatsApp: checked }))}
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

        <TabsContent value="datos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Gestión de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Actualización de Datos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Actualización de Datos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="actualizacion-automatica">Actualización Automática</Label>
                      <p className="text-sm text-gray-600">Actualizar datos automáticamente en tiempo real</p>
                    </div>
                    <Switch
                      id="actualizacion-automatica"
                      checked={configuracion.actualizacionAutomatica}
                      onCheckedChange={(checked) =>
                        setConfiguracion((prev) => ({ ...prev, actualizacionAutomatica: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intervalo-actualizacion">Intervalo de Actualización (segundos)</Label>
                    <Input
                      id="intervalo-actualizacion"
                      type="number"
                      value={configuracion.intervalActualizacion}
                      onChange={(e) =>
                        setConfiguracion((prev) => ({ ...prev, intervalActualizacion: Number(e.target.value) }))
                      }
                    />
                    <p className="text-xs text-gray-500">Frecuencia de actualización de datos en segundos</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Backup y Retención */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Backup y Retención</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="backup-automatico">Backup Automático</Label>
                      <p className="text-sm text-gray-600">Realizar copias de seguridad automáticas</p>
                    </div>
                    <Switch
                      id="backup-automatico"
                      checked={configuracion.backupAutomatico}
                      onCheckedChange={(checked) =>
                        setConfiguracion((prev) => ({ ...prev, backupAutomatico: checked }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retencion-datos">Retención de Datos (días)</Label>
                    <Input
                      id="retencion-datos"
                      type="number"
                      value={configuracion.retencionDatos}
                      onChange={(e) =>
                        setConfiguracion((prev) => ({ ...prev, retencionDatos: Number(e.target.value) }))
                      }
                    />
                    <p className="text-xs text-gray-500">Días que se mantendrán los datos históricos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Registro de Usuarios */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Registro de Usuarios</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registro-publico">Registro Público</Label>
                      <p className="text-sm text-gray-600">Permitir que usuarios se registren sin invitación</p>
                    </div>
                    <Switch
                      id="registro-publico"
                      checked={configuracion.registroPublico}
                      onCheckedChange={(checked) => setConfiguracion((prev) => ({ ...prev, registroPublico: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="aprobar-usuarios">Aprobar Usuarios</Label>
                      <p className="text-sm text-gray-600">Requerir aprobación manual de nuevos usuarios</p>
                    </div>
                    <Switch
                      id="aprobar-usuarios"
                      checked={configuracion.aprobarUsuarios}
                      onCheckedChange={(checked) => setConfiguracion((prev) => ({ ...prev, aprobarUsuarios: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sesiones */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gestión de Sesiones</h3>
                <div className="space-y-2">
                  <Label htmlFor="sesion-expira">Expiración de Sesión (minutos)</Label>
                  <Input
                    id="sesion-expira"
                    type="number"
                    value={configuracion.sesionExpira}
                    onChange={(e) => setConfiguracion((prev) => ({ ...prev, sesionExpira: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-500">Tiempo en minutos antes de que expire una sesión inactiva</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuración Regional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración Regional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moneda">Moneda</Label>
                    <Select
                      value={configuracion.moneda}
                      onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, moneda: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                        <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        <SelectItem value="BRL">Real Brasileño (BRL)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idioma">Idioma</Label>
                    <Select
                      value={configuracion.idioma}
                      onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, idioma: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zona-horaria">Zona Horaria</Label>
                    <Select
                      value={configuracion.zonaHoraria}
                      onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, zonaHoraria: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formato-fecha">Formato de Fecha</Label>
                    <Select
                      value={configuracion.formatoFecha}
                      onValueChange={(value) => setConfiguracion((prev) => ({ ...prev, formatoFecha: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
