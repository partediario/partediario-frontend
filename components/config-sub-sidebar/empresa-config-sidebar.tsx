"use client"

import { ArrowLeft, Building2, MapPin, Beef, Truck } from "lucide-react"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { cn } from "@/lib/utils"

const configOptions = [
  { id: "datos-empresa", label: "Datos Empresa", icon: Building2 },
  { id: "establecimientos", label: "Establecimientos", icon: MapPin },
  { id: "categoria-animales", label: "Categoría Animales", icon: Beef },
  { id: "maquinarias", label: "Maquinarias", icon: Truck },
]

export function EmpresaConfigSidebar() {
  const { state, navigateBack, setEmpresaConfigTab } = useConfigNavigation()

  return (
    <div className="w-64 h-screen fixed left-0 top-0 z-10 overflow-y-auto bg-[#1F2427]">
      <div className="p-4 min-h-full flex flex-col">
        {/* Botón Volver Atrás */}
        <button
          onClick={navigateBack}
          className="flex items-center gap-2 text-white hover:bg-gray-700 rounded-md px-3 py-2 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Volver Atrás</span>
        </button>

        {/* Nombre de la Empresa */}
        <div className="mb-6 pb-4 border-b border-gray-600">
          <h2 className="text-white font-semibold text-lg">{state.selectedEmpresaName}</h2>
          <p className="text-gray-400 text-sm">Configuración de empresa</p>
        </div>

        {/* Opciones de Configuración */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {configOptions.map((option) => {
              const IconComponent = option.icon
              const isActive = state.empresaConfigTab === option.id
              return (
                <li key={option.id}>
                  <button
                    onClick={() => setEmpresaConfigTab(option.id)}
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
    </div>
  )
}
