"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import ActividadesView from "@/components/sections/actividades/actividades-view"

export default function ActividadesPage() {
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
    <AppLayout activeSection="Actividades">
      <ActividadesView />
    </AppLayout>
  )
}
