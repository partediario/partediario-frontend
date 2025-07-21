"use client"

import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  CloudRain,
  ChevronDown,
  ChevronRight,
  Wrench,
  Home,
  Building,
  FileText,
  Package,
} from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import EntradaAnimalesDrawer from "./entrada-animales-drawer"
import SalidaAnimalesDrawer from "./salida-animales-drawer"
import LluviaDrawer from "./lluvia-drawer"
import ActividadAnimalesDrawer from "../../actividades/components/actividad-animales-drawer"
import { useCurrentEstablishment } from "@/hooks/use-current-establishment"
import { toast } from "sonner"
import ActividadInsumosDrawer from "../../actividades/components/actividad-insumos-drawer"
import ActividadMixtaDrawer from "../../actividades/components/actividad-mixta-drawer"
import ReclasificacionDrawer from "../../actividades/components/reclasificacion-drawer"
import ReclasificacionLoteDrawer from "../../actividades/components/reclasificacion-lote-drawer"
import EntradaInsumosDrawer from "./entrada-insumos-drawer"
import SalidaInsumosDrawer from "./salida-insumos-drawer"

interface TipoActividad {
  id: number
  nombre: string
  ubicacion: string
  descripcion: string
  animales: string
  insumos: string
}

interface ActividadesPorUbicacion {
  [key: string]: TipoActividad[]
}

interface AddParteDrawerProps {
  isOpen: boolean
  onClose: () => void
  onRefresh?: () => void
}

export default function AddParteDrawer({ isOpen, onClose, onRefresh }: AddParteDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [entradaAnimalesOpen, setEntradaAnimalesOpen] = useState(false)
  const [salidaAnimalesOpen, setSalidaAnimalesOpen] = useState(false)
  const [entradaInsumosOpen, setEntradaInsumosOpen] = useState(false)
  const [salidaInsumosOpen, setSalidaInsumosOpen] = useState(false)
  const [lluviaDrawerOpen, setLluviaDrawerOpen] = useState(false)
  const [actividadAnimalesOpen, setActividadAnimalesOpen] = useState(false)
  const [actividadInsumosOpen, setActividadInsumosOpen] = useState(false)
  const [actividadMixtaOpen, setActividadMixtaOpen] = useState(false)
  const [actividadSeleccionada, setActividadSeleccionada] = useState<TipoActividad | null>(null)
  const [tiposActividades, setTiposActividades] = useState<TipoActividad[]>([])
  const [loading, setLoading] = useState(false)
  const [reclasificacionDrawerOpen, setReclasificacionDrawerOpen] = useState(false)
  const [reclasificacionLoteDrawerOpen, setReclasificacionLoteDrawerOpen] = useState(false)

  const { currentEstablishment } = useCurrentEstablishment()

  // Cargar tipos de actividades cuando se abre el drawer
  useEffect(() => {
    if (isOpen) {
      console.log("🔍 Drawer abierto, currentEstablishment:", currentEstablishment)
      console.log("🏢 Establecimiento ID:", currentEstablishment?.id)
      console.log("🏭 Empresa ID:", currentEstablishment?.empresa_id)

      // Usar empresa_id del establishment o fallback a 1
      const empresaId = currentEstablishment?.empresa_id || 1
      console.log("🎯 Empresa ID a usar:", empresaId)

      fetchTiposActividades(empresaId)
    }
  }, [isOpen, currentEstablishment])

  const fetchTiposActividades = async (empresaId: number) => {
    setLoading(true)
    try {
      const url = `/api/tipos-actividades?empresa_id=${empresaId}`
      console.log("🌐 Llamando API:", url)

      const response = await fetch(url)
      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Error response:", errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("📊 Datos recibidos:", data)
      console.log("📋 Tipos actividades:", data.tipos_actividades)
      console.log("📊 Cantidad de actividades:", data.tipos_actividades?.length || 0)

      setTiposActividades(data.tipos_actividades || [])
    } catch (error) {
      console.error("❌ Error fetching tipos actividades:", error)
      toast.error("Error al cargar tipos de actividades")
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleOptionClick = (option: string, actividad?: TipoActividad) => {
    console.log(`Seleccionado: ${option}`)

    if (option === "Entrada de Animales") {
      setEntradaAnimalesOpen(true)
      onClose()
      return
    }

    if (option === "Salida de Animales") {
      setSalidaAnimalesOpen(true)
      onClose()
      return
    }

    if (option === "Entrada de Insumos") {
      setEntradaInsumosOpen(true)
      onClose()
      return
    }

    if (option === "Salida de Insumos") {
      setSalidaInsumosOpen(true)
      onClose()
      return
    }

    if (option === "Lluvia") {
      setLluviaDrawerOpen(true)
      onClose()
      return
    }

    // Para actividades, verificar primero si es reclasificación
    if (actividad) {
      console.log("🔍 Verificando actividad:", actividad)
      console.log("🆔 ID de actividad:", actividad.id)

      // Verificar si es reclasificación de animales por categoría (ID 37)
      if (actividad.id === 37) {
        console.log("✅ Actividad de reclasificación por categoría detectada (ID 37)")
        setActividadSeleccionada(actividad)
        setReclasificacionDrawerOpen(true)
        onClose()
        return
      }

      // Verificar si es reclasificación de animales por lote (ID 38)
      if (actividad.id === 38) {
        console.log("✅ Actividad de reclasificación por lote detectada (ID 38)")
        setActividadSeleccionada(actividad)
        setReclasificacionLoteDrawerOpen(true)
        onClose()
        return
      }

      // Si no es ID 37 o 38, continuar con las verificaciones normales
      console.log("🐄 Animales:", actividad.animales)
      console.log("📦 Insumos:", actividad.insumos)

      // Verificar si la actividad requiere animales o insumos
      if (
        (actividad.animales === "OBLIGATORIO" || actividad.animales === "OPCIONAL") &&
        actividad.insumos === "NO APLICA"
      ) {
        console.log("✅ Actividad válida para drawer de animales")
        setActividadSeleccionada(actividad)
        setActividadAnimalesOpen(true)
        onClose()
        return
      }

      // Verificar si la actividad requiere insumos OBLIGATORIO o OPCIONAL y animales NO APLICA
      if (
        actividad.animales === "NO APLICA" &&
        (actividad.insumos === "OBLIGATORIO" || actividad.insumos === "OPCIONAL")
      ) {
        console.log("✅ Actividad válida para drawer de insumos")
        setActividadSeleccionada(actividad)
        setActividadInsumosOpen(true)
        onClose()
        return
      }

      // Verificar si la actividad requiere tanto animales como insumos (ambos OBLIGATORIO o OPCIONAL)
      if (
        (actividad.animales === "OBLIGATORIO" || actividad.animales === "OPCIONAL") &&
        (actividad.insumos === "OBLIGATORIO" || actividad.insumos === "OPCIONAL")
      ) {
        console.log("✅ Actividad válida para drawer mixto")
        setActividadSeleccionada(actividad)
        setActividadMixtaOpen(true)
        onClose()
        return
      }

      console.log("❌ Actividad no válida para ningún drawer específico")
      toast.info(`La actividad "${actividad.nombre}" no tiene configuración válida`)
      return
    }

    // Para otras opciones, mostrar mensaje temporal
    toast.info(`Funcionalidad "${option}" en desarrollo`)
    onClose()
  }

  // Agrupar actividades por ubicación, separando ADMINISTRACION del resto
  const actividadesPorUbicacion: ActividadesPorUbicacion = tiposActividades.reduce((acc, actividad) => {
    const ubicacion = actividad.ubicacion
    if (!acc[ubicacion]) {
      acc[ubicacion] = []
    }
    acc[ubicacion].push(actividad)
    return acc
  }, {} as ActividadesPorUbicacion)

  // Separar actividades de ADMINISTRACION para mostrarlas en MOVIMIENTO DE ANIMALES
  const actividadesAdministracion = actividadesPorUbicacion["ADMINISTRACION"] || []
  const actividadesOtrasUbicaciones = Object.entries(actividadesPorUbicacion).filter(
    ([ubicacion]) => ubicacion !== "ADMINISTRACION",
  )

  console.log("🗂️ Actividades agrupadas:", actividadesPorUbicacion)
  console.log("🔢 Número de ubicaciones:", Object.keys(actividadesPorUbicacion).length)
  console.log("📋 Actividades de Administración:", actividadesAdministracion)

  // Configuración de iconos por ubicación
  const iconosUbicacion = {
    CAMPO: { icon: Wrench, color: "green" },
    CORRAL: { icon: Home, color: "orange" },
    ESTANCIA: { icon: Building, color: "purple" },
    ADMINISTRACION: { icon: FileText, color: "blue" },
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose} direction="right">
        <DrawerContent className="h-full w-96 ml-auto">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle className="text-xl font-bold text-gray-900">Nuevo Parte Diario</DrawerTitle>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DrawerHeader>

          <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden">
            {/* Movimiento de Animales */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Movimiento de Animales</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleOptionClick("Entrada de Animales")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Entrada de Animales</p>
                    <p className="text-sm text-gray-500">Registrar ingreso de ganado</p>
                  </div>
                </button>

                <button
                  onClick={() => handleOptionClick("Salida de Animales")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <ArrowDownLeft className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Salida de Animales</p>
                    <p className="text-sm text-gray-500">Registrar salida de ganado</p>
                  </div>
                </button>

                {/* Actividades de Administración movidas aquí */}
                {actividadesAdministracion.length > 0 && (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection("ADMINISTRACION")}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Reclasificación</p>
                        <p className="text-sm text-gray-500">{actividadesAdministracion.length} actividades</p>
                      </div>
                      {expandedSections.includes("ADMINISTRACION") ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.includes("ADMINISTRACION") && (
                      <div className="pl-4 py-2 space-y-1 max-h-60 overflow-y-auto">
                        {actividadesAdministracion.map((actividad) => (
                          <button
                            key={actividad.id}
                            onClick={() => handleOptionClick(actividad.nombre, actividad)}
                            className="w-full text-left py-2 px-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
                          >
                            {actividad.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Movimiento de Insumos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Movimiento de Insumos</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleOptionClick("Entrada de Insumos")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Entrada de Insumos</p>
                    <p className="text-sm text-gray-500">Registrar ingreso de insumos</p>
                  </div>
                </button>

                <button
                  onClick={() => handleOptionClick("Salida de Insumos")}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Salida de Insumos</p>
                    <p className="text-sm text-gray-500">Registrar salida de insumos</p>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Clima */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Clima</h3>
              <button
                onClick={() => handleOptionClick("Lluvia")}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CloudRain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lluvia</p>
                  <p className="text-sm text-gray-500">Registrar precipitaciones</p>
                </div>
              </button>
            </div>

            <Separator />

            {/* Actividades (sin ADMINISTRACION) */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actividades</h3>

              {loading ? (
                <div className="text-center py-4 text-gray-500">Cargando actividades...</div>
              ) : actividadesOtrasUbicaciones.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No se encontraron actividades</p>
                  <p className="text-xs mt-1">Empresa ID: {currentEstablishment?.empresa_id || 1}</p>
                </div>
              ) : (
                actividadesOtrasUbicaciones.map(([ubicacion, actividades]) => {
                  const config = iconosUbicacion[ubicacion as keyof typeof iconosUbicacion]
                  if (!config) {
                    console.log("⚠️ Ubicación no reconocida:", ubicacion)
                    return null
                  }

                  const IconComponent = config.icon

                  return (
                    <div key={ubicacion} className="space-y-1">
                      <button
                        onClick={() => toggleSection(ubicacion)}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`flex-shrink-0 w-10 h-10 bg-${config.color}-100 rounded-lg flex items-center justify-center`}
                        >
                          <IconComponent className={`h-5 w-5 text-${config.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {ubicacion.charAt(0) + ubicacion.slice(1).toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-500">{actividades.length} actividades</p>
                        </div>
                        {expandedSections.includes(ubicacion) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      {expandedSections.includes(ubicacion) && (
                        <div className="pl-4 py-2 space-y-1 max-h-60 overflow-y-auto">
                          {actividades.map((actividad) => (
                            <button
                              key={actividad.id}
                              onClick={() => handleOptionClick(actividad.nombre, actividad)}
                              className="w-full text-left py-2 px-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-all duration-200 hover:translate-x-1"
                            >
                              {actividad.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer de Entrada de Animales */}
      <EntradaAnimalesDrawer
        isOpen={entradaAnimalesOpen}
        onClose={() => setEntradaAnimalesOpen(false)}
        onSuccess={() => {
          console.log("Entrada de animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Salida de Animales */}
      <SalidaAnimalesDrawer
        isOpen={salidaAnimalesOpen}
        onClose={() => setSalidaAnimalesOpen(false)}
        onSuccess={() => {
          console.log("Salida de animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Entrada de Insumos */}
      <EntradaInsumosDrawer
        isOpen={entradaInsumosOpen}
        onClose={() => setEntradaInsumosOpen(false)}
        onSuccess={() => {
          console.log("Entrada de insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Salida de Insumos */}
      <SalidaInsumosDrawer
        isOpen={salidaInsumosOpen}
        onClose={() => setSalidaInsumosOpen(false)}
        onSuccess={() => {
          console.log("Salida de insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Lluvia */}
      <LluviaDrawer
        isOpen={lluviaDrawerOpen}
        onClose={() => setLluviaDrawerOpen(false)}
        onSuccess={() => {
          console.log("Datos de lluvia guardados exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Actividad con Animales */}
      <ActividadAnimalesDrawer
        isOpen={actividadAnimalesOpen}
        onClose={() => setActividadAnimalesOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad con animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Actividad con Insumos */}
      <ActividadInsumosDrawer
        isOpen={actividadInsumosOpen}
        onClose={() => setActividadInsumosOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad con insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Actividad Mixta */}
      <ActividadMixtaDrawer
        isOpen={actividadMixtaOpen}
        onClose={() => setActividadMixtaOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad mixta guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Reclasificación por Categoría (ID 37) */}
      <ReclasificacionDrawer
        isOpen={reclasificacionDrawerOpen}
        onClose={() => setReclasificacionDrawerOpen(false)}
        onSuccess={() => {
          console.log("Reclasificación por categoría guardada exitosamente")
          onRefresh?.()
        }}
      />

      {/* Drawer de Reclasificación por Lote (ID 38) */}
      <ReclasificacionLoteDrawer
        isOpen={reclasificacionLoteDrawerOpen}
        onClose={() => setReclasificacionLoteDrawerOpen(false)}
        onSuccess={() => {
          console.log("Reclasificación por lote guardada exitosamente")
          onRefresh?.()
        }}
      />
    </>
  )
}
