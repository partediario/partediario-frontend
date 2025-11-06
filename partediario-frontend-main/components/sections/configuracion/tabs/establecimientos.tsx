"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Edit, Plus, Loader2, HelpCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { EditarEstablecimientoDrawer } from "../components/editar-establecimiento-drawer"
import { PermissionWrapper } from "@/components/permission-wrapper"

interface Establecimiento {
  id: number
  nombre: string
  latitud: string
  longitud: string
  empresa_id: number
}

export function Establecimientos() {
  const { toast } = useToast()
  const { empresaSeleccionada, refreshData } = useEstablishment()
  const { usuario } = useUser()

  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<Establecimiento | null>(null)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("edit")
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  // Cargar establecimientos cuando cambia la empresa seleccionada
  useEffect(() => {
    if (empresaSeleccionada && usuario?.id) {
      loadEstablecimientos()
    } else {
      setEstablecimientos([])
    }
  }, [empresaSeleccionada, usuario?.id])

  const loadEstablecimientos = async () => {
    if (!empresaSeleccionada || !usuario?.id) return

    setLoading(true)
    try {
      console.log("🏭 Cargando establecimientos asignados para:", { usuario_id: usuario.id, empresaSeleccionada })

      const response = await fetch(
        `/api/establecimientos-configuracion?usuario_id=${usuario.id}&empresa_id=${empresaSeleccionada}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar establecimientos")
      }

      console.log("✅ Establecimientos asignados cargados:", data.establecimientos)
      setEstablecimientos(data.establecimientos || [])
    } catch (error) {
      console.error("❌ Error loading establecimientos:", error)
      toast({
        title: "Error",
        description: "Error al cargar establecimientos asignados",
        variant: "destructive",
      })
      setEstablecimientos([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (establecimiento: Establecimiento) => {
    setDrawerMode("edit")
    setSelectedEstablecimiento(establecimiento)
    setIsEditDrawerOpen(true)
  }

  const handleEditSuccess = async () => {
    await loadEstablecimientos()
    await refreshData() // Actualizar todos los dropdowns del sistema

    toast({
      title: "Sistema actualizado",
      description: "Todos los componentes han sido actualizados con los nuevos datos.",
    })
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
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Establecimientos</h3>
            <p className="text-sm text-slate-600">Registra la ubicación de tus establecimientos agropecuarios</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Selecciona una empresa</h3>
              <p className="text-slate-600">
                Para ver y gestionar establecimientos, primero selecciona una empresa en el menú superior.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!usuario?.id) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Cargando usuario</h3>
              <p className="text-slate-600">Esperando información del usuario...</p>
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
          <h3 className="text-lg font-semibold">Establecimientos</h3>
          <p className="text-sm text-slate-600">Registra la ubicación de tus establecimientos agropecuarios</p>
        </div>

        {/* Botón Nuevo Establecimiento - solo para usuarios que pueden editar */}
        <PermissionWrapper requirePermission="canEditConfig" configType="establecimiento">
          <Button
            onClick={() => {
              setDrawerMode("create")
              setSelectedEstablecimiento(null)
              setIsEditDrawerOpen(true)
            }}
            className="bg-green-700 hover:bg-green-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Establecimiento
          </Button>
        </PermissionWrapper>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Establecimientos Registrados</CardTitle>
            <button
              type="button"
              className="text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 transition-colors relative"
              aria-label="Información sobre Establecimientos Registrados"
              onClick={(e) => handleTooltipToggle("establecimientos-registrados", e)}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <CardDescription>Lista de establecimientos asignados a ti</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando establecimientos...</span>
            </div>
          ) : establecimientos.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tienes establecimientos asignados</h3>
              <p className="text-slate-600">No tienes establecimientos asignados en esta empresa.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Coordenadas</TableHead>
                  <TableHead className="w-20">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {establecimientos.map((establecimiento) => (
                  <TableRow key={establecimiento.id}>
                    <TableCell className="font-medium">{establecimiento.nombre}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {establecimiento.latitud && establecimiento.longitud
                        ? `${Number(establecimiento.latitud).toFixed(4)}, ${Number(establecimiento.longitud).toFixed(4)}`
                        : "Sin coordenadas"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* Botón Editar - solo para usuarios que pueden editar */}
                        <PermissionWrapper requirePermission="canEditConfig" configType="establecimiento">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(establecimiento)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </PermissionWrapper>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer de edición */}
      <EditarEstablecimientoDrawer
        establecimiento={selectedEstablecimiento}
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false)
          setSelectedEstablecimiento(null)
        }}
        onSuccess={handleEditSuccess}
        mode={drawerMode}
        empresaId={empresaSeleccionada}
      />

      {/* Tooltip manual */}
      {activeTooltip === "establecimientos-registrados" && tooltipPosition && (
        <div
          className="fixed w-96 bg-white border border-gray-200 rounded-lg shadow-xl p-5 z-[9999]"
          style={{
            left: Math.max(10, Math.min(tooltipPosition.x - 200, window.innerWidth - 400)),
            top: Math.max(10, tooltipPosition.y - 200),
          }}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-base text-gray-900 pr-2">Lista de establecimientos asignados</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Aquí se muestran todos los establecimientos agropecuarios que tienes asignados en esta empresa. Cada
              establecimiento representa una ubicación física donde se realizan actividades ganaderas.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800 font-medium mb-1">Información importante:</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Las coordenadas GPS ayudan a ubicar geográficamente cada establecimiento. Puedes editar la información
                de cada establecimiento haciendo clic en el ícono de edición.
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
