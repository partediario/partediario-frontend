"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"

interface User {
  usuario_id?: string
  id: string
  email: string
  nombres: string
  apellidos: string
  nombreCompleto?: string
  activo?: boolean
  profile?: any
  roles?: any[]
  empresas?: any[]
  phone?: string
}

interface UserContextType {
  usuario: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialized = useRef(false)
  const isLoadingProfile = useRef(false)

  // Función para obtener datos del perfil desde la API
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 [USER_CONTEXT] Obteniendo perfil completo para usuario:", userId)

      const response = await fetch(`/api/user-profile?user_id=${userId}`)

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.usuario) {
        console.log("✅ [USER_CONTEXT] Perfil completo obtenido:")
        console.log("📋 [PROFILE_DATA] Datos completos del perfil:", JSON.stringify(result.usuario, null, 2))

        // Mostrar información específica de roles
        if (result.usuario.roles && result.usuario.roles.length > 0) {
          console.log("👤 [ROLES] Roles del usuario:")
          result.usuario.roles.forEach((role: any, index: number) => {
            console.log(`   ${index + 1}. ${role.nombre} (ID: ${role.id})`)
            if (role.privilegios && role.privilegios.length > 0) {
              console.log(`      Privilegios: ${role.privilegios.join(", ")}`)
            }
          })
        } else {
          console.log("👤 [ROLES] El usuario no tiene roles asignados")
        }

        // Mostrar información específica de empresas
        if (result.usuario.empresas && result.usuario.empresas.length > 0) {
          console.log("🏢 [EMPRESAS] Empresas del usuario:")
          result.usuario.empresas.forEach((empresa: any, index: number) => {
            console.log(`   ${index + 1}. ${empresa.nombre} (ID: ${empresa.id})`)
            if (empresa.establecimientos && empresa.establecimientos.length > 0) {
              console.log(`      Establecimientos:`)
              empresa.establecimientos.forEach((est: any, estIndex: number) => {
                console.log(`         ${estIndex + 1}. ${est.nombre} (ID: ${est.id})`)
              })
            } else {
              console.log(`      Sin establecimientos asignados`)
            }
          })
        } else {
          console.log("🏢 [EMPRESAS] El usuario no tiene empresas asignadas")
        }

        // Mostrar información básica
        console.log("📞 [CONTACTO] Información de contacto:")
        console.log(`   Email: ${result.usuario.email}`)
        console.log(`   Teléfono: ${result.usuario.phone || "No especificado"}`)
        console.log(`   Nombre completo: ${result.usuario.nombreCompleto}`)

        return result.usuario
      } else {
        throw new Error(result.error || "Error obteniendo perfil")
      }
    } catch (error) {
      console.error("❌ [USER_CONTEXT] Error al obtener perfil:", error)
      throw error
    }
  }

  const loadUserData = async () => {
    if (typeof window === "undefined" || isLoadingProfile.current) return

    try {
      isLoadingProfile.current = true
      const userData = localStorage.getItem("user_data")
      const token = localStorage.getItem("supabase_token")

      console.log("🔍 [USER_CONTEXT] Verificando datos:", {
        hasUserData: !!userData,
        hasToken: !!token,
      })

      if (userData && token) {
        const parsedUser = JSON.parse(userData)
        console.log("🔍 [USER_CONTEXT] Datos parseados:", parsedUser)

        // Verificar que tenga al menos id o usuario_id y email
        if ((parsedUser.id || parsedUser.usuario_id) && parsedUser.email) {
          // Asegurar que tenga usuario_id para compatibilidad
          if (!parsedUser.usuario_id && parsedUser.id) {
            parsedUser.usuario_id = parsedUser.id
          }

          console.log("✅ [USER_CONTEXT] Usuario básico cargado:", parsedUser.email)

          // Si ya tiene datos del perfil completo, usar esos datos
          if (parsedUser.roles && parsedUser.empresas) {
            console.log("📋 [USER_CONTEXT] Usando datos del perfil en caché")
            setUsuario(parsedUser)
            setError(null)
          } else {
            // Solo cargar perfil si no tiene datos completos
            console.log("🔄 [USER_CONTEXT] Cargando perfil completo...")
            try {
              const profileData = await fetchUserProfile(parsedUser.id)

              // Combinar datos existentes con datos del perfil
              const completeUser = {
                ...parsedUser,
                ...profileData,
                usuario_id: parsedUser.usuario_id || parsedUser.id,
              }

              console.log("🎯 [USER_CONTEXT] Usuario completo cargado:", {
                id: completeUser.id,
                email: completeUser.email,
                nombreCompleto: completeUser.nombreCompleto,
                rolesCount: completeUser.roles?.length || 0,
                empresasCount: completeUser.empresas?.length || 0,
              })

              setUsuario(completeUser)
              setError(null)

              // Actualizar localStorage sin disparar eventos
              const currentData = localStorage.getItem("user_data")
              const newData = JSON.stringify(completeUser)
              if (currentData !== newData) {
                localStorage.setItem("user_data", newData)
              }
            } catch (profileError) {
              console.log("⚠️ [USER_CONTEXT] Error al cargar perfil completo, usando datos básicos:", profileError)
              setUsuario(parsedUser)
              setError("Perfil parcialmente cargado")
            }
          }
        } else {
          console.log("❌ [USER_CONTEXT] Datos de usuario incompletos:", parsedUser)
          setError("Datos de usuario incompletos")
          setUsuario(null)
        }
      } else {
        console.log("❌ [USER_CONTEXT] No hay sesión activa")
        setError("No hay sesión activa")
        setUsuario(null)
      }
    } catch (error) {
      console.log("❌ [USER_CONTEXT] Error al cargar usuario:", error)
      setError("Error al verificar sesión")
      setUsuario(null)
    } finally {
      setLoading(false)
      isLoadingProfile.current = false
    }
  }

  const refreshProfile = async () => {
    if (!usuario?.id || isLoadingProfile.current) return

    try {
      isLoadingProfile.current = true
      console.log("🔄 [USER_CONTEXT] Refrescando perfil del usuario...")
      const profileData = await fetchUserProfile(usuario.id)

      const updatedUser = {
        ...usuario,
        ...profileData,
      }

      setUsuario(updatedUser)
      localStorage.setItem("user_data", JSON.stringify(updatedUser))
      setError(null)

      console.log("✅ [USER_CONTEXT] Perfil refrescado exitosamente")
    } catch (error) {
      console.error("❌ [USER_CONTEXT] Error al refrescar perfil:", error)
      setError("Error al refrescar perfil")
    } finally {
      isLoadingProfile.current = false
    }
  }

  const logout = () => {
    console.log("🚪 [USER_CONTEXT] Cerrando sesión")
    localStorage.removeItem("user_data")
    localStorage.removeItem("supabase_token")
    localStorage.removeItem("supabase_refresh_token")
    setUsuario(null)
    setError(null)
    isInitialized.current = false
    window.location.href = "/login"
  }

  const updateUser = (newUser: User | null) => {
    console.log("🔄 [USER_CONTEXT] Actualizando usuario:", newUser?.email || "null")
    setUsuario(newUser)
    setError(newUser ? null : "No hay sesión activa")

    if (newUser) {
      localStorage.setItem("user_data", JSON.stringify(newUser))
    } else {
      localStorage.removeItem("user_data")
      localStorage.removeItem("supabase_token")
      localStorage.removeItem("supabase_refresh_token")
    }
  }

  useEffect(() => {
    // Solo ejecutar una vez al montar el componente
    if (!isInitialized.current) {
      console.log("🚀 [USER_CONTEXT] Inicializando contexto de usuario")
      isInitialized.current = true
      loadUserData()
    }

    // Escuchar cambios en localStorage solo de otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      // Solo reaccionar si el cambio viene de otra pestaña/ventana
      if (
        e.storageArea === localStorage &&
        (e.key === "user_data" || e.key === "supabase_token") &&
        !isLoadingProfile.current
      ) {
        console.log("🔄 [USER_CONTEXT] Detectado cambio externo en storage:", e.key)
        loadUserData()
      }
    }

    const handleUserChange = (e: CustomEvent) => {
      console.log("🔄 [USER_CONTEXT] Detectado cambio de usuario")
      if (!isLoadingProfile.current) {
        loadUserData()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("userChanged", handleUserChange as EventListener)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("userChanged", handleUserChange as EventListener)
    }
  }, []) // Array de dependencias vacío - solo ejecutar una vez

  const isAuthenticated = !!usuario && !!(usuario.id || usuario.usuario_id) && !!usuario.email

  return (
    <UserContext.Provider
      value={{
        usuario,
        loading,
        error,
        isAuthenticated,
        setUser: updateUser,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
