"use client"

import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { EmpresasSidebar } from "@/components/config-sub-sidebar/empresas-sidebar"
import { EmpresasList } from "@/components/config-sub-sidebar/empresas-list"
import { Usuarios } from "./tabs/usuarios"
import { EmpresaConfigSidebar } from "@/components/config-sub-sidebar/empresa-config-sidebar"
import { EstablecimientoConfigSidebar } from "@/components/config-sub-sidebar/establecimiento-config-sidebar"
import { DatosEmpresa } from "./tabs/datos-empresa"
import { DatosEstablecimiento } from "./tabs/datos-establecimiento"
import { EstablecimientosListConfig } from "@/components/config-sub-sidebar/establecimientos-list-config"
import { CategoriaAnimales } from "./tabs/categoria-animales"
import { Maquinarias } from "./tabs/maquinarias"
import { Potreros } from "./tabs/potreros"
import { Lotes } from "./tabs/lotes"
import { Insumos } from "./tabs/insumos"

export function NuevaConfiguracionView() {
  const { state } = useConfigNavigation()

  // Renderizar sidebar según el nivel de navegación
  const renderSidebar = () => {
    switch (state.level) {
      case "empresas":
        return <EmpresasSidebar />
      case "empresa-config":
        return <EmpresaConfigSidebar />
      case "establecimiento-config":
        return <EstablecimientoConfigSidebar />
      default:
        return null
    }
  }

  // Renderizar contenido según el nivel y tab activo
  const renderContent = () => {
    switch (state.level) {
      case "empresas":
        if (state.empresasTab === "usuarios") {
          return <Usuarios />
        }
        return <EmpresasList />

      case "empresa-config":
        switch (state.empresaConfigTab) {
          case "datos-empresa":
            return <DatosEmpresa />
          case "establecimientos":
            return <EstablecimientosListConfig />
          case "categoria-animales":
            return <CategoriaAnimales />
          case "maquinarias":
            return <Maquinarias />
          default:
            return <DatosEmpresa />
        }

      case "establecimiento-config":
        switch (state.establecimientoConfigTab) {
          case "datos-establecimiento":
            return <DatosEstablecimiento />
          case "potreros":
            return <Potreros />
          case "lotes":
            return <Lotes />
          case "insumos":
            return <Insumos />
          default:
            return <div>Selecciona una opción</div>
        }

      default:
        return null
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sub-sidebar (si aplica) */}
      {renderSidebar()}

      {/* Contenido principal */}
      <div className={`flex-1 overflow-auto ${state.level !== "main" ? "ml-64" : ""}`}>
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  )
}
