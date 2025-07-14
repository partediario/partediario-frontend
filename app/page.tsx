"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ConfigurationInterface from "@/components/configuration-interface"

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay token de autenticación
    const token = localStorage.getItem("supabase_token")

    if (!token) {
      // No hay token, redirigir al login
      router.push("/login")
    } else {
      // Hay token, permitir acceso
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Solo mostrar la aplicación si está autenticado
  if (!isAuthenticated) {
    return null
  }

  return <ConfigurationInterface />
}
