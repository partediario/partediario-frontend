export interface SearchAndFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters?: {
    [key: string]: any
  }
  onFilterChange?: (filters: any) => void
  placeholder?: string
  showFilters?: boolean
  className?: string
}

export interface Establecimiento {
  id: number
  nombre: string
  ubicacion?: string
  superficie_total?: number
  empresa_id: number
  created_at?: string
  updated_at?: string
}

export interface Potrero {
  id: number
  nombre: string
  superficie_total: number
  superfice_util: number | null
  recurso_forrajero: string | null
  receptividad: number | null
  receptividad_unidad: string | null
  establecimiento_id: number
}

export interface Actividad {
  id: number
  nombre: string
  descripcion?: string
  fecha: string
  tipo: string
  establecimiento_id: number
  potrero_id?: number
  created_at?: string
  updated_at?: string
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  empresa_id: number
  created_at?: string
  updated_at?: string
}

export interface Empresa {
  id: number
  nombre: string
  descripcion?: string
  created_at?: string
  updated_at?: string
}
