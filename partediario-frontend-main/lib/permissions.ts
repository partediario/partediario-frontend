// Definición de roles según las imágenes
export const ROLES = {
  OPERATIVO: 1,
  GERENTE: 2,
  CONSULTOR: 3,
  ADMINISTRADOR: 4,
} as const

// Definición de privilegios según las imágenes
export const PRIVILEGIOS = {
  DASHBOARD_PARTES_DIARIOS: 1,
  DASHBOARD_MOVIMIENTOS: 2,
  DASHBOARD_CLIMA: 3,
  DASHBOARD_INSUMOS: 4,
  CONF: 5,
  CONF_VER_EMPRESA: 6,
  CONF_EDITAR_EMPRESA: 7,
  CONF_VER_ESTABLECIMIENTO: 8,
  CONF_EDITAR_ESTABLECIMIENTO: 9,
  CONF_VER_USUARIOS: 10,
  CONF_EDITAR_USUARIOS: 11,
  CONF_VER_ROLES: 12,
  CONF_EDITAR_ROLES: 13,
  CONF_VER_PRIVILEGIOS: 14,
  CONF_EDITAR_PRIVILEGIOS: 15,
  PD_AGREGAR_MOVIMIENTO_ANIMALES: 16,
  PD_AGREGAR_ACTIVIDAD: 17,
  PD_AGREGAR_CLIMA: 18,
  PD_AGREGAR_INSUMO: 19,
  AI_TOOLS_PARTE_DIARIO_RESUMEN: 20,
} as const

export type RoleId = (typeof ROLES)[keyof typeof ROLES]
export type PrivilegioId = (typeof PRIVILEGIOS)[keyof typeof PRIVILEGIOS]

export interface UserRole {
  id: number
  nombre: string
  privilegios: string[]
}

export interface UserPermissions {
  roles: UserRole[]
  isAdmin: boolean
  isConsultor: boolean
  isGerente: boolean
  isOperativo: boolean
  canEdit: boolean
  hasPrivilege: (privilegeId: PrivilegioId) => boolean
  canViewDashboard: (type: "partes" | "movimientos" | "clima" | "insumos") => boolean
  canViewConfiguration: () => boolean
  canEditConfiguration: (type?: "empresa" | "establecimiento" | "usuarios" | "roles") => boolean
  canAddParteDiario: () => boolean
  canAddMovimiento: () => boolean
  canAddActividad: () => boolean
  canAddClima: () => boolean
  canAddInsumo: () => boolean
  canViewUsers: () => boolean
  canEditUsers: () => boolean
  getUserRoleName: () => string
  getPermissionsSummary: () => object
}

export function createPermissions(usuario: any): UserPermissions {
  const roles: UserRole[] = usuario?.roles || []

  // Verificar roles específicos
  const isAdmin = roles.some((role) => role.id === ROLES.ADMINISTRADOR)
  const isConsultor = roles.some((role) => role.id === ROLES.CONSULTOR)
  const isGerente = roles.some((role) => role.id === ROLES.GERENTE)
  const isOperativo = roles.some((role) => role.id === ROLES.OPERATIVO)

  // Lógica de edición:
  // - ADMINISTRADOR: puede editar todo
  // - CONSULTOR: NO puede editar nada (solo lectura)
  // - GERENTE: puede editar todo excepto usuarios
  // - OPERATIVO: puede editar según sus privilegios específicos
  const canEdit = isAdmin || (!isConsultor && (isGerente || isOperativo))

  // Función para verificar si tiene un privilegio específico
  const hasPrivilege = (privilegeId: PrivilegioId): boolean => {
    // Los administradores tienen todos los privilegios
    if (isAdmin) return true

    // Verificar en los privilegios del usuario
    return roles.some((role) => role.privilegios && role.privilegios.includes(getPrivilegeNameById(privilegeId)))
  }

  // Función para obtener el nombre del privilegio por ID
  const getPrivilegeNameById = (privilegeId: PrivilegioId): string => {
    const privilegeMap: Record<PrivilegioId, string> = {
      [PRIVILEGIOS.DASHBOARD_PARTES_DIARIOS]: "DASHBOARD PARTES DIARIOS",
      [PRIVILEGIOS.DASHBOARD_MOVIMIENTOS]: "DASHBOARD MOVIMIENTOS",
      [PRIVILEGIOS.DASHBOARD_CLIMA]: "DASHBOARD CLIMA",
      [PRIVILEGIOS.DASHBOARD_INSUMOS]: "DASHBOARD INSUMOS",
      [PRIVILEGIOS.CONF]: "CONF.",
      [PRIVILEGIOS.CONF_VER_EMPRESA]: "CONF. VER EMPRESA",
      [PRIVILEGIOS.CONF_EDITAR_EMPRESA]: "CONF. EDITAR EMPRESA",
      [PRIVILEGIOS.CONF_VER_ESTABLECIMIENTO]: "CONF. VER ESTABLECIMIENTO",
      [PRIVILEGIOS.CONF_EDITAR_ESTABLECIMIENTO]: "CONF. EDITAR ESTABLECIMIENTO",
      [PRIVILEGIOS.CONF_VER_USUARIOS]: "CONF. VER USUARIOS",
      [PRIVILEGIOS.CONF_EDITAR_USUARIOS]: "CONF. EDITAR USUARIOS",
      [PRIVILEGIOS.CONF_VER_ROLES]: "CONF. VER ROLES",
      [PRIVILEGIOS.CONF_EDITAR_ROLES]: "CONF. EDITAR ROLES",
      [PRIVILEGIOS.CONF_VER_PRIVILEGIOS]: "CONF. VER PRIVILEGIOS",
      [PRIVILEGIOS.CONF_EDITAR_PRIVILEGIOS]: "CONF. EDITAR PRIVILEGIOS",
      [PRIVILEGIOS.PD_AGREGAR_MOVIMIENTO_ANIMALES]: "PD AGREGAR MOVIMIENTO DE ANIMALES",
      [PRIVILEGIOS.PD_AGREGAR_ACTIVIDAD]: "PD AGREGAR ACTIVIDAD",
      [PRIVILEGIOS.PD_AGREGAR_CLIMA]: "PD AGREGAR CLIMA",
      [PRIVILEGIOS.PD_AGREGAR_INSUMO]: "PD AGREGAR INSUMO",
      [PRIVILEGIOS.AI_TOOLS_PARTE_DIARIO_RESUMEN]: "AI TOOLS PARTE DIARIO RESUMEN",
    }
    return privilegeMap[privilegeId] || ""
  }

  // Verificar acceso a dashboards según rol específico
  const canViewDashboard = (type: "partes" | "movimientos" | "clima" | "insumos"): boolean => {
    // ADMINISTRADOR: puede ver todo
    if (isAdmin) return true

    // CONSULTOR: puede ver todo
    if (isConsultor) return true

    // GERENTE: puede ver todo
    if (isGerente) return true

    // OPERATIVO: solo Movimientos, Clima e Insumos (NO Partes Diarios)
    if (isOperativo) {
      switch (type) {
        case "partes":
          return hasPrivilege(PRIVILEGIOS.DASHBOARD_PARTES_DIARIOS)
        case "movimientos":
          return true // OPERATIVO puede ver movimientos
        case "clima":
          return true // OPERATIVO puede ver clima
        case "insumos":
          return true // OPERATIVO puede ver insumos
        default:
          return false
      }
    }

    // Para otros roles, verificar privilegios específicos
    const dashboardPrivileges = {
      partes: PRIVILEGIOS.DASHBOARD_PARTES_DIARIOS,
      movimientos: PRIVILEGIOS.DASHBOARD_MOVIMIENTOS,
      clima: PRIVILEGIOS.DASHBOARD_CLIMA,
      insumos: PRIVILEGIOS.DASHBOARD_INSUMOS,
    }
    return hasPrivilege(dashboardPrivileges[type])
  }

  // Verificar acceso a configuración según rol
  const canViewConfiguration = (): boolean => {
    // ADMINISTRADOR: puede ver todo
    if (isAdmin) return true

    // CONSULTOR: puede ver configuración (pero no editar)
    if (isConsultor) return true

    // GERENTE: puede ver configuración
    if (isGerente) return true

    // OPERATIVO: NO puede acceder a configuración
    if (isOperativo) return false

    // Para otros roles, verificar privilegios espec��ficos
    return (
      hasPrivilege(PRIVILEGIOS.CONF) ||
      hasPrivilege(PRIVILEGIOS.CONF_VER_EMPRESA) ||
      hasPrivilege(PRIVILEGIOS.CONF_VER_ESTABLECIMIENTO) ||
      hasPrivilege(PRIVILEGIOS.CONF_VER_USUARIOS) ||
      hasPrivilege(PRIVILEGIOS.CONF_VER_ROLES)
    )
  }

  // Verificar permisos de edición en configuración
  const canEditConfiguration = (type?: "empresa" | "establecimiento" | "usuarios" | "roles"): boolean => {
    // CONSULTOR: NO puede editar nada
    if (isConsultor) return false

    // ADMINISTRADOR: puede editar todo
    if (isAdmin) return true

    // GERENTE: puede editar todo EXCEPTO usuarios
    if (isGerente) {
      if (type === "usuarios") return false
      return true
    }

    // OPERATIVO: NO puede acceder a configuración
    if (isOperativo) return false

    // Para otros roles, verificar privilegios específicos
    if (!type) return canEdit

    const editPrivileges = {
      empresa: PRIVILEGIOS.CONF_EDITAR_EMPRESA,
      establecimiento: PRIVILEGIOS.CONF_EDITAR_ESTABLECIMIENTO,
      usuarios: PRIVILEGIOS.CONF_EDITAR_USUARIOS,
      roles: PRIVILEGIOS.CONF_EDITAR_ROLES,
    }

    return hasPrivilege(editPrivileges[type])
  }

  // Verificar permisos para ver usuarios
  const canViewUsers = (): boolean => {
    // ADMINISTRADOR: puede ver usuarios
    if (isAdmin) return true

    // CONSULTOR: puede ver usuarios (pero no editar)
    if (isConsultor) return true

    // GERENTE: NO puede ver usuarios
    if (isGerente) return false

    // OPERATIVO: NO puede acceder a configuración
    if (isOperativo) return false

    return hasPrivilege(PRIVILEGIOS.CONF_VER_USUARIOS)
  }

  // Verificar permisos para editar usuarios
  const canEditUsers = (): boolean => {
    // CONSULTOR: NO puede editar nada
    if (isConsultor) return false

    // ADMINISTRADOR: puede editar usuarios
    if (isAdmin) return true

    // GERENTE: NO puede editar usuarios
    if (isGerente) return false

    // OPERATIVO: NO puede acceder a configuración
    if (isOperativo) return false

    return hasPrivilege(PRIVILEGIOS.CONF_EDITAR_USUARIOS)
  }

  // Verificar permisos para agregar datos en parte diario
  const canAddParteDiario = (): boolean => {
    // CONSULTOR: NO puede agregar nada
    if (isConsultor) return false

    // ADMINISTRADOR: puede agregar todo
    if (isAdmin) return true

    // GERENTE: puede agregar partes diarios
    if (isGerente) return true

    // OPERATIVO: según sus privilegios específicos
    if (isOperativo) {
      return (
        hasPrivilege(PRIVILEGIOS.PD_AGREGAR_MOVIMIENTO_ANIMALES) ||
        hasPrivilege(PRIVILEGIOS.PD_AGREGAR_ACTIVIDAD) ||
        hasPrivilege(PRIVILEGIOS.PD_AGREGAR_CLIMA) ||
        hasPrivilege(PRIVILEGIOS.PD_AGREGAR_INSUMO)
      )
    }

    return (
      hasPrivilege(PRIVILEGIOS.PD_AGREGAR_MOVIMIENTO_ANIMALES) ||
      hasPrivilege(PRIVILEGIOS.PD_AGREGAR_ACTIVIDAD) ||
      hasPrivilege(PRIVILEGIOS.PD_AGREGAR_CLIMA) ||
      hasPrivilege(PRIVILEGIOS.PD_AGREGAR_INSUMO)
    )
  }

  const canAddMovimiento = (): boolean => {
    if (isConsultor) return false
    if (isAdmin || isGerente) return true
    return hasPrivilege(PRIVILEGIOS.PD_AGREGAR_MOVIMIENTO_ANIMALES)
  }

  const canAddActividad = (): boolean => {
    if (isConsultor) return false
    if (isAdmin || isGerente) return true
    return hasPrivilege(PRIVILEGIOS.PD_AGREGAR_ACTIVIDAD)
  }

  const canAddClima = (): boolean => {
    if (isConsultor) return false
    if (isAdmin || isGerente) return true
    return hasPrivilege(PRIVILEGIOS.PD_AGREGAR_CLIMA)
  }

  const canAddInsumo = (): boolean => {
    if (isConsultor) return false
    if (isAdmin || isGerente) return true
    return hasPrivilege(PRIVILEGIOS.PD_AGREGAR_INSUMO)
  }

  // Obtener nombre del rol principal
  const getUserRoleName = (): string => {
    if (roles.length === 0) return "Sin rol"
    return roles[0].nombre || "Rol desconocido"
  }

  // Obtener resumen de permisos para debugging
  const getPermissionsSummary = () => {
    return {
      isAdmin,
      isConsultor,
      isGerente,
      isOperativo,
      canEdit,
      roleName: getUserRoleName(),
      rolesCount: roles.length,
      dashboards: {
        partes: canViewDashboard("partes"),
        movimientos: canViewDashboard("movimientos"),
        clima: canViewDashboard("clima"),
        insumos: canViewDashboard("insumos"),
      },
      configuration: {
        canView: canViewConfiguration(),
        canEditEmpresa: canEditConfiguration("empresa"),
        canEditEstablecimiento: canEditConfiguration("establecimiento"),
        canViewUsers: canViewUsers(),
        canEditUsers: canEditUsers(),
        canEditRoles: canEditConfiguration("roles"),
      },
      parteDiario: {
        canAdd: canAddParteDiario(),
        canAddMovimiento: canAddMovimiento(),
        canAddActividad: canAddActividad(),
        canAddClima: canAddClima(),
        canAddInsumo: canAddInsumo(),
      },
    }
  }

  return {
    roles,
    isAdmin,
    isConsultor,
    isGerente,
    isOperativo,
    canEdit,
    hasPrivilege,
    canViewDashboard,
    canViewConfiguration,
    canEditConfiguration,
    canAddParteDiario,
    canAddMovimiento,
    canAddActividad,
    canAddClima,
    canAddInsumo,
    canViewUsers,
    canEditUsers,
    getUserRoleName,
    getPermissionsSummary,
  }
}
