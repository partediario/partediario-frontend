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
    <div className="flex flex-col h-screen">
      {/* Header fijo - No hace scroll */}
      <div className="flex-shrink-0 border-b bg-white">
        <DashboardHeader />

        {/* KPIs fijos en la cabecera */}
        <div className="px-6 py-2 border-b border-gray-200">
          <KpisDinamicos establecimientoId={establecimientoSeleccionado} />
        </div>
      </div>

      {/* Contenido con scroll - Solo la lista de partes diarios */}
      <div className="flex-1 overflow-hidden">
        <RegistrosList establecimientoId={establecimientoSeleccionado} />
      </div>
    </div>
  )
}
