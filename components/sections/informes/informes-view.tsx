"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { useEstablishment } from "@/contexts/establishment-context"
import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import DashboardHeader from "./components/dashboard-header"
import RegistrosList from "./components/registros-list"
import KpisDinamicos from "./components/kpis-dinamicos"
import AddParteDiarioDrawer from "./components/add-parte-drawer"

export default function InformesView() {
  const { establecimientoSeleccionado } = useEstablishment()
  const permissions = usePermissions()
  const [isAddParteDiarioOpen, setIsAddParteDiarioOpen] = useState(false)

  useEffect(() => {
    // Escuchar cuando se actualicen los partes diarios para recargar KPIs
    const handleReloadKpis = () => {
      console.log("🔄 Recargando KPIs después de actualizar parte diario")
      window.dispatchEvent(new CustomEvent("reloadKpis"))
    }

    window.addEventListener("reloadPartesDiarios", handleReloadKpis as EventListener)

    return () => {
      window.removeEventListener("reloadPartesDiarios", handleReloadKpis as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Botón flotante "Agregar Parte Diario" - Solo en móviles, alineado con hamburguesa */}
      {permissions.canAddParteDiario() && (
        <Button
          onClick={() => setIsAddParteDiarioOpen(true)}
          style={{ backgroundColor: "#8C9C78" }}
          className="fixed top-4 right-4 z-50 md:hidden hover:brightness-90 text-white shadow-lg"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Parte Diario
        </Button>
      )}

      <div className="bg-white border-b border-gray-200">
        <DashboardHeader 
          onAddClick={() => setIsAddParteDiarioOpen(true)}
        />
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs ahora son parte del contenido scrolleable */}
        <KpisDinamicos establecimientoId={establecimientoSeleccionado} />

        {/* Lista de registros sin su propio scroll, forma parte del scroll general */}
        <RegistrosList establecimientoId={establecimientoSeleccionado} />
      </div>

      {/* Drawer para agregar parte diario */}
      <AddParteDiarioDrawer 
        isOpen={isAddParteDiarioOpen} 
        onClose={() => setIsAddParteDiarioOpen(false)} 
      />
    </div>
  )
}
