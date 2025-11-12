"use client"

import { ArrowLeft, MapPin, Map, PackageIcon, Beef } from "lucide-react"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { cn } from "@/lib/utils"
import { ConfigSubSidebarLayout } from "./config-sub-sidebar-layout"

const configOptions = [
  { id: "datos-establecimiento", label: "Datos Establecimiento", icon: MapPin },
  { id: "potreros", label: "Potreros", icon: Map },
  { id: "lotes", label: "Lotes", icon: Beef },
  { id: "insumos", label: "Insumos", icon: PackageIcon },
]

export function EstablecimientoConfigSidebar() {
  const { state, navigateBack, setEstablecimientoConfigTab } = useConfigNavigation()

  return (
    <ConfigSubSidebarLayout>
      <div className="p-4 min-h-full flex flex-col">
        {/* Botón Volver Atrás */}
        <button
          onClick={navigateBack}
          className="flex items-center gap-2 text-white hover:bg-gray-700 rounded-md px-3 py-2 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Volver Atrás</span>
        </button>

        {/* Nombre del Establecimiento */}
        <div className="mb-6 pb-4 border-b border-gray-600">
          <h2 className="text-white font-semibold text-lg">{state.selectedEstablecimientoName}</h2>
          <p className="text-gray-400 text-sm">Configuración de establecimiento</p>
        </div>

        {/* Opciones de Configuración */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {configOptions.map((option) => {
              const IconComponent = option.icon
              const isActive = state.establecimientoConfigTab === option.id
              return (
                <li key={option.id}>
                  <button
                    onClick={() => setEstablecimientoConfigTab(option.id)}
                    className={cn(
                      "w-full flex items-center gap-3 text-sm py-3 px-4 rounded-md transition-colors duration-200",
                      isActive ? "bg-gray-700 text-white font-medium" : "text-gray-200 hover:bg-gray-600",
                    )}
                  >
                    <IconComponent className={cn("h-5 w-5", isActive ? "text-[#A8C090]" : "text-[#8C9C78]")} />
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </ConfigSubSidebarLayout>
  )
}
