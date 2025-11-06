// Tipos para Parte Diario
export interface ParteDiario {
  pd_id: number
  pd_fecha: string
  pd_hora: string
  pd_tipo: string
  pd_descripcion: string | null
  pd_nota: string | null
  pd_usuario: string | null
  pd_usuario_nombres: string | null
  pd_usuario_apellidos: string | null
  pd_establecimiento_id: string
  pd_establecimiento_nombre: string | null
  pd_empresa_id: string
  pd_empresa_nombre: string | null
  created_at?: string
  updated_at?: string
}

// Filtros para partes diarios
export interface PartesDiariosFilter {
  establecimientoId?: string
  fecha?: string
  tipo?: string
}

// Tipos para empresas y establecimientos
export interface Empresa {
  id: string
  nombre: string
  descripcion?: string
}

export interface Establecimiento {
  id: string
  nombre: string
  empresa_id: string
  descripcion?: string
}

// Tipos para usuarios
export interface Usuario {
  id: string
  email: string
  nombres?: string
  apellidos?: string
  created_at?: string
  updated_at?: string
}

// Tipos para relaciones usuario-empresa-establecimiento
export interface UsuarioEmpresa {
  usuario_id: string
  empresa_id: string
  nombre: string
  rol?: string
}

export interface UsuarioEstablecimiento {
  usuario_id: string
  empresa_id: string
  establecimiento_id: string
  nombre: string
  rol?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Tipos para filtros generales
export interface BaseFilter {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
}
