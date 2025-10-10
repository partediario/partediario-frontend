"use client"

import { useEffect } from "react"
import { useEstablishment } from "@/contexts/establishment-context"
import DashboardHeader from "./components/dashboard-header"
import RegistrosList from "./components/registros-list"
import KpisDinamicos from "./components/kpis-dinamicos"

export default function InformesView() {
  const { establecimientoSeleccionado } = useEstablishment()

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
      <div className="bg-white border-b border-gray-200">
        <DashboardHeader />
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs ahora son parte del contenido scrolleable */}
        <KpisDinamicos establecimientoId={establecimientoSeleccionado} />

        {/* Lista de registros sin su propio scroll, forma parte del scroll general */}
        <RegistrosList establecimientoId={establecimientoSeleccionado} />
      </div>
    </div>
  )
}
