import type { ParteDiario, PartesDiariosFilter } from "./types"

// Tipos para las interfaces de API
export interface UsuarioEmpresa {
  usuario_id: string
  empresa_id: string
  nombre: string
}

export interface UsuarioEstablecimiento {
  usuario_id: string
  empresa_id: string
  establecimiento_id: string
  nombre: string
}

// Función para obtener empresas del usuario
export const fetchUsuarioEmpresas = async (usuarioId: string): Promise<UsuarioEmpresa[]> => {
  if (!usuarioId) {
    throw new Error("Usuario ID es requerido")
  }
  try {
    console.log("Fetching empresas for user:", usuarioId)

    const response = await fetch(`/api/empresas?usuario_id=${usuarioId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("Empresas data:", data.empresas)
    return data.empresas || []
  } catch (error) {
    console.error("Error fetching empresas:", error)
    throw error
  }
}

// Función para obtener establecimientos del usuario
export const fetchUsuarioEstablecimientos = async (
  usuarioId: string,
  empresaId: string,
): Promise<UsuarioEstablecimiento[]> => {
  if (!usuarioId) {
    throw new Error("Usuario ID es requerido")
  }
  try {
    console.log("Fetching establecimientos for user:", usuarioId, "empresa:", empresaId)

    const response = await fetch(`/api/establecimientos?usuario_id=${usuarioId}&empresa_id=${empresaId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("Establecimientos data:", data.establecimientos)
    return data.establecimientos || []
  } catch (error) {
    console.error("Error fetching establecimientos:", error)
    throw error
  }
}

// Función para obtener los partes diarios con filtros
export const fetchPartesDiarios = async (filters: PartesDiariosFilter): Promise<ParteDiario[]> => {
  try {
    console.log("Fetching partes diarios with filters:", filters)

    const params = new URLSearchParams()
    if (filters.establecimientoId) params.append("establecimiento_id", filters.establecimientoId)
    if (filters.fecha) params.append("fecha", filters.fecha)
    if (filters.tipo && filters.tipo !== "todos") params.append("tipo", filters.tipo)

    const response = await fetch(`/api/partes-diarios?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Error desconocido" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log("Partes diarios data:", data.partes_diarios?.length || 0, "records")
    return data.partes_diarios || []
  } catch (error) {
    console.error("Error fetching partes diarios:", error)
    throw error
  }
}

// Función para obtener un parte diario específico por ID
export const fetchParteDiarioById = async (id: number): Promise<ParteDiario | null> => {
  try {
    // Por ahora, obtenemos todos y filtramos localmente
    // En el futuro se puede crear un endpoint específico
    const allPartes = await fetchPartesDiarios({})
    return allPartes.find((parte) => parte.pd_id === id) || null
  } catch (error) {
    console.error(`Error fetching parte diario with id ${id}:`, error)
    return null
  }
}

// Función para obtener la fecha actual en formato YYYY-MM-DD
export const getCurrentDate = (): string => {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Función de prueba para verificar la conexión
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log("Testing Supabase connection...")

    const response = await fetch("/api/test-connection", {
      method: "GET",
    })

    if (!response.ok) {
      console.error("Connection test failed:", response.status)
      return false
    }

    const data = await response.json()
    console.log("Connection test result:", data)
    return data.success || false
  } catch (error) {
    console.error("Connection test error:", error)
    return false
  }
}
