"use client"

import { ArrowLeft, Building2, Users } from "lucide-react"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import { cn } from "@/lib/utils"

const sidebarOptions = [
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "usuarios", label: "Usuarios", icon: Users },
]

export function EmpresasSidebar() {
  const { navigateBack, state, setEmpresasTab } = useConfigNavigation()

  return (
    <div className="w-64 h-screen fixed left-0 top-0 z-10 overflow-y-auto bg-[#1F2427]">
      <div className="p-4 min-h-full flex flex-col">
        {/* Botón Volver Atrás */}
        <button
          onClick={navigateBack}
          className="flex items-center gap-2 text-white hover:bg-gray-700 rounded-md px-3 py-2 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Volver Atrás</span>
        </button>

        {/* Opciones del Sub-Sidebar */}
        <nav className="flex-1">
          <ul className="space-y-2">
            {sidebarOptions.map((option) => {
              const IconComponent = option.icon
              const isActive = state.empresasTab === option.id
              return (
                <li key={option.id}>
                  <button
                    onClick={() => setEmpresasTab(option.id)}
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
