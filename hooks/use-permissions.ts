"use client"

import { useUser } from "@/contexts/user-context"
import { useEstablishment } from "@/contexts/establishment-context"
import { createPermissions } from "@/lib/permissions"
import { useMemo } from "react"

export function usePermissions() {
  const { usuario, loading } = useUser()
  const { establecimientoSeleccionado } = useEstablishment()

  const permissions = useMemo(() => {
    if (loading || !usuario) {
      // Permisos por defecto mientras carga
      return {
        roles: [],
        isAdmin: false,
        isConsultor: false,
        isGerente: false,
        isOperativo: false,
        canEdit: false,
        hasPrivilege: () => false,
        canViewDashboard: () => false,
        canViewConfiguration: () => false,
        canEditConfiguration: () => false,
        canAddParteDiario: () => false,
        canAddMovimiento: () => false,
        canAddActividad: () => false,
        canAddClima: () => false,
        canAddInsumo: () => false,
        canViewUsers: () => false,
        canEditUsers: () => false,
        getUserRoleName: () => "Cargando...",
        getPermissionsSummary: () => ({}),
      }
    }

    return createPermissions(usuario)
  }, [usuario, loading, establecimientoSeleccionado]) // Agregar establecimientoSeleccionado como dependencia

  return permissions
}
