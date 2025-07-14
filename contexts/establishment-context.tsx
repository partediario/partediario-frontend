"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  fetchUsuarioEmpresas,
  fetchUsuarioEstablecimientos,
  type UsuarioEmpresa,
  type UsuarioEstablecimiento,
} from "@/lib/api"

interface EstablishmentContextType {
  // Estados
  empresas: UsuarioEmpresa[]
  establecimientos: UsuarioEstablecimiento[]
  empresaSeleccionada: string
  establecimientoSeleccionado: string
  loading: boolean
  error: string | null

  // Funciones
  setEmpresaSeleccionada: (empresaId: string) => void
  setEstablecimientoSeleccionado: (establecimientoId: string) => void
  refreshData: () => Promise<void>

  // Helpers
  getEmpresaNombre: (empresaId: string) => string
  getEstablecimientoNombre: (establecimientoId: string) => string
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined)

export function EstablishmentProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<UsuarioEmpresa[]>([])
  const [establecimientos, setEstablecimientos] = useState<UsuarioEstablecimiento[]>([])
  const [empresaSeleccionada, setEmpresaSeleccionadaState] = useState<string>("")
  const [establecimientoSeleccionado, setEstablecimientoSeleccionadoState] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string>("")
  const [inicializado, setInicializado] = useState(false)

  // Obtener usuario ID del localStorage
  useEffect(() => {
    const getUserId = () => {
      const userData = localStorage.getItem("user_data")
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          return parsedUser.id
        } catch {
          return null
        }
      }
      return null
    }

    const id = getUserId()

    if (!id) {
      console.log("No hay usuario logueado")
      setError("No hay sesión activa")
      return
    }

    console.log("🆔 Usuario ID para EstablishmentContext:", id)
    setUsuarioId(id)
  }, [])

  // Cargar empresas cuando se obtiene el usuario ID
  useEffect(() => {
    if (!usuarioId || inicializado) return

    const loadEmpresas = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("🏢 [Context] Cargando empresas para usuario:", usuarioId)

        const empresasData = await fetchUsuarioEmpresas(usuarioId)
        console.log("🏢 [Context] Empresas cargadas (raw):", empresasData)

        // Transformar los datos para que tengan empresa_id
        const empresasTransformadas = empresasData.map((empresa: any) => ({
          empresa_id: empresa.id.toString(),
          nombre: empresa.nombre,
        }))

        const empresasOrdenadas = empresasTransformadas.sort(
          (a, b) => Number.parseInt(a.empresa_id) - Number.parseInt(b.empresa_id),
        )

        console.log("🏢 [Context] Empresas transformadas:", empresasOrdenadas)
        setEmpresas(empresasOrdenadas)

        // Auto-seleccionar primera empresa
        if (empresasOrdenadas.length > 0 && !empresaSeleccionada) {
          const primeraEmpresa = empresasOrdenadas[0]
          console.log("🏢 [Context] Seleccionando primera empresa:", primeraEmpresa.empresa_id)
          setEmpresaSeleccionadaState(primeraEmpresa.empresa_id)
        }

        setInicializado(true)
      } catch (error) {
        console.error("❌ [Context] Error loading companies:", error)
        setError("Error al cargar empresas")
      } finally {
        setLoading(false)
      }
    }

    loadEmpresas()
  }, [usuarioId, inicializado])

  // Cargar establecimientos cuando cambia la empresa
  useEffect(() => {
    if (!usuarioId || !empresaSeleccionada) {
      setEstablecimientos([])
      setEstablecimientoSeleccionadoState("")
      return
    }

    const loadEstablecimientos = async () => {
      try {
        setError(null)
        console.log("🏭 [Context] Cargando establecimientos para empresa:", empresaSeleccionada)

        const establecimientosData = await fetchUsuarioEstablecimientos(usuarioId, empresaSeleccionada)
        const establecimientosOrdenados = establecimientosData.sort(
          (a, b) => Number.parseInt(a.establecimiento_id) - Number.parseInt(b.establecimiento_id),
        )

        console.log("🏭 [Context] Establecimientos cargados:", establecimientosOrdenados)
        setEstablecimientos(establecimientosOrdenados)

        // Auto-seleccionar primer establecimiento
        if (establecimientosOrdenados.length > 0) {
          const primerEstablecimiento = establecimientosOrdenados[0]
          console.log("🏭 [Context] Seleccionando primer establecimiento:", primerEstablecimiento.establecimiento_id)
          setEstablecimientoSeleccionadoState(primerEstablecimiento.establecimiento_id)

          // Guardar en localStorage para compatibilidad con componentes existentes
          localStorage.setItem(
            "selected_establishment",
            JSON.stringify({
              id: primerEstablecimiento.establecimiento_id,
              nombre: primerEstablecimiento.nombre,
            }),
          )

          // Disparar evento para compatibilidad con código existente
          const event = new CustomEvent("establishmentChange", {
            detail: { establecimientoId: primerEstablecimiento.establecimiento_id },
          })
          window.dispatchEvent(event)
        }
      } catch (error) {
        console.error("❌ [Context] Error loading establishments:", error)
        setError("Error al cargar establecimientos")
      }
    }

    loadEstablecimientos()
  }, [empresaSeleccionada, usuarioId])

  // Escuchar cambios en los datos de la empresa
  const handleCompanyDataChange = async (event: CustomEvent) => {
    console.log("🏢 [Context] Datos de empresa actualizados, recargando datos...")

    // Recargar datos completos
    await refreshData()

    // Disparar evento global para que otros componentes se actualicen
    const globalEvent = new CustomEvent("companyDataUpdated", {
      detail: {
        empresaId: event.detail?.empresaId || empresaSeleccionada,
        updatedData: event.detail?.updatedData,
        timestamp: Date.now(),
      },
    })
    window.dispatchEvent(globalEvent)

    // Forzar re-render de componentes que dependan del nombre de empresa
    setTimeout(() => {
      const forceUpdateEvent = new CustomEvent("forceComponentUpdate", {
        detail: {
          type: "company_name_updated",
          empresaId: event.detail?.empresaId || empresaSeleccionada,
          newName: event.detail?.updatedData?.nombre,
        },
      })
      window.dispatchEvent(forceUpdateEvent)
    }, 100)
  }

  useEffect(() => {
    window.addEventListener("companyDataChanged", handleCompanyDataChange as EventListener)

    return () => {
      window.removeEventListener("companyDataChanged", handleCompanyDataChange as EventListener)
    }
  }, [empresaSeleccionada])

  // Funciones para cambiar selecciones
  const setEmpresaSeleccionada = (empresaId: string) => {
    console.log("🏢 [Context] Cambiando empresa a:", empresaId)
    setEmpresaSeleccionadaState(empresaId)
    // Reset establecimiento cuando cambia empresa
    setEstablecimientoSeleccionadoState("")
  }

  const setEstablecimientoSeleccionado = (establecimientoId: string) => {
    console.log("🏭 [Context] Cambiando establecimiento a:", establecimientoId)
    setEstablecimientoSeleccionadoState(establecimientoId)

    // Guardar en localStorage para compatibilidad con componentes existentes
    const establecimiento = establecimientos.find((e) => e.establecimiento_id === establecimientoId)
    if (establecimiento) {
      localStorage.setItem(
        "selected_establishment",
        JSON.stringify({
          id: establecimientoId,
          nombre: establecimiento.nombre,
        }),
      )
    }

    // Disparar evento para compatibilidad con código existente
    const event = new CustomEvent("establishmentChange", {
      detail: { establecimientoId },
    })
    window.dispatchEvent(event)
  }

  // Helper functions
  const getEmpresaNombre = (empresaId: string) => {
    const empresa = empresas.find((e) => e.empresa_id === empresaId)
    return empresa?.nombre || empresaId
  }

  const getEstablecimientoNombre = (establecimientoId: string) => {
    const establecimiento = establecimientos.find((e) => e.establecimiento_id === establecimientoId)
    return establecimiento?.nombre || establecimientoId
  }

  const refreshData = async () => {
    if (!usuarioId) return

    try {
      setLoading(true)
      setError(null)

      console.log("🔄 [Context] Refrescando datos de empresas...")
      const empresasData = await fetchUsuarioEmpresas(usuarioId)
      const empresasTransformadas = empresasData.map((empresa: any) => ({
        empresa_id: empresa.id.toString(),
        nombre: empresa.nombre,
      }))
      const empresasOrdenadas = empresasTransformadas.sort(
        (a, b) => Number.parseInt(a.empresa_id) - Number.parseInt(b.empresa_id),
      )

      console.log("🔄 [Context] Empresas actualizadas:", empresasOrdenadas)
      setEmpresas(empresasOrdenadas)

      if (empresaSeleccionada) {
        console.log("🔄 [Context] Refrescando establecimientos...")
        const establecimientosData = await fetchUsuarioEstablecimientos(usuarioId, empresaSeleccionada)
        const establecimientosOrdenados = establecimientosData.sort(
          (a, b) => Number.parseInt(a.establecimiento_id) - Number.parseInt(b.establecimiento_id),
        )
        setEstablecimientos(establecimientosOrdenados)
      }
    } catch (error) {
      console.error("❌ [Context] Error refreshing data:", error)
      setError("Error al refrescar datos")
    } finally {
      setLoading(false)
    }
  }

  const value: EstablishmentContextType = {
    empresas,
    establecimientos,
    empresaSeleccionada,
    establecimientoSeleccionado,
    loading,
    error,
    setEmpresaSeleccionada,
    setEstablecimientoSeleccionado,
    refreshData,
    getEmpresaNombre,
    getEstablecimientoNombre,
  }

  return <EstablishmentContext.Provider value={value}>{children}</EstablishmentContext.Provider>
}

export function useEstablishment() {
  const context = useContext(EstablishmentContext)
  if (context === undefined) {
    throw new Error("useEstablishment must be used within an EstablishmentProvider")
  }
  return context
}
