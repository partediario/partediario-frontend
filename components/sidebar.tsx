"use client"

import type React from "react"

import Image from "next/image"
import {
  BarChart3,
  TrendingUp,
  Cloud,
  Settings,
  LogOut,
  Map,
  Tractor,
  Package,
  Activity,
  Eye,
  Crown,
  Users,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import { useEffect } from "react"

interface SidebarProps {
  onMenuClick?: (menuItem: string) => void
  onEstablishmentChange?: (establishment: string) => void
  onCompanyChange?: (company: string) => void
}

export default function Sidebar({ onMenuClick, onEstablishmentChange, onCompanyChange }: SidebarProps) {
  const {
    empresas,
    establecimientos,
    empresaSeleccionada,
    establecimientoSeleccionado,
    loading,
    error,
    setEmpresaSeleccionada,
    setEstablecimientoSeleccionado,
    getEmpresaNombre,
    getEstablecimientoNombre,
  } = useEstablishment()

  const { usuario, loading: loadingUsuario, error: errorUsuario, isAuthenticated } = useUser()
  const permissions = usePermissions()

  // Mostrar resumen de permisos cuando el usuario se carga
  useEffect(() => {
    if (usuario && !loadingUsuario) {
      console.log("🔐 [SIDEBAR] Permisos del usuario cargados:")
      const summary = permissions.getPermissionsSummary()
      console.log("📋 [SIDEBAR] Resumen de permisos:", summary)
    }
  }, [usuario, loadingUsuario, permissions])

  const menuItems = [
    {
      icon: BarChart3,
      label: "Registros",
      key: "registros",
      visible: permissions.canViewDashboard("partes"),
      requiresAuth: true,
    },
    {
      icon: TrendingUp,
      label: "Movimientos",
      key: "movimientos",
      visible: permissions.canViewDashboard("movimientos"),
      requiresAuth: true,
    },
    {
      icon: Activity,
      label: "Actividades",
      key: "actividades",
      visible: true, // Mantenido oculto como antes
      requiresAuth: true,
    },
    {
      icon: Cloud,
      label: "Clima",
      key: "clima",
      visible: permissions.canViewDashboard("clima"),
      requiresAuth: true,
    },
    {
      icon: Map,
      label: "Potreros/Parcelas",
      key: "potreros",
      visible: false, // Mantenido oculto como antes
      requiresAuth: true,
    },
    {
      icon: Package,
      label: "Insumos",
      key: "insumos",
      visible: true, // Cambiado de permissions.canViewDashboard("insumos") a false
      requiresAuth: true,
    },
    {
      icon: Tractor,
      label: "Maquinarias",
      key: "maquinarias",
      visible: false, // Mantenido oculto como antes
      requiresAuth: true,
    },
    {
      icon: Settings,
      label: "Configuración",
      key: "configuracion",
      visible: permissions.canViewConfiguration(),
      requiresAuth: true,
    },
  ]

  const handleMenuItemClick = (menuItem: string) => {
    console.log("🔍 [SIDEBAR] Menu clicked:", menuItem)
    console.log("🔐 [SIDEBAR] Permisos actuales:", {
      isAdmin: permissions.isAdmin,
      isConsultor: permissions.isConsultor,
      canEdit: permissions.canEdit,
      canAddParteDiario: permissions.canAddParteDiario(),
    })
    onMenuClick?.(menuItem)
  }

  const handleLogout = () => {
    console.log("🚪 Cerrando sesión...")

    // Limpiar todo el localStorage
    localStorage.removeItem("supabase_token")
    localStorage.removeItem("supabase_refresh")
    localStorage.removeItem("user_data")

    // Disparar evento para notificar el cambio
    window.dispatchEvent(new Event("userChanged"))

    // Redirigir al login
    window.location.href = "/login"
  }

  const handleCompanyChange = (value: string) => {
    console.log("🏢 Cambiando empresa a:", value)
    setEmpresaSeleccionada(value)
    onCompanyChange?.(value)

    // Disparar evento global para actualizar todos los componentes
    const event = new CustomEvent("empresaChanged", {
      detail: {
        empresaId: value,
        empresaNombre: getEmpresaNombre(value),
        timestamp: Date.now(),
      },
    })
    window.dispatchEvent(event)

    // También disparar evento genérico de actualización
    window.dispatchEvent(
      new CustomEvent("updateAllComponents", {
        detail: { type: "empresa", value, timestamp: Date.now() },
      }),
    )
  }

  const handleEstablishmentChange = (value: string) => {
    console.log("🏭 Cambiando establecimiento a:", value)
    setEstablecimientoSeleccionado(value)
    onEstablishmentChange?.(value)

    // Disparar evento global para actualizar todos los componentes
    const event = new CustomEvent("establecimientoChanged", {
      detail: {
        establecimientoId: value,
        establecimientoNombre: getEstablecimientoNombre(value),
        empresaId: empresaSeleccionada,
        timestamp: Date.now(),
      },
    })
    window.dispatchEvent(event)

    // También disparar evento genérico de actualización
    window.dispatchEvent(
      new CustomEvent("updateAllComponents", {
        detail: { type: "establecimiento", value, timestamp: Date.now() },
      }),
    )
  }

  // Función para obtener el icono del rol
  const getRoleIcon = () => {
    if (permissions.isAdmin) return <Crown className="h-4 w-4 text-yellow-500" />
    if (permissions.isConsultor) return <Eye className="h-4 w-4 text-blue-500" />
    return <Users className="h-4 w-4 text-gray-400" />
  }

  // Función para manejar click en dropdown cuando solo hay una opción
  const handleSingleOptionClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  // Mostrar loading mientras se carga el usuario
  if (loadingUsuario) {
    return (
      <div className="w-64 min-h-screen p-4 flex items-center justify-center" style={{ backgroundColor: "#1F2427" }}>
        <div className="text-white">Cargando usuario...</div>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar mensaje de error
  if (!isAuthenticated || !usuario) {
    return (
      <div className="w-64 min-h-screen p-4 flex flex-col" style={{ backgroundColor: "#1F2427" }}>
        <div className="pt-3 pb-2 flex flex-col items-center">
          <Image
            src="https://res.cloudinary.com/dtieutmxi/image/upload/v1749300882/Parte_Diario_blanco_tsoirc.svg"
            alt="Logo Parte Diario"
            width={160}
            height={56}
            className="h-auto object-contain"
            priority
          />
        </div>
        <div className="border-t border-white opacity-40 mt-2 mb-6" />
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {errorUsuario || "No hay sesión activa"}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  // Mostrar nombre completo del usuario
  const nombreCompleto = usuario.nombreCompleto || `${usuario.nombres} ${usuario.apellidos}`.trim() || usuario.email
  const iniciales = nombreCompleto
    .split(" ")
    .map((name) => name.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="w-64 h-screen fixed left-0 top-0 z-10 overflow-y-auto" style={{ backgroundColor: "#1F2427" }}>
      <div className="p-4 min-h-full flex flex-col">
        {/* Logo con efecto hover */}
        <div className="pt-3 pb-2 flex flex-col items-center cursor-pointer group">
          <Image
            src="https://res.cloudinary.com/dtieutmxi/image/upload/v1749300882/Parte_Diario_blanco_tsoirc.svg"
            alt="Logo Parte Diario"
            width={160}
            height={56}
            className="h-auto object-contain group-hover:scale-105 group-hover:brightness-110 transition-all duration-300"
            priority
          />
        </div>

        {/* Línea separadora blanca */}
        <div className="border-t border-white opacity-40 mt-2 mb-6" />

        {/* Error message del establishment context */}
        {error && <div className="mb-4 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">{error}</div>}

        {/* Selector de Empresa con título */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Empresa</label>
          <Select
            value={empresaSeleccionada}
            onValueChange={empresas.length > 1 ? handleCompanyChange : undefined}
            disabled={loading || empresas.length === 0}
          >
            <SelectTrigger
              className={`w-full text-white border-gray-600 rounded-md ${empresas.length <= 1 ? "[&>svg]:hidden" : ""}`}
              style={{ backgroundColor: "#2A2D2E" }}
              onClick={empresas.length <= 1 ? handleSingleOptionClick : undefined}
            >
              <SelectValue>
                {loading
                  ? "Cargando empresas..."
                  : empresaSeleccionada
                    ? getEmpresaNombre(empresaSeleccionada)
                    : empresas.length === 0
                      ? "No hay empresas disponibles"
                      : "Seleccionar empresa"}
              </SelectValue>
            </SelectTrigger>
            {empresas.length > 1 && (
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.empresa_id} value={empresa.empresa_id}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
        </div>

        {/* Selector de Establecimiento con título */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Establecimiento</label>
          <Select
            value={establecimientoSeleccionado}
            onValueChange={establecimientos.length > 1 ? handleEstablishmentChange : undefined}
            disabled={!empresaSeleccionada || establecimientos.length === 0}
          >
            <SelectTrigger
              className={`w-full text-white border-gray-600 rounded-md ${
                establecimientos.length <= 1 ? "[&>svg]:hidden" : ""
              }`}
              style={{ backgroundColor: "#2A2D2E" }}
              onClick={establecimientos.length <= 1 ? handleSingleOptionClick : undefined}
            >
              <SelectValue>
                {!empresaSeleccionada
                  ? "Selecciona empresa primero"
                  : establecimientoSeleccionado
                    ? getEstablecimientoNombre(establecimientoSeleccionado)
                    : establecimientos.length === 0
                      ? "No hay establecimientos disponibles"
                      : "Seleccionar establecimiento"}
              </SelectValue>
            </SelectTrigger>
            {establecimientos.length > 1 && (
              <SelectContent>
                {establecimientos.map((establecimiento) => (
                  <SelectItem key={establecimiento.establecimiento_id} value={establecimiento.establecimiento_id}>
                    {establecimiento.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            )}
          </Select>
        </div>

        {/* Navegación con espaciado perfectamente simétrico */}
        <nav className="flex-1 pb-4">
          <ul className="space-y-2">
            {menuItems
              .filter((item) => item.visible && (!item.requiresAuth || isAuthenticated))
              .map((item) => {
                const IconComponent = item.icon
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => handleMenuItemClick(item.label)}
                      className="w-full flex items-center gap-3 text-sm text-gray-200 py-3 px-4 hover:bg-gray-600 rounded-md transition-colors duration-200"
                    >
                      <IconComponent className="h-5 w-5 text-[#8C9C78]" />
                      {item.label}
                    </button>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* Información del usuario */}
        <div className="mt-auto pt-4 border-t border-gray-600">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {iniciales}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getRoleIcon()}
                <p className="text-sm font-medium text-white truncate">{nombreCompleto}</p>
              </div>
              <p className="text-xs text-gray-300 truncate">{usuario.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="default" className="text-xs bg-gray-800 text-white hover:bg-gray-700">
                  {permissions.getUserRoleName()}
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-sm text-gray-200 py-2 px-3 hover:bg-gray-600 rounded-md transition-colors duration-200"
          >
            <LogOut className="h-4 w-4 text-[#8C9C78]" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
