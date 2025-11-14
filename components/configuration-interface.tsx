"use client"

import { useState } from "react"
import Sidebar from "./sidebar"
import InformesView from "./sections/informes/informes-view"
import MovimientosView from "./sections/movimientos/movimientos-view"
import ClimaView from "./sections/clima/clima-view"
import InsumosView from "./sections/insumos/insumos-view"
import MaquinariasView from "./sections/maquinarias/maquinarias-view"
import PotrerosView from "./sections/potreros/potreros-view"
import ActividadesView from "./sections/actividades/actividades-view"
import ConfiguracionView from "./sections/configuracion/configuracion-view"
import ReportesView from "./sections/reportes/reportes-view" // Importando nueva vista de Reportes
import { UserProvider } from "@/contexts/user-context"

export default function ConfigurationInterface() {
  const [activeSection, setActiveSection] = useState("Registros")
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedEstablishment, setSelectedEstablishment] = useState<string>("")

  const handleMenuClick = (section: string) => {
    console.log("Menu clicked:", section)
    setActiveSection(section)
  }

  const handleCompanyChange = (companyId: string) => {
    console.log("Company changed:", companyId)
    setSelectedCompany(companyId)
  }

  const handleEstablishmentChange = (establishmentId: string) => {
    console.log("Establishment changed:", establishmentId)
    setSelectedEstablishment(establishmentId)
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Registros":
        return <InformesView establecimientoId={selectedEstablishment} />
      case "Reportes":
        return <ReportesView /> // Agregando caso para Reportes
      case "Movimientos":
        return <MovimientosView establecimientoId={selectedEstablishment} />
      case "Actividades":
        return <ActividadesView />
      case "Clima":
        return <ClimaView />
      case "Potreros/Parcelas":
        return <PotrerosView />
      case "Insumos":
        return <InsumosView />
      case "Maquinarias":
        return <MaquinariasView />
      case "Configuración":
        return <ConfiguracionView />
      default:
        return <InformesView establecimientoId={selectedEstablishment} />
    }
  }

  return (
    <UserProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar
          onMenuClick={handleMenuClick}
          onCompanyChange={handleCompanyChange}
          onEstablishmentChange={handleEstablishmentChange}
        />
        <main className="flex-1 ml-64">{renderActiveSection()}</main>
      </div>
    </UserProvider>
  )
}
// hola
