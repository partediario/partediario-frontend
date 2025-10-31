"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import ConfiguracionView from "@/components/sections/configuracion/configuracion-view"

export default function ConfiguracionPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("supabase_token")

    if (!token) {
      router.push("/login")
    } else {
      setIsAuthenticated(true)
    }

    setIsLoading(false)
  }, [router])

  if (isLoading || !isAuthenticated) {
    return null
  }

  return (
    <AppLayout activeSection="Configuración">
      <ConfiguracionView />
    </AppLayout>
  )
}
