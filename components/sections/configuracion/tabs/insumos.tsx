"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { InsumoDrawer } from "../components/insumo-drawer"
import { usePermissions } from "@/hooks/use-permissions"

interface Insumo {
  id: number
  nombre: string
  contenido: number
  empresa_id: number
  establecimiento_id: number
  clase_insumo_id: number
  tipo_insumo_id: number
  subtipo_insumo_id: number
  unidad_medida_producto: number
  unidad_medida_uso: number
  pd_clase_insumos?: {
    nombre: string
  }
  pd_tipos_insumo?: {
    nombre: string
  }
  pd_subtipos_insumo?: {
    nombre: string
  }
  pd_unidad_medida_producto?: {
    nombre: string
  }
  pd_unidad_medida_uso?: {
    nombre: string
  }
  stock?: {
    cantidad: number
  }
}

export function Insumos() {
  const { toast } = useToast()
  const { establecimientoSeleccionado } = useEstablishment()
  const permissions = usePermissions()

  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar insumos cuando cambia el establecimiento
  useEffect(() => {
    if (establecimientoSeleccionado) {
      fetchInsumos()
    } else {
      setInsumos([])
    }
  }, [establecimientoSeleccionado])

  const fetchInsumos = async () => {
    if (!establecimientoSeleccionado) return

    setLoading(true)
    try {
      const response = await fetch(`/api/insumos-crud?establecimiento_id=${establecimientoSeleccionado}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar insumos")
      }

      setInsumos(data.insumos || [])
    } catch (error) {
      console.error("Error fetching insumos:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedInsumo(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEdit = (insumo: Insumo) => {
    setSelectedInsumo(insumo)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    fetchInsumos()
  }

  const handleTooltipToggle = (tooltipId: string, event: React.MouseEvent) => {
    if (activeTooltip === tooltipId) {
      setActiveTooltip(null)
      setTooltipPosition(null)
    } else {
      const rect = event.currentTarget.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left,
        y: rect.top - 10,
      })
      setActiveTooltip(tooltipId)
    }
  }

  if (!establecimientoSeleccionado) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Insumos Agropecuarios</h3>
          <p className="text-sm text-slate-600">Gestiona los insumos y su stock en el establecimiento</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-500 mb-2">Selecciona un establecimiento para ver los insumos</p>
              <p className="text-sm text-slate-400">Los insumos se organizan por establecimiento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Insumos Agropecuarios</h3>
          <p className="text-sm text-slate-600">Gestiona los insumos y su stock en el establecimiento</p>
        </div>
        {/* Solo mostrar botón Nuevo Insumo si NO es consultor */}
        {!permissions.isConsultor && (
          <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Insumo
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Insumos Registrados</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Insumos Registrados"
              onClick={(e) => handleTooltipToggle("insumos-registrados", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>{loading ? "Cargando insumos..." : `${insumos.length} insumos registrados`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Cargando insumos...</div>
            </div>
          ) : insumos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-2">No hay insumos registrados</p>
              <p className="text-sm text-slate-400">Crea tu primer insumo para comenzar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Insumo</TableHead>
                  <TableHead>Clase</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-medium">{insumo.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{insumo.pd_clase_insumos?.nombre || "Sin clase"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{insumo.pd_tipos_insumo?.nombre || "Sin tipo"}</Badge>
                    </TableCell>
                    <TableCell>
                      {insumo.contenido} {insumo.pd_unidad_medida_producto?.nombre || ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={insumo.stock?.cantidad ? "default" : "destructive"}>
                        {insumo.stock?.cantidad || 0} {insumo.pd_unidad_medida_uso?.nombre || "unidades"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Solo mostrar botón editar si NO es consultor */}
                        {!permissions.isConsultor && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(insumo)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InsumoDrawer
        insumo={selectedInsumo}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        establecimientoId={establecimientoSeleccionado || ""}
      />

      {/* Tooltip manual */}
      {activeTooltip === "insumos-registrados" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Gestión de insumos agropecuarios</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Los insumos son productos utilizados en las actividades agropecuarias como fertilizantes, medicamentos,
              alimentos, etc. Cada insumo tiene un stock que se puede gestionar independientemente.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Funcionalidad:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Permite controlar el inventario de insumos, registrar entradas y salidas, y mantener un control preciso
                del stock disponible para las actividades del establecimiento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar tooltip al hacer clic fuera */}
      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
