"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, MapPin, Loader2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { EditarEstablecimientoDrawer } from "@/components/sections/configuracion/components/editar-establecimiento-drawer"

interface Establecimiento {
  id: number
  establecimiento_id?: string
  nombre: string
  latitud: string
  longitud: string
}

export function EstablecimientosListConfig() {
  const { toast } = useToast()
  const { usuario } = useUser()
  const { state, navigateToEstablecimientoConfig } = useConfigNavigation()
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    console.log("[v0] EstablecimientosListConfig - Estado actual:", {
      selectedEmpresaId: state.selectedEmpresaId,
      usuarioId: usuario?.id,
    })

    if (state.selectedEmpresaId && usuario?.id) {
      loadEstablecimientos()
    } else {
      console.log("[v0] No se puede cargar establecimientos - falta empresa o usuario")
      setLoading(false)
    }
  }, [state.selectedEmpresaId, usuario?.id])

  const loadEstablecimientos = async () => {
    if (!state.selectedEmpresaId || !usuario?.id) {
      console.log("[v0] loadEstablecimientos - Faltan datos:", {
        empresaId: state.selectedEmpresaId,
        usuarioId: usuario?.id,
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Cargando establecimientos para empresa:", state.selectedEmpresaId)
      const response = await fetch(
        `/api/establecimientos-configuracion?usuario_id=${usuario.id}&empresa_id=${state.selectedEmpresaId}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar establecimientos")
      }

      console.log("[v0] Establecimientos cargados:", data.establecimientos)
      setEstablecimientos(data.establecimientos || [])
    } catch (error) {
      console.error("[v0] Error loading establecimientos:", error)
      toast({
        title: "Error",
        description: "Error al cargar establecimientos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdministrar = (establecimiento: Establecimiento) => {
    const estId = String(establecimiento.id)
    console.log("[v0] Navegando a establecimiento:", estId, establecimiento.nombre)
    navigateToEstablecimientoConfig(estId, establecimiento.nombre)
  }

  const handleNuevoEstablecimiento = () => {
    setDrawerOpen(true)
  }

  const handleEstablecimientoCreado = () => {
    loadEstablecimientos()
    setDrawerOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando establecimientos...</span>
      </div>
    )
  }

  if (!state.selectedEmpresaId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Selecciona una empresa primero</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Establecimientos</h3>
            <p className="text-sm text-slate-600">Registra la ubicación de tus establecimientos agropecuarios</p>
          </div>
          <Button onClick={handleNuevoEstablecimiento} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Establecimiento
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {establecimientos.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay establecimientos</h3>
                <p className="text-slate-600">Agrega tu primer establecimiento para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 pb-3 border-b font-semibold text-sm text-slate-700">
                  <div>Nombre</div>
                  <div>Coordenadas</div>
                  <div className="text-right">Acciones</div>
                </div>
                {establecimientos.map((establecimiento) => (
                  <div
                    key={establecimiento.id}
                    className="grid grid-cols-3 gap-4 py-3 border-b last:border-0 items-center hover:bg-slate-50 rounded px-2"
                  >
                    <div className="font-medium text-slate-900">{establecimiento.nombre}</div>
                    <div className="text-sm text-slate-600">
                      {establecimiento.latitud && establecimiento.longitud
                        ? `${Number(establecimiento.latitud).toFixed(4)}, ${Number(establecimiento.longitud).toFixed(4)}`
                        : "Sin coordenadas"}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdministrar(establecimiento)}
                        className="hover:bg-slate-100"
                      >
                        Administrar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditarEstablecimientoDrawer
        establecimiento={null}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleEstablecimientoCreado}
        mode="create"
        empresaId={state.selectedEmpresaId ? Number(state.selectedEmpresaId) : undefined}
        usuarioId={usuario?.id}
      />
    </>
  )
}
