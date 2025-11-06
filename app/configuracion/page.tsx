"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useConfigNavigation } from "@/contexts/config-navigation-context"
import Sidebar from "@/components/sidebar"
import { NuevaConfiguracionView } from "@/components/sections/configuracion/nueva-configuracion-view"

export default function ConfiguracionPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { state, navigateToEmpresas } = useConfigNavigation()

  useEffect(() => {
    const token = localStorage.getItem("supabase_token")

    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
      if (state.level === "main") {
        navigateToEmpresas()
      }
    }

    setIsLoading(false)
  }, [router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen">
      {state.level === "main" && <Sidebar activeSection="Configuración" />}

      <div className={`flex-1 ${state.level === "main" ? "ml-64" : ""}`}>
        <NuevaConfiguracionView />
      </div>
    </div>
  )
}
