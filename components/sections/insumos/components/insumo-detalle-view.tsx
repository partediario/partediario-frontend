"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, TrendingUp, Clock, Cable as Cube } from "lucide-react"

interface InsumoDetalleViewProps {
  insumo: any
  onVolver: () => void
}

export function InsumoDetalleView({ insumo, onVolver }: InsumoDetalleViewProps) {
  // Datos de prueba para los KPIs
  const kpisData = {
    stockTotal: 2000,
    totalEntradas: 1300,
    totalSalidas: 400,
    consumoDiarioPromedio: 100,
    diasRestantes: 20,
  }

  // Datos de prueba para información detallada
  const infoDetallada = {
    claseInsumo: "Combustible",
    tipoInsumo: "Gasoil",
    subtipoInsumo: "Gasoil Común",
    unidadMedidaProducto: "Litros",
    unidadMedidaUso: "Litros/día",
    ultimoMovimiento: "6/2/2024",
  }

  // Datos de prueba para resumen de movimientos
  const resumenMovimientos = {
    totalMovimientos: 5,
    totalEntradas: 1300,
    totalSalidas: 400,
    balanceNeto: 900,
  }

  // Datos de prueba para información adicional
  const infoAdicional = {
    ultimoMovimiento: "6/2/2024",
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onVolver} className="flex items-center gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div>
          <h3 className="text-xl font-semibold">Gasoil Común</h3>
          <p className="text-gray-600">Detalle completo del insumo</p>
        </div>
      </div>

      {/* KPIs - 5 tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stock Total */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stock Total</p>
                <p className="text-2xl font-bold">{kpisData.stockTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Entradas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">{kpisData.totalEntradas.toLocaleString()}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Salidas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Salidas</p>
                <p className="text-2xl font-bold text-red-600">{kpisData.totalSalidas.toLocaleString()}</p>
                <p className="text-xs text-gray-500">unidades</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600 rotate-180" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consumo Diario Promedio */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Consumo Diario Promedio</p>
                <p className="text-2xl font-bold text-orange-600">{kpisData.consumoDiarioPromedio}</p>
                <p className="text-xs text-gray-500">unidades/día</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Días Restantes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Días Restantes</p>
                <p className="text-2xl font-bold text-purple-600">{kpisData.diasRestantes}</p>
                <p className="text-xs text-gray-500">estimados</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Detallada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cube className="w-5 h-5" />
            Información Detallada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Clase de Insumo</p>
              <p className="font-medium">{infoDetallada.claseInsumo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tipo de Insumo</p>
              <p className="font-medium">{infoDetallada.tipoInsumo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Subtipo de Insumo</p>
              <p className="font-medium">{infoDetallada.subtipoInsumo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Unidad de Medida del Producto</p>
              <p className="font-medium">{infoDetallada.unidadMedidaProducto}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Unidad de Medida de Uso</p>
              <p className="font-medium">{infoDetallada.unidadMedidaUso}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Último Movimiento</p>
              <p className="font-medium">{infoDetallada.ultimoMovimiento}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Movimientos e Información Adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen de Movimientos */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Movimientos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total de movimientos:</span>
              <span className="font-bold text-lg">{resumenMovimientos.totalMovimientos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600">Total entradas:</span>
              <span className="font-bold text-lg text-green-600">
                {resumenMovimientos.totalEntradas.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600">Total salidas:</span>
              <span className="font-bold text-lg text-red-600">{resumenMovimientos.totalSalidas.toLocaleString()}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-medium">Balance neto:</span>
              <span className="font-bold text-lg text-green-600">
                {resumenMovimientos.balanceNeto.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Último movimiento:</span>
              <span className="font-medium">{infoAdicional.ultimoMovimiento}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
