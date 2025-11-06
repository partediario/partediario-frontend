"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus, Eye, Calendar } from "lucide-react"

interface IndicadorCriticoProps {
  onAgregarMovimiento?: (insumo: any) => void
  onVerTrazabilidad?: (insumo: any) => void
}

export function IndicadorCritico({ onAgregarMovimiento, onVerTrazabilidad }: IndicadorCriticoProps) {
  const alertasCriticas = [
    {
      id: "1",
      nombre: "Nafta Super",
      categoria: "Combustibles",
      stockActual: 180,
      stockMinimo: 200,
      unidad: "L",
      diasRestantes: 3,
      ultimoMovimiento: "2025-01-15",
      criticidad: "critico",
      icono: "⛽",
    },
    {
      id: "2",
      nombre: "Vacuna Triple",
      categoria: "Veterinarios",
      stockActual: 8,
      stockMinimo: 15,
      unidad: "dosis",
      diasRestantes: 12,
      ultimoMovimiento: "2025-01-10",
      criticidad: "bajo",
      icono: "💉",
    },
    {
      id: "3",
      nombre: "Alambre Eléctrico",
      categoria: "Materiales",
      stockActual: 45,
      stockMinimo: 100,
      unidad: "metros",
      diasRestantes: 8,
      ultimoMovimiento: "2025-01-08",
      criticidad: "bajo",
      icono: "🔌",
    },
  ]

  const getCriticidadColor = (criticidad: string) => {
    switch (criticidad) {
      case "critico":
        return "bg-red-100 text-red-800 border-red-200"
      case "bajo":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getCriticidadTexto = (criticidad: string) => {
    switch (criticidad) {
      case "critico":
        return "Crítico"
      case "bajo":
        return "Stock Bajo"
      default:
        return "Atención"
    }
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Stock Crítico
          </CardTitle>
          <Badge className="bg-red-100 text-red-800">{alertasCriticas.length} alertas activas</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alertasCriticas.map((alerta) => (
            <div key={alerta.id} className={`border rounded-lg p-4 ${getCriticidadColor(alerta.criticidad)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{alerta.icono}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{alerta.nombre}</h3>
                    <p className="text-sm text-gray-600">{alerta.categoria}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getCriticidadColor(alerta.criticidad)}>
                    {getCriticidadTexto(alerta.criticidad)}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Stock Actual</p>
                  <p className="font-semibold">
                    {alerta.stockActual} {alerta.unidad}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Stock Mínimo</p>
                  <p className="font-semibold">
                    {alerta.stockMinimo} {alerta.unidad}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Días Restantes</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {alerta.diasRestantes} días
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Último Movimiento</p>
                  <p className="font-semibold">{new Date(alerta.ultimoMovimiento).toLocaleDateString("es-ES")}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAgregarMovimiento?.(alerta)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Entrada
                </Button>
                <Button size="sm" variant="outline" onClick={() => onVerTrazabilidad?.(alerta)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Historial
                </Button>
              </div>

              {/* Indicador visual de nivel */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>0</span>
                  <span>{alerta.stockMinimo} (mínimo)</span>
                  <span>Capacidad</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${alerta.criticidad === "critico" ? "bg-red-500" : "bg-orange-500"}`}
                    style={{
                      width: `${Math.min((alerta.stockActual / (alerta.stockMinimo * 2)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {alertasCriticas.length === 0 && (
            <div className="text-center py-8">
              <div className="text-green-500 mb-4">
                <AlertTriangle className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¡Todo en orden!</h3>
              <p className="text-gray-600">No hay alertas de stock crítico en este momento.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
