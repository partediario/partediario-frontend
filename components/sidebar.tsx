"use client"

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
  ChevronDownIcon,
  FileText,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEstablishment } from "@/contexts/establishment-context"
import { useUser } from "@/contexts/user-context"
import { usePermissions } from "@/hooks/use-permissions"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UsuarioViewDrawer from "@/components/sections/configuracion/components/usuario-view-drawer"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface SidebarProps {
  activeSection?: string
  onEstablishmentChange?: (establishment: string) => void
  onCompanyChange?: (company: string) => void
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ activeSection, onEstablishmentChange, onCompanyChange, isOpen = false, onClose }: SidebarProps) {
  const router = useRouter()
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

  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false)
  const [tempEmpresa, setTempEmpresa] = useState<string>("")
  const [tempEstablecimiento, setTempEstablecimiento] = useState<string>("")
  const [isUserViewDrawerOpen, setIsUserViewDrawerOpen] = useState(false)

  useEffect(() => {
    if (usuario && !loadingUsuario) {
      console.log("🔐 [SIDEBAR] Permisos del usuario cargados:")
      const summary = permissions.getPermissionsSummary()
      console.log("📋 [SIDEBAR] Resumen de permisos:", summary)
    }
  }, [usuario, loadingUsuario, permissions])

  useEffect(() => {
    if (isContextDialogOpen) {
      setTempEmpresa(empresaSeleccionada)
      setTempEstablecimiento(establecimientoSeleccionado)
    }
  }, [isContextDialogOpen, empresaSeleccionada, establecimientoSeleccionado])

  const menuItems = [
    {
      icon: BarChart3,
      label: "Registros",
      key: "registros",
      path: "/registros",
      visible: permissions.canViewDashboard("partes"),
      requiresAuth: true,
    },
    {
      icon: FileText,
      label: "Reportes",
      key: "reportes",
      path: "/reportes",
      visible: true,
      requiresAuth: true,
    },
    {
      icon: TrendingUp,
      label: "Movimientos",
      key: "movimientos",
      path: "/movimientos",
      visible: permissions.canViewDashboard("movimientos"),
      requiresAuth: true,
    },
    {
      icon: Activity,
      label: "Actividades",
      key: "actividades",
      path: "/actividades",
      visible: true,
      requiresAuth: true,
    },
    {
      icon: Cloud,
      label: "Clima",
      key: "clima",
      path: "/clima",
      visible: permissions.canViewDashboard("clima"),
      requiresAuth: true,
    },
    {
      icon: Map,
      label: "Potreros/Parcelas",
      key: "potreros",
      path: "/potreros",
      visible: false,
      requiresAuth: true,
    },
    {
      icon: Package,
      label: "Insumos",
      key: "insumos",
      path: "/insumos",
      visible: true,
      requiresAuth: true,
    },
    {
      icon: Tractor,
      label: "Maquinarias",
      key: "maquinarias",
      path: "/maquinarias",
      visible: false,
      requiresAuth: true,
    },
  ]

  const handleMenuItemClick = (path: string, label: string) => {
    console.log("🔍 [SIDEBAR] Menu clicked:", label)
    console.log("🔐 [SIDEBAR] Permisos actuales:", {
      isAdmin: permissions.isAdmin,
      isConsultor: permissions.isConsultor,
      canEdit: permissions.canEdit,
      canAddParteDiario: permissions.canAddParteDiario(),
    })
    router.push(path)
  }

  const handleLogoClick = () => {
    console.log("🏠 [SIDEBAR] Logo clicked - Redirigiendo a Registros")
    router.push("/registros")
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

  const handleApplyContext = () => {
    if (tempEmpresa !== empresaSeleccionada) {
      console.log("🏢 Cambiando empresa a:", tempEmpresa)
      setEmpresaSeleccionada(tempEmpresa)
      onCompanyChange?.(tempEmpresa)

      // Disparar evento global para actualizar todos los componentes
      const event = new CustomEvent("empresaChanged", {
        detail: {
          empresaId: tempEmpresa,
          empresaNombre: getEmpresaNombre(tempEmpresa),
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      // También disparar evento genérico de actualización
      window.dispatchEvent(
        new CustomEvent("updateAllComponents", {
          detail: { type: "empresa", value: tempEmpresa, timestamp: Date.now() },
        }),
      )
    }

    if (tempEstablecimiento !== establecimientoSeleccionado) {
      console.log("🏭 Cambiando establecimiento a:", tempEstablecimiento)
      setEstablecimientoSeleccionado(tempEstablecimiento)
      onEstablishmentChange?.(tempEstablecimiento)

      // Disparar evento global para actualizar todos los componentes
      const event = new CustomEvent("establecimientoChanged", {
        detail: {
          establecimientoId: tempEstablecimiento,
          establecimientoNombre: getEstablecimientoNombre(tempEstablecimiento),
          empresaId: tempEmpresa,
          timestamp: Date.now(),
        },
      })
      window.dispatchEvent(event)

      // También disparar evento genérico de actualización
      window.dispatchEvent(
        new CustomEvent("updateAllComponents", {
          detail: { type: "establecimiento", value: tempEstablecimiento, timestamp: Date.now() },
        }),
      )
    }

    setIsContextDialogOpen(false)
  }

  // Función para obtener el icono del rol
  const getRoleIcon = () => {
    if (permissions.isAdmin) return <Crown className="h-4 w-4 text-yellow-500" />
    if (permissions.isConsultor) return <Eye className="h-4 w-4 text-blue-500" />
    return <Users className="h-4 w-4 text-gray-400" />
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
            src="/images/design-mode/Parte_Diario_blanco_tsoirc.svg"
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

  const handleMenuClick = (path: string, label: string) => {
    handleMenuItemClick(path, label)
    onClose?.() // Close mobile sidebar when clicking a menu item
  }

  // Sidebar content component - reusable for both mobile and desktop
  const SidebarContent = () => (
    <div className="p-4 min-h-full flex flex-col" style={{ backgroundColor: "#1F2427" }}>
        <div className="pt-3 pb-2 flex flex-col items-center cursor-pointer group" onClick={handleLogoClick}>
          <Image
            src="/images/design-mode/Parte_Diario_blanco_tsoirc.svg"
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

        <button
          onClick={() => setIsContextDialogOpen(true)}
          className="mb-6 w-full flex items-center justify-between p-3 rounded-md hover:bg-gray-700 transition-colors duration-200 group"
          style={{ backgroundColor: "#2A2D2E" }}
        >
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-white truncate">
              {empresaSeleccionada ? getEmpresaNombre(empresaSeleccionada) : "Seleccionar empresa"}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {establecimientoSeleccionado
                ? getEstablecimientoNombre(establecimientoSeleccionado)
                : "Seleccionar establecimiento"}
            </div>
          </div>
          <ChevronDownIcon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
        </button>

        <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold">Cambiar contexto</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Selector de Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <Select value={tempEmpresa} onValueChange={setTempEmpresa} disabled={loading || empresas.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {loading
                        ? "Cargando empresas..."
                        : tempEmpresa
                          ? getEmpresaNombre(tempEmpresa)
                          : empresas.length === 0
                            ? "No hay empresas disponibles"
                            : "Seleccionar empresa"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.empresa_id} value={empresa.empresa_id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Establecimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Establecimiento</label>
                <Select
                  value={tempEstablecimiento}
                  onValueChange={setTempEstablecimiento}
                  disabled={!tempEmpresa || establecimientos.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {!tempEmpresa
                        ? "Selecciona empresa primero"
                        : tempEstablecimiento
                          ? getEstablecimientoNombre(tempEstablecimiento)
                          : establecimientos.length === 0
                            ? "No hay establecimientos disponibles"
                            : "Seleccionar establecimiento"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {establecimientos.map((establecimiento) => (
                      <SelectItem key={establecimiento.establecimiento_id} value={establecimiento.establecimiento_id}>
                        {establecimiento.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-3 sm:mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsContextDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleApplyContext} 
                className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 order-1 sm:order-2"
              >
                Aplicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Navegación con espaciado perfectamente simétrico */}
        <nav className="flex-1 pb-4">
          <ul className="space-y-2">
            {menuItems
              .filter((item) => item.visible && (!item.requiresAuth || isAuthenticated))
              .map((item) => {
                const IconComponent = item.icon
                const isActive = activeSection === item.label
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => handleMenuClick(item.path, item.label)}
                      className={`w-full flex items-center gap-3 text-sm py-3 px-4 rounded-md transition-colors duration-200 ${
                        isActive ? "bg-gray-700 text-white font-medium" : "text-gray-200 hover:bg-gray-600"
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 ${isActive ? "text-[#A8C090]" : "text-[#8C9C78]"}`} />
                      {item.label}
                    </button>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* Configuración button above user info */}
        {permissions.canViewConfiguration() && isAuthenticated && (
          <div className="pb-4 border-b border-gray-600">
            <button
              onClick={() => handleMenuClick("/configuracion", "Configuración")}
              className={`w-full flex items-center gap-3 text-sm py-3 px-4 rounded-md transition-colors duration-200 ${
                activeSection === "Configuración"
                  ? "bg-gray-700 text-white font-medium"
                  : "text-gray-200 hover:bg-gray-600"
              }`}
            >
              <Settings
                className={`h-5 w-5 ${activeSection === "Configuración" ? "text-[#A8C090]" : "text-[#8C9C78]"}`}
              />
              Configuración
            </button>
          </div>
        )}

        {/* Información del usuario */}
        <div className="mt-auto pt-4 border-t border-gray-600">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {iniciales}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <button
                onClick={() => setIsUserViewDrawerOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
              >
                {getRoleIcon()}
                <p className="text-sm font-medium text-white truncate hover:text-blue-400 transition-colors">
                  {nombreCompleto}
                </p>
              </button>
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
  )

  return (
    <>
      {/* Mobile Sidebar - Sheet */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent 
          side="left" 
          className="p-0 w-64 border-0 md:hidden" 
          style={{ backgroundColor: "#1F2427" }}
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden md:block w-64 h-screen fixed left-0 top-0 z-10 overflow-y-auto" style={{ backgroundColor: "#1F2427" }}>
        <SidebarContent />
      </div>

      {/* User View Drawer - Outside both sidebars */}
      {usuario && (
        <UsuarioViewDrawer
          open={isUserViewDrawerOpen}
          onOpenChange={setIsUserViewDrawerOpen}
          usuario={{
            id: usuario.id,
            nombres: usuario.nombres,
            apellidos: usuario.apellidos,
            email: usuario.email,
            telefono: usuario.telefono || "",
            created_at: usuario.created_at || new Date().toISOString(),
          }}
        />
      )}
    </>
  )
}
