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
import { LoteDrawer } from "../components/lote-drawer"
import { usePermissions } from "@/hooks/use-permissions"

interface Lote {
  id: number
  nombre: string
  potrero_id: number
  empresa_id: number
  establecimiento_id: number
  pd_potreros?: {
    nombre: string
  }
}

interface LoteStock {
  id: number
  lote_id: number
  categoria_animal_id: number
  cantidad: number
  peso_total: number | null
}

export function Lotes() {
  const { toast } = useToast()
  const { state } = useConfigNavigation()
  const permissions = usePermissions()

  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [lotesStock, setLotesStock] = useState<Record<number, LoteStock[]>>({})

  useEffect(() => {
    if (state.selectedEstablecimientoId) {
      fetchLotes()
    } else {
      setLotes([])
      setLotesStock({})
    }
  }, [state.selectedEstablecimientoId])

  const fetchLotes = async () => {
    if (!state.selectedEstablecimientoId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/lotes-crud?establecimiento_id=${state.selectedEstablecimientoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar lotes")
      }

      const lotesData = data.lotes || []
      setLotes(lotesData)

      await fetchStockParaTodosLosLotes(lotesData)
    } catch (error) {
      console.error("Error fetching lotes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los lotes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStockParaTodosLosLotes = async (lotesData: Lote[]) => {
    try {
      const stockPromises = lotesData.map(async (lote) => {
        try {
          const response = await fetch(`/api/lote-stock?lote_id=${lote.id}`)
          const data = await response.json()
          return { loteId: lote.id, stock: data.stock || [] }
        } catch (error) {
          console.error(`Error fetching stock for lote ${lote.id}:`, error)
          return { loteId: lote.id, stock: [] }
        }
      })

      const stockResults = await Promise.all(stockPromises)
      const stockMap: Record<number, LoteStock[]> = {}

      for (const result of stockResults) {
        stockMap[result.loteId] = result.stock
      }

      setLotesStock(stockMap)
    } catch (error) {
      console.error("Error fetching stock for lotes:", error)
    }
  }

  const calcularEstadoLote = (loteId: number): "Cargado" | "Vacío" => {
    const stock = lotesStock[loteId] || []

    if (stock.length === 0) {
      return "Vacío"
    }

    const todasCantidadesCero = stock.every((item) => item.cantidad === 0)
    if (todasCantidadesCero) {
      return "Vacío"
    }

    return "Cargado"
  }

  const handleCreate = () => {
    setSelectedLote(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEdit = (lote: Lote) => {
    setSelectedLote(lote)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    fetchLotes()
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

  if (!state.selectedEstablecimientoId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Lotes de Animales</h3>
          <p className="text-sm text-slate-600">Gestiona los grupos de animales y su ubicación en potreros</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-500 mb-2">Selecciona un establecimiento para ver los lotes</p>
              <p className="text-sm text-slate-400">Los lotes se organizan por establecimiento</p>
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
          <h3 className="text-lg font-semibold">Lotes de Animales</h3>
          <p className="text-sm text-slate-600">Gestiona los grupos de animales y su ubicación en potreros</p>
        </div>
        {!permissions.isConsultor && (
          <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Lotes Registrados</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Lotes Registrados"
              onClick={(e) => handleTooltipToggle("lotes-registrados", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>{loading ? "Cargando lotes..." : `${lotes.length} lotes registrados`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Cargando lotes...</div>
            </div>
          ) : lotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No hay lotes registrados</p>
              {!permissions.isConsultor && (
                <Button onClick={handleCreate} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer lote
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Lote</TableHead>
                  <TableHead>Potrero Actual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotes.map((lote) => {
                  const estado = calcularEstadoLote(lote.id)

                  return (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">{lote.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lote.pd_potreros?.nombre || "Sin potrero"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={estado === "Cargado" ? "default" : "outline"}
                          className={
                            estado === "Cargado" ? "bg-green-600 hover:bg-green-700" : "text-gray-600 border-gray-300"
                          }
                        >
                          {estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!permissions.isConsultor && (
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(lote)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LoteDrawer
        lote={selectedLote}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        establecimientoId={state.selectedEstablecimientoId || ""}
      />

      {activeTooltip === "lotes-registrados" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Grupos de animales organizados</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Los lotes son agrupaciones lógicas de animales que facilitan el manejo y seguimiento del ganado. Cada lote
              se ubica en un potrero específico y permite registrar movimientos y actividades.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Funcionalidad:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Los lotes permiten controlar el stock de animales de manera organizada, registrar movimientos entre
                potreros y generar reportes específicos por grupo de animales.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTooltip && <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)} />}
    </div>
  )
}
