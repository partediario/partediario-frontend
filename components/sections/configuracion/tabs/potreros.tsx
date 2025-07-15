"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Plus, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEstablishment } from "@/contexts/establishment-context"
import { PotreroDrawer } from "../components/potrero-drawer"
import { usePermissions } from "@/hooks/use-permissions"

interface Potrero {
  id: number
  nombre: string
  superficie_total: number
  superfice_util: number | null
  recurso_forrajero: string | null
  receptividad: number | null
  receptividad_unidad: string | null
  establecimiento_id: number
}

export function Potreros() {
  const { toast } = useToast()
  const { establecimientoSeleccionado } = useEstablishment()
  const permissions = usePermissions()

  const [potreros, setPotreros] = useState<Potrero[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPotrero, setSelectedPotrero] = useState<Potrero | null>(null)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar potreros cuando cambia el establecimiento
  useEffect(() => {
    if (establecimientoSeleccionado) {
      loadPotreros()
    } else {
      setPotreros([])
    }
  }, [establecimientoSeleccionado])

  const loadPotreros = async () => {
    if (!establecimientoSeleccionado) return

    setLoading(true)
    try {
      const response = await fetch(`/api/potreros-crud?establecimiento_id=${establecimientoSeleccionado}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar potreros")
      }

      setPotreros(data.potreros || [])
    } catch (error) {
      console.error("Error fetching potreros:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los potreros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoPotrero = () => {
    setSelectedPotrero(null)
    setDrawerMode("create")
    setDrawerOpen(true)
  }

  const handleEditPotrero = (potrero: Potrero) => {
    setSelectedPotrero(potrero)
    setDrawerMode("edit")
    setDrawerOpen(true)
  }

  const handleDrawerSuccess = () => {
    loadPotreros()
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

  // Función para formatear la receptividad con el label correcto y coma decimal
  const formatReceptividad = (receptividad: number | null, unidad: string | null) => {
    if (!receptividad || !unidad) return "-"

    // Convertir unidad de API a label de display
    const unidadLabel = unidad === "KILOS" ? "Kg" : unidad === "UG" ? "Ug" : unidad

    // Formatear número con coma decimal si tiene decimales
    const numeroFormateado =
      receptividad % 1 === 0 ? receptividad.toString() : receptividad.toString().replace(".", ",")

    return `${numeroFormateado} ${unidadLabel}`
  }

  if (!establecimientoSeleccionado) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-slate-600">Selecciona un establecimiento para gestionar sus potreros</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Potreros</h3>
          <p className="text-sm text-slate-600">Gestiona las divisiones de pastoreo de tu establecimiento</p>
        </div>
        {/* Solo mostrar botón Nuevo Potrero si NO es consultor */}
        {!permissions.isConsultor && (
          <Button onClick={handleNuevoPotrero} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Potrero
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Potreros Registrados</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Potreros Registrados"
              onClick={(e) => handleTooltipToggle("potreros-registrados", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>
            {loading ? "Cargando potreros..." : `${potreros.length} potreros registrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <p className="text-slate-600">Cargando potreros...</p>
            </div>
          ) : potreros.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No hay potreros registrados</p>
              {/* Solo mostrar botón si NO es consultor */}
              {!permissions.isConsultor && (
                <Button onClick={handleNuevoPotrero} className="bg-green-700 hover:bg-green-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer potrero
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Superficie Total</TableHead>
                  <TableHead>Superficie Útil</TableHead>
                  <TableHead>Recurso Forrajero</TableHead>
                  <TableHead>Receptividad</TableHead>
                  <TableHead className="w-32">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {potreros.map((potrero) => (
                  <TableRow key={potrero.id}>
                    <TableCell className="font-medium">{potrero.nombre}</TableCell>
                    <TableCell>{potrero.superficie_total} ha</TableCell>
                    <TableCell>{potrero.superfice_util ? `${potrero.superfice_util} ha` : "-"}</TableCell>
                    <TableCell>{potrero.recurso_forrajero || "-"}</TableCell>
                    <TableCell>{formatReceptividad(potrero.receptividad, potrero.receptividad_unidad)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Solo mostrar botón editar si NO es consultor */}
                        {!permissions.isConsultor && (
                          <Button size="sm" variant="ghost" onClick={() => handleEditPotrero(potrero)}>
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

      <PotreroDrawer
        potrero={selectedPotrero}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        establecimientoId={establecimientoSeleccionado}
      />

      {/* Tooltip manual */}
      {activeTooltip === "potreros-registrados" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Divisiones de pastoreo del establecimiento</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Los potreros son las divisiones físicas de tu establecimiento donde pastan los animales. Registra la
              superficie total, útil, tipo de pasto y capacidad de carga para optimizar el manejo del ganado.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Datos importantes:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                La receptividad indica cuántos animales puede soportar el potrero. El recurso forrajero especifica el
                tipo de pasto disponible. Esta información es clave para la rotación de pasturas.
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
