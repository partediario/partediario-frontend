"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Building2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { AgregarEmpresaDrawer } from "./agregar-empresa-drawer"

interface Empresa {
  empresa_id: string
  nombre: string
  id?: number
}

export function EmpresasList() {
  const { toast } = useToast()
  const { usuario } = useUser()
  const { navigateToEmpresaConfig } = useConfigNavigation()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    loadEmpresas()
  }, [usuario?.id])

  const loadEmpresas = async () => {
    if (!usuario?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/empresas?usuario_id=${usuario.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar empresas")
      }

      console.log("[v0] Empresas cargadas:", data.empresas)
      setEmpresas(data.empresas || [])
    } catch (error) {
      console.error("Error loading empresas:", error)
      toast({
        title: "Error",
        description: "Error al cargar empresas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdministrar = (empresa: Empresa) => {
    const empresaId = empresa.id ? String(empresa.id) : empresa.empresa_id
    console.log("[v0] Navegando a empresa config con ID:", empresaId, "Nombre:", empresa.nombre)
    navigateToEmpresaConfig(empresaId, empresa.nombre)
  }

  const handleAgregarEmpresa = () => {
    setDrawerOpen(true)
  }

  const handleEmpresaCreada = () => {
    loadEmpresas()
    setDrawerOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Cargando empresas...</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Empresas</h2>
            <p className="text-sm text-slate-600">Gestiona las empresas del sistema</p>
          </div>
          <Button onClick={handleAgregarEmpresa} className="bg-green-700 hover:bg-green-800">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Empresa
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {empresas.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No hay empresas</h3>
                <p className="text-slate-600">Agrega tu primera empresa para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 pb-3 border-b font-semibold text-sm text-slate-700">
                  <div>Nombre</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>
                {empresas.map((empresa) => (
                  <div
                    key={empresa.empresa_id}
                    className="grid grid-cols-3 gap-4 py-3 border-b last:border-0 items-center hover:bg-slate-50 rounded px-2"
                  >
                    <div className="font-medium text-slate-900">{empresa.nombre}</div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdministrar(empresa)}
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

      <AgregarEmpresaDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={handleEmpresaCreada} />
    </>
  )
}
