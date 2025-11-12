"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

type NavigationLevel = "main" | "empresas" | "empresa-config" | "establecimiento-config"

interface ConfigNavigationState {
  level: NavigationLevel
  selectedEmpresaId: string | null
  selectedEmpresaName: string | null
  selectedEstablecimientoId: string | null
  selectedEstablecimientoName: string | null
  empresaConfigTab: string
  establecimientoConfigTab: string
  empresasTab: string
  isSubSidebarOpen: boolean
}

interface ConfigNavigationContextType {
  state: ConfigNavigationState
  navigateToEmpresas: () => void
  navigateToEmpresaConfig: (empresaId: string, empresaName: string) => void
  navigateToEstablecimientoConfig: (establecimientoId: string, establecimientoName: string) => void
  navigateBack: () => void
  setEmpresaConfigTab: (tab: string) => void
  setEstablecimientoConfigTab: (tab: string) => void
  setEmpresasTab: (tab: string) => void
  resetNavigation: () => void
  toggleSubSidebar: () => void
  setSubSidebarOpen: (open: boolean) => void
}

const ConfigNavigationContext = createContext<ConfigNavigationContextType | undefined>(undefined)

export function ConfigNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const [state, setState] = useState<ConfigNavigationState>({
    level: "main",
    selectedEmpresaId: null,
    selectedEmpresaName: null,
    selectedEstablecimientoId: null,
    selectedEstablecimientoName: null,
    empresaConfigTab: "datos-empresa",
    establecimientoConfigTab: "datos-establecimiento",
    empresasTab: "empresas",
    isSubSidebarOpen: false,
  })

  const navigateToEmpresas = useCallback(() => {
    setState((prev) => ({
      ...prev,
      level: "empresas",
      selectedEmpresaId: null,
      selectedEmpresaName: null,
      selectedEstablecimientoId: null,
      selectedEstablecimientoName: null,
    }))
  }, [])

  const navigateToEmpresaConfig = useCallback((empresaId: string, empresaName: string) => {
    setState((prev) => ({
      ...prev,
      level: "empresa-config",
      selectedEmpresaId: empresaId,
      selectedEmpresaName: empresaName,
      selectedEstablecimientoId: null,
      selectedEstablecimientoName: null,
      empresaConfigTab: "datos-empresa",
    }))
  }, [])

  const navigateToEstablecimientoConfig = useCallback((establecimientoId: string, establecimientoName: string) => {
    setState((prev) => ({
      ...prev,
      level: "establecimiento-config",
      selectedEstablecimientoId: establecimientoId,
      selectedEstablecimientoName: establecimientoName,
      establecimientoConfigTab: "datos-establecimiento",
    }))
  }, [])

  const navigateBack = useCallback(() => {
    setState((prev) => {
      if (prev.level === "establecimiento-config") {
        return { ...prev, level: "empresa-config", selectedEstablecimientoId: null, selectedEstablecimientoName: null }
      }
      if (prev.level === "empresa-config") {
        return { ...prev, level: "empresas", selectedEmpresaId: null, selectedEmpresaName: null }
      }
      if (prev.level === "empresas") {
        router.back()
        return prev
      }
      return prev
    })
  }, [router])

  const setEmpresaConfigTab = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, empresaConfigTab: tab }))
  }, [])

  const setEstablecimientoConfigTab = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, establecimientoConfigTab: tab }))
  }, [])

  const setEmpresasTab = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, empresasTab: tab }))
  }, [])

  const resetNavigation = useCallback(() => {
    setState({
      level: "main",
      selectedEmpresaId: null,
      selectedEmpresaName: null,
      selectedEstablecimientoId: null,
      selectedEstablecimientoName: null,
      empresaConfigTab: "datos-empresa",
      establecimientoConfigTab: "datos-establecimiento",
      empresasTab: "empresas",
      isSubSidebarOpen: false,
    })
  }, [])

  const toggleSubSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, isSubSidebarOpen: !prev.isSubSidebarOpen }))
  }, [])

  const setSubSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isSubSidebarOpen: open }))
  }, [])

  return (
    <ConfigNavigationContext.Provider
      value={{
        state,
        navigateToEmpresas,
        navigateToEmpresaConfig,
        navigateToEstablecimientoConfig,
        navigateBack,
        setEmpresaConfigTab,
        setEstablecimientoConfigTab,
        setEmpresasTab,
        resetNavigation,
        toggleSubSidebar,
        setSubSidebarOpen,
      }}
    >
      {children}
    </ConfigNavigationContext.Provider>
  )
}

export function useConfigNavigation() {
  const context = useContext(ConfigNavigationContext)
  if (!context) {
    throw new Error("useConfigNavigation must be used within ConfigNavigationProvider")
  }
  return context
}
