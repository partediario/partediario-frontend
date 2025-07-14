"use client"

import { HelpCircle, X, Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import AddParteDrawer from "./add-parte-drawer"
import { useUser } from "@/contexts/user-context"

const RegistrosHeader = () => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const { user } = useUser()

  // Verificar si el usuario es consultor - múltiples verificaciones
  const isConsultor = user?.role === "CONSULTOR" || user?.role === "Consultor" || user?.role === "consultor"

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Partes Diarios</h1>
        <div className="relative">
          <button
            onClick={() => setShowTooltip(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Información sobre Partes Diarios"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {showTooltip && (
            <>
              <div className="fixed inset-0 bg-black/20 z-[100]" onClick={() => setShowTooltip(false)} />
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl border p-4 w-80 max-w-[90vw] z-[101]">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Partes Diarios</h3>
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Registro completo de todas las actividades diarias del establecimiento ganadero.</p>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Información incluida:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Movimientos de animales (entradas/salidas)</li>
                      <li>Actividades con animales y insumos</li>
                      <li>Registros climáticos y pluviométricos</li>
                      <li>Reclasificaciones de ganado</li>
                      <li>Notas y observaciones diarias</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Funcionalidades:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Búsqueda por descripción, nota o usuario</li>
                      <li>Filtrado por tipo de actividad</li>
                      <li>Selección de rango de fechas</li>
                      <li>Exportación de datos</li>
                      <li>Edición y visualización detallada</li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Los datos se actualizan automáticamente con cada nuevo registro.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Botón Agregar Parte Diario - oculto para consultores */}
      {!isConsultor && user && (
        <Button onClick={() => setIsAddDrawerOpen(true)} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Parte Diario
        </Button>
      )}

      {/* Drawer para agregar parte diario */}
      {!isConsultor && (
        <AddParteDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSuccess={() => {
            window.dispatchEvent(new CustomEvent("reloadPartesDiarios"))
          }}
        />
      )}
    </div>
  )
}

export default RegistrosHeader
