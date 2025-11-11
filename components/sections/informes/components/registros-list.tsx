"use client"

import { useEffect, useState, useMemo } from "react"
import { fetchPartesDiarios } from "@/lib/api"
import type { ParteDiario } from "@/lib/types"
import SearchAndFilters from "./search-and-filters"
import ParteDiarioCard from "./parte-diario-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useEstablishment } from "@/contexts/establishment-context"
import { HelpCircle, X } from "lucide-react"

interface RegistrosListProps {
  establecimientoId?: string
}

export default function RegistrosList({ establecimientoId: propEstablecimientoId }: RegistrosListProps) {
  const { establecimientoSeleccionado: contextEstablecimientoId } = useEstablishment()

  // Use context value if prop is not provided
  const establecimientoId = propEstablecimientoId || contextEstablecimientoId

  const [partesDiarios, setPartesDiarios] = useState<ParteDiario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPartesTooltip, setShowPartesTooltip] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedType, setSelectedType] = useState("todos")

  const loadPartesDiarios = async () => {
    if (!establecimientoId) {
      setPartesDiarios([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const filters: any = {
        establecimientoId: establecimientoId,
      }

      // Add date filter if selected
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split("T")[0]
        filters.fecha = dateStr
      }

      // Add type filter if not "todos"
      if (selectedType !== "todos") {
        filters.tipo = selectedType
      }

      console.log("Loading partes diarios with filters:", filters)
      const data = await fetchPartesDiarios(filters)
      setPartesDiarios(data)
    } catch (err) {
      console.error("Error loading partes diarios:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  // Escuchar el evento de recarga en la lista de registros:
  useEffect(() => {
    // Función para manejar la recarga
    const handleReload = () => {
      console.log("Evento reloadPartesDiarios recibido en registros-list")
      console.log("Recargando partes diarios después de guardar...")
      loadPartesDiarios()
    }

    // Agregar listener para el evento de recarga
    console.log("Registrando listener para reloadPartesDiarios en registros-list")
    window.addEventListener("reloadPartesDiarios", handleReload)

    return () => {
      console.log("Removiendo listener para reloadPartesDiarios en registros-list")
      window.removeEventListener("reloadPartesDiarios", handleReload)
    }
  }, [establecimientoId, selectedDate, selectedType])

  // Mantener el useEffect existente para cargar cuando cambian los filtros:
  useEffect(() => {
    loadPartesDiarios()
  }, [establecimientoId, selectedDate, selectedType])

  // Filter data based on search term (client-side filtering for search)
  const filteredPartesDiarios = useMemo(() => {
    if (!searchTerm.trim()) {
      return partesDiarios
    }

    const searchLower = searchTerm.toLowerCase()
    return partesDiarios.filter((parte) => {
      const descripcion = parte.pd_descripcion?.toLowerCase() || ""
      const nota = parte.pd_nota?.toLowerCase() || ""
      const usuario = parte.pd_usuario?.toLowerCase() || ""
      const usuarioNombres = parte.pd_usuario_nombres?.toLowerCase() || ""
      const usuarioApellidos = parte.pd_usuario_apellidos?.toLowerCase() || ""
      const usuarioCompleto = `${usuarioNombres} ${usuarioApellidos}`.toLowerCase()

      return (
        descripcion.includes(searchLower) ||
        nota.includes(searchLower) ||
        usuario.includes(searchLower) ||
        usuarioCompleto.includes(searchLower)
      )
    })
  }, [partesDiarios, searchTerm])

  const handleRefresh = () => {
    loadPartesDiarios()
  }

  if (!establecimientoId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">Partes Diarios</h2>
            <button
              onClick={() => setShowPartesTooltip(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Información sobre Partes Diarios"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-4 md:p-6">
          <Alert>
            <AlertDescription className="text-sm">Selecciona un establecimiento para ver los partes diarios.</AlertDescription>
          </Alert>
        </div>
        {showPartesTooltip && (
          <>
            <div className="fixed inset-0 bg-black/20 z-[100]" onClick={() => setShowPartesTooltip(false)} />
            <div className="fixed top-1/2 left-1/2 z-[101] w-80 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">Partes Diarios</h3>
                <button
                  onClick={() => setShowPartesTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Registro completo de todas las actividades diarias del establecimiento ganadero.</p>
                <div>
                  <p className="mb-1 font-medium text-gray-700">Información incluida:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Movimientos de animales (entradas / salidas)</li>
                    <li>Actividades con animales e insumos</li>
                    <li>Registros climáticos y pluviométricos</li>
                    <li>Reclasificaciones de ganado</li>
                    <li>Notas y observaciones diarias</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-gray-700">Funcionalidades:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Búsqueda y filtrado avanzados</li>
                    <li>Selección de rango de fechas</li>
                    <li>Exportación de datos</li>
                    <li>Edición y visualización detallada</li>
                  </ul>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Los datos se actualizan automáticamente con cada nuevo registro.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Partes Diarios</h2>
          <button
            onClick={() => setShowPartesTooltip(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Información sobre Partes Diarios"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {showPartesTooltip && (
          <>
            <div className="fixed inset-0 bg-black/20 z-[100]" onClick={() => setShowPartesTooltip(false)} />
            <div className="fixed top-1/2 left-1/2 z-[101] w-80 max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">Partes Diarios</h3>
                <button
                  onClick={() => setShowPartesTooltip(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Registro completo de todas las actividades diarias del establecimiento ganadero.</p>
                <div>
                  <p className="mb-1 font-medium text-gray-700">Información incluida:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Movimientos de animales (entradas / salidas)</li>
                    <li>Actividades con animales e insumos</li>
                    <li>Registros climáticos y pluviométricos</li>
                    <li>Reclasificaciones de ganado</li>
                    <li>Notas y observaciones diarias</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-gray-700">Funcionalidades:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Búsqueda y filtrado avanzados</li>
                    <li>Selección de rango de fechas</li>
                    <li>Exportación de datos</li>
                    <li>Edición y visualización detallada</li>
                  </ul>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Los datos se actualizan automáticamente con cada nuevo registro.
                </p>
              </div>
            </div>
          </>
        )}

        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onRefresh={handleRefresh}
          isLoading={loading}
        />

        {error && (
          <Alert className="mt-4">
            <AlertDescription>Error al cargar los partes diarios: {error}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPartesDiarios.length === 0 ? (
          <Alert>
            <AlertDescription>
              {searchTerm
                ? "No se encontraron partes diarios que coincidan con la búsqueda."
                : "No hay partes diarios registrados para este establecimiento con los filtros seleccionados."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPartesDiarios.map((parte) => (
              <ParteDiarioCard key={`parte-${parte.pd_id}-${parte.pd_fecha}-${parte.pd_hora}`} parte={parte} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
