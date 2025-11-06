"use client"

import { usePermissions } from "@/hooks/use-permissions"
import type { ReactNode } from "react"

interface PermissionWrapperProps {
  children: ReactNode
  requirePermission?:
    | "admin"
    | "canEdit"
    | "canAddParteDiario"
    | "canViewConfig"
    | "canEditConfig"
    | "canViewUsers"
    | "canEditUsers"
  requirePrivilege?: number
  fallback?: ReactNode
  showForConsultor?: boolean
  hideForConsultor?: boolean
  hideForGerente?: boolean
  hideForOperativo?: boolean
  configType?: "empresa" | "establecimiento" | "usuarios" | "roles"
}

export function PermissionWrapper({
  children,
  requirePermission,
  requirePrivilege,
  fallback = null,
  showForConsultor = true,
  hideForConsultor = false,
  hideForGerente = false,
  hideForOperativo = false,
  configType,
}: PermissionWrapperProps) {
  const permissions = usePermissions()

  // Ocultar para roles específicos
  if (hideForConsultor && permissions.isConsultor) return <>{fallback}</>
  if (hideForGerente && permissions.isGerente) return <>{fallback}</>
  if (hideForOperativo && permissions.isOperativo) return <>{fallback}</>

  // Si es consultor y no se permite mostrar para consultores
  if (permissions.isConsultor && !showForConsultor) {
    return <>{fallback}</>
  }

  // Verificar permisos específicos
  if (requirePermission) {
    switch (requirePermission) {
      case "admin":
        if (!permissions.isAdmin) return <>{fallback}</>
        break
      case "canEdit":
        if (!permissions.canEdit) return <>{fallback}</>
        break
      case "canAddParteDiario":
        if (!permissions.canAddParteDiario()) return <>{fallback}</>
        break
      case "canViewConfig":
        if (!permissions.canViewConfiguration()) return <>{fallback}</>
        break
      case "canEditConfig":
        if (!permissions.canEditConfiguration(configType)) return <>{fallback}</>
        break
      case "canViewUsers":
        if (!permissions.canViewUsers()) return <>{fallback}</>
        break
      case "canEditUsers":
        if (!permissions.canEditUsers()) return <>{fallback}</>
        break
    }
  }

  // Verificar privilegio específico
  if (requirePrivilege && !permissions.hasPrivilege(requirePrivilege)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
