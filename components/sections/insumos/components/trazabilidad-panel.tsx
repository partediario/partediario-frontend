"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  TrendingUp,
  TrendingDown,
  MapPin,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"

interface TrazabilidadPanelProps {
  isOpen: boolean
  onClose: () => void
  insumo: any
}

export function TrazabilidadPanel({ isOpen, onClose, insumo }: TrazabilidadPanelProps) {
  const [activeTab, setActiveTab] = useState("movimientos")

  if (!insumo) return null

  const movimientosEjemplo = [
    {
      id: 1,
      fecha: "2024-01-15",
      tipo: "Entrada",
      cantidad: 500,
      unidad: "L",
      destino: "Depósito Central",
      usuario: "Juan Pérez",
      observaciones: "Compra mensual programada",
      documento: "FC-001234",
      proveedor: "YPF",
      precio: 850,
      lote: "L240115001",
    },
    {
      id: 2,
      fecha: "2024-01-18",
      tipo: "Salida",
      cantidad: 120,
      unidad: "L",
      destino: "Tractor JD 6110",
      usuario: "Carlos López",
      observaciones: "Carga para siembra de soja",
      documento: "RM-000456",
      operacion: "Siembra Lote Norte",
      precio: 850,
      lote: "L240115001",
    },
    {
      id: 3,
      fecha: "2024-01-20",
      tipo: "Salida",
      cantidad: 80,
      unidad: "L",
      destino: "Cosechadora Case",
      usuario: "Ana Martín",
      observaciones: "Mantenimiento preventivo",
      documento: "RM-000457",
      operacion: "Mantenimiento",
      precio: 850,
      lote: "L240115001",
    },
  ]

  const alertasEjemplo = [
    {
      id: 1,
      tipo: "warning",
      mensaje: "Stock por debajo del mínimo recomendado",
      fecha: "2024-01-22",
      estado: "activa",
    },
    {
      id: 2,
      tipo: "info",
      mensaje: "Precio actualizado automáticamente",
      fecha: "2024-01-20",
      estado: "resuelta",
    },
  ]

  const documentosEjemplo = [
    {
      id: 1,
      tipo: "Factura de Compra",
      numero: "FC-001234",
      fecha: "2024-01-15",
      proveedor: "YPF",
      monto: 425000,
    },
    {
      id: 2,
      tipo: "Remito de Salida",
      numero: "RM-000456",
      fecha: "2024-01-18",
      destino: "Tractor JD 6110",
      cantidad: "120 L",
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value)
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === "Entrada" ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    )
  }

  const getAlertaIcon = (tipo: string) => {
    switch (tipo) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Trazabilidad: {insumo.nombre}
          </SheetTitle>
          <SheetDescription>Historial completo de movimientos, documentos y alertas del insumo</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Información del Insumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Categoría</p>
                  <p className="font-medium">{insumo.categoria}</p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Actual</p>
                  <p className="font-medium">
                    {insumo.stockActual} {insumo.unidad}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Estado</p>
                  <Badge
                    variant={
                      insumo.estado === "critico" ? "destructive" : insumo.estado === "bajo" ? "secondary" : "default"
                    }
                  >
                    {insumo.estado}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600">Días Restantes</p>
                  <p className="font-medium">{insumo.diasRestantes || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs de Trazabilidad */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
            </TabsList>

            <TabsContent value="movimientos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {movimientosEjemplo.map((movimiento, index) => (
                      <div key={movimiento.id}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">{getTipoIcon(movimiento.tipo)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={movimiento.tipo === "Entrada" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {movimiento.tipo}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {new Date(movimiento.fecha).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="font-semibold">
                                {movimiento.cantidad} {movimiento.unidad}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{movimiento.destino}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-gray-400" />
                                <span>{movimiento.usuario}</span>
                              </div>
                              {movimiento.documento && (
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3 h-3 text-gray-400" />
                                  <span>{movimiento.documento}</span>
                                </div>
                              )}
                              {movimiento.lote && (
                                <div className="flex items-center gap-2">
                                  <Package className="w-3 h-3 text-gray-400" />
                                  <span>Lote: {movimiento.lote}</span>
                                </div>
                              )}
                            </div>

                            {movimiento.observaciones && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                                {movimiento.observaciones}
                              </div>
                            )}

                            <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                              <span>Valor: {formatCurrency(movimiento.precio * movimiento.cantidad)}</span>
                              <span>Precio unitario: {formatCurrency(movimiento.precio)}</span>
                            </div>
                          </div>
                        </div>
                        {index < movimientosEjemplo.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos Relacionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documentosEjemplo.map((documento, index) => (
                      <div key={documento.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{documento.tipo}</p>
                              <p className="text-sm text-gray-600">N° {documento.numero}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{new Date(documento.fecha).toLocaleDateString()}</p>
                            <p className="text-gray-600">{documento.proveedor || documento.destino}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          {documento.monto && <p>Monto: {formatCurrency(documento.monto)}</p>}
                          {documento.cantidad && <p>Cantidad: {documento.cantidad}</p>}
                        </div>
                        {index < documentosEjemplo.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alertas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas y Notificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alertasEjemplo.map((alerta, index) => (
                      <div key={alerta.id}>
                        <div className="flex items-start gap-3">
                          {getAlertaIcon(alerta.tipo)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{alerta.mensaje}</p>
                              <Badge
                                variant={alerta.estado === "activa" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {alerta.estado}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(alerta.fecha).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {index < alertasEjemplo.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Acciones */}
          <div className="flex gap-2 pt-4 border-t">
            <Button className="flex-1 bg-[#227C63] hover:bg-[#1a5f4d]">Exportar Historial</Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
