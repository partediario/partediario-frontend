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
  Users,
  MapPin,
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
import TrasladoPotreroDrawer from "../../actividades/components/traslado-potrero-drawer"
import ReloteoDrawer from "../../actividades/components/reloteo-drawer"
import FaenaDrawer from "../../actividades/components/faena-drawer" // Importar FaenaDrawer
import LimpiezaBebederosDrawer from "../../actividades/components/limpieza-bebederos-drawer" // Importar LimpiezaBebederosDrawer
import ReparacionAlambradosDrawer from "../../actividades/components/reparacion-alambrados-drawer"
import SeñaladaDrawer from "../../actividades/components/senalada-drawer"
import SanitacionDrawer from "../../actividades/components/sanitacion-drawer"
import CastracionDrawer from "../../actividades/components/castracion-drawer" // Importar CastracionDrawer

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
  const [trasladoPotreroDrawerOpen, setTrasladoPotreroDrawerOpen] = useState(false)
  const [actividadTrasladoSeleccionada, setActividadTrasladoSeleccionada] = useState<TipoActividad | null>(null)
  const [reloteoDrawerOpen, setReloteoDrawerOpen] = useState(false)
  const [actividadReloteoSeleccionada, setActividadReloteoSeleccionada] = useState<TipoActividad | null>(null)
  const [faenaDrawerOpen, setFaenaDrawerOpen] = useState(false) // Estado para FaenaDrawer
  const [actividadFaenaSeleccionada, setActividadFaenaSeleccionada] = useState<TipoActividad | null>(null) // Estado para FaenaDrawer
  const [limpiezaBebederosDrawerOpen, setLimpiezaBebederosDrawerOpen] = useState(false) // Estado para LimpiezaBebederosDrawer
  const [actividadLimpiezaBebederosSeleccionada, setActividadLimpiezaBebederosSeleccionada] =
    useState<TipoActividad | null>(null) // Estado para LimpiezaBebederosDrawer
  const [reparacionAlambradosDrawerOpen, setReparacionAlambradosDrawerOpen] = useState(false)
  const [actividadReparacionAlambradosSeleccionada, setActividadReparacionAlambradosSeleccionada] =
    useState<TipoActividad | null>(null)
  const [senaladadDrawerOpen, setSenaladadDrawerOpen] = useState(false)
  const [actividadSenaladadSeleccionada, setActividadSenaladadSeleccionada] = useState<TipoActividad | null>(null)
  const [sanitacionDrawerOpen, setSanitacionDrawerOpen] = useState(false)
  const [actividadSanitacionSeleccionada, setActividadSanitacionSeleccionada] = useState<TipoActividad | null>(null)
  const [castracionDrawerOpen, setCastracionDrawerOpen] = useState(false) // Agregar estados para drawer de castración
  const [actividadCastracionSeleccionada, setActividadCastracionSeleccionada] = useState<TipoActividad | null>(null) // Agregar estados para drawer de castración

  const { currentEstablishment } = useCurrentEstablishment()

  useEffect(() => {
    if (isOpen) {
      console.log("🔍 Drawer abierto, currentEstablishment:", currentEstablishment)
      console.log("🏢 Establecimiento ID:", currentEstablishment?.id)
      console.log("🏭 Empresa ID:", currentEstablishment?.empresa_id)

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

    if (actividad) {
      console.log("🔍 Verificando actividad:", actividad)
      console.log("🆔 ID de actividad:", actividad.id)

      if (actividad.id === 1 || actividad.nombre === "Reparación de Alambrados") {
        console.log("✅ Actividad de reparación de alambrados detectada")
        setActividadReparacionAlambradosSeleccionada(actividad)
        setReparacionAlambradosDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 2 || actividad.nombre === "Limpieza de Bebederos") {
        console.log("✅ Actividad de limpieza de bebederos detectada")
        setActividadLimpiezaBebederosSeleccionada(actividad)
        setLimpiezaBebederosDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 8 || actividad.nombre === "Señalada") {
        console.log("✅ Actividad de señalada detectada")
        setActividadSenaladadSeleccionada(actividad)
        setSenaladadDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 26 || actividad.nombre === "Sanitación") {
        console.log("✅ Actividad de sanitación detectada")
        setActividadSanitacionSeleccionada(actividad)
        setSanitacionDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 12 || actividad.nombre === "Castración") {
        console.log("✅ Actividad de castración detectada")
        setActividadCastracionSeleccionada(actividad)
        setCastracionDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 37) {
        console.log("✅ Actividad de reclasificación por categoría detectada (ID 37)")
        setActividadSeleccionada(actividad)
        setReclasificacionDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 38) {
        console.log("✅ Actividad de reclasificación por lote detectada (ID 38)")
        setActividadSeleccionada(actividad)
        setReclasificacionLoteDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.nombre === "Traslado de Potrero" || actividad.id === 5) {
        console.log("✅ Actividad de traslado de potrero detectada")
        setActividadTrasladoSeleccionada(actividad)
        setTrasladoPotreroDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 11 || actividad.nombre === "Reloteo") {
        console.log("✅ Actividad de reloteo detectada")
        setActividadReloteoSeleccionada(actividad)
        setReloteoDrawerOpen(true)
        onClose()
        return
      }

      if (actividad.id === 36 || actividad.nombre === "Faena") {
        console.log("✅ Actividad de faena detectada")
        setActividadFaenaSeleccionada(actividad)
        setFaenaDrawerOpen(true)
        onClose()
        return
      }

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

    toast.info(`Funcionalidad "${option}" en desarrollo`)
    onClose()
  }

  const actividadesPorUbicacion: ActividadesPorUbicacion = tiposActividades.reduce((acc, actividad) => {
    const ubicacion = actividad.ubicacion
    if (!acc[ubicacion]) {
      acc[ubicacion] = []
    }
    acc[ubicacion].push(actividad)
    return acc
  }, {} as ActividadesPorUbicacion)

  const actividadesAdministracion = actividadesPorUbicacion["ADMINISTRACION"] || []
  const actividadesReclasificacion = actividadesAdministracion.filter((act) => act.id === 37 || act.id === 38)
  const actividadesGestionPotreros = actividadesAdministracion.filter((act) => act.id === 5 || act.id === 11)

  const actividadesOtrasUbicaciones = Object.entries(actividadesPorUbicacion).filter(
    ([ubicacion]) => ubicacion !== "ADMINISTRACION",
  )

  console.log("🗂️ Actividades agrupadas:", actividadesPorUbicacion)
  console.log("🔢 Número de ubicaciones:", Object.keys(actividadesPorUbicacion).length)
  console.log("📋 Actividades de Reclasificación:", actividadesReclasificacion)
  console.log("📋 Actividades de Gestión Potreros:", actividadesGestionPotreros)

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

                {actividadesReclasificacion.length > 0 && (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection("RECLASIFICACION")}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Reclasificación de Animales</p>
                        <p className="text-sm text-gray-500">{actividadesReclasificacion.length} actividades</p>
                      </div>
                      {expandedSections.includes("RECLASIFICACION") ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.includes("RECLASIFICACION") && (
                      <div className="pl-4 py-2 space-y-1 max-h-60 overflow-y-auto">
                        {actividadesReclasificacion.map((actividad) => (
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

                {actividadesGestionPotreros.length > 0 && (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSection("GESTION_POTREROS")}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Gestión de Potreros/Lotes</p>
                        <p className="text-sm text-gray-500">{actividadesGestionPotreros.length} actividades</p>
                      </div>
                      {expandedSections.includes("GESTION_POTREROS") ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.includes("GESTION_POTREROS") && (
                      <div className="pl-4 py-2 space-y-1 max-h-60 overflow-y-auto">
                        {actividadesGestionPotreros.map((actividad) => (
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

      <EntradaAnimalesDrawer
        isOpen={entradaAnimalesOpen}
        onClose={() => setEntradaAnimalesOpen(false)}
        onSuccess={() => {
          console.log("Entrada de animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      <SalidaAnimalesDrawer
        isOpen={salidaAnimalesOpen}
        onClose={() => setSalidaAnimalesOpen(false)}
        onSuccess={() => {
          console.log("Salida de animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      <EntradaInsumosDrawer
        isOpen={entradaInsumosOpen}
        onClose={() => setEntradaInsumosOpen(false)}
        onSuccess={() => {
          console.log("Entrada de insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      <SalidaInsumosDrawer
        isOpen={salidaInsumosOpen}
        onClose={() => setSalidaInsumosOpen(false)}
        onSuccess={() => {
          console.log("Salida de insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      <LluviaDrawer
        isOpen={lluviaDrawerOpen}
        onClose={() => setLluviaDrawerOpen(false)}
        onSuccess={() => {
          console.log("Datos de lluvia guardados exitosamente")
          onRefresh?.()
        }}
      />

      <ActividadAnimalesDrawer
        isOpen={actividadAnimalesOpen}
        onClose={() => setActividadAnimalesOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad con animales guardada exitosamente")
          onRefresh?.()
        }}
      />

      <ActividadInsumosDrawer
        isOpen={actividadInsumosOpen}
        onClose={() => setActividadInsumosOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad con insumos guardada exitosamente")
          onRefresh?.()
        }}
      />

      <ActividadMixtaDrawer
        isOpen={actividadMixtaOpen}
        onClose={() => setActividadMixtaOpen(false)}
        actividadSeleccionada={actividadSeleccionada}
        onSuccess={() => {
          console.log("Actividad mixta guardada exitosamente")
          onRefresh?.()
        }}
      />

      <ReclasificacionDrawer
        isOpen={reclasificacionDrawerOpen}
        onClose={() => setReclasificacionDrawerOpen(false)}
        onSuccess={() => {
          console.log("Reclasificación por categoría guardada exitosamente")
          onRefresh?.()
        }}
      />

      <ReclasificacionLoteDrawer
        isOpen={reclasificacionLoteDrawerOpen}
        onClose={() => setReclasificacionLoteDrawerOpen(false)}
        onSuccess={() => {
          console.log("Reclasificación por lote guardada exitosamente")
          onRefresh?.()
        }}
      />

      <TrasladoPotreroDrawer
        isOpen={trasladoPotreroDrawerOpen}
        onClose={() => setTrasladoPotreroDrawerOpen(false)}
        onSuccess={() => {
          console.log("Traslado de potrero guardado exitosamente")
          onRefresh?.()
        }}
        tipoActividadId={actividadTrasladoSeleccionada?.id}
      />

      <ReloteoDrawer
        isOpen={reloteoDrawerOpen}
        onClose={() => setReloteoDrawerOpen(false)}
        onSuccess={() => {
          console.log("Reloteo guardado exitosamente")
          onRefresh?.()
        }}
        tipoActividadId={actividadReloteoSeleccionada?.id}
      />

      <FaenaDrawer
        isOpen={faenaDrawerOpen}
        onClose={() => setFaenaDrawerOpen(false)}
        actividadSeleccionada={actividadFaenaSeleccionada}
        onSuccess={() => {
          console.log("Faena guardada exitosamente")
          onRefresh?.()
        }}
      />

      <LimpiezaBebederosDrawer
        isOpen={limpiezaBebederosDrawerOpen}
        onClose={() => setLimpiezaBebederosDrawerOpen(false)}
        actividadSeleccionada={actividadLimpiezaBebederosSeleccionada}
        onSuccess={() => {
          console.log("Limpieza de bebederos guardada exitosamente")
          onRefresh?.()
        }}
      />

      <ReparacionAlambradosDrawer
        isOpen={reparacionAlambradosDrawerOpen}
        onClose={() => setReparacionAlambradosDrawerOpen(false)}
        actividadSeleccionada={actividadReparacionAlambradosSeleccionada}
        onSuccess={() => {
          console.log("Reparación de alambrados guardada exitosamente")
          onRefresh?.()
        }}
      />

      <SeñaladaDrawer
        isOpen={senaladadDrawerOpen}
        onClose={() => setSenaladadDrawerOpen(false)}
        actividadSeleccionada={actividadSenaladadSeleccionada}
        onSuccess={() => {
          console.log("Señalada guardada exitosamente")
          onRefresh?.()
        }}
      />

      <SanitacionDrawer
        isOpen={sanitacionDrawerOpen}
        onClose={() => setSanitacionDrawerOpen(false)}
        actividadSeleccionada={actividadSanitacionSeleccionada}
        onSuccess={() => {
          console.log("Sanitación guardada exitosamente")
          onRefresh?.()
        }}
      />

      <CastracionDrawer
        isOpen={castracionDrawerOpen}
        onClose={() => setCastracionDrawerOpen(false)}
        actividadSeleccionada={actividadCastracionSeleccionada}
        onSuccess={() => {
          console.log("Castración guardada exitosamente")
          onRefresh?.()
        }}
      />
    </>
  )
}
