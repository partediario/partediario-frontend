"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Plus, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { MaquinariaDrawer } from "../components/maquinaria-drawer"
import { usePermissions } from "@/hooks/use-permissions"

interface Maquinaria {
  id: number
  nombre: string
  categoria: string | null
  marca: string | null
  modelo: string | null
  empresa_id: number
}

export function Maquinarias() {
  const { toast } = useToast()
  const { state } = useConfigNavigation()
  const empresaSeleccionada = state.selectedEmpresaId ? Number(state.selectedEmpresaId) : null
  const permissions = usePermissions()

  const [maquinarias, setMaquinarias] = useState<Maquinaria[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMaquinaria, setSelectedMaquinaria] = useState<Maquinaria | null>(null)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar maquinarias cuando cambia la empresa
  useEffect(() => {
    if (empresaSeleccionada) {
      fetchMaquinarias()
    } else {
      setMaquinarias([])
    }
  }, [empresaSeleccionada])

  const fetchMaquinarias = async () => {
    if (!empresaSeleccionada) return

    setLoading(true)
    try {
      const response = await fetch(`/api/maquinarias-crud?empresa_id=${empresaSeleccionada}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar maquinarias")
      }

      setMaquinarias(data.maquinarias || [])
    } catch (error) {
      console.error("Error fetching maquinarias:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las maquinarias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedMaquinaria(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEdit = (maquinaria: Maquinaria) => {
    setSelectedMaquinaria(maquinaria)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    fetchMaquinarias()
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

  if (!empresaSeleccionada) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Maquinarias</h3>
          <p className="text-sm text-slate-600">Gestiona las maquinarias de tu empresa</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-500 mb-2">Selecciona una empresa para ver las maquinarias</p>
              <p className="text-sm text-slate-400">Las maquinarias se organizan por empresa</p>
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
          <h3 className="text-lg font-semibold">Maquinarias</h3>
          <p className="text-sm text-slate-600">Gestiona las maquinarias de tu empresa</p>
        </div>
        {/* Solo mostrar botón Nueva Maquinaria si NO es consultor */}
        {!permissions.isConsultor && (
          <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Maquinaria
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Maquinarias Registradas</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Maquinarias Registradas"
              onClick={(e) => handleTooltipToggle("maquinarias-registradas", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>
            {loading ? "Cargando maquinarias..." : `${maquinarias.length} maquinarias registradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Cargando maquinarias...</div>
            </div>
          ) : maquinarias.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No hay maquinarias registradas</p>
              {!permissions.isConsultor && (
                <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primera maquinaria
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maquinarias.map((maquinaria) => (
                  <TableRow key={maquinaria.id}>
                    <TableCell className="font-medium">{maquinaria.nombre}</TableCell>
                    <TableCell>
                      {maquinaria.categoria ? (
                        <Badge variant="secondary">{maquinaria.categoria}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin categoría</span>
                      )}
                    </TableCell>
                    <TableCell>{maquinaria.marca || <span className="text-gray-400 text-sm">-</span>}</TableCell>
                    <TableCell>{maquinaria.modelo || <span className="text-gray-400 text-sm">-</span>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Solo mostrar botones si NO es consultor */}
                        {!permissions.isConsultor && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(maquinaria)}>
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

      <MaquinariaDrawer
        maquinaria={selectedMaquinaria}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        empresaId={empresaSeleccionada || ""}
      />

      {/* Tooltip manual */}
      {activeTooltip === "maquinarias-registradas" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Gestión de Maquinarias</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Las maquinarias son los equipos y vehículos utilizados en las operaciones de la empresa agropecuaria.
              Registra tractores, cosechadoras, implementos y otros equipos para llevar un control de su uso.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Funcionalidad:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Mantén un registro organizado de todas las maquinarias de tu empresa, incluyendo su categoría, marca y
                modelo para facilitar el seguimiento y mantenimiento.
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
